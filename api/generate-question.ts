import { client, send, sendError, readBody } from './shared'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { country, committee, topic, role } = await readBody(req)
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: `You are a MUN committee chair. Generate a realistic debate question for a delegate representing ${country} in ${committee} on the topic "${topic}". Role: ${role}. Return only the question text, no JSON.` },
        { role: 'user', content: 'Generate a debate question.' },
      ],
    })
    return send(res, { question: completion.choices[0].message.content })
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
