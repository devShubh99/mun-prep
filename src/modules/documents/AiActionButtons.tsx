import { useState, useRef, useEffect } from 'react'
import { documentAi } from '../../lib/api'
import { useConference } from '../../hooks/useConference'
import { Wand2, Scissors, Lightbulb, FilePlus } from 'lucide-react'
import { ProgressBar } from '../../components/ProgressIndicator'

interface Props {
  content: string
  documentType: string
  onPreview: (result: string, action: string) => void
  disabled?: boolean
}

const ACTIONS = [
  { key: 'polish', label: 'Polish Wording', icon: Wand2 },
  { key: 'shorten', label: 'Condense', icon: Scissors },
  { key: 'brainstorm', label: 'Brainstorm', icon: Lightbulb },
  { key: 'insert-clause', label: 'Draft Clause', icon: FilePlus },
]

export default function AiActionButtons({ content, documentType, onPreview, disabled }: Props) {
  const { tasks, setTask, setDocumentDraft } = useConference()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const actionLabels: Record<string, string> = {
    polish: 'Polishing\u2026',
    shorten: 'Condensing\u2026',
    brainstorm: 'Brainstorming\u2026',
    'insert-clause': 'Drafting\u2026',
  }

  const handleAction = async (action: string) => {
    setLoadingAction(action)
    setError(null)
    setTask('documents', actionLabels[action] || 'Processing\u2026')
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const { result } = await documentAi({ action, documentType, content }, controller.signal)
      if (!result) throw new Error('AI returned empty response')
      setDocumentDraft({ content: result, action })
      onPreview(result, action)
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Action failed')
    } finally {
      setLoadingAction(null)
      setTask('documents', null)
    }
  }

  return (
    <div>
      {error && (
        <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-2">{error}</div>
      )}
      {(loadingAction || tasks['documents']) && <div className="mb-2"><ProgressBar /></div>}
      <div className="flex gap-2">
      {ACTIONS.map(action => (
        <button
          key={action.key}
          onClick={() => handleAction(action.key)}
          disabled={loadingAction !== null || disabled}
          className="btn-secondary text-xs"
        >
          {loadingAction === action.key ? (
            <span className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          ) : (
            <action.icon className="w-3.5 h-3.5" />
          )}
          {action.label}
        </button>
      ))}
      </div>
    </div>
  )
}
