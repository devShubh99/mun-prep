import { client, json } from './shared'

const SYSTEM_PROMPT = `You are a MUN evaluator. Score the delegate's answer and return JSON:
{
  "argumentScore": 1-10,
  "diplomacyScore": 1-10,
  "compliment": "string",
  "improvement": "string",
  "modelRebuttal": "string"
}`

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const { question, answer, country, committee, topic, role } = await req.json()
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\nContext: ${country}, ${committee}, ${topic}, Role: ${role}` },
        { role: 'user', content: `Question: ${question}\nAnswer: ${answer}\n\nEvaluate this answer.` },
      ],
      response_format: { type: 'json_object' },
    })
    return json(JSON.parse(completion.choices[0].message.content || '{}'))
  } catch (e: any) {
    return json({ error: e.message }, 500)
  }
}
