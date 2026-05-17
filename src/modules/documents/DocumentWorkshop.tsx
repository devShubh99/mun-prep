import { useState, useEffect, useCallback } from 'react'
import { useConference } from '../../hooks/useConference'
import { supabase } from '../../lib/supabase'
import { useAutoSave } from '../../hooks/useAutoSave'
import RichTextEditor from './RichTextEditor'
import AiActionButtons from './AiActionButtons'
// TEST BUILD: Document archive — restore + permanent delete with confirmation
import { Plus, X, Archive, RotateCcw, Trash2 } from 'lucide-react'
import type { Document } from '../../types'

function wordCount(content: string): number {
  try {
    const json = JSON.parse(content)
    const text = JSON.stringify(json).replace(/<[^>]*>/g, '').replace(/[{}"\[\]\\]/g, ' ').trim()
    return text.split(/\s+/).filter(Boolean).length
  } catch { return 0 }
}

export default function DocumentWorkshop() {
  const { conference } = useConference()
  const [docs, setDocs] = useState<Document[]>([])
  const [archivedDocs, setArchivedDocs] = useState<Document[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const activeDoc = docs.find(d => d.id === activeDocId)

  useEffect(() => {
    if (!conference) return
    setError(null)
    supabase
      .from('documents')
      .select('*')
      .eq('conference_id', conference.id)
      .eq('archived', false)
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); return }
        if (data) {
          setDocs(data as Document[])
          if (!activeDocId && data.length > 0) setActiveDocId(data[0].id)
        }
      })
  }, [conference?.id])

  useEffect(() => {
    if (!conference || !showArchived) return
    supabase
      .from('documents')
      .select('*')
      .eq('conference_id', conference.id)
      .eq('archived', true)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (!err && data) setArchivedDocs(data as Document[])
      })
  }, [conference?.id, showArchived])

  const saveDocument = useCallback(async () => {
    if (!activeDoc) return
    const { error: err } = await supabase.from('documents').update({ content: activeDoc.content, updated_at: new Date().toISOString() }).eq('id', activeDoc.id)
    if (err) setError(err.message)
  }, [activeDoc])

  useAutoSave(activeDoc?.content, saveDocument)

  const handleCreate = async () => {
    if (!conference) return
    setError(null)
    const { data, error: err } = await supabase
      .from('documents')
      .insert({
        conference_id: conference.id,
        title: 'Untitled',
        content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
        archived: false,
      })
      .select()
      .single()
    if (err) { setError(err.message); return }
    if (data) {
      setDocs(prev => [...prev, data as Document])
      setActiveDocId(data.id)
    }
  }

  const handleArchive = async (id: string) => {
    setError(null)
    const { error: err } = await supabase.from('documents').update({ archived: true }).eq('id', id)
    if (err) { setError(err.message); return }
    setDocs(prev => prev.filter(d => d.id !== id))
    if (activeDocId === id) {
      const remaining = docs.filter(d => d.id !== id)
      setActiveDocId(remaining.length > 0 ? remaining[0].id : null)
    }
  }

  const handlePermanentlyDeleteDoc = async (id: string, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return
    setError(null)
    const { error: err } = await supabase.from('documents').delete().eq('id', id)
    if (err) { setError(err.message); return }
    setArchivedDocs(prev => prev.filter(d => d.id !== id))
  }

  const handleRestore = async (id: string) => {
    setError(null)
    const { error: err } = await supabase.from('documents').update({ archived: false }).eq('id', id)
    if (err) { setError(err.message); return }
    setArchivedDocs(prev => prev.filter(d => d.id !== id))
    supabase
      .from('documents')
      .select('*')
      .eq('conference_id', conference?.id)
      .eq('archived', false)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setDocs(data as Document[]) })
  }

  const handleRename = async (id: string, title: string) => {
    setError(null)
    const { error: err } = await supabase.from('documents').update({ title }).eq('id', id)
    if (err) { setError(err.message); return }
    setDocs(prev => prev.map(d => d.id === id ? { ...d, title } : d))
    setRenamingId(null)
  }

  const handleContentChange = (content: string) => {
    if (!activeDocId) return
    setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, content } : d))
  }

  return (
    <div>
      {error && (
        <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-4">{error}</div>
      )}
      <div className="flex items-center border-b border-hairline mb-4 overflow-x-auto">
        {docs.map(doc => (
          <div
            key={doc.id}
            className={`flex items-center gap-1 px-3 py-2 text-sm cursor-pointer border-b-2 transition-colors shrink-0 ${
              activeDocId === doc.id
                ? 'border-primary text-ink'
                : 'border-transparent text-muted hover:text-body'
            }`}
            onClick={() => setActiveDocId(doc.id)}
          >
            {renamingId === doc.id ? (
              <input
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={() => handleRename(doc.id, renameValue)}
                onKeyDown={e => e.key === 'Enter' && handleRename(doc.id, renameValue)}
                className="input py-0.5 px-1 text-sm w-32"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                onDoubleClick={() => { setRenamingId(doc.id); setRenameValue(doc.title) }}
                className="flex items-center gap-1"
              >
                {doc.title}
                {doc.content && <span className="text-xs text-muted-soft font-[400]">({wordCount(doc.content)}w)</span>}
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); handleArchive(doc.id) }}
              className="p-0.5 hover:bg-surface-soft rounded"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={handleCreate} className="p-3 text-muted hover:text-ink">
          <Plus className="w-4 h-4" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`btn-ghost text-xs flex items-center gap-1 ${showArchived ? 'text-primary' : ''}`}
          >
            <Archive className="w-3.5 h-3.5" /> Archived
          </button>
        </div>
      </div>

      {showArchived && archivedDocs.length > 0 && (
        <div className="mb-4 p-3 bg-surface-soft/50 rounded-xl">
          <h4 className="text-xs font-[500] text-muted mb-2">Archived Documents</h4>
          <div className="space-y-1">
            {archivedDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-surface-soft transition-colors">
                <span className="text-sm text-muted italic">{doc.title}</span>
                <div className="flex gap-1">
                  <button onClick={() => handleRestore(doc.id)} className="btn-ghost text-xs flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Restore
                  </button>
                  <button onClick={() => handlePermanentlyDeleteDoc(doc.id, doc.title)} className="btn-ghost text-xs flex items-center gap-1 text-error">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeDoc ? (
        <div>
          <AiActionButtons
            content={activeDoc.content}
            documentType="general"
            onResult={handleContentChange}
          />
          <div className="mt-4">
            <RichTextEditor
              content={activeDoc.content}
              onChange={handleContentChange}
            />
          </div>
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-muted">No documents yet. Click <strong>+</strong> to create one.</p>
        </div>
      )}
    </div>
  )
}
