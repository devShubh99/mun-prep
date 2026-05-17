import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Settings, Globe, Loader } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useConference } from '../hooks/useConference'

export default function Layout() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { conference, tasks } = useConference()
  const [showTasks, setShowTasks] = useState(false)

  const showBreadcrumb = pathname.startsWith('/conference/') && conference
  const activeTasks = Object.entries(tasks).filter(([, label]) => label !== null) as [string, string][]

  return (
    <div className="min-h-screen bg-canvas">
      <header className="no-print sticky top-0 z-50 bg-canvas border-b border-hairline">
        <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-ink hover:text-primary transition-colors">
              <Globe className="w-5 h-5" />
              <span className="font-serif text-[22px] font-[400] tracking-[-0.3px]">MUN Prep</span>
            </Link>
            {showBreadcrumb && (
              <span className="text-muted text-sm">
                / <span className="text-body">{conference.name}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-muted hidden sm:block">{user.email}</span>
            )}
            <Link to="/settings" className="btn-ghost p-2">
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content" className="max-w-content mx-auto px-6 py-section">
        <Outlet />
      </main>

      {activeTasks.length > 0 && (
        <div className="fixed bottom-4 left-4 z-50">
          <button
            onClick={() => setShowTasks(!showTasks)}
            className="bg-surface-dark text-on-dark rounded-full px-3 py-1.5 text-xs shadow-lg flex items-center gap-1.5 hover:bg-surface-dark-elevated transition-colors"
          >
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            {activeTasks.length} running
          </button>
          {showTasks && (
            <div className="absolute bottom-full mb-2 left-0 bg-surface-dark rounded-xl p-3 shadow-lg min-w-[180px]">
              {activeTasks.map(([key, label]) => (
                <div key={key} className="flex items-center gap-2 py-1 text-xs text-on-dark">
                  <Loader className="w-3 h-3 text-primary animate-spin shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
