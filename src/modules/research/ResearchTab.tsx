import { useState, useEffect, useRef } from 'react'
import { useConference } from '../../hooks/useConference'
import { generateResearch } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import ResearchChat from './ResearchChat'
import { Search, Copy, Check } from 'lucide-react'
import { ProgressBar } from '../../components/ProgressIndicator'


function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="text-muted-soft hover:text-primary transition-colors p-1"
      title="Copy section"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

export default function ResearchTab() {
  const { conference, updateConference, tasks, setTask } = useConference()
  const abortRef = useRef<AbortController | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [conference, generating])

  const handleGenerate = async () => {
    if (!conference) return
    setGenerating(true)
    setError(null)
    setTask('research', 'Researching\u2026')
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const data = await generateResearch({
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
      }, controller.signal)
      const err = await updateConference({
        research_data: {
          sections: data.sections,
          _generatedFor: { country: conference.assigned_country, committee: conference.committee, topic: conference.topic },
        },
      })
      if (err) setError(err)
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Failed to generate research')
    } finally {
      setGenerating(false)
      setTask('research', null)
    }
  }

  const handleCopyToDocuments = async () => {
    if (!conference || !conference.research_data) return
    setError(null)
    const text = conference.research_data.sections
      ?.map(s => `## ${s.title}\n\n${s.items.map(i => `### ${i.label}\n${i.content}${i.list ? '\n' + i.list.map(l => `- ${l}`).join('\n') : ''}`).join('\n\n')}`)
      .join('\n\n') || ''
    const { error: err } = await supabase.from('documents').insert({
      conference_id: conference.id,
      title: `Research \u2013 ${conference.assigned_country} \u2013 ${conference.topic}`,
      content: JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
      }),
      archived: false,
    })
    if (err) { setError(err.message); return }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sections = conference?.research_data?.sections
  const gen = conference?.research_data?._generatedFor
  const stale = gen && (gen.country !== conference?.assigned_country || gen.committee !== conference?.committee || gen.topic !== conference?.topic)

  return (
    <div>
      {stale && (
        <div className="text-sm text-warning bg-warning/10 rounded-lg px-3 py-2 mb-4">
          Conference details changed since this research was generated. <button onClick={handleGenerate} disabled={generating} className="underline font-[500]">Regenerate</button>
        </div>
      )}
      {error && (
        <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-4">{error}</div>
      )}
      {(generating || tasks['research']) && <div className="mb-4"><ProgressBar /></div>}
      {!sections ? (
        <div className="card text-center">
          <p className="text-body mb-4">
            Generate a comprehensive research briefing for {conference?.assigned_country} on {conference?.topic}.
          </p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            <Search className="w-4 h-4" />
            {generating ? 'Researching\u2026' : 'Research Topic'}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-[22px] font-[400] tracking-[-0.3px] text-ink">
              Research Briefing \u2014 {conference?.assigned_country}
            </h2>
            <div className="flex gap-2">
              <button onClick={handleCopyToDocuments} className="btn-secondary">
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy to Documents'}
              </button>
              <button onClick={handleGenerate} disabled={generating} className="btn-ghost">
                <Search className="w-3 h-3" />
                Re-research
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {sections.map((section, si) => (
              <section key={si}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-serif text-[20px] font-[400] text-ink">{section.title}</h3>
                  <CopyBtn text={section.items.map(i => `### ${i.label}\n${i.content}${i.list ? '\n' + i.list.map(l => `- ${l}`).join('\n') : ''}`).join('\n\n')} />
                </div>
                <div className="space-y-3">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="bg-surface-soft/50 rounded-xl px-4 py-3 border-l-4 border-l-primary/40">
                      <h4 className="text-xs font-[500] text-muted uppercase tracking-wide mb-1">{item.label}</h4>
                      <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">{item.content}</p>
                      {item.list && item.list.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {item.list.map((li, liIdx) => (
                            <li key={liIdx} className="text-sm text-body flex items-start gap-2">
                              <span className="text-primary mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              {li}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-8">
            <ResearchChat />
          </div>
        </div>
      )}
    </div>
  )
}
