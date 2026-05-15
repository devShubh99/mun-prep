import { client, send, sendError, readBody } from './shared'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { researchContext, question } = await readBody(req)
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: `You are a research assistant. Use the following research context to answer questions:\n\n${researchContext}` },
        { role: 'user', content: question },
      ],
    })
    return send(res, { answer: completion.choices[0].message.content })
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
