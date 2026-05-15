import { useState, useEffect } from 'react'
import { useConference } from '../../hooks/useConference'
import { supabase } from '../../lib/supabase'
import { generateQuestion, evaluateAnswer } from '../../lib/api'
import QuestionDisplay from './QuestionDisplay'
import FeedbackDisplay from './FeedbackDisplay'
import SpeechPractice from './SpeechPractice'
import { MessageSquare, Mic } from 'lucide-react'
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
  const [mode, setMode] = useState<'qa' | 'speech'>('qa')
  const [role, setRole] = useState('UfC')
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentEval, setCurrentEval] = useState<DebateFeedback | null>(null)
  const [history, setHistory] = useState<DebateQA[]>([])

  useEffect(() => {
    if (!conference) return
    supabase
      .from('debate_qa')
      .select('*')
      .eq('conference_id', conference.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setHistory(data as DebateQA[])
      })
  }, [conference?.id])

  const handleAsk = async () => {
    if (!conference) return
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!conference || !currentQuestion) return
    setLoading(true)
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

      await supabase.from('debate_qa').insert({
        conference_id: conference.id,
        role,
        question: currentQuestion,
        user_answer: answer,
        evaluation,
      })

      const { data } = await supabase
        .from('debate_qa')
        .select('*')
        .eq('conference_id', conference.id)
        .order('created_at', { ascending: false })
      if (data) setHistory(data as DebateQA[])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-hairline mb-6">
        <button
          onClick={() => setMode('qa')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-[500] border-b-2 transition-colors ${
            mode === 'qa' ? 'border-primary text-ink' : 'border-transparent text-muted'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Q&A Practice
        </button>
        <button
          onClick={() => setMode('speech')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-[500] border-b-2 transition-colors ${
            mode === 'speech' ? 'border-primary text-ink' : 'border-transparent text-muted'
          }`}
        >
          <Mic className="w-4 h-4" /> Speech Practice
        </button>
      </div>

      {mode === 'qa' ? (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <label htmlFor="debate-role" className="text-sm font-[500] text-body">Role:</label>
            <select id="debate-role" value={role} onChange={e => setRole(e.target.value)} className="input w-auto">
              {DEBATE_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button onClick={handleAsk} disabled={loading} className="btn-primary">
              {loading ? 'Generating…' : 'Ask Question'}
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
      ) : (
        <SpeechPractice />
      )}
    </div>
  )
}
