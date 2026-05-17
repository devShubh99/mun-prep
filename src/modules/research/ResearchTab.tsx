import { useState, useEffect, useRef } from 'react'
import { useConference } from '../../hooks/useConference'
import { generateResearch } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import ResearchChat from './ResearchChat'
import { countryFlag } from '../../lib/countryFlags'
import { Search, Copy, Check, Printer, Download, MessageSquare, X, ChevronRight, Users, DollarSign, TrendingDown, BarChart, Landmark, Globe, Shield, BookOpen, ScrollText, Swords, Target, Ban, MessageCircle, Lightbulb, Handshake, ExternalLink } from 'lucide-react'
import { ProgressBar } from '../../components/ProgressIndicator'
import type { ResearchSection, VotingRow, BilateralRelation, AllyBubble } from '../../types'

const ICON_MAP: Record<string, any> = { users: Users, 'dollar-sign': DollarSign, 'trending-down': TrendingDown, 'bar-chart': BarChart, landmark: Landmark }

function heroIcon(icon: string) {
  const Icon = ICON_MAP[icon]
  return Icon ? <Icon className="w-3.5 h-3.5" /> : null
}

function CopyBtn({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className={`text-muted-soft hover:text-primary transition-colors ${className}`} title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function SectionIcon({ title }: { title: string }) {
  const t = title.toLowerCase()
  if (t.includes('country')) return <Globe className="w-4 h-4 text-primary" />
  if (t.includes('foreign') || t.includes('policy')) return <Shield className="w-4 h-4 text-accent-teal" />
  if (t.includes('committee')) return <BookOpen className="w-4 h-4 text-primary" />
  if (t.includes('history')) return <ScrollText className="w-4 h-4 text-accent-amber" />
  if (t.includes('bloc')) return <Swords className="w-4 h-4 text-accent-teal" />
  if (t.includes('toolkit')) return <Target className="w-4 h-4 text-primary" />
  return <ChevronRight className="w-4 h-4 text-muted" />
}

function ConfidenceBar({ confidence }: { confidence?: string }) {
  if (!confidence) return null
  const colors = { high: 'bg-success', medium: 'bg-accent-amber', low: 'bg-error' }
  const labels = { high: 'Well sourced', medium: 'Partially sourced', low: 'Inferred' }
  const color = colors[confidence as keyof typeof colors] || 'bg-hairline'
  const label = labels[confidence as keyof typeof labels] || 'Unknown'
  return <div className="h-[3px] w-full rounded-t-xl overflow-hidden"><div className={`h-full ${color} rounded-t-xl`} style={{ width: confidence === 'high' ? '100%' : confidence === 'medium' ? '60%' : '30%' }} /></div>
}

function Bubble({ name, group, importance }: { name: string; group: string; importance: string }) {
  const size = importance === 'large' ? 'px-3 py-1.5 text-sm' : importance === 'medium' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
  const colors = { ally: 'bg-success/10 text-success border-success/30', opponent: 'bg-error/10 text-error border-error/30', swing: 'bg-surface-card text-muted border-hairline' }
  const color = colors[group as keyof typeof colors] || colors.swing
  return <span className={`inline-flex items-center gap-1.5 rounded-full border ${size} ${color}`}><span className={`w-1.5 h-1.5 rounded-full ${group === 'ally' ? 'bg-success' : group === 'opponent' ? 'bg-error' : 'bg-muted'}`} />{countryFlag(name)} {name}</span>
}

export default function ResearchTab() {
  const { conference, updateConference, tasks, setTask } = useConference()
  const abortRef = useRef<AbortController | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  const rd = conference?.research_data
  const sections = rd?.sections
  const gen = rd?._generatedFor
  const stale = gen && (gen.country !== conference?.assigned_country || gen.committee !== conference?.committee || gen.topic !== conference?.topic)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.getAttribute('data-step'))
          if (!isNaN(idx)) setActiveStep(idx)
        }
      })
    }, { rootMargin: '-80px 0px -60% 0px' })
    sectionRefs.current.forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [sections])

  useEffect(() => { return () => abortRef.current?.abort() }, [])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [conference, generating])

  const scrollTo = (idx: number) => { sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' }) }

  const handleGenerate = async () => {
    if (!conference) return
    setGenerating(true); setError(null); setTask('research', 'Researching\u2026')
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const data = await generateResearch({ country: conference.assigned_country, committee: conference.committee, topic: conference.topic }, controller.signal)
      const err = await updateConference({ research_data: { ...data, _generatedFor: { country: conference.assigned_country, committee: conference.committee, topic: conference.topic } } as any })
      if (err) setError(err)
    } catch (e: any) { if (e?.name !== 'AbortError') setError(e?.message || 'Failed') }
    finally { setGenerating(false); setTask('research', null) }
  }

  const allText = sections?.map(s => `## ${s.title}\n${s.items.map(i => `### ${i.label}\n${i.content}${i.list?.length ? '\n' + i.list.map(l => `- ${l}`).join('\n') : ''}`).join('\n')}`).join('\n\n') || ''

  const handleCopyFull = () => { navigator.clipboard.writeText(allText) }
  const handleDownloadMd = () => {
    const blob = new Blob([`# Research Briefing: ${conference?.assigned_country}\n${allText}`], { type: 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `research-${conference?.assigned_country?.replace(/\s+/g, '-')}.md`; a.click()
  }
  const handleCopyToDocuments = async () => {
    if (!conference) return
    const { error: err } = await supabase.from('documents').insert({
      conference_id: conference.id, archived: false,
      title: `Research \u2013 ${conference.assigned_country} \u2013 ${conference.topic}`,
      content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: allText }] }] }),
    })
    if (err) setError(err.message)
  }

  if (!sections) {
    return (
      <div>
        {error && <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-4">{error}</div>}
        {(generating || tasks['research']) && <div className="mb-4"><ProgressBar /></div>}
        <div className="card text-center py-16">
          <span className="text-5xl mb-4 block">{conference?.assigned_country ? countryFlag(conference.assigned_country) : '\uD83C\uDF10'}</span>
          <p className="text-body mb-6 max-w-md mx-auto">Generate a comprehensive research briefing for {conference?.assigned_country} on {conference?.topic || conference?.committee}.</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary"><Search className="w-4 h-4" /> {generating ? 'Researching\u2026' : 'Research Topic'}</button>
        </div>
      </div>
    )
  }

  const steps = sections.map((s: ResearchSection, i: number) => {
    const t = s.title
    if (t.toLowerCase().includes('country')) return 'Country'
    if (t.toLowerCase().includes('foreign') || t.toLowerCase().includes('policy')) return 'Foreign Policy'
    if (t.toLowerCase().includes('committee')) return 'Committee'
    if (t.toLowerCase().includes('history')) return 'History'
    if (t.toLowerCase().includes('bloc')) return 'Blocs'
    if (t.toLowerCase().includes('toolkit')) return 'Toolkit'
    return s.title.split(' ')[0]
  })

  const votingRecord: VotingRow[] = (rd as any).votingRecord || []
  const bilateralRelations: BilateralRelation[] = (rd as any).bilateralRelations || []
  const allyBubbles: AllyBubble[] = (rd as any).allyBubbles || []
  const role: string = (rd as any).role || ''
  const statChips = (rd as any).statChips || []

  // Quickfire data
  const toolkit = sections.find(s => s.title.toLowerCase().includes('toolkit'))
  const firstDemand = toolkit?.items?.find(i => i.label.toLowerCase().includes('speech') || i.label.toLowerCase().includes('opening'))
  const firstRedLine = toolkit?.items?.find(i => i.label.toLowerCase().includes('red'))
  const firstAlly = allyBubbles?.find(b => b.group === 'ally')

  return (
    <div>
      {stale && <div className="text-sm text-warning bg-warning/10 rounded-lg px-3 py-2 mb-4">Research topic changed. <button onClick={handleGenerate} disabled={generating} className="underline font-[500]">Regenerate</button></div>}
      {error && <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-4 no-print">{error}</div>}
      {(generating || tasks['research']) && <div className="mb-4"><ProgressBar /></div>}

      {/* Zone 1: Hero */}
      <div className="card-light mb-6 print:mb-4" id="research-print-area">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{countryFlag(conference?.assigned_country || '')}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[18px] font-[500] text-ink">{conference?.assigned_country}</h1>
                {role && <span className="badge bg-primary/10 text-primary text-[11px]">{role}</span>}
              </div>
              <p className="text-sm text-muted mt-0.5">{conference?.committee}{conference?.topic ? ` — ${conference.topic}` : ''}</p>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <button onClick={handleCopyFull} className="btn-ghost text-xs"><Copy className="w-3.5 h-3.5" /> Copy</button>
            <button onClick={handleDownloadMd} className="btn-ghost text-xs"><Download className="w-3.5 h-3.5" /> Md</button>
            <button onClick={() => window.print()} className="btn-ghost text-xs"><Printer className="w-3.5 h-3.5" /> Print</button>
            <button onClick={handleGenerate} disabled={generating} className="btn-ghost text-xs"><Search className="w-3.5 h-3.5" /> Re-research</button>
          </div>
        </div>
        {statChips.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-hairline">
            {statChips.map((chip: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted">
                {heroIcon(chip.icon)} <span className="font-[500] text-ink">{chip.value}</span> <span className="text-muted-soft">{chip.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zone 2: Stepper */}
      <div className="sticky top-0 z-40 bg-surface-soft/90 backdrop-blur border-b border-hairline -mx-6 px-6 mb-6 no-print">
        <div className="flex gap-0 overflow-x-auto py-3">
          {steps.map((step: string, i: number) => {
            const isPast = i < activeStep; const isActive = i === activeStep
            return (
              <button key={i} onClick={() => scrollTo(i)} className="flex items-center gap-2 px-3 py-1 text-xs shrink-0 hover:bg-surface-soft rounded-lg transition-colors">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-[500] ${isPast ? 'bg-success text-white' : isActive ? 'bg-primary text-white' : 'bg-canvas text-muted border border-hairline'}`}>
                  {isPast ? '\u2713' : i + 1}
                </span>
                <span className={`${isActive ? 'text-ink font-[500]' : 'text-muted'}`}>{step}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Zone 3: Content */}
      <div className="space-y-6">
        {sections.map((section: ResearchSection, si: number) => {
          const t = section.title.toLowerCase()
          const isBloc = t.includes('bloc')
          const isToolkit = t.includes('toolkit')

          return (
            <section key={si} ref={(el: HTMLElement | null) => { sectionRefs.current[si] = el }} data-step={si} className="bg-white border border-hairline rounded-xl overflow-hidden">
              <ConfidenceBar confidence={section.confidence} />

              {/* Section header */}
              <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                <SectionIcon title={section.title} />
                <h2 className="text-sm font-[500] text-ink flex-1">{section.title}</h2>
                {section.confidence && (
                  <span className={`text-[10px] font-[500] px-1.5 py-0.5 rounded ${section.confidence === 'high' ? 'bg-success/10 text-success' : section.confidence === 'medium' ? 'bg-accent-amber/10 text-accent-amber' : 'bg-error/10 text-error'}`}>
                    {section.confidence === 'high' ? 'Well sourced' : section.confidence === 'medium' ? 'Partially' : 'Inferred'}
                  </span>
                )}
                <CopyBtn text={section.items.map(i => `${i.label}: ${i.content}${i.list?.length ? '\n' + i.list.map(l => `- ${l}`).join('\n') : ''}`).join('\n\n')} className="p-1" />
              </div>

              {/* Bloc layout */}
              {isBloc && (
                <div className="px-5 pb-5 space-y-4">
                  {allyBubbles.length > 0 && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {allyBubbles.filter(b => b.group === 'ally').map((b, i) => <Bubble key={i} {...b} />)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allyBubbles.filter(b => b.group === 'opponent').map((b, i) => <Bubble key={i} {...b} />)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allyBubbles.filter(b => b.group === 'swing').map((b, i) => <Bubble key={i} {...b} />)}
                      </div>
                      <div className="flex gap-4 text-[10px] text-muted-soft pt-2 border-t border-hairline">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Ally (size = importance)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error" /> Opponent</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted" /> Swing</span>
                      </div>
                    </>
                  )}
                  {/* Standard items for bloc too */}
                  {section.items.map((item, ii) => (
                    <div key={ii}>
                      <span className="text-[10px] font-[500] text-muted uppercase tracking-wide">{item.label}</span>
                      <p className="text-sm text-body mt-0.5 whitespace-pre-wrap">{item.content}</p>
                      {item.list?.length ? <ul className="mt-1 space-y-0.5">{item.list.map((l, li) => <li key={li} className="text-sm text-body flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-muted mt-1.5 shrink-0" />{l}</li>)}</ul> : null}
                    </div>
                  ))}
                  {/* Bilateral relations grid */}
                  {bilateralRelations.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {bilateralRelations.map((rel, ri) => (
                        <div key={ri} className="bg-surface-soft/50 rounded-lg px-3 py-2.5">
                          <div className="flex items-center gap-1.5 mb-1"><span>{countryFlag(rel.country)}</span><span className="text-xs font-[500] text-ink">{rel.country}</span></div>
                          <p className="text-xs text-muted leading-relaxed">{rel.summary}</p>
                          <span className={`text-[10px] font-[500] mt-1.5 inline-block px-1.5 py-0.5 rounded ${rel.type === 'Partner' ? 'bg-success/10 text-success' : rel.type === 'Rival' ? 'bg-error/10 text-error' : rel.type === 'Complex' ? 'bg-accent-amber/10 text-accent-amber' : 'bg-surface-card text-muted'}`}>{rel.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Toolkit layout */}
              {isToolkit && (
                <div className="px-5 pb-5">
                  {section.items.map((item, ii) => {
                    const isRedLine = item.label.toLowerCase().includes('red')
                    const isOpening = item.label.toLowerCase().includes('opening') || item.label.toLowerCase().includes('speech')
                    const isAmendment = item.label.toLowerCase().includes('amendment')
                    const isAlly = item.label.toLowerCase().includes('working paper') || item.label.toLowerCase().includes('ally')

                    if (isRedLine) {
                      return <div key={ii} className="mb-3">
                        <div className="flex items-center gap-2 mb-2"><Ban className="w-3.5 h-3.5 text-error" /><span className="text-xs font-[500] text-error uppercase tracking-wide">DO NOT CROSS</span></div>
                        {item.list?.map((l, li) => <div key={li} className="flex items-start gap-2 py-1.5 px-3 bg-error/5 rounded-lg mb-1"><span className="text-error shrink-0 mt-0.5">\u2716</span><span className="text-sm text-body">{l}</span></div>)}
                        {item.content && <p className="text-sm text-body mt-1">{item.content}</p>}
                      </div>
                    }

                    if (isOpening) {
                      return <div key={ii} className="mb-3">
                        <div className="flex items-center gap-2 mb-2"><MessageCircle className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-[500] text-muted uppercase tracking-wide">Opening plays</span></div>
                        {item.list?.map((l, li) => <div key={li} className="flex items-start gap-3 py-1"><span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-[500] flex items-center justify-center shrink-0 mt-0.5">{li + 1}</span><span className="text-sm text-body">{l}</span></div>)}
                      </div>
                    }

                    if (isAlly) {
                      return <div key={ii} className="mb-3">
                        <div className="flex items-center gap-2 mb-2"><Handshake className="w-3.5 h-3.5 text-success" /><span className="text-xs font-[500] text-muted uppercase tracking-wide">Working paper allies</span></div>
                        <div className="flex flex-wrap gap-2">{item.list?.map((l, li) => <span key={li} className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success rounded-full text-xs"><span>{countryFlag(l)}</span>{l}</span>)}</div>
                      </div>
                    }

                    if (isAmendment) {
                      return <div key={ii} className="mb-3">
                        <div className="flex items-center gap-2 mb-2"><ExternalLink className="w-3.5 h-3.5 text-accent-amber" /><span className="text-xs font-[500] text-muted uppercase tracking-wide">Likely amendments</span></div>
                        {item.list?.map((l, li) => <div key={li} className="py-1.5 border-b border-hairline/50 last:border-0"><span className="text-[10px] font-[500] text-muted-soft">Clause {li + 1}</span><p className="text-sm text-body">{l}</p></div>)}
                      </div>
                    }

                    return <div key={ii} className="mb-3">
                      <span className="text-[10px] font-[500] text-muted uppercase tracking-wide">{item.label}</span>
                      {item.list?.length ? <ul className="mt-1 space-y-1">{item.list.map((l, li) => <li key={li} className="text-sm text-body flex items-start gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />{l}</li>)}</ul> : null}
                      {item.content && <p className="text-sm text-body mt-0.5">{item.content}</p>}
                    </div>
                  })}
                </div>
              )}

              {/* Standard layout */}
              {!isBloc && !isToolkit && (
                <div className="px-5 pb-5 space-y-3">
                  {section.items.map((item, ii) => (
                    <div key={ii}>
                      <span className="text-[10px] font-[500] text-muted uppercase tracking-wide">{item.label}</span>
                      <p className="text-sm text-body mt-0.5 whitespace-pre-wrap">{item.content}</p>
                      {item.list?.length ? (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">{item.list.map((l, li) => <span key={li} className="text-xs bg-surface-soft text-muted rounded-full px-2 py-0.5">{l}</span>)}</div>
                      ) : null}
                    </div>
                  ))}
                  {/* Voting Record — show inside Committee section or as standalone */}
                  {t.includes('committee') && votingRecord.length > 0 && (
                    <div className="pt-3 border-t border-hairline">
                      <span className="text-[10px] font-[500] text-muted uppercase tracking-wide mb-2 block">Voting Record</span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="text-muted-soft border-b border-hairline"><th className="text-left py-1.5 pr-4 font-[500]">Topic</th><th className="text-center w-10 py-1.5 font-[500]">YES</th><th className="text-center w-10 py-1.5 font-[500]">NO</th><th className="text-center w-10 py-1.5 font-[500]">ABS</th><th className="text-center w-10 py-1.5 font-[500]">CO</th></tr></thead>
                          <tbody>{votingRecord.map((row: VotingRow, ri: number) => (
                            <tr key={ri} className="border-b border-hairline/50"><td className="py-2 pr-4 text-body">{row.topic}</td>
                              <td className="text-center py-2">{row.yes ? <span className="w-4 h-4 rounded bg-success inline-block" /> : null}</td>
                              <td className="text-center py-2">{row.no ? <span className="w-4 h-4 rounded bg-error inline-block" /> : null}</td>
                              <td className="text-center py-2">{row.abstain ? <span className="w-4 h-4 rounded bg-accent-amber inline-block" /> : null}</td>
                              <td className="text-center py-2">{row.coSponsor ? <span className="w-4 h-4 rounded bg-primary inline-block" /> : null}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )
        })}
      </div>

      {/* Zone 4: Quickfire Strip */}
      <div className="sticky bottom-0 z-40 bg-white border-t border-hairline mt-8 no-print">
        <div className="flex">
          <div className="flex-1 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1"><MessageCircle className="w-3 h-3 text-primary" /><span className="text-[10px] font-[500] text-muted-soft">#1 DEMAND</span></div>
            <p className="text-xs text-body leading-tight">{firstDemand?.list?.[0] || firstDemand?.content?.slice(0, 60) || 'Generate research'}</p>
          </div>
          <div className="w-px bg-hairline" />
          <div className="flex-1 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1"><Ban className="w-3 h-3 text-error" /><span className="text-[10px] font-[500] text-muted-soft">#1 RED LINE</span></div>
            <p className="text-xs text-body leading-tight">{firstRedLine?.list?.[0] || firstRedLine?.content?.slice(0, 60) || 'N/A'}</p>
          </div>
          <div className="w-px bg-hairline" />
          <div className="flex-1 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1"><Handshake className="w-3 h-3 text-success" /><span className="text-[10px] font-[500] text-muted-soft">CLOSEST ALLY</span></div>
            <div className="flex items-center gap-1.5 text-xs text-body">{firstAlly ? <><span>{countryFlag(firstAlly.name)}</span><span>{firstAlly.name}</span></> : <span>N/A</span>}</div>
          </div>
        </div>
      </div>

      {/* Zone 5: Floating Chat FAB */}
      <div className="fixed bottom-28 right-6 z-50 no-print">
        {chatOpen ? (
          <div className="bg-white border border-hairline rounded-xl shadow-lg w-[360px] max-w-[90vw] h-[480px] max-h-[70vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
              <span className="text-sm font-[500] text-ink">Research Chat</span>
              <button onClick={() => setChatOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-hidden"><ResearchChat /></div>
          </div>
        ) : (
          <button onClick={() => setChatOpen(true)} className="w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:bg-primary-active transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
