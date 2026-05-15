import { client, send, sendError, readBody } from './shared'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const ACTIONS: Record<string, string> = {
  polish: 'Polish the text to make it more diplomatic and professional. Return only the polished text.',
  shorten: 'Shorten the text to half its length while keeping all key points. Return only the shortened text.',
  brainstorm: 'Brainstorm additional points, arguments, or clauses the delegate could add. Return only the new content, no prefix.',
  'insert-clause': 'Draft a formal working clause on this topic. Return only the clause text.',
}

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { action, documentType, content, context } = await readBody(req)
    const instruction = ACTIONS[action] || ACTIONS.polish
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: `${instruction}\nDocument type: ${documentType}\n${context ? `Context: ${context}` : ''}` },
        { role: 'user', content },
      ],
    })
    return send(res, { result: completion.choices[0].message.content?.trim() })
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
