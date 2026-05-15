const BASE = '/api'

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(text || res.statusText, res.status)
  }
  return res.json()
}

export function generateCheatSheet(params: {
  country: string
  committee: string
  topic: string
  specialRole?: string
}) {
  return request<Record<string, unknown>>('/generate-cheatsheet', params)
}

export function generateResearch(params: {
  country: string
  committee: string
  topic: string
}) {
  return request<{ content: string }>('/generate-research', params)
}

export function researchChat(params: {
  researchContext: string
  question: string
}) {
  return request<{ answer: string }>('/research-chat', params)
}

export function documentAi(params: {
  action: string
  documentType: string
  content: string
  context?: string
}) {
  return request<{ result: string }>('/document-ai', params)
}

export function generateQuestion(params: {
  country: string
  committee: string
  topic: string
  role: string
}) {
  return request<{ question: string }>('/generate-question', params)
}

export function evaluateAnswer(params: {
  question: string
  answer: string
  country: string
  committee: string
  topic: string
  role: string
}) {
  return request<{
    argumentScore: number
    diplomacyScore: number
    compliment: string
    improvement: string
    modelRebuttal: string
  }>('/evaluate-answer', params)
}

export function evaluateSpeech(params: {
  transcript: string
  researchContext: string
  cheatSheetContext: string
}) {
  return request<{
    transcript: string
    evaluation: {
      clarity: { score: number; feedback: string }
      argumentStrength: { score: number; feedback: string }
      factualAccuracy: { score: number; feedback: string }
      tone: { score: number; feedback: string }
    }
    overallScore: number
    suggestedImprovements: string[]
    rebuttalReady: string
  }>('/evaluate-speech', params)
}

export function sttProxy(params: { audioBase64: string }) {
  return request<{ transcript: string }>('/stt-proxy', params)
}
