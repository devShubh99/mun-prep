import { useState } from 'react'
import { documentAi } from '../../lib/api'
import { Sparkles, Scissors, Lightbulb, FilePlus } from 'lucide-react'
import { ProgressBar } from '../../components/ProgressIndicator'

interface Props {
  content: string
  documentType: string
  onResult: (result: string) => void
}

const ACTIONS = [
  { key: 'polish', label: 'Polish', icon: Sparkles },
  { key: 'shorten', label: 'Shorten', icon: Scissors },
  { key: 'brainstorm', label: 'Brainstorm', icon: Lightbulb },
  { key: 'insert-clause', label: 'Insert Clause', icon: FilePlus },
]

export default function AiActionButtons({ content, documentType, onResult }: Props) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (action: string) => {
    setLoadingAction(action)
    setError(null)
    try {
      const { result } = await documentAi({ action, documentType, content })
      if (action === 'polish' || action === 'shorten') {
        onResult(result)
      } else {
        try {
          const parsed = JSON.parse(content)
          parsed.content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: '\n' + result }],
          })
          onResult(JSON.stringify(parsed))
        } catch {
          onResult(result)
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Action failed')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div>
      {error && (
        <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-2">{error}</div>
      )}
      {loadingAction && <div className="mb-2"><ProgressBar /></div>}
      <div className="flex gap-2">
      {ACTIONS.map(action => (
        <button
          key={action.key}
          onClick={() => handleAction(action.key)}
          disabled={loadingAction !== null}
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
