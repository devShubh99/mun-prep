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

export function buildReviewContent(
  originalDoc: any,
  changes: { id: number; type: 'changed' | 'added'; originalText: string; newText: string; status: 'pending' | 'accepted' | 'rejected' }[]
): any {
  if (!originalDoc?.content) return originalDoc

  const doc = JSON.parse(JSON.stringify(originalDoc))

  for (const change of changes) {
    if (change.status === 'rejected') continue
    if (change.type === 'added') {
      doc.content.push({
        type: 'paragraph',
        attrs: { 'data-change-id': String(change.id) },
        content: [{ type: 'text', marks: [{ type: 'suggestionInsert', attrs: { changeId: String(change.id) } }], text: change.newText }],
      })
      continue
    }
    const para = doc.content[change.id]
    if (!para) continue

    const newPara = {
      type: 'paragraph',
      attrs: { 'data-change-id': String(change.id) },
      content: [] as any[],
    }

    if (change.originalText) {
      newPara.content.push({
        type: 'text',
        marks: [{ type: 'suggestionDelete', attrs: { changeId: String(change.id) } }],
        text: change.originalText,
      })
    }
    if (change.newText) {
      if (newPara.content.length > 0) {
        newPara.content.push({ type: 'text', text: ' ' })
      }
      newPara.content.push({
        type: 'text',
        marks: [{ type: 'suggestionInsert', attrs: { changeId: String(change.id) } }],
        text: change.newText,
      })
    }
    doc.content[change.id] = newPara
  }

  return doc
}

export function applyChanges(
  originalDoc: any,
  changes: { id: number; type: 'changed' | 'added'; originalText: string; newText: string; status: 'pending' | 'accepted' | 'rejected' }[]
): any {
  if (!originalDoc?.content) return originalDoc
  const doc = JSON.parse(JSON.stringify(originalDoc))

  for (const change of changes) {
    if (change.status === 'accepted') {
      if (change.type === 'added') {
        doc.content.push({
          type: 'paragraph',
          content: [{ type: 'text', text: change.newText }],
        })
      } else {
        doc.content[change.id] = {
          type: 'paragraph',
          content: [{ type: 'text', text: change.newText || change.originalText }],
        }
      }
    }
  }
  return doc
}
