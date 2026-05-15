import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

const ACTIONS: Record<string, string> = {
  polish: 'Polish the text to make it more diplomatic and professional. Return only the polished text.',
  shorten: 'Shorten the text to half its length while keeping all key points. Return only the shortened text.',
  brainstorm: 'Brainstorm additional points, arguments, or clauses the delegate could add. Return only the new content, no prefix.',
  'insert-clause': 'Draft a formal working clause on this topic. Return only the clause text.',
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { action, documentType, content, context } = JSON.parse(event.body || '{}')
    const instruction = ACTIONS[action] || ACTIONS.polish
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: `${instruction}\nDocument type: ${documentType}\n${context ? `Context: ${context}` : ''}` },
        { role: 'user', content },
      ],
    })
    return ok({ result: response.choices[0].message.content?.trim() })
  } catch (e: any) {
    return error(500, e.message)
  }
}
