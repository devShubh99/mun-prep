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

function makePara(text: string, marks?: { type: string; attrs?: Record<string, string> }[]): any {
  return {
    type: 'paragraph',
    content: text ? [{ type: 'text', marks, text }] : undefined,
  }
}

export function buildReviewContent(
  originalDoc: any,
  changes: { id: number; type: 'changed' | 'added'; originalText: string; newText: string; status: 'pending' | 'accepted' | 'rejected'; insertAfterIndex?: number; selectionRange?: { startPara: number; endPara: number } | null }[]
): any {
  if (!originalDoc?.content) return originalDoc
  const doc = JSON.parse(JSON.stringify(originalDoc))

  for (const change of changes) {
    if (change.status === 'rejected') continue

    if (change.type === 'added') {
      const lines = change.newText.split('\n').filter(l => l.trim())
      if (lines.length === 0) continue
      const insertAt = change.insertAfterIndex !== undefined
        ? Math.min(change.insertAfterIndex + 1, doc.content.length)
        : doc.content.length
      const newParas = lines.map(line => makePara(line, [{ type: 'suggestionInsert', attrs: { changeId: String(change.id) } }]))
      doc.content.splice(insertAt, 0, ...newParas)
      continue
    }

    // changed type
    const origLines = change.originalText.split('\n').filter(l => l.trim())
    const newLines = change.newText.split('\n').filter(l => l.trim())

    if (origLines.length === 0 && newLines.length === 0) continue

    const deleteParas = origLines.map(line => makePara(line, [{ type: 'suggestionDelete', attrs: { changeId: String(change.id) } }]))
    const insertParas = newLines.map(line => makePara(line, [{ type: 'suggestionInsert', attrs: { changeId: String(change.id) } }]))

    if (change.selectionRange) {
      const { startPara, endPara } = change.selectionRange
      const count = endPara - startPara + 1
      doc.content.splice(startPara, count, ...deleteParas, ...insertParas)
    } else {
      if (change.id < doc.content.length) {
        doc.content.splice(change.id, 1, ...deleteParas, ...insertParas)
      } else {
        doc.content.push(...deleteParas, ...insertParas)
      }
    }
  }

  return doc
}

export function applyChanges(
  originalDoc: any,
  changes: { id: number; type: 'changed' | 'added'; originalText: string; newText: string; status: 'pending' | 'accepted' | 'rejected'; insertAfterIndex?: number; selectionRange?: { startPara: number; endPara: number } | null }[]
): any {
  if (!originalDoc?.content) return originalDoc
  const doc = JSON.parse(JSON.stringify(originalDoc))

  for (const change of changes) {
    if (change.status !== 'accepted') continue

    if (change.type === 'added') {
      const lines = change.newText.split('\n').filter(l => l.trim())
      if (lines.length === 0) continue
      const insertAt = change.insertAfterIndex !== undefined
        ? Math.min(change.insertAfterIndex + 1, doc.content.length)
        : doc.content.length
      const newParas = lines.map(line => makePara(line))
      doc.content.splice(insertAt, 0, ...newParas)
      continue
    }

    // changed type — replace with AI text
    const newLines = change.newText.split('\n').filter(l => l.trim())
    if (newLines.length === 0) continue

    let origRefs: any[] = []
    if (change.selectionRange) {
      const { startPara, endPara } = change.selectionRange
      origRefs = doc.content.slice(startPara, endPara + 1)
    } else {
      origRefs = [doc.content[change.id]].filter(Boolean)
    }

    const newParas = newLines.map((line, i) => {
      const ref = i < origRefs.length ? origRefs[i] : origRefs[origRefs.length - 1]
      if (ref) {
        return { type: ref.type || 'paragraph', attrs: { ...ref.attrs }, content: [{ type: 'text', text: line }] }
      }
      return makePara(line)
    })

    if (change.selectionRange) {
      const { startPara, endPara } = change.selectionRange
      const count = endPara - startPara + 1
      doc.content.splice(startPara, count, ...newParas)
    } else {
      doc.content.splice(change.id, 1, ...newParas)
    }
  }

  return doc
}
