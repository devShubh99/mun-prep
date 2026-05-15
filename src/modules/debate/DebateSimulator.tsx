import { useState, useEffect } from 'react'
import { useConference } from '../../hooks/useConference'
import { supabase } from '../../lib/supabase'
import { generateQuestion, evaluateAnswer } from '../../lib/api'
import QuestionDisplay from './QuestionDisplay'
import FeedbackDisplay from './FeedbackDisplay'

import type { DebateQA, DebateFeedback } from '../../types'

const DEBATE_ROLES = [
  { value: 'UfC', label: 'Unilateralist for Change' },
  { value: 'G4', label: 'Group of 4' },
  { value: 'Chair', label: 'Committee Chair' },
  { value: 'Swing', label: 'Swing State' },
  { value: 'Journalist', label: 'Journalist' },
]

export default function DebateSimulator() {
  const { conference } = useConference()
  const [role, setRole] = useState('UfC')
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentEval, setCurrentEval] = useState<DebateFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<DebateQA[]>([])

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

  const handleAsk = async () => {
    if (!conference) return
    setLoading(true)
    setError(null)
    try {
      const { question } = await generateQuestion({
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        role,
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
    if (!conference || !currentQuestion) return
    setLoading(true)
    setError(null)
    try {
      const evaluation = await evaluateAnswer({
        question: currentQuestion,
        answer,
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        role,
      })
      setCurrentEval(evaluation)

      const { error: dbErr } = await supabase.from('debate_qa').insert({
        conference_id: conference.id,
        role,
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
      <div className="flex items-center gap-3 mb-6">
        <label htmlFor="debate-role" className="text-sm font-[500] text-body">Role:</label>
        <select id="debate-role" value={role} onChange={e => setRole(e.target.value)} className="input w-auto">
          {DEBATE_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
          <h3 className="font-[500] text-sm text-muted mb-3">Past Questions</h3>
          <div className="space-y-2">
            {history.slice(0, 10).map(entry => (
              <div key={entry.id} className="card-light p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="badge bg-surface-card text-muted">{entry.role}</span>
                  <span className="text-xs text-muted-soft">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-body">{entry.question}</p>
                {entry.evaluation && (
                  <div className="flex gap-3 mt-2 text-xs text-muted">
                    <span>Argument: {entry.evaluation.argumentScore}/10</span>
                    <span>Diplomacy: {entry.evaluation.diplomacyScore}/10</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
