interface Props {
  question: string
  answer: string
  onAnswerChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
}

export default function QuestionDisplay({ question, answer, onAnswerChange, onSubmit, loading }: Props) {
  return (
    <div className="card-light space-y-4">
      <div className="bg-primary/10 rounded-lg p-4">
        <p className="text-body font-[500]">{question}</p>
      </div>
      <div>
        <label htmlFor="debate-answer" className="block text-sm font-[500] text-body mb-1">Your Answer</label>
        <textarea
          id="debate-answer"
          value={answer}
          onChange={e => onAnswerChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }}
          className="input min-h-[100px] resize-y"
          placeholder="Type your answer… (Enter to submit, Shift+Enter for newline)"
          disabled={loading}
        />
      </div>
      <div className="flex justify-end">
        <button onClick={onSubmit} disabled={loading || !answer.trim()} className="btn-primary">
          {loading ? 'Evaluating…' : 'Submit Answer'}
        </button>
      </div>
    </div>
  )
}
