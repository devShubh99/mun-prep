import { callDeepSeek, send, sendError, readBody } from './_shared.js'
import type { IncomingMessage, ServerResponse } from 'http'

const SYSTEM_PROMPT = `You are a MUN evaluator. Score the delegate's answer and return JSON:
{
  "argumentScore": 1-10,
  "diplomacyScore": 1-10,
  "compliment": "string",
  "improvement": "string",
  "modelRebuttal": "string"
}`

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { question, answer, country, committee, topic, difficulty, role } = await readBody(req)
    const content = await callDeepSeek([
      { role: 'system', content: `${SYSTEM_PROMPT}\nContext: ${country}, ${committee}, ${topic}, Role: ${role}, Difficulty: ${difficulty}` },
      { role: 'user', content: `Question: ${question}\nAnswer: ${answer}\n\nEvaluate this answer.` },
    ], { json: true })
    return send(res, JSON.parse(content))
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
