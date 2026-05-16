import { callDeepSeek, send, sendError, readBody } from './_shared.js'
import type { IncomingMessage, ServerResponse } from 'http'

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { country, committee, topic, role } = await readBody(req)
    const content = await callDeepSeek([
      { role: 'system', content: `You are a MUN committee chair. Generate a realistic debate question for a delegate representing ${country} in ${committee} on the topic "${topic}". Role: ${role}. Return only the question text, no JSON.` },
      { role: 'user', content: 'Generate a debate question.' },
    ])
    return send(res, { question: content })
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
