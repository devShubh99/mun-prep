import { Mark } from '@tiptap/core'

export const SuggestionInsert = Mark.create({
  name: 'suggestionInsert',
  addAttributes() { return { changeId: { default: null } } },
  renderHTML({ mark }) {
    return ['span', {
      'data-change-id': mark.attrs.changeId,
      'data-suggestion-type': 'insert',
      style: 'background: rgba(93,184,114,0.25); border-bottom: 2px solid #5db872;',
    }, 0]
  },
  parseHTML() { return [{ tag: 'span[data-suggestion-type="insert"]' }] },
})

export const SuggestionDelete = Mark.create({
  name: 'suggestionDelete',
  addAttributes() { return { changeId: { default: null } } },
  renderHTML({ mark }) {
    return ['span', {
      'data-change-id': mark.attrs.changeId,
      'data-suggestion-type': 'delete',
      style: 'background: rgba(198,69,69,0.15); text-decoration: line-through; color: #c64545;',
    }, 0]
  },
  parseHTML() { return [{ tag: 'span[data-suggestion-type="delete"]' }] },
})

function makePara(text: string): any {
  return { type: 'paragraph', content: text ? [{ type: 'text', text }] : undefined }
}

export function applyAiContent(
  originalDoc: any,
  newText: string,
  selectionRange: { startPara: number; endPara: number } | null,
  insertAfter: boolean,
): any {
  if (!originalDoc?.content) return originalDoc
  const doc = JSON.parse(JSON.stringify(originalDoc))
  const lines = newText.split('\n').filter(l => l.trim())
  if (lines.length === 0) return originalDoc

  if (insertAfter) {
    const afterIdx = selectionRange ? Math.min(selectionRange.endPara + 1, doc.content.length) : doc.content.length
    const newParas = lines.map(l => makePara(l))
    doc.content.splice(afterIdx, 0, ...newParas)
  } else if (selectionRange) {
    const { startPara, endPara } = selectionRange
    const count = Math.min(endPara - startPara + 1, doc.content.length - startPara)
    const newParas = lines.map(l => makePara(l))
    doc.content.splice(startPara, count, ...newParas)
  } else {
    const newParas = lines.map(l => makePara(l))
    doc.content.push(...newParas)
  }

  return doc
}
