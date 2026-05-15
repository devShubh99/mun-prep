import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { researchContext, question } = JSON.parse(event.body || '{}')
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: `You are a research assistant. Use the following research context to answer questions:\n\n${researchContext}` },
        { role: 'user', content: question },
      ],
    })
    return ok({ answer: response.choices[0].message.content })
  } catch (e: any) {
    return error(500, e.message)
  }
}
