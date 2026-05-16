export function ProgressBar() {
  return (
    <div className="w-full h-1 bg-surface-soft rounded-full overflow-hidden">
      <div className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-progress" />
    </div>
  )
}

export function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-2">
      <span className="w-2 h-2 bg-muted rounded-full animate-dot" />
      <span className="w-2 h-2 bg-muted rounded-full animate-dot" style={{ animationDelay: '0.16s' }} />
      <span className="w-2 h-2 bg-muted rounded-full animate-dot" style={{ animationDelay: '0.32s' }} />
    </div>
  )
}
