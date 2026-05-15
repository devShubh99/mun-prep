import { client, send, sendError, readBody } from './shared'
import type { VercelRequest, VercelResponse } from '@vercel/node'

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

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { country, committee, topic, specialRole } = await readBody(req)
    const completion = await client.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Country: ${country}\nCommittee: ${committee}\nTopic: ${topic}${specialRole ? `\nSpecial Role: ${specialRole}` : ''}\n\nGenerate comprehensive cheat sheet JSON.` },
      ],
      response_format: { type: 'json_object' },
    })
    return send(res, JSON.parse(completion.choices[0].message.content || '{}'))
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
