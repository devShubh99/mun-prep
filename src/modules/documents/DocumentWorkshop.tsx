import { useState, useEffect, useCallback } from 'react'
import { useConference } from '../../hooks/useConference'
import { supabase } from '../../lib/supabase'
import { useAutoSave } from '../../hooks/useAutoSave'
import RichTextEditor from './RichTextEditor'
import AiActionButtons from './AiActionButtons'
import { Plus, X, Archive, RotateCcw, Trash2 } from 'lucide-react'
import type { Document } from '../../types'
import { buildReviewContent, applyChanges } from './suggestion-marks'

function extractTextFromDoc(jsonStr: string): string[] {
  try {
    const doc = JSON.parse(jsonStr)
    if (!doc?.content) return jsonStr ? [jsonStr] : []
    if (!Array.isArray(doc.content)) return []
    return doc.content
      .filter((n: any) => n.type === 'paragraph')
      .map((n: any) => n.content?.map((c: any) => c.text || '').join('') || '')
      .filter((t: string) => t.trim())
  } catch { return jsonStr ? [jsonStr] : [] }
}

function extractPlainText(content: string): string {
  try {
    const doc = JSON.parse(content)
    if (doc?.type === 'doc' && Array.isArray(doc.content)) {
      return doc.content
        .filter((n: any) => n.type === 'paragraph')
        .map((n: any) => n.content?.map((c: any) => c.text || '').join('') || '')
        .filter((t: string) => t.trim())
        .join('\n')
    }
    return content
  } catch {
    return content
  }
}

interface Change {
  id: number
  type: 'changed' | 'added'
  originalText: string
  newText: string
  status: 'pending' | 'accepted' | 'rejected'
  insertAfterIndex?: number
  selectionRange?: { startPara: number; endPara: number } | null
}

interface SelectionInfo { text: string; startPara: number; endPara: number }

