import { client, json } from './shared'

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const { researchContext, question } = await req.json()
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: `You are a research assistant. Use the following research context to answer questions:\n\n${researchContext}` },
        { role: 'user', content: question },
      ],
    })
    return json({ answer: completion.choices[0].message.content })
  } catch (e: any) {
    return json({ error: e.message }, 500)
  }
}
