import OpenAI from 'openai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://mun-prep.vercel.app',
    'X-Title': 'MUN Prep',
  },
})

export function send(res: VercelResponse, data: unknown, status = 200) {
  return res.status(status).json(data)
}

export function sendError(res: VercelResponse, message: string, status = 500) {
  return res.status(status).json({ error: message })
}

export function readBody(req: VercelRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: string) => body += chunk)
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { resolve({}) }
    })
    req.on('error', reject)
  })
}
