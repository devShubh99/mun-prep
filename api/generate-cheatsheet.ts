import { client, json } from './shared'

const SYSTEM_PROMPT = `You are an expert MUN delegate. Generate a comprehensive cheat sheet as JSON matching this schema exactly:
{
  "mandate": "string",
  "coreDemands": ["string"],
  "redLines": ["string"],
  "keyArguments": ["string"],
  "allies": ["string"],
  "opponents": ["string"],
  "votingRecord": "string",
  "draftClauses": ["string"],
  "bilateralRelations": "string",
  "qaPairs": [{"question": "string", "answer": "string"}],
  "strategyNotes": "string"
}`

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const { country, committee, topic, specialRole } = await req.json()
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Country: ${country}\nCommittee: ${committee}\nTopic: ${topic}${specialRole ? `\nSpecial Role: ${specialRole}` : ''}\n\nGenerate comprehensive cheat sheet JSON.` },
      ],
      response_format: { type: 'json_object' },
    })
    return json(JSON.parse(completion.choices[0].message.content || '{}'))
  } catch (e: any) {
    return json({ error: e.message }, 500)
  }
}
