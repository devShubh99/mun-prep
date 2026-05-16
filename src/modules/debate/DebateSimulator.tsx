import { useState, useEffect } from 'react'
import { useConference } from '../../hooks/useConference'
import { supabase } from '../../lib/supabase'
import { generateQuestion, evaluateAnswer } from '../../lib/api'
import QuestionDisplay from './QuestionDisplay'
import FeedbackDisplay from './FeedbackDisplay'
import { ProgressBar } from '../../components/ProgressIndicator'
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'

import type { DebateQA, DebateFeedback } from '../../types'

const DIFFICULTY_LEVELS = [
  { difficulty: 'very-easy', role: 'Chair', label: 'Very Easy — Chair' },
  { difficulty: 'easy', role: 'Unilateralist for Change', label: 'Easy — Unilateralist for Change' },
  { difficulty: 'medium', role: 'Group of 4', label: 'Medium — Group of 4' },
  { difficulty: 'hard', role: 'Swing State', label: 'Hard — Swing State' },
  { difficulty: 'expert', role: 'Journalist', label: 'Expert — Journalist' },
]

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="text-xs text-muted-soft hover:text-primary transition-colors flex items-center gap-1"
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function DebateSimulator() {
  const { conference } = useConference()
  const [difficulty, setDifficulty] = useState('easy')
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentEval, setCurrentEval] = useState<DebateFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<DebateQA[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!conference) return
    setError(null)
    supabase
      .from('debate_qa')
      .select('*')
      .eq('conference_id', conference.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else if (data) setHistory(data as DebateQA[])
      })
  }, [conference?.id])

  const currentLevel = DIFFICULTY_LEVELS.find(l => l.difficulty === difficulty)

  const handleAsk = async () => {
    if (!conference || !currentLevel) return
    setLoading(true)
    setError(null)
    try {
      const { question } = await generateQuestion({
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        difficulty: currentLevel.difficulty,
        role: currentLevel.role,
      })
      setCurrentQuestion(question)
      setAnswer('')
      setCurrentEval(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to generate question')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!conference || !currentQuestion || !currentLevel) return
    setLoading(true)
    setError(null)
    try {
      const evaluation = await evaluateAnswer({
        question: currentQuestion,
        answer,
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        difficulty: currentLevel.difficulty,
        role: currentLevel.role,
      })
      setCurrentEval(evaluation)

      const { error: dbErr } = await supabase.from('debate_qa').insert({
        conference_id: conference.id,
        role: currentLevel?.label || '',
        question: currentQuestion,
        user_answer: answer,
        evaluation,
      })
      if (dbErr) { setError(dbErr.message); return }

      const { data } = await supabase
        .from('debate_qa')
        .select('*')
        .eq('conference_id', conference.id)
        .order('created_at', { ascending: false })
      if (data) setHistory(data as DebateQA[])
    } catch (e: any) {
      setError(e?.message || 'Failed to evaluate answer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-4">{error}</div>
      )}
      {loading && <div className="mb-4"><ProgressBar /></div>}
      <div className="flex items-center gap-3 mb-6">
        <label htmlFor="debate-difficulty" className="text-sm font-[500] text-body">Difficulty:</label>
        <select id="debate-difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input w-auto">
          {DIFFICULTY_LEVELS.map(l => <option key={l.difficulty} value={l.difficulty}>{l.label}</option>)}
        </select>
        <button onClick={handleAsk} disabled={loading} className="btn-primary">
          {loading ? 'Generating\u2026' : 'Ask Question'}
        </button>
      </div>

      {currentQuestion && (
        <QuestionDisplay
          question={currentQuestion}
          answer={answer}
          onAnswerChange={setAnswer}
          onSubmit={handleSubmitAnswer}
          loading={loading}
        />
      )}

      {currentEval && <FeedbackDisplay feedback={currentEval} />}

      {history.length > 0 && (
        <div className="mt-8">
          <h3 className="font-[500] text-sm text-muted mb-3">Past Sessions</h3>
          <div className="space-y-2">
            {history.slice(0, 10).map(entry => {
              const isOpen = expandedId === entry.id
              return (
                <div key={entry.id}>
                  <button
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    className="w-full text-left card-light p-4 hover:bg-surface-soft transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted">{isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
                        <span className="badge bg-surface-card text-muted">{entry.role}</span>
                      </div>
                      <span className="text-xs text-muted-soft">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-body ml-6">{entry.question}</p>
                    {entry.evaluation && !isOpen && (
                      <div className="flex gap-3 mt-2 ml-6 text-xs text-muted">
                        <span>Argument: {entry.evaluation.argumentScore}/10</span>
                        <span>Diplomacy: {entry.evaluation.diplomacyScore}/10</span>
                      </div>
                    )}
                  </button>

                  {isOpen && entry.evaluation && (
                    <div className="card-light rounded-t-none border-t-0 p-4 space-y-3">
                      {/* User Answer */}
                      {entry.user_answer && (
                        <div>
                          <span className="text-xs font-[500] text-body">Your Answer</span>
                          <p className="text-sm text-muted bg-surface-soft rounded-lg p-3 mt-1">{entry.user_answer}</p>
                        </div>
                      )}

                      {/* Scores */}
                      <div className="flex gap-4">
                        <div>
                          <span className="text-xs text-muted">Argument</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} className={`text-sm ${i < Math.round(entry.evaluation!.argumentScore / 2) ? 'text-accent-amber' : 'text-hairline'}`}>★</span>
                            ))}
                            <span className="text-xs text-muted ml-1">{entry.evaluation.argumentScore}/10</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-muted">Diplomacy</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} className={`text-sm ${i < Math.round(entry.evaluation!.diplomacyScore / 2) ? 'text-accent-amber' : 'text-hairline'}`}>★</span>
                            ))}
                            <span className="text-xs text-muted ml-1">{entry.evaluation.diplomacyScore}/10</span>
                          </div>
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="p-2.5 bg-success/10 rounded-lg text-sm text-body">
                        <span className="font-[500] text-success">👍 </span>{entry.evaluation.compliment}
                      </div>
                      <div className="p-2.5 bg-warning/10 rounded-lg text-sm text-body">
                        <span className="font-[500] text-warning">💡 </span>{entry.evaluation.improvement}
                      </div>
                      <div className="p-2.5 bg-primary/10 rounded-lg text-sm text-body">
                        <span className="font-[500] text-primary">🔄 Rebuttal:</span>
                        <p className="mt-1">{entry.evaluation.modelRebuttal}</p>
                      </div>

                      {/* Copy */}
                      <div className="flex justify-end pt-1">
                        <CopyBtn text={`Question: ${entry.question}\n\nAnswer: ${entry.user_answer || ''}\n\nArgument Score: ${entry.evaluation.argumentScore}/10\nDiplomacy Score: ${entry.evaluation.diplomacyScore}/10\n\nFeedback: ${entry.evaluation.compliment}\nImprovement: ${entry.evaluation.improvement}\nModel Rebuttal: ${entry.evaluation.modelRebuttal}`} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
