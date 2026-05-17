import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1, Heading2, Heading3, Moon, Sun, Check, X } from 'lucide-react';
import ToolbarButton from '@/components/ToolbarButton';
import { SuggestionInsert, SuggestionDelete } from './suggestion-marks';

interface DiffChange {
  id: number
  type: 'changed' | 'added'
  originalText: string
  newText: string
  status: 'pending' | 'accepted' | 'rejected'
}

interface Props {
  content: string
  onChange: (content: string) => void
  darkMode: boolean
  setDarkMode: (v: boolean) => void
  reviewMode?: boolean
  changes?: DiffChange[]
  activeChangeIdx?: number
  onAcceptChange?: () => void
  onRejectChange?: () => void
  onAcceptAll?: () => void
  onRejectAll?: () => void
  onSelectChange?: (changeId: number) => void
  onExitReview?: () => void
}

export default function RichTextEditor({ content, onChange, darkMode, setDarkMode, reviewMode, changes, activeChangeIdx, onAcceptChange, onRejectChange, onAcceptAll, onRejectAll, onSelectChange, onExitReview }: Props) {
  const contentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      SuggestionInsert,
      SuggestionDelete,
    ],
    content: (() => { try { return JSON.parse(content) } catch { return content } })(),
    editable: !reviewMode,
    onUpdate: ({ editor }) => {
      if (reviewMode) return
      const json = JSON.stringify(editor.getJSON());
      contentRef.current = json;
      onChange(json);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      if (!reviewMode || !onSelectChange) return
      let foundId: number | null = null
      ed.state.doc.nodesBetween(0, ed.state.doc.content.size, (node) => {
        if (foundId !== null) return false
        if (!node.marks) return
        for (const mark of node.marks) {
          const id = mark.attrs?.changeId
          if (id !== null && id !== undefined) {
            foundId = Number(id)
            return false
          }
        }
      })
      if (foundId !== null) onSelectChange(foundId)
    },
  });

  useEffect(() => {
    if (editor && content !== contentRef.current && !reviewMode) {
      contentRef.current = content;
      try {
        editor.commands.setContent(JSON.parse(content), false);
      } catch {
        editor.commands.setContent(content, false);
      }
    }
  }, [editor, content, reviewMode]);

  if (!editor) return null;

  const pending = changes?.filter(c => c.status === 'pending').length || 0
  const accepted = changes?.filter(c => c.status === 'accepted').length || 0
  const rejected = changes?.filter(c => c.status === 'rejected').length || 0

  return (
    <div className={`rounded-lg overflow-hidden border border-hairline ${darkMode ? 'bg-surface-dark' : 'bg-canvas'}`}>
      <div className={`flex items-center gap-1 px-3 py-2 border-b ${darkMode ? 'border-surface-dark-elevated bg-surface-dark' : 'border-hairline bg-canvas'}`}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label="Underline">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <span className={`w-px h-5 mx-1 ${darkMode ? 'bg-surface-dark-elevated' : 'bg-hairline'}`} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="Bullet List">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="Ordered List">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <span className={`w-px h-5 mx-1 ${darkMode ? 'bg-surface-dark-elevated' : 'bg-hairline'}`} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} label="Heading 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="Heading 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="Heading 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="ml-auto btn-ghost p-1.5"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {reviewMode && changes && changes.length > 0 && (
        <div className="bg-accent-amber/10 border-b border-accent-amber/20 px-4 py-2 flex items-center justify-between text-sm flex-wrap gap-2">
          <span className="text-muted">
            Reviewing {changes.length} change{changes.length > 1 ? 's' : ''}
            <span className="text-muted-soft ml-1">
              ({pending} pending, {accepted} accepted, {rejected} rejected)
            </span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {activeChangeIdx !== undefined ? `Paragraph ${activeChangeIdx + 1} of ${changes.length}` : 'Click a change to select it'}
            </span>
            <span className="w-px h-4 bg-hairline mx-1" />
            {activeChangeIdx !== undefined && changes[activeChangeIdx]?.status === 'pending' && (
              <>
                <button onClick={onRejectChange} className="btn-ghost text-xs text-error flex items-center gap-1">
                  <X className="w-3 h-3" /> Reject
                </button>
                <button onClick={onAcceptChange} className="btn-ghost text-xs text-success flex items-center gap-1">
                  <Check className="w-3 h-3" /> Accept
                </button>
              </>
            )}
            {pending > 1 && (
              <>
                <span className="w-px h-4 bg-hairline mx-1" />
                <button onClick={onRejectAll} className="btn-ghost text-xs text-error">Reject All Pending</button>
                <button onClick={onAcceptAll} className="btn-ghost text-xs text-success">Accept All Pending</button>
              </>
            )}
            <span className="w-px h-4 bg-hairline mx-1" />
            <button onClick={onExitReview} className="btn-ghost text-xs text-muted" title="Apply accepted and exit">
              Finish Review
            </button>
          </div>
        </div>
      )}

      <div className={reviewMode ? 'review-active' : darkMode ? 'editor-dark' : 'editor-light'}>
        <EditorContent editor={editor} className="prose prose-sm max-w-none" />
      </div>
    </div>
  )
}
