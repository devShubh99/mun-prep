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
  const text = await res.text()
  if (!res.ok) throw new ApiError(text || res.statusText, res.status)
  try { return JSON.parse(text) } catch {
    throw new ApiError(`Invalid response: ${text.slice(0, 80)}`)
  }
}

export function generateCheatSheet(params: {
  country: string
  committee: string
  topic: string
  specialRole?: string
}) {
  return request<{ mandate: string; coreDemands: string[]; redLines: string[]; keyArguments: string[]; allies: string[]; opponents: string[]; votingRecord: string; draftClauses: string[]; bilateralRelations: string; qaPairs: { question: string; answer: string }[]; strategyNotes: string }>('/generate-cheatsheet', params)
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
  difficulty: string
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
  difficulty: string
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


