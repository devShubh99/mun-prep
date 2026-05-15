import { callDeepSeek, send, sendError, readBody } from './_shared'
import type { IncomingMessage, ServerResponse } from 'http'

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

export default async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== 'POST') return sendError(res, 'Method not allowed', 405)
  try {
    const { country, committee, topic, specialRole } = await readBody(req)
    const content = await callDeepSeek([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Country: ${country}\nCommittee: ${committee}\nTopic: ${topic}${specialRole ? `\nSpecial Role: ${specialRole}` : ''}\n\nGenerate comprehensive cheat sheet JSON.` },
    ], { json: true })
    return send(res, JSON.parse(content))
  } catch (e: any) {
    return sendError(res, e.message)
  }
}