export default function DocumentWorkshop() {
  const { conference } = useConference()
  const [docs, setDocs] = useState<Document[]>([])
  const [archivedDocs, setArchivedDocs] = useState<Document[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [changes, setChanges] = useState<Change[]>([])
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewContent, setReviewContent] = useState<string | null>(null)
  const [activeChangeIdx, setActiveChangeIdx] = useState(0)
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null)
  const [cursorPara, setCursorPara] = useState(-1)

  const activeDoc = docs.find(d => d.id === activeDocId)

  const effectiveContent = selectionInfo?.text ?? ''

  const isActionDisabled = !selectionInfo || selectionInfo.text.trim().length < 3

  const buildChanges = (originalJson: string, resultText: string, action: string, _insertAt?: number): Change[] => {
    if (action === 'polish') {
      if (!selectionInfo) return []
      const paragraphTexts = extractTextFromDoc(originalJson)
      const originalFull = paragraphTexts.slice(selectionInfo.startPara, selectionInfo.endPara + 1).join('\n').trim()
      const newFull = resultText.trim()
      if (!newFull || originalFull.toLowerCase() === newFull.toLowerCase() || !originalFull) return []
      return [{
        id: 0,
        type: 'changed',
        originalText: originalFull,
        newText: newFull,
        status: 'pending',
        selectionRange: { startPara: selectionInfo.startPara, endPara: selectionInfo.endPara },
      }]
    }

    const insertAfterIdx = selectionInfo ? selectionInfo.endPara : undefined
    return [{ id: 0, type: 'added', originalText: '', newText: resultText.trim(), status: 'pending', insertAfterIndex: insertAfterIdx }]
  }

  const getOriginalDoc = () => {
    try { return JSON.parse(activeDoc?.content || '{}') } catch { return { type: 'doc', content: [] } }
  }

  const finalizeReview = (updated: Change[]) => {
    if (!activeDocId || !activeDoc) return
    const original = getOriginalDoc()
    const result = applyChanges(original, updated)
    handleContentChange(JSON.stringify(result))
    setReviewMode(false)
    setChanges([])
    setReviewContent(null)
    setSelectionInfo(null)
  }

  const tryFinishReview = (updated: Change[]) => {
    if (!updated.some(c => c.status === 'pending')) {
      finalizeReview(updated)
    }
  }

  const handleAiResult = (resultText: string, action: string) => {
    const originalJson = activeDoc?.content || '{}'
    const built = buildChanges(originalJson, resultText, action, cursorPara >= 0 ? cursorPara : undefined)
    if (built.length === 0) { setError('AI returned no changes.'); return }
    setChanges(built)
    setActiveChangeIdx(0)
    setReviewMode(true)
    const original = getOriginalDoc()
    const reviewDoc = buildReviewContent(original, built)
    setReviewContent(JSON.stringify(reviewDoc))
  }

  const updateChangeStatus = (id: number, status: 'accepted' | 'rejected') => {
    setChanges(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, status } : c)
      const original = getOriginalDoc()
      const reviewDoc = buildReviewContent(original, updated)
      setReviewContent(JSON.stringify(reviewDoc))
      tryFinishReview(updated)
      return updated
    })
  }

  const acceptAll = () => {
    setChanges(prev => {
      const updated = prev.map(c => c.status === 'pending' ? { ...c, status: 'accepted' as const } : c)
      const original = getOriginalDoc()
      setReviewContent(JSON.stringify(buildReviewContent(original, updated)))
      tryFinishReview(updated)
      return updated
    })
  }

  const rejectAll = () => {
    setChanges(prev => {
      const updated = prev.map(c => c.status === 'pending' ? { ...c, status: 'rejected' as const } : c)
      const original = getOriginalDoc()
      setReviewContent(JSON.stringify(buildReviewContent(original, updated)))
      tryFinishReview(updated)
      return updated
    })
  }

  const handleSelectChange = (id: number) => {
    setActiveChangeIdx(id)
  }

  const saveDocument = useCallback(async () => {
    if (!activeDoc || reviewMode) return
    const { error: err } = await supabase.from('documents').update({ content: activeDoc.content, updated_at: new Date().toISOString() }).eq('id', activeDoc.id)
    if (err) setError(err.message)
  }, [activeDoc, reviewMode])

  useAutoSave(activeDoc?.content, saveDocument)

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

  const handleCreate = async () => {
    if (!conference) return
    setError(null)
    const baseTitle = 'Untitled'
    const existingNames = new Set(docs.map(d => d.title))
    let uniqueTitle = baseTitle
    let counter = 1
    while (existingNames.has(uniqueTitle)) {
      counter++
      uniqueTitle = `${baseTitle} (${counter})`
    }
    const { data, error: err } = await supabase
      .from('documents')
      .insert({
        conference_id: conference.id,
        title: uniqueTitle,
        content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
        archived: false,
      })
      .select()
      .single()
    if (err) { setError(err.message); return }
    if (data) {
      setDocs(prev => [...prev, data as Document])
      setActiveDocId(data.id)
      setRenamingId(data.id)
      setRenameValue('')
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
    const safeTitle = title.trim() || 'Untitled'
    const existingNames = new Set(docs.filter(d => d.id !== id).map(d => d.title))
    let finalTitle = safeTitle
    let counter = 1
    while (existingNames.has(finalTitle)) {
      counter++
      finalTitle = `${safeTitle} (${counter})`
    }
    const { error: err } = await supabase.from('documents').update({ title: finalTitle }).eq('id', id)
    if (err) { setError(err.message); return }
    setDocs(prev => prev.map(d => d.id === id ? { ...d, title: finalTitle } : d))
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
            onClick={() => { if (!reviewMode) setActiveDocId(doc.id) }}
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
        <button onClick={handleCreate} disabled={reviewMode} className="p-3 text-muted hover:text-ink">
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

      {activeDoc && !reviewMode && (
        <div>
          <AiActionButtons
            content={extractPlainText(effectiveContent)}
            documentType="general"
            onPreview={handleAiResult}
            disabled={isActionDisabled}
          />
          <div className="mt-4">
            <RichTextEditor
              content={activeDoc.content}
              onChange={handleContentChange}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onSelection={setSelectionInfo}
              onCursorParagraph={setCursorPara}
            />
          </div>
        </div>
      )}

      {activeDoc && reviewMode && reviewContent && (
        <div>
          <RichTextEditor
            content={reviewContent}
            onChange={() => {}}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            reviewMode={reviewMode}
            changes={changes}
            activeChangeIdx={activeChangeIdx}
            onAcceptChange={() => updateChangeStatus(activeChangeIdx, 'accepted')}
            onRejectChange={() => updateChangeStatus(activeChangeIdx, 'rejected')}
            onAcceptAll={acceptAll}
            onRejectAll={rejectAll}
            onSelectChange={handleSelectChange}
          />
        </div>
      )}

      {!activeDoc && (
        <div className="card text-center">
          <p className="text-muted">No documents yet. Click <strong>+</strong> to create one.</p>
        </div>
      )}
    </div>
  )
}
