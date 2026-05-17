import { useState, useRef, useEffect } from 'react'
import { useConference } from '../../hooks/useConference'
import { generateCheatSheet } from '../../lib/api'
import { countryFlag } from '../../lib/countryFlags'
import { BookOpen, Copy, Check, Printer, Download } from 'lucide-react'
import { ProgressBar } from '../../components/ProgressIndicator'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { CheatSheetJson } from '../../types'

const SECTIONS = [
  { id: 'mandate', label: 'Mandate' },
  { id: 'coreDemands', label: 'Core Demands' },
  { id: 'redLines', label: 'Red Lines' },
  { id: 'alliesOpponents', label: 'Allies & Opponents' },
  { id: 'votingRecord', label: 'Voting Record' },
  { id: 'draftClauses', label: 'Draft Clauses' },
  { id: 'strategy', label: 'Strategy & Q&A' },
]

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

function alliesRegionData(allies: string[], opponents: string[]) {
  const regionMap: Record<string, { allies: number; opponents: number }> = {
    'Europe': { allies: 0, opponents: 0 },
    'Asia': { allies: 0, opponents: 0 },
    'Africa': { allies: 0, opponents: 0 },
    'Americas': { allies: 0, opponents: 0 },
    'Middle East': { allies: 0, opponents: 0 },
    'Oceania': { allies: 0, opponents: 0 },
  }
  const euCountries = ['France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Sweden', 'Denmark', 'Finland', 'Poland', 'Portugal', 'Austria', 'Ireland', 'Greece', 'Czech Republic', 'Romania', 'Norway', 'Estonia', 'United Kingdom']
  const asiaCountries = ['China', 'Japan', 'South Korea', 'India', 'Indonesia', 'Vietnam', 'Thailand', 'Singapore', 'Malaysia', 'Philippines', 'Myanmar', 'Bangladesh', 'Pakistan', 'Sri Lanka', 'Nepal']
  const africaCountries = ['Nigeria', 'South Africa', 'Kenya', 'Ethiopia', 'Ghana', 'Egypt', 'Morocco', 'Algeria', 'Angola', 'Tanzania']
  const americasCountries = ['United States', 'Canada', 'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru']
  const middleEastCountries = ['Russia', 'Saudi Arabia', 'Iran', 'Iraq', 'Israel', 'Turkey', 'UAE', 'Qatar', 'Kuwait', 'Oman', 'Syria', 'Yemen']
  const oceaniaCountries = ['Australia', 'New Zealand']

  const categorize = (name: string) => {
    if (euCountries.includes(name)) return 'Europe'
    if (oceaniaCountries.includes(name)) return 'Oceania'
    if (middleEastCountries.includes(name)) return 'Middle East'
    if (asiaCountries.includes(name)) return 'Asia'
    if (africaCountries.includes(name)) return 'Africa'
    if (americasCountries.includes(name)) return 'Americas'
    if (['European Union'].includes(name)) return 'Europe'
    return 'Europe'
  }

  const clean = (s: string) => s.replace(/ *\(.*?\)/g, '').trim()
  allies.forEach(a => { const r = categorize(clean(a)); if (regionMap[r]) regionMap[r].allies++ })
  opponents.forEach(o => { const r = categorize(clean(o)); if (regionMap[r]) regionMap[r].opponents++ })

  return Object.entries(regionMap).map(([region, v]) => ({ region, allies: v.allies, opponents: v.opponents }))
}

