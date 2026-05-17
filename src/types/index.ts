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
  archived: boolean
  created_at: string
  updated_at: string
}

export interface CheatSheetJson {
  _generatedFor?: { country: string; committee: string; topic: string }
  mandate: string
  coreDemands: string[]
  redLines: string[]
  keyArguments: string[]
  allies: string[]
  opponents: string[]
  opponentNotes?: string
  votingRecord: string
  draftClauses: string[]
  bilateralRelations: string
  qaPairs: { question: string; answer: string }[]
  strategyNotes: string
}

export interface ResearchItem {
  label: string
  content: string
  list?: string[]
}

export interface ResearchSection {
  title: string
  items: ResearchItem[]
}

export interface StatChip {
  icon: string
  label: string
  value: string
}

export interface VotingRow {
  topic: string
  yes: boolean
  no: boolean
  abstain: boolean
  coSponsor: boolean
}

export interface BilateralRelation {
  country: string
  summary: string
  type: 'Partner' | 'Rival' | 'Complex' | 'Neutral'
}

export interface AllyBubble {
  name: string
  group: 'ally' | 'opponent' | 'swing'
  importance: 'large' | 'medium' | 'small'
}

export interface ResearchJson {
  country: string
  committee: string
  topic: string
  role: string
  statChips: StatChip[]
  sections: ResearchSection[]
  votingRecord: VotingRow[]
  bilateralRelations: BilateralRelation[]
  allyBubbles: AllyBubble[]
  _generatedFor?: { country: string; committee: string; topic: string }
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
  archived?: boolean
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
