import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

const SYSTEM_PROMPT = `You are an expert MUN delegate. Generate a comprehensive cheat sheet as JSON matching this schema exactly:
{
  "mandate": "string - the delegate's mandate and powers",
  "coreDemands": ["string - each core demand"],
  "redLines": ["string - each red line"],
  "keyArguments": ["string - each key argument"],
  "allies": ["string - ally countries"],
  "opponents": ["string - opponent countries"],
  "votingRecord": "string - voting record details",
  "draftClauses": ["string - each draft clause"],
  "bilateralRelations": "string - bilateral relations summary",
  "qaPairs": [{"question": "string", "answer": "string"}],
  "strategyNotes": "string - strategy notes"
}`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { country, committee, topic, specialRole } = JSON.parse(event.body || '{}')
    const userPrompt = `Country: ${country}\nCommittee: ${committee}\nTopic: ${topic}${specialRole ? `\nSpecial Role: ${specialRole}` : ''}\n\nGenerate comprehensive cheat sheet JSON.`
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    })
    return ok(JSON.parse(response.choices[0].message.content || '{}'))
  } catch (e: any) {
    return error(500, e.message)
  }
}
