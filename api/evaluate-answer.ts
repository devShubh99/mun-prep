import { client, send, sendError, readBody } from './shared'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are a MUN evaluator. Score the delegate's answer and return JSON:
{
  "argumentScore": 1-10,
  "diplomacyScore": 1-10,
  "compliment": "string",
  "improvement": "string",
  "modelRebuttal": "string"
}`

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { question, answer, country, committee, topic, role } = await readBody(req)
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\nContext: ${country}, ${committee}, ${topic}, Role: ${role}` },
        { role: 'user', content: `Question: ${question}\nAnswer: ${answer}\n\nEvaluate this answer.` },
      ],
      response_format: { type: 'json_object' },
    })
    return send(res, JSON.parse(completion.choices[0].message.content || '{}'))
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
