import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConference } from '../hooks/useConference'
import { Plus, Search, Trash2, Globe } from 'lucide-react'

export default function Dashboard() {
  const { conferences, createConference, deleteConference, loading } = useConference()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', assigned_country: '', committee: '', topic: '', special_role: '', deadline: '' })
  const [submitting, setSubmitting] = useState(false)

  const filtered = conferences.filter(c =>
    !search || [c.name, c.assigned_country, c.committee, c.topic].some(
      f => f?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const created = await createConference({
      name: form.name,
      assigned_country: form.assigned_country,
      committee: form.committee,
      topic: form.topic,
      special_role: form.special_role || null,
      deadline: form.deadline || null,
    })
    setSubmitting(false)
    setShowModal(false)
    setForm({ name: '', assigned_country: '', committee: '', topic: '', special_role: '', deadline: '' })
    if (created) navigate(`/conference/${created.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const modal = showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowModal(false)}>
      <div className="bg-canvas rounded-xl border border-hairline p-8 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="font-serif text-[22px] font-[400] tracking-[-0.3px] text-ink mb-6">New Conference</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label htmlFor="conf-name" className="block text-sm font-[500] text-body mb-1">Name *</label>
            <input id="conf-name" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="UNSC Session 2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="conf-country" className="block text-sm font-[500] text-body mb-1">Country *</label>
              <input id="conf-country" required value={form.assigned_country} onChange={e => setForm(p => ({ ...p, assigned_country: e.target.value }))} className="input" placeholder="France" />
            </div>
            <div>
              <label htmlFor="conf-committee" className="block text-sm font-[500] text-body mb-1">Committee *</label>
              <input id="conf-committee" required value={form.committee} onChange={e => setForm(p => ({ ...p, committee: e.target.value }))} className="input" placeholder="UNSC" />
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
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creating\u2026' : 'Create'}
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

      {conferences.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conferences\u2026"
            className="input pl-10"
          />
        </div>
      )}

      {filtered.length === 0 ? (
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
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> New Conference
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
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
                  <button onClick={() => deleteConference(c.id)} className="btn-ghost p-1 text-muted hover:text-error">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="badge bg-surface-card text-body">{c.committee || 'No committee'}</span>
                {c.deadline && new Date(c.deadline) > new Date() && (
                  <span className="badge bg-accent-amber/10 text-accent-amber">
                    {Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000)} days
                  </span>
                )}
              </div>
              <p className="text-sm text-muted mt-2">{c.assigned_country} — {c.topic || 'No topic'}</p>
            </div>
          ))}
        </div>
      )}

      {modal}
    </div>
  )
}
