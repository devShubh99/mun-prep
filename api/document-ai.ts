import { callDeepSeek, send, sendError, readBody } from './_shared.js'
import type { IncomingMessage, ServerResponse } from 'http'

const ACTIONS: Record<string, string> = {
  polish: 'You are polishing a MUN delegate\'s document. Rewrite the text to be more diplomatic, professional, and persuasive. Preserve all factual content, arguments, and meaning. Return ONLY the rewritten text — no labels, no explanations, no prefixes. Maintain the same paragraph structure (same number of paragraphs).',
  brainstorm: 'You are brainstorming additional content for a MUN delegate\'s document. Generate new points, arguments, clauses, or angles the delegate could add. Return ONLY the new content — no labels, no explanations, no prefixes. Each distinct point should be its own paragraph.',
}

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { action, documentType, content, context } = await readBody(req)
    const instruction = ACTIONS[action] || ACTIONS.polish
    const result = await callDeepSeek([
      { role: 'system', content: `${instruction}\nDocument type: ${documentType}${context ? `\nContext: ${context}` : ''}` },
      { role: 'user', content },
    ])
    return send(res, { result: result.trim() })
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
