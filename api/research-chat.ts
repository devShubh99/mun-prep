import { callDeepSeek, send, sendError, readBody } from './_shared'
import type { IncomingMessage, ServerResponse } from 'http'

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { researchContext, question } = await readBody(req)
    const content = await callDeepSeek([
      { role: 'system', content: `You are a research assistant. Use the following research context to answer questions:\n\n${researchContext}` },
      { role: 'user', content: question },
    ])
    return send(res, { answer: content })
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
