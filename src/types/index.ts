export interface Conference {
  id: string
  user_id: string
  name: string
  assigned_country: string
  committee: string
  topic: string
  special_role: string | null
  deadline: string | null
  cheat_sheet_data: CheatSheetJson | null
  research_data: ResearchJson | null
  created_at: string
  updated_at: string
}

export interface CheatSheetJson {
  mandate: string
  coreDemands: string[]
  redLines: string[]
  keyArguments: string[]
  allies: string[]
  opponents: string[]
  votingRecord: string
  draftClauses: string[]
  bilateralRelations: string
  qaPairs: { question: string; answer: string }[]
  strategyNotes: string
}

export interface ResearchJson {
  content: string
}

export interface Document {
  id: string
  conference_id: string
  title: string
  content: string
  archived: boolean
  created_at: string
  updated_at: string
}

export interface DebateQA {
  id: string
  conference_id: string
  role: string
  question: string
  user_answer: string | null
  evaluation: DebateFeedback | null
  created_at: string
}

export interface DebateFeedback {
  argumentScore: number
  diplomacyScore: number
  compliment: string
  improvement: string
  modelRebuttal: string
}

export interface ResearchChatMessage {
  id: string
  conference_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export const TABLES = {
  conferences: 'conferences',
  documents: 'documents',
  debateQa: 'debate_qa',
  researchChatMessages: 'research_chat_messages',
} as const
