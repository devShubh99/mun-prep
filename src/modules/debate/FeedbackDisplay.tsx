interface Props {
  feedback: {
    argumentScore: number
    diplomacyScore: number
    compliment: string
    improvement: string
    modelRebuttal: string
  }
}

export default function FeedbackDisplay({ feedback }: Props) {
  return (
    <div className="card-light space-y-4 mt-6">
      <h3 className="font-[500] text-lg text-ink">Feedback</h3>
      <div className="flex gap-6">
        <div>
          <span className="text-sm text-muted">Argument</span>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`text-lg ${i < Math.round(feedback.argumentScore / 2) ? 'text-accent-amber' : 'text-hairline'}`}>★</span>
            ))}
            <span className="text-sm text-muted ml-1">{feedback.argumentScore}/10</span>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted">Diplomacy</span>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`text-lg ${i < Math.round(feedback.diplomacyScore / 2) ? 'text-accent-amber' : 'text-hairline'}`}>★</span>
            ))}
            <span className="text-sm text-muted ml-1">{feedback.diplomacyScore}/10</span>
          </div>
        </div>
      </div>
      <div className="p-3 bg-success/10 rounded-lg text-sm text-body">
        <span className="font-[500] text-success">👍 {feedback.compliment}</span>
      </div>
      <div className="p-3 bg-warning/10 rounded-lg text-sm text-body">
        <span className="font-[500] text-warning">💡 {feedback.improvement}</span>
      </div>
      <div className="p-3 bg-primary/10 rounded-lg text-sm text-body">
        <span className="font-[500] text-primary">🔄 Model Rebuttal:</span>
        <p className="mt-1">{feedback.modelRebuttal}</p>
      </div>
    </div>
  )
}
