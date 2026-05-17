import { useState, useEffect, useRef } from 'react'
import { useConference } from '../../hooks/useConference'
import { researchChat } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Send, Copy, Check } from 'lucide-react'
import { TypingDots } from '../../components/ProgressIndicator'
import type { ResearchChatMessage } from '../../types'

function CopyMsg({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="text-muted-soft hover:text-primary transition-colors opacity-0 group-hover:opacity-100 p-0.5"
      title="Copy message"
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

export default function ResearchChat() {
  const { conference, setTask } = useConference()
  const { user } = useAuth()
  const [messages, setMessages] = useState<ResearchChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conference) return
    setError(null)
    supabase
      .from('research_chat_messages')
      .select('*')
      .eq('conference_id', conference.id)
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else if (data) setMessages(data as ResearchChatMessage[])
      })
  }, [conference?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !conference || !user) return
    const text = input.trim()
    setInput('')
    setError(null)

    const userMsg: ResearchChatMessage = {
      id: crypto.randomUUID(),
      conference_id: conference.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setSending(true)
    setTask('research-chat', 'Answering…')

    try {
      const { answer } = await researchChat({
        researchContext: conference.research_data?.content || '',
        question: text,
      })
      const assistantMsg: ResearchChatMessage = {
        id: crypto.randomUUID(),
        conference_id: conference.id,
        role: 'assistant',
        content: answer,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])

      const { error: dbErr } = await supabase.from('research_chat_messages').insert([userMsg, assistantMsg])
      if (dbErr) setError(dbErr.message)
    } catch (e: any) {
      setError(e?.message || 'Failed to get response')
    } finally {
      setSending(false)
      setTask('research-chat', null)
    }
  }

  return (
    <div>
      <h3 className="font-[500] text-sm text-muted mb-4">Ask follow-up questions</h3>
      {error && (
        <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-2">{error}</div>
      )}
      <div className="card-light p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-muted-soft text-sm text-center py-8">Ask a question about the research above.</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`group max-w-[80%] flex items-end gap-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div
                className={`rounded-xl px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-soft text-body'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'assistant' && <CopyMsg text={msg.content} />}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-surface-soft rounded-xl px-4 py-2 text-sm text-muted">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about this research…"
          className="input flex-1"
          disabled={sending}
        />
        <button onClick={handleSend} disabled={sending || !input.trim()} className="btn-primary">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
