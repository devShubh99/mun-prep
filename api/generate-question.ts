import { client, json } from './shared'

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const { country, committee, topic, role } = await req.json()
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: `You are a MUN committee chair. Generate a realistic debate question for a delegate representing ${country} in ${committee} on the topic "${topic}". Role: ${role}. Return only the question text, no JSON.` },
        { role: 'user', content: 'Generate a debate question.' },
      ],
    })
    return json({ question: completion.choices[0].message.content })
  } catch (e: any) {
    return json({ error: e.message }, 500)
  }
}
