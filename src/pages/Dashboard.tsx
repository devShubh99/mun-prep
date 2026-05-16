import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConference } from '../hooks/useConference'
import { Plus, Search, Trash2, Globe, Edit2, Copy } from 'lucide-react'

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', "Côte d'Ivoire", 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe',
]

const COMMITTEES = [
  'Administrative and Budgetary Committee (ABC)',
  'Advisory Committee on Administrative and Budgetary Questions (ACABQ)',
  'Asian Infrastructure Investment Bank (AIIB)',
  'Arab League (AL)',
  'Asian Development Bank (ADB)',
  'Association of Southeast Asian Nations (ASEAN)',
  'African Union (AU)',
  'Commission on Crime Prevention and Criminal Justice (CCPCJ)',
  'European Organization for Nuclear Research (CERN)',
  'Council of the European Union (CEU)',
  'Commonwealth of Independent States (CIS)',
  'Commission on Narcotic Drugs (CND)',
  'Committee on the Peaceful Uses of Outer Space (COPUOS)',
  'Commission on Population and Development (CPD)',
  'Commission on Science and Technology for Development (CSTD)',
  'Commission on the Status of Women (CSW)',
  'Comprehensive Nuclear-Test-Ban Treaty Organization (CTBTO)',
  'Department of Global Communications (DGC)',
  'Disarmament and International Security Committee (DISEC)',
  'European Council (EC)',
  'Economic Commission for Latin America and the Caribbean (ECLAC)',
  'Economic and Financial Committee (ECOFIN)',
  'Economic and Social Council (ECOSOC)',
  'Economic Community of West African States (ECOWAS)',
  'European Parliament (EP)',
  'European Union (EU)',
  'Food and Agriculture Organization (FAO)',
  'Fédération Internationale de Football Association (FIFA)',
  'Group of 7 (G7)',
  'Group of 8 (G8)',
  'Group of 20 (G20)',
  'General Assembly (GA)',
  'Human Rights Council (HRC)',
  'Historical Security Council (HSC)',
  'Inter-American Development Bank (IADB)',
  'International Atomic Energy Agency (IAEA)',
  'International Civil Aviation Organisation (ICAO)',
  'International Criminal Court (ICC)',
  'International Chamber of Commerce (ICC)',
  'International Court of Justice (ICJ)',
  'International Committee of the Red Cross (ICRC)',
  'International Fund for Agricultural Development (IFAD)',
  'International Labour Organization (ILO)',
  'International Monetary Fund (IMF)',
  'International Maritime Organisation (IMO)',
  'International Criminal Police Organization (INTERPOL)',
  'International Olympic Committee (IOC)',
  'International Telecommunications Union (ITU)',
  'Joint Crisis Committee (JCC)',
  'League of Nations (LoN)',
  'North Atlantic Treaty Organization (NATO)',
  'Organization of Petroleum Exporting Countries (OPEC)',
  'Organization for Security and Co-operation in Europe (OSCE)',
  'Peacebuilding Commission (PBC)',
  'Press Corps (PC)',
  'Security Council (SC)',
  'Special Conference on Slavery and Human Trafficking (SCSHT)',
  'Social, Cultural and Humanitarian Committee (SOCHUM)',
  'Special Political and Decolonization Committee (SPECPOL)',
  'UN Commission on Science and Technology for Development (UCoST)',
  'UN Conference on Trade and Development (UNCTAD)',
  'UN Development Program (UNDP)',
  'UN Environment Programme (UNEP)',
  'UN Educational, Scientific and Cultural Organization (UNESCO)',
  'UN Framework Convention on Climate Change (UNFCCC)',
  'UN Population Fund (UNFPA)',
  'UN High Commissioner for Refugees (UNHCR)',
  'UN Children\'s Fund (UNICEF)',
  'UN Industrial Development Organization (UNIDO)',
  'UN Office for Disaster Risk Reduction (UNISDR)',
  'UN Office on Drugs and Crime (UNODC)',
  'UN Office for Outer Space Affairs (UNOOSA)',
  'UN Permanent Forum on Indigenous Issues (UNPFII)',
  'UN Entity for Gender Equality (UN Women)',
  'World Tourism Organization (UNWTO)',
  'Universal Postal Union (UPU)',
  'United States Senate (US Senate)',
  'World Bank (WB)',
  'World Food Programme (WFP)',
  'World Health Assembly (WHA)',
  'World Health Organization (WHO)',
  'World Meteorological Organization (WMO)',
  'World Intellectual Property Organization (WIPO)',
  'World Trade Organization (WTO)',
]

