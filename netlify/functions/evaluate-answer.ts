import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

const SYSTEM_PROMPT = `You are a MUN evaluator. Score the delegate's answer and return JSON:
{
  "argumentScore": 1-10,
  "diplomacyScore": 1-10,
  "compliment": "string",
  "improvement": "string",
  "modelRebuttal": "string"
}`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { question, answer, country, committee, topic, role } = JSON.parse(event.body || '{}')
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\nContext: ${country}, ${committee}, ${topic}, Role: ${role}` },
        { role: 'user', content: `Question: ${question}\nAnswer: ${answer}\n\nEvaluate this answer.` },
      ],
      response_format: { type: 'json_object' },
    })
    return ok(JSON.parse(response.choices[0].message.content || '{}'))
  } catch (e: any) {
    return error(500, e.message)
  }
}
