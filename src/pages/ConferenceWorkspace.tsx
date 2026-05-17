import { useEffect } from 'react'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { useConference } from '../hooks/useConference'
import { BookOpen, FileText, MessageSquare, Search } from 'lucide-react'

const TABS = [
  { path: 'cheat-sheet', label: 'Cheat Sheet', icon: BookOpen },
  { path: 'research', label: 'Research', icon: Search },
  { path: 'debate', label: 'Debate', icon: MessageSquare },
  { path: 'documents', label: 'Documents', icon: FileText },
]

export default function ConferenceWorkspace() {
  const { id } = useParams<{ id: string }>()
  const { setActiveConferenceId, conference } = useConference()

  useEffect(() => {
    if (id) setActiveConferenceId(id)
  }, [id, setActiveConferenceId])

  if (!conference) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h1 className="font-serif text-[22px] font-[400] text-ink">{conference.name}</h1>
        <span className="text-sm text-muted">— {conference.assigned_country}</span>
      </div>
      <div className="flex gap-1 mb-8 border-b border-hairline overflow-x-auto">
        {TABS.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-[500] border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-ink'
                  : 'border-transparent text-muted hover:text-body hover:border-hairline'
              }`
            }
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}
