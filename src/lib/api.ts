const BASE = '/api'

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const text = await res.text()
  if (!res.ok) throw new ApiError(text || res.statusText, res.status)
  try { return JSON.parse(text) } catch {
    throw new ApiError(`Invalid response: ${text.slice(0, 80)}`)
  }
}

export function generateCheatSheet(params: {
  country: string; committee: string; topic: string; specialRole?: string
}, signal?: AbortSignal) {
  return request<{ mandate: string; coreDemands: string[]; redLines: string[]; keyArguments: string[]; allies: string[]; opponents: string[]; votingRecord: string; draftClauses: string[]; bilateralRelations: string; qaPairs: { question: string; answer: string }[]; strategyNotes: string }>('/generate-cheatsheet', params, signal)
}

export function generateResearch(params: {
  country: string; committee: string; topic: string
}, signal?: AbortSignal) {
  return request<{ sections: { title: string; items: { label: string; content: string; list?: string[] }[] }[] }>('/generate-research', params, signal)
}

export function researchChat(params: {
  researchContext: string; question: string
}, signal?: AbortSignal) {
  return request<{ answer: string }>('/research-chat', params, signal)
}

export function documentAi(params: {
  action: string; documentType: string; content: string; context?: string
}, signal?: AbortSignal) {
  return request<{ result: string }>('/document-ai', params, signal)
}

export function generateQuestion(params: {
  country: string; committee: string; topic: string; difficulty: string; role: string
}, signal?: AbortSignal) {
  return request<{ question: string }>('/generate-question', params, signal)
}

export function evaluateAnswer(params: {
  question: string; answer: string; country: string; committee: string; topic: string; difficulty: string; role: string
}, signal?: AbortSignal) {
  return request<{ argumentScore: number; diplomacyScore: number; compliment: string; improvement: string; modelRebuttal: string }>('/evaluate-answer', params, signal)
}


