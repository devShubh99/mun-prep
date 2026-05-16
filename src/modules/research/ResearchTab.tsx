import { useState } from 'react'
import { useConference } from '../../hooks/useConference'
import { generateResearch } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import ResearchChat from './ResearchChat'
import { Sparkles, Copy } from 'lucide-react'
import { ProgressBar } from '../../components/ProgressIndicator'
import DOMPurify from 'dompurify'

export default function ResearchTab() {
  const { conference, updateConference } = useConference()
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!conference) return
    setGenerating(true)
    setError(null)
    try {
      const data = await generateResearch({
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
      })
      const err = await updateConference({
        research_data: {
          content: data.content,
          _generatedFor: { country: conference.assigned_country, committee: conference.committee, topic: conference.topic },
        },
      })
      if (err) setError(err)
    } catch (e: any) {
      setError(e?.message || 'Failed to generate research')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyToDocuments = async () => {
    if (!conference || !conference.research_data) return
    setError(null)
    const { error: err } = await supabase.from('documents').insert({
      conference_id: conference.id,
      title: `Research – ${conference.assigned_country} – ${conference.topic}`,
      content: JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: conference.research_data.content.replace(/<[^>]*>/g, '') }],
          },
        ],
      }),
      archived: false,
    })
    if (err) { setError(err.message); return }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const researchContent = conference?.research_data?.content
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
      {generating && <div className="mb-4"><ProgressBar /></div>}
      {!researchContent ? (
        <div className="card text-center">
          <p className="text-body mb-4">
            Generate a comprehensive research briefing for {conference?.assigned_country} on {conference?.topic}.
          </p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            {generating ? 'Generating…' : 'Generate Research'}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-[22px] font-[400] tracking-[-0.3px] text-ink">
              Research Briefing — {conference?.assigned_country}
            </h2>
            <div className="flex gap-2">
              <button onClick={handleCopyToDocuments} className="btn-secondary">
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy to Documents'}
              </button>
              <button onClick={handleGenerate} disabled={generating} className="btn-ghost">
                <Sparkles className="w-3 h-3" />
                Regenerate
              </button>
            </div>
          </div>

          <div
            className="card-light prose prose-sm max-w-none [&_h2]:font-serif [&_h2]:text-[22px] [&_h2]:font-[400] [&_h2]:tracking-[-0.3px] [&_h2]:text-ink [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:font-[500] [&_h3]:text-body [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:text-body [&_p]:text-body"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(researchContent) }}
          />

          <div className="mt-8">
            <ResearchChat />
          </div>
        </div>
      )}
    </div>
  )
}
