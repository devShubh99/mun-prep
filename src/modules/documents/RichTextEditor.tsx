import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1, Heading2, Heading3, Moon, Sun } from 'lucide-react';
import ToolbarButton from '@/components/ToolbarButton';

interface Props {
  content: string
  onChange: (content: string) => void
  darkMode: boolean
  setDarkMode: (v: boolean) => void
}

export default function RichTextEditor({ content, onChange, darkMode, setDarkMode }: Props) {
  const contentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    content: (() => { try { return JSON.parse(content) } catch { return content } })(),
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      contentRef.current = json;
      onChange(json);
    },
  });

  useEffect(() => {
    if (editor && content !== contentRef.current) {
      contentRef.current = content;
      try {
        editor.commands.setContent(JSON.parse(content), false);
      } catch {
        editor.commands.setContent(content, false);
      }
    }
  }, [editor, content]);

  if (!editor) return null;

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
      <div className={darkMode ? 'editor-dark' : 'editor-light'}>
        <EditorContent editor={editor} className="prose prose-sm max-w-none" />
      </div>
    </div>
  );
}
