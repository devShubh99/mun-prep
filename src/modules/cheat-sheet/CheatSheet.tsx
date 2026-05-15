import { useState } from 'react'
import { useConference } from '../../hooks/useConference'
import { generateCheatSheet } from '../../lib/api'
import { Sparkles } from 'lucide-react'
import type { CheatSheetJson } from '../../types'

const TABS = [
  { key: 'mandate', label: 'Mandate' },
  { key: 'coreDemands', label: 'Core Demands' },
  { key: 'redLines', label: 'Red Lines' },
  { key: 'alliesOpponents', label: 'Allies & Opponents' },
  { key: 'votingRecord', label: 'Voting Record' },
  { key: 'draftClauses', label: 'Draft Clauses' },
  { key: 'strategy', label: 'Strategy & Q&A' },
]

export default function CheatSheet() {
  const { conference, updateConference } = useConference()
  const [activeTab, setActiveTab] = useState('mandate')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!conference) return
    setGenerating(true)
    setError(null)
    try {
      const data = await generateCheatSheet({
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        specialRole: conference.special_role || undefined,
      })
      const err = await updateConference({ cheat_sheet_data: data as unknown as CheatSheetJson })
      if (err) setError(err)
    } catch (e: any) {
      setError(e?.message || 'Failed to generate cheat sheet')
    } finally {
      setGenerating(false)
    }
  }

  const cs = conference?.cheat_sheet_data

  return (
    <div>
      {error && (
        <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-4">{error}</div>
      )}
      {!cs ? (
        <div className="card text-center">
          <p className="text-body mb-4">Generate an AI-powered cheat sheet for {conference?.assigned_country}.</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating\u2026' : 'Generate Cheat Sheet'}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1 border-b border-hairline">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-[500] border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary text-ink'
                      : 'border-transparent text-muted hover:text-body'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={generating} className="btn-ghost text-sm">
              <Sparkles className="w-3 h-3" />
              Regenerate
            </button>
          </div>

          <div className="space-y-4">
            {activeTab === 'mandate' && (
              <div className="card-light">
                <p className="text-body whitespace-pre-wrap">{cs.mandate}</p>
              </div>
            )}
            {activeTab === 'coreDemands' && (
              <div className="card-light">
                <ol className="list-decimal pl-5 space-y-2">
                  {cs.coreDemands.map((d, i) => <li key={i} className="text-body">{d}</li>)}
                </ol>
              </div>
            )}
            {activeTab === 'redLines' && (
              <div className="card-light">
                <ul className="list-disc pl-5 space-y-2">
                  {cs.redLines.map((r, i) => <li key={i} className="text-body">{r}</li>)}
                </ul>
              </div>
            )}
            {activeTab === 'alliesOpponents' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-3">Allies</h3>
                  <ul className="space-y-1">
                    {cs.allies.map((a, i) => <li key={i} className="text-body">{a}</li>)}
                  </ul>
                </div>
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-3">Opponents</h3>
                  <ul className="space-y-1">
                    {cs.opponents.map((o, i) => <li key={i} className="text-body">{o}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {activeTab === 'votingRecord' && (
              <div className="card-light">
                <p className="text-body whitespace-pre-wrap">{cs.votingRecord}</p>
              </div>
            )}
            {activeTab === 'draftClauses' && (
              <div className="card-light">
                <ol className="list-decimal pl-5 space-y-2">
                  {cs.draftClauses.map((c, i) => <li key={i} className="text-body">{c}</li>)}
                </ol>
              </div>
            )}
            {activeTab === 'strategy' && (
              <div className="space-y-4">
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-2">Key Arguments</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {cs.keyArguments.map((a, i) => <li key={i} className="text-body">{a}</li>)}
                  </ul>
                </div>
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-2">Bilateral Relations</h3>
                  <p className="text-body whitespace-pre-wrap">{cs.bilateralRelations}</p>
                </div>
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-2">Q&A Pairs</h3>
                  <div className="space-y-3">
                    {cs.qaPairs.map((qa, i) => (
                      <div key={i}>
                        <p className="font-[500] text-sm text-ink">Q: {qa.question}</p>
                        <p className="text-body text-sm">A: {qa.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-light">
                  <h3 className="font-[500] text-sm text-muted mb-2">Strategy Notes</h3>
                  <p className="text-body whitespace-pre-wrap">{cs.strategyNotes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
