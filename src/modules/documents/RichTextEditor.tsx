import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered,
  Heading1, Heading2, Heading3, Moon, Sun,
  Highlighter, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Link2, Table2, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  CheckSquare, Quote, Minus, X,
} from 'lucide-react';
import ToolbarButton from '@/components/ToolbarButton';
import { SuggestionInsert, SuggestionDelete } from './suggestion-marks';

interface SelectionInfo { text: string; startPara: number; endPara: number }

interface Props {
  content: string; onChange: (content: string) => void; darkMode: boolean; setDarkMode: (v: boolean) => void;
  onSelection?: (info: SelectionInfo | null) => void;
}

const COLORS = ['#cc785c', '#5db872', '#c64545', '#e8a55a', '#5db8a6', '#141413'];

export default function RichTextEditor({ content, onChange, darkMode, setDarkMode, onSelection }: Props) {
  const contentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline, Image, Table, TableRow, TableHeader, TableCell,
      Link.configure({ openOnClick: false }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle, Color, Subscript, Superscript,
      TaskList, TaskItem.configure({ nested: true }),
      SuggestionInsert, SuggestionDelete,
    ],
    content: (() => { try { return JSON.parse(content) } catch { return content } })(),
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      contentRef.current = json;
      onChange(json);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const resolveBlockIdx = (pos: number) => {
        const r = ed.state.doc.resolve(pos)
        return r.depth >= 1 ? r.index(1) : 0
      }
      if (onSelection && !ed.state.selection.empty) {
        const text = ed.state.doc.textBetween(ed.state.selection.from, ed.state.selection.to).trim()
        if (text.length >= 3) onSelection({ text, startPara: resolveBlockIdx(ed.state.selection.from), endPara: resolveBlockIdx(Math.max(ed.state.selection.to - 1, ed.state.selection.from)) })
        else onSelection(null)
      } else if (onSelection) onSelection(null)
    },
  });

  useEffect(() => {
    if (editor && content !== contentRef.current) {
      contentRef.current = content;
      try { editor.commands.setContent(JSON.parse(content), false); } catch { editor.commands.setContent(content, false); }
    }
  }, [editor, content]);

  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    if (!editor) return
    const cb = () => setWordCount(editor.state.doc.textContent.split(/\s+/).filter(Boolean).length)
    editor.on('update', cb)
    cb()
    return () => { editor.off('update', cb) }
  }, [editor])

  if (!editor) return null;

  const addImage = () => { const url = window.prompt('Image URL:'); if (url) editor.chain().focus().setImage({ src: url }).run() }
  const addTable = () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  const addLink = () => { const url = window.prompt('Link URL:'); if (url) editor.chain().focus().setLink({ href: url }).run() }

  const Btn = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <ToolbarButton onClick={onClick} active={active ?? false} label={title}>{children}</ToolbarButton>
  );

  return (
    <div className={`rounded-lg overflow-hidden border border-hairline ${darkMode ? 'bg-surface-dark' : 'bg-canvas'}`}>
      {/* Row 1: Inline formatting */}
      <div className={`flex items-center gap-0.5 px-3 py-1.5 border-b flex-wrap ${darkMode ? 'border-surface-dark-elevated bg-surface-dark' : 'border-hairline bg-canvas'}`}>
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter className="w-4 h-4" /></Btn>
        <div className="flex items-center gap-0.5 px-1">
          {COLORS.map(c => (
            <button key={c} onClick={() => editor.chain().focus().setColor(c).run()} title={c}
              className={`w-4 h-4 rounded-full border ${darkMode ? 'border-surface-dark-elevated' : 'border-hairline'} hover:scale-110 transition-transform`} style={{ backgroundColor: c }} />
          ))}
          {editor.isActive('textStyle') && <button onClick={() => editor.chain().focus().unsetColor().run()} title="Remove color" className="text-muted-soft hover:text-error ml-0.5"><X className="w-3 h-3" /></button>}
        </div>
        <Btn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript"><SubscriptIcon className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript"><SuperscriptIcon className="w-4 h-4" /></Btn>
        <Btn onClick={addLink} active={editor.isActive('link')} title="Link"><Link2 className="w-4 h-4" /></Btn>
        {editor.isActive('link') && <button onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link" className="text-muted-soft hover:text-error p-0.5"><X className="w-3 h-3" /></button>}
        <div className="ml-auto">
          <button onClick={() => setDarkMode(!darkMode)} className="btn-ghost p-1.5" title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Row 2: Block & structure formatting */}
      <div className={`flex items-center gap-0.5 px-3 py-1.5 border-b flex-wrap ${darkMode ? 'border-surface-dark-elevated bg-surface-dark' : 'border-hairline bg-canvas'}`}>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 className="w-4 h-4" /></Btn>
        <span className={`w-px h-5 mx-0.5 ${darkMode ? 'bg-surface-dark-elevated' : 'bg-hairline'}`} />
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List"><ListOrdered className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task List"><CheckSquare className="w-4 h-4" /></Btn>
        <span className={`w-px h-5 mx-0.5 ${darkMode ? 'bg-surface-dark-elevated' : 'bg-hairline'}`} />
        <Btn onClick={addTable} title="Insert Table"><Table2 className="w-4 h-4" /></Btn>
        <Btn onClick={addImage} title="Insert Image"><ImageIcon className="w-4 h-4" /></Btn>
        <span className={`w-px h-5 mx-0.5 ${darkMode ? 'bg-surface-dark-elevated' : 'bg-hairline'}`} />
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center"><AlignCenter className="w-4 h-4" /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight className="w-4 h-4" /></Btn>
        <span className={`w-px h-5 mx-0.5 ${darkMode ? 'bg-surface-dark-elevated' : 'bg-hairline'}`} />
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus className="w-4 h-4" /></Btn>
      </div>

      <div className={darkMode ? 'editor-dark' : 'editor-light'}>
        <EditorContent editor={editor} className="prose prose-sm max-w-none [&_table]:border [&_table]:border-hairline [&_table_td]:border [&_table_td]:border-hairline [&_table_td]:p-2 [&_table_th]:border [&_table_th]:border-hairline [&_table_th]:p-2 [&_table_th]:bg-surface-soft [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2 [&_ul[data-type=taskList]_li_label]:mt-1 [&_s]:opacity-60 [&_s]:decoration-error/50" />
      </div>
      <div className="flex items-center justify-end px-3 py-1.5 border-t border-hairline text-xs text-muted-soft">
        {wordCount} word{wordCount !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