export default function CheatSheet() {
  const { conference, updateConference, tasks, setTask } = useConference()
  const abortRef = useRef<AbortController | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const cs = conference?.cheat_sheet_data
  const gen = cs?._generatedFor
  const stale = gen && (gen.country !== conference?.assigned_country || gen.committee !== conference?.committee || gen.topic !== conference?.topic)

  const handleGenerate = async () => {
    if (!conference) return
    setGenerating(true)
    setError(null)
    setTask('cheat-sheet', 'Researching\u2026')
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const data = await generateCheatSheet({
        country: conference.assigned_country,
        committee: conference.committee,
        topic: conference.topic,
        specialRole: conference.special_role || undefined,
      }, controller.signal)
      const err = await updateConference({
        cheat_sheet_data: { ...(data as CheatSheetJson), _generatedFor: { country: conference.assigned_country, committee: conference.committee, topic: conference.topic } },
      })
      if (err) setError(err)
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Failed to generate cheat sheet')
    } finally {
      setGenerating(false)
      setTask('cheat-sheet', null)
    }
  }

  const scrollTo = (id: string) => {
    document.getElementById(`cs-${id}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!cs) {
    return (
      <div>
        {error && <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-4">{error}</div>}
      {(generating || tasks['cheat-sheet']) && <div className="mb-4"><ProgressBar /></div>}
        <div className="card text-center py-16">
          <span className="text-5xl mb-4 block">{conference?.assigned_country ? countryFlag(conference.assigned_country) : '\uD83C\uDF10'}</span>
          <h2 className="font-serif text-[28px] font-[400] text-ink mb-2">{conference?.assigned_country || 'No country selected'}</h2>
          <p className="text-muted mb-6 max-w-md mx-auto">Generate an AI-powered cheat sheet to prepare for your committee.</p>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary text-base px-6 py-3">
            <BookOpen className="w-5 h-5" />
            {generating ? 'Researching\u2026' : 'Research Briefing'}
          </button>
        </div>
      </div>
    )
  }

  const regionData = alliesRegionData(cs.allies, cs.opponents)

  const handleDownloadMd = () => {
    const lines: string[] = []
    lines.push(`# Cheat Sheet: ${conference?.assigned_country}`)
    lines.push(`**Committee:** ${conference?.committee}  |  **Topic:** ${conference?.topic || 'N/A'}`)
    lines.push('')
    lines.push('## Mandate')
    lines.push(cs.mandate)
    lines.push('')
    lines.push('## Core Demands')
    cs.coreDemands.forEach((d, i) => lines.push(`${i + 1}. ${d}`))
    lines.push('')
    lines.push('## Red Lines')
    cs.redLines.forEach(r => lines.push(`- ${r}`))
    lines.push('')
    lines.push('## Allies')
    cs.allies.forEach(a => lines.push(`- ${a}`))
    lines.push('')
    lines.push('## Opponents')
    cs.opponents.forEach(o => lines.push(`- ${o}`))
    lines.push('')
    lines.push('## Voting Record')
    lines.push(cs.votingRecord)
    lines.push('')
    lines.push('## Draft Clauses')
    cs.draftClauses.forEach((c, i) => lines.push(`${i + 1}. ${c}`))
    lines.push('')
    lines.push('## Key Arguments')
    cs.keyArguments.forEach((a, i) => lines.push(`${i + 1}. ${a}`))
    lines.push('')
    lines.push('## Bilateral Relations')
    lines.push(cs.bilateralRelations)
    lines.push('')
    lines.push('## Strategy Notes')
    lines.push(cs.strategyNotes)
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `cheatsheet-${conference?.assigned_country?.replace(/\s+/g, '-')}.md`
    a.click(); URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [conference, generating])

  return (
    <div ref={printRef} className="cheat-sheet-print">
      {stale && (
        <div className="text-sm text-warning bg-warning/10 rounded-lg px-3 py-2 mb-4">
          Conference details changed since this cheat sheet was generated.{' '}
          <button onClick={handleGenerate} disabled={generating} className="underline font-[500]">Regenerate</button>
        </div>
      )}
      {error && <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-4">{error}</div>}
      {(generating || tasks['cheat-sheet']) && <div className="mb-4"><ProgressBar /></div>}

      {/* Hero */}
      <div className="card-light mb-6 print:mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{countryFlag(conference?.assigned_country || '')}</span>
              <h1 className="font-serif text-[32px] font-[400] tracking-[-0.5px] text-ink">{conference?.assigned_country}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge bg-primary/10 text-primary text-xs">{conference?.committee}</span>
              {conference?.topic && <span className="badge bg-surface-card text-body text-xs">{conference.topic}</span>}
              {conference?.special_role && <span className="badge bg-accent-amber/10 text-accent-amber text-xs">{conference.special_role}</span>}
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <button onClick={handleDownloadMd} className="btn-ghost text-xs" title="Download as Markdown">
              <Download className="w-3.5 h-3.5" /> Md
            </button>
            <button onClick={() => window.print()} className="btn-ghost text-xs">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={handleGenerate} disabled={generating} className="btn-ghost text-xs">
              <BookOpen className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Quick nav */}
        <nav className="hidden lg:block w-44 shrink-0 no-print">
          <div className="sticky top-24 space-y-0.5">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="block w-full text-left px-3 py-1.5 text-sm text-muted hover:text-ink hover:bg-surface-soft rounded-lg transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-8 print:space-y-6">

          {/* 1. Mandate */}
          <section id="cs-mandate" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-serif text-[22px] font-[400] text-ink">Mandate</h2>
              <CopyBtn text={cs.mandate} />
            </div>
            <div className="bg-primary/5 rounded-xl px-4 py-3 border-l-4 border-l-primary">
              <p className="text-body text-sm whitespace-pre-wrap">{cs.mandate}</p>
            </div>
          </section>

          {/* 2. Core Demands */}
          <section id="cs-coreDemands" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-serif text-[22px] font-[400] text-ink">Core Demands</h2>
              <CopyBtn text={cs.coreDemands.map((d, i) => `${i + 1}. ${d}`).join('\n')} />
            </div>
            <div className="space-y-2">
              {cs.coreDemands.map((d, i) => (
                <div key={i} className="bg-primary/5 rounded-xl px-4 py-3 border-l-4 border-l-primary flex items-start gap-3">
                  <span className="font-serif text-xl font-[400] text-primary leading-none mt-0.5 w-7 text-center shrink-0">{i + 1}</span>
                  <p className="text-body text-sm">{d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Red Lines */}
          <section id="cs-redLines" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-serif text-[22px] font-[400] text-ink">Red Lines</h2>
              <CopyBtn text={cs.redLines.map(r => `• ${r}`).join('\n')} />
            </div>
            <div className="space-y-2">
              {cs.redLines.map((r, i) => (
                <div key={i} className="bg-error/5 rounded-xl px-4 py-3 border-l-4 border-l-error flex items-start gap-3">
                  <span className="text-error shrink-0 mt-0.5">⚠️</span>
                  <p className="text-body text-sm">{r}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Allies & Opponents */}
          <section id="cs-alliesOpponents" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-serif text-[22px] font-[400] text-ink">Allies &amp; Opponents</h2>
              <CopyBtn text={`ALLIES:\n${cs.allies.map(a => `• ${a}`).join('\n')}\n\nOPPONENTS:\n${cs.opponents.map(o => `• ${o}`).join('\n')}`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl px-4 py-3 bg-success/5 border-l-4 border-l-success">
                <h3 className="text-sm font-[500] text-success mb-3">Allies</h3>
                <ul className="space-y-1.5">
                  {cs.allies.map((a, i) => {
                    const name = a.replace(/ *\(.*?\)/g, '').trim()
                    return (
                      <li key={i} className="text-sm text-body flex items-center gap-2">
                        <span>{countryFlag(name)}</span>
                        <span>{name}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="rounded-xl px-4 py-3 bg-error/5 border-l-4 border-l-error">
                <h3 className="text-sm font-[500] text-error mb-3">Opponents</h3>
                <ul className="space-y-1.5">
                  {cs.opponents.map((o, i) => {
                    const name = o.replace(/ *\(.*?\)/g, '').trim()
                    return (
                      <li key={i} className="text-sm text-body flex items-center gap-2">
                        <span>{countryFlag(name)}</span>
                        <span>{name}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            {cs.opponentNotes && (
              <div className="text-sm text-muted bg-surface-soft/50 rounded-xl px-4 py-3 mb-4 leading-relaxed">
                {cs.opponentNotes}
              </div>
            )}

            {regionData.some(d => d.allies > 0 || d.opponents > 0) && (
              <div className="card-light no-print">
                <h3 className="text-sm font-[500] text-muted mb-3">By Region</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={regionData} layout="vertical" barCategoryGap={8}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#6c6a64' }} />
                    <YAxis dataKey="region" type="category" width={90} tick={{ fontSize: 11, fill: '#3d3d3a' }} />
                    <Tooltip />
                    <Bar dataKey="allies" fill="#5db872" radius={[0, 4, 4, 0]} name="Allies" />
                    <Bar dataKey="opponents" fill="#c64545" radius={[0, 4, 4, 0]} name="Opponents" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* 5. Voting Record */}
          <section id="cs-votingRecord" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-serif text-[22px] font-[400] text-ink">Voting Record</h2>
              <CopyBtn text={cs.votingRecord} />
            </div>
            <div className="bg-accent-teal/5 rounded-xl px-4 py-3 border-l-4 border-l-accent-teal">
              <p className="text-body text-sm whitespace-pre-wrap">{cs.votingRecord}</p>
            </div>
          </section>

          {/* 6. Draft Clauses */}
          <section id="cs-draftClauses" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-serif text-[22px] font-[400] text-ink">Draft Clauses</h2>
              <CopyBtn text={cs.draftClauses.map((c, i) => `Clause ${i + 1}. ${c}`).join('\n')} />
            </div>
            <div className="space-y-2">
              {cs.draftClauses.map((c, i) => (
                <div key={i} className="bg-accent-amber/5 rounded-xl px-4 py-3 border-l-4 border-l-accent-amber flex items-start gap-3">
                  <span className="text-xs font-[500] text-accent-amber shrink-0 mt-0.5 min-w-[68px]">Clause {i + 1}</span>
                  <p className="text-body text-sm">{c}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Strategy & Q&A */}
          <section id="cs-strategy" className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-serif text-[22px] font-[400] text-ink">Strategy &amp; Q&amp;A</h2>
            </div>

            {/* Key Arguments */}
            <div className="rounded-xl px-4 py-3 bg-surface-soft/50 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-[500] text-sm text-body">Key Arguments</h3>
                <CopyBtn text={cs.keyArguments.map((a, i) => `${i + 1}. ${a}`).join('\n')} />
              </div>
              <ul className="space-y-1.5">
                {cs.keyArguments.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-canvas">
                    <span className="text-xs font-[500] text-primary shrink-0 mt-0.5 w-5 text-right">{i + 1}.</span>
                    <span className="text-sm text-body">{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bilateral Relations */}
            <div className="rounded-xl px-4 py-3 bg-surface-soft/50 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-[500] text-sm text-body">Bilateral Relations</h3>
                <CopyBtn text={cs.bilateralRelations} />
              </div>
              <p className="text-body text-sm whitespace-pre-wrap leading-relaxed">{cs.bilateralRelations}</p>
            </div>

            {/* Q&A */}
            <div className="rounded-xl px-4 py-3 bg-surface-soft/50 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-[500] text-sm text-body">Q&amp;A Pairs</h3>
                <CopyBtn text={cs.qaPairs.map(qa => `Q: ${qa.question}\nA: ${qa.answer}`).join('\n\n')} />
              </div>
              <div className="space-y-3">
                {cs.qaPairs.map((qa, i) => (
                  <div key={i}>
                    <div className="bg-primary/5 rounded-t-xl px-4 py-3 border-l-4 border-l-primary">
                      <span className="text-xs font-[500] text-primary">Q{i + 1}</span>
                      <p className="text-sm text-body mt-0.5">{qa.question}</p>
                    </div>
                    <div className="bg-canvas rounded-b-xl px-4 py-3 border-l-4 border-l-muted-soft -mt-px">
                      <span className="text-xs font-[500] text-muted">A</span>
                      <p className="text-sm text-muted mt-0.5">{qa.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategy Notes */}
            <div className="rounded-xl px-4 py-3 bg-accent-amber/5 border border-accent-amber/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-[500] text-sm text-body flex items-center gap-2">
                  <span>💡</span> Strategy Notes
                </h3>
                <CopyBtn text={cs.strategyNotes} />
              </div>
              <p className="text-body text-sm whitespace-pre-wrap leading-relaxed">{cs.strategyNotes}</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
