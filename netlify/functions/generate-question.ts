import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { country, committee, topic, role } = JSON.parse(event.body || '{}')
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: `You are a MUN committee chair. Generate a realistic debate question for a delegate representing ${country} in ${committee} on the topic "${topic}". Role: ${role}. Return only the question text, no JSON.` },
        { role: 'user', content: 'Generate a debate question.' },
      ],
    })
    return ok({ question: response.choices[0].message.content })
  } catch (e: any) {
    return error(500, e.message)
  }
}
