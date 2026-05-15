import type { Handler } from '@netlify/functions'
import { deepseek, ok, error } from './shared'

const SYSTEM_PROMPT = `You are a MUN speech evaluator. Evaluate the transcript and return JSON:
{
  "transcript": "string",
  "evaluation": {
    "clarity": { "score": 1-10, "feedback": "string" },
    "argumentStrength": { "score": 1-10, "feedback": "string" },
    "factualAccuracy": { "score": 1-10, "feedback": "string" },
    "tone": { "score": 1-10, "feedback": "string" }
  },
  "overallScore": "number 0-10",
  "suggestedImprovements": ["string", "string"],
  "rebuttalReady": "string - AI-generated counter-argument"
}`

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { transcript, researchContext, cheatSheetContext } = JSON.parse(event.body || '{}')
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + `\n\nResearch Context:\n${researchContext}\n\nCheat Sheet Context:\n${cheatSheetContext}` },
        { role: 'user', content: `Evaluate this speech: "${transcript}"` },
      ],
      response_format: { type: 'json_object' },
    })
    return ok(JSON.parse(response.choices[0].message.content || '{}'))
  } catch (e: any) {
    return error(500, e.message)
  }
}