function Autocomplete({ id, value, onChange, options, placeholder, required }: {
  id: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [touched, setTouched] = useState(false)
  const [query, setQuery] = useState(value)
  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
  const valid = !touched || !required || options.some(o => o.toLowerCase() === value.toLowerCase())

  return (
    <div className="relative">
      <div className="relative">
        <input
          id={id}
          required={required}
          value={open ? query : value}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setOpen(true); setQuery('') }}
          onBlur={() => { setTimeout(() => setOpen(false), 200); setTouched(true); setQuery(value) }}
          className={`input pr-8 ${!valid ? 'border-error focus:border-error focus:ring-error' : ''}`}
          placeholder={placeholder}
          autoComplete="off"
        />
        <svg
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {!valid && (
        <p className="text-xs text-error mt-1">Select a value from the list</p>
      )}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-canvas border border-hairline rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-soft">No matches found</div>
          ) : (
            filtered.map(opt => (
              <button
                key={opt}
                type="button"
                onMouseDown={() => { onChange(opt); setOpen(false); setQuery(opt) }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface-soft ${opt === value ? 'bg-primary/10 text-ink' : 'text-body'}`}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { conferences, createConference, deleteConference, updateConference, loading, conferenceError } = useConference()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<'newest' | 'deadline' | 'name'>('newest')
  const [form, setForm] = useState({ name: '', assigned_country: '', committee: '', topic: '', special_role: '', deadline: '' })
  const [submitting, setSubmitting] = useState(false)

  const filtered = conferences.filter(c =>
    !search || [c.name, c.assigned_country, c.committee, c.topic].some(
      f => f?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'deadline') {
      if (!a.deadline) return 1; if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    }
    if (sort === 'name') return a.name.localeCompare(b.name)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const openNew = () => {
    setEditingId(null)
    setForm({ name: '', assigned_country: '', committee: '', topic: '', special_role: '', deadline: '' })
    setShowModal(true)
  }

  const openEdit = (c: typeof conferences[0]) => {
    setEditingId(c.id)
    setForm({
      name: c.name,
      assigned_country: c.assigned_country,
      committee: c.committee,
      topic: c.topic || '',
      special_role: c.special_role || '',
      deadline: c.deadline || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    if (!COUNTRIES.some(c => c.toLowerCase() === form.assigned_country.toLowerCase())) {
      setError('Please select a valid country from the list'); setSubmitting(false); return
    }
    if (!COMMITTEES.some(c => c.toLowerCase() === form.committee.toLowerCase())) {
      setError('Please select a valid committee from the list'); setSubmitting(false); return
    }
    const payload = {
      name: form.name,
      assigned_country: form.assigned_country,
      committee: form.committee,
      topic: form.topic,
      special_role: form.special_role || null,
      deadline: form.deadline || null,
    }
    if (editingId) {
      const err = await updateConference(payload)
      if (err) { setError(err); setSubmitting(false); return }
      setShowModal(false); setEditingId(null); setSubmitting(false)
      setForm({ name: '', assigned_country: '', committee: '', topic: '', special_role: '', deadline: '' })
    } else {
      const created = await createConference(payload)
      setSubmitting(false)
      if (!created) { setError('Failed to create conference'); return }
      setShowModal(false)
      setForm({ name: '', assigned_country: '', committee: '', topic: '', special_role: '', deadline: '' })
      navigate(`/conference/${created.id}`)
    }
  }

  const handleDuplicate = async (c: typeof conferences[0]) => {
    setError(null)
    const created = await createConference({
      name: `${c.name} (copy)`,
      assigned_country: c.assigned_country,
      committee: c.committee,
      topic: c.topic,
      special_role: c.special_role,
      deadline: c.deadline,
    })
    if (!created) setError('Failed to duplicate')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const modal = showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setShowModal(false); setEditingId(null) }}>
      <div className="bg-canvas rounded-xl border border-hairline p-8 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="font-serif text-[22px] font-[400] tracking-[-0.3px] text-ink mb-6">{editingId ? 'Edit Conference' : 'New Conference'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="conf-name" className="block text-sm font-[500] text-body mb-1">Name *</label>
            <input id="conf-name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="UNSC Session 2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="conf-country" className="block text-sm font-[500] text-body mb-1">Country *</label>
              <Autocomplete id="conf-country" value={form.assigned_country} onChange={v => setForm(p => ({ ...p, assigned_country: v }))} options={COUNTRIES} placeholder="France" required />
            </div>
            <div>
              <label htmlFor="conf-committee" className="block text-sm font-[500] text-body mb-1">Committee *</label>
              <Autocomplete id="conf-committee" value={form.committee} onChange={v => setForm(p => ({ ...p, committee: v }))} options={COMMITTEES} placeholder="UNSC" required />
            </div>
          </div>
          <div>
            <label htmlFor="conf-topic" className="block text-sm font-[500] text-body mb-1">Topic</label>
            <input id="conf-topic" value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} className="input" placeholder="Cybersecurity" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="conf-role" className="block text-sm font-[500] text-body mb-1">Special Role</label>
              <input id="conf-role" value={form.special_role} onChange={e => setForm(p => ({ ...p, special_role: e.target.value }))} className="input" placeholder="Chair (optional)" />
            </div>
            <div>
              <label htmlFor="conf-deadline" className="block text-sm font-[500] text-body mb-1">Deadline</label>
              <input id="conf-deadline" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditingId(null) }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving\u2026' : editingId ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-[28px] font-[400] tracking-[-0.3px] text-ink">Conferences</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Conference
        </button>
      </div>
      {(error || conferenceError) && (
        <div className="text-sm text-error bg-error/5 rounded-lg px-3 py-2 mb-4">{error || conferenceError}</div>
      )}

      {conferences.length > 0 && (
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conferences\u2026"
              className="input pl-10"
            />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as any)} className="input w-44">
            <option value="newest">Newest</option>
            <option value="deadline">Deadline (soonest)</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      )}

      {sorted.length === 0 && !search && loading && (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {sorted.length === 0 && !loading ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-full bg-surface-card flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-muted" />
          </div>
          <h2 className="font-serif text-[22px] font-[400] text-ink mb-2">
            {search ? 'No conferences found' : 'No conferences yet'}
          </h2>
          <p className="text-muted mb-6">
            {search ? 'Try a different search term.' : 'Create your first conference to get started.'}
          </p>
          {!search && (
            <button onClick={openNew} className="btn-primary">
              <Plus className="w-4 h-4" /> New Conference
            </button>
          )}
        </div>
      ) : !loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/conference/${c.id}`)}
              className="card cursor-pointer hover:shadow-sm transition-shadow border-l-4 border-l-primary"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-2xl">
                  <span className="font-serif text-[18px] font-[400] text-ink">{c.name}</span>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(c)} className="btn-ghost p-1 text-muted hover:text-ink" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDuplicate(c)} className="btn-ghost p-1 text-muted hover:text-ink" title="Duplicate">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteConference(c.id)} className="btn-ghost p-1 text-muted hover:text-error" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="badge bg-surface-card text-body">{c.committee || 'No committee'}</span>
                {c.deadline && (
                  <span className={`badge ${new Date(c.deadline) > new Date() ? 'bg-accent-amber/10 text-accent-amber' : 'bg-error/10 text-error'}`}>
                    {new Date(c.deadline) > new Date()
                      ? `${Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000)} days`
                      : 'Past due'}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted mt-2">{c.assigned_country} — {c.topic || 'No topic'}</p>
            </div>
          ))}
        </div>
      ) : null}

      {modal}
    </div>
  )
}
