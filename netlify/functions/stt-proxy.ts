import type { Handler } from '@netlify/functions'
import { ok, error } from './shared'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return error(405, 'Method not allowed')
  try {
    const { audioBase64 } = JSON.parse(event.body || '{}')
    const apiKey = process.env.GOOGLE_STT_API_KEY
    if (!apiKey) return error(500, 'GOOGLE_STT_API_KEY not configured')

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
          },
          audio: { content: audioBase64 },
        }),
      }
    )
    const data = await response.json()
    const transcript = data.results
      ?.map((r: any) => r.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join(' ') || ''
    return ok({ transcript })
  } catch (e: any) {
    return error(500, e.message)
  }
}
