import { useState, useEffect, useRef } from 'react'
import { useConference } from '../../hooks/useConference'
import { supabase } from '../../lib/supabase'
import { generateQuestion, evaluateAnswer } from '../../lib/api'
import QuestionDisplay from './QuestionDisplay'
import FeedbackDisplay from './FeedbackDisplay'
import { ProgressBar } from '../../components/ProgressIndicator'
import { Copy, Check, ChevronDown, ChevronRight, Archive, RotateCcw, Trash2, MessageSquare } from 'lucide-react'

import type { DebateQA, DebateFeedback } from '../../types'

const DIFFICULTY_LEVELS = [
  { difficulty: 'very-easy', role: 'Chair', label: 'Very Easy \u2014 Chair' },
  { difficulty: 'easy', role: 'Unilateralist for Change', label: 'Easy \u2014 Unilateralist for Change' },
  { difficulty: 'medium', role: 'Group of 4', label: 'Medium \u2014 Group of 4' },
  { difficulty: 'hard', role: 'Swing State', label: 'Hard \u2014 Swing State' },
  { difficulty: 'expert', role: 'Journalist', label: 'Expert \u2014 Journalist' },
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
  const { conference, tasks, setTask, debateDraft, setDebateDraft } = useConference()
  const abortRef = useRef<AbortController | null>(null)
  const [difficulty, setDifficulty] = useState('easy')
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentEval, setCurrentEval] = useState<DebateFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<DebateQA[]>([])
  const [archivedHistory, setArchivedHistory] = useState<DebateQA[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(new Set())

  const currentLevel = DIFFICULTY_LEVELS.find(l => l.difficulty === difficulty)

  // Restore draft on mount
  useEffect(() => {
    if (debateDraft) {
      setCurrentQuestion(debateDraft.question)
      setAnswer(debateDraft.answer)
      setCurrentEval(debateDraft.evaluation)
    }
  }, [])

  // Abort API on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  useEffect(() => {
    if (!conference) return
    setError(null)
    supabase
      .from('debate_qa')
      .select('*')
      .eq('conference_id', conference.id)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); return }
        if (!data) return
        setHistory((data as DebateQA[]).filter(e => !e.archived))
        setArchivedHistory((data as DebateQA[]).filter(e => e.archived))
      })
  }, [conference?.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleAsk()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [conference, loading])

  const handleAsk = async () => {
    if (!conference || !currentLevel) return
    setSubmittedAnswers(new Set())
    setLoading(true)
    setError(null)
    setDebateDraft(null)
    setTask('debate', 'Posing question\u2026')
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const { question } = await generateQuestion({
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        difficulty: currentLevel.difficulty,
        role: currentLevel.role,
      }, controller.signal)
      setCurrentQuestion(question)
      setAnswer('')
      setCurrentEval(null)
      setDebateDraft({ question, answer: '', evaluation: null })
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Failed to generate question')
    } finally {
      setLoading(false)
      setTask('debate', null)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!conference || !currentQuestion || !currentLevel) return
    const answerKey = `${currentQuestion}|${answer}`
    if (submittedAnswers.has(answerKey)) {
      setError('You already submitted this answer')
      return
    }
    setLoading(true)
    setError(null)
    setTask('debate', 'Scoring\u2026')
    abortRef.current?.abort()
    const controller2 = new AbortController()
    abortRef.current = controller2
    try {
      const evaluation = await evaluateAnswer({
        question: currentQuestion,
        answer,
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        difficulty: currentLevel.difficulty,
        role: currentLevel.role,
      }, controller2.signal)
      setCurrentEval(evaluation)
      setDebateDraft({ question: currentQuestion, answer, evaluation })
      setSubmittedAnswers(prev => new Set(prev).add(answerKey))

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
      if (data) {
        setHistory((data as DebateQA[]).filter(e => !e.archived))
        setArchivedHistory((data as DebateQA[]).filter(e => e.archived))
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Failed to evaluate answer')
    } finally {
      setLoading(false)
      setTask('debate', null)
    }
  }

  const handleArchive = async (id: string) => {
    await supabase.from('debate_qa').update({ archived: true }).eq('id', id)
    const entry = history.find(e => e.id === id)
    if (entry) {
      setHistory(prev => prev.filter(e => e.id !== id))
      setArchivedHistory(prev => [{ ...entry, archived: true }, ...prev])
    }
  }

  const handleRestore = async (id: string) => {
    await supabase.from('debate_qa').update({ archived: false }).eq('id', id)
    const entry = archivedHistory.find(e => e.id === id)
    if (entry) {
      setArchivedHistory(prev => prev.filter(e => e.id !== id))
      setHistory(prev => [{ ...entry, archived: false }, ...prev])
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Permanently delete this debate session? This cannot be undone.')) return
    await supabase.from('debate_qa').delete().eq('id', id)
    setArchivedHistory(prev => prev.filter(e => e.id !== id))
  }

  const handleNewQuestion = () => {
    setCurrentQuestion(null)
    setAnswer('')
    setCurrentEval(null)
  }

  const scored = history.filter(e => e.evaluation)
  const avgArg = scored.length > 0 ? scored.reduce((s, e) => s + (e.evaluation!.argumentScore || 0), 0) / scored.length : 0
  const avgDip = scored.length > 0 ? scored.reduce((s, e) => s + (e.evaluation!.diplomacyScore || 0), 0) / scored.length : 0
  const overall = (avgArg + avgDip) / 2

  const first = scored[scored.length - 1]
  const last = scored[0]
  const lastTotal = last?.evaluation ? last.evaluation.argumentScore + last.evaluation.diplomacyScore : 0
  const firstTotal = first?.evaluation ? first.evaluation.argumentScore + first.evaluation.diplomacyScore : 0
  const perSessionTrend = scored.length >= 2 ? ((lastTotal - firstTotal) / 2).toFixed(1) : '\u2014'

  const best = scored.reduce((best, e) => {
    const total = (e.evaluation?.argumentScore || 0) + (e.evaluation?.diplomacyScore || 0)
    return total > best.total ? { total, date: e.created_at } : best
  }, { total: 0, date: '' })

  return (
    <div>
      {error && (
        <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-4">{error}</div>
      )}
      {(loading || tasks['debate']) && <div className="mb-4"><ProgressBar /></div>}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <label htmlFor="debate-difficulty" className="text-sm font-[500] text-body">Difficulty:</label>
        <select id="debate-difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input w-auto">
          {DIFFICULTY_LEVELS.map(l => <option key={l.difficulty} value={l.difficulty}>{l.label}</option>)}
        </select>
        <button onClick={handleAsk} disabled={loading} className="btn-primary">
          <MessageSquare className="w-4 h-4" />
          {loading ? 'Posing question\u2026' : 'Ask Question'}
        </button>
      </div>

      {!currentQuestion && history.length === 0 && !loading && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-serif text-[22px] text-ink mb-2">Practice Makes Perfect</h2>
          <p className="text-muted text-sm mb-6 max-w-md mx-auto">
            Prepare for {conference?.assigned_country || 'your country'} by practicing debate questions and receiving scored feedback.
          </p>
          <div className="text-left max-w-xs mx-auto space-y-3 mb-6">
            <div className="flex items-start gap-3 text-sm text-body">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-[500] flex items-center justify-center shrink-0">1</span>
              <span>Click <strong>Ask Question</strong> to get a debate question tailored to your committee and difficulty.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-body">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-[500] flex items-center justify-center shrink-0">2</span>
              <span>Type your answer and submit to receive scores on argument and diplomacy.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-body">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-[500] flex items-center justify-center shrink-0">3</span>
              <span>Review feedback and track your improvement across sessions.</span>
            </div>
          </div>
          <p className="text-xs text-muted-soft">Select a difficulty level above to begin.</p>
        </div>
      )}

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

      {currentEval && (
        <div className="flex justify-end mt-4">
          <button onClick={handleNewQuestion} className="btn-secondary">
            New Question
          </button>
        </div>
      )}

      {scored.length >= 2 && (
        <div className="bg-surface-soft/50 rounded-xl px-4 py-3 mb-6 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-[500] text-sm text-body">Session Summary</h3>
            <span className="text-xs text-muted-soft">{scored.length} session{scored.length > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center mb-3">
            <div>
              <span className="text-xl font-serif text-primary">{overall.toFixed(1)}</span>
              <p className="text-[10px] text-muted mt-0.5">Average</p>
            </div>
            <div>
              <span className="text-xl font-serif text-ink">{avgArg.toFixed(1)}</span>
              <p className="text-[10px] text-muted mt-0.5">Argument</p>
            </div>
            <div>
              <span className="text-xl font-serif text-ink">{avgDip.toFixed(1)}</span>
              <p className="text-[10px] text-muted mt-0.5">Diplomacy</p>
            </div>
            <div>
              <span className={`text-xl font-serif ${Number(perSessionTrend) >= 0 ? 'text-success' : 'text-error'}`}>
                {perSessionTrend !== '\u2014' ? `${Number(perSessionTrend) >= 0 ? '+' : ''}${perSessionTrend}` : '\u2014'}
              </span>
              <p className="text-[10px] text-muted mt-0.5">Trend</p>
            </div>
          </div>
          {scored.length >= 2 && (
            <div className="flex justify-between text-[11px] text-muted-soft border-t border-hairline pt-2">
              <span>Best: <span className="text-ink font-[500]">{(best.total / 2).toFixed(1)}</span> {best.date ? new Date(best.date).toLocaleDateString() : ''}</span>
              <span>Recent: <span className="text-ink font-[500]">{(lastTotal / 2).toFixed(1)}</span></span>
            </div>
          )}
        </div>
      )}

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
                      {entry.user_answer && (
                        <div>
                          <span className="text-xs font-[500] text-body">Your Answer</span>
                          <p className="text-sm text-muted bg-surface-soft rounded-lg p-3 mt-1">{entry.user_answer}</p>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <div>
                          <span className="text-xs text-muted">Argument</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} className={`text-sm ${i < Math.round(entry.evaluation!.argumentScore / 2) ? 'text-accent-amber' : 'text-hairline'}`}>{'\u2605'}</span>
                            ))}
                            <span className="text-xs text-muted ml-1">{entry.evaluation.argumentScore}/10</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-muted">Diplomacy</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} className={`text-sm ${i < Math.round(entry.evaluation!.diplomacyScore / 2) ? 'text-accent-amber' : 'text-hairline'}`}>{'\u2605'}</span>
                            ))}
                            <span className="text-xs text-muted ml-1">{entry.evaluation.diplomacyScore}/10</span>
                          </div>
                        </div>
                      </div>

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

                      <div className="flex justify-between pt-1">
                        <button onClick={() => handleArchive(entry.id)} className="btn-ghost text-xs flex items-center gap-1 text-muted">
                          <Archive className="w-3 h-3" /> Archive
                        </button>
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

      {archivedHistory.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="btn-ghost text-xs flex items-center gap-1 mb-2"
          >
            <Archive className="w-3.5 h-3.5" /> Archived ({archivedHistory.length})
          </button>
          {showArchived && (
            <div className="space-y-2">
              {archivedHistory.map(entry => (
                <div key={entry.id} className="bg-surface-soft/50 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0 mr-4">
                    <p className="text-sm text-muted truncate">{entry.question}</p>
                    <span className="text-xs text-muted-soft">{entry.role} — {new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleRestore(entry.id)} className="btn-ghost text-xs flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                    <button onClick={() => handlePermanentDelete(entry.id)} className="btn-ghost text-xs flex items-center gap-1 text-error">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
