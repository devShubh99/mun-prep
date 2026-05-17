import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-canvas p-8">
          <div className="card text-center max-w-md">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h2 className="font-serif text-[22px] text-ink mb-2">Something went wrong</h2>
            <p className="text-muted text-sm mb-2">{this.state.error?.message}</p>
            <p className="text-muted-soft text-xs mb-4">Try refreshing the page. If the problem persists, check your connection.</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
