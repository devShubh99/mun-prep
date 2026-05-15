import { Link, Outlet, useLocation } from 'react-router-dom'
import { Settings, Globe } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useConference } from '../hooks/useConference'

export default function Layout() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { conference } = useConference()

  const showBreadcrumb = pathname.startsWith('/conference/') && conference

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-50 bg-canvas border-b border-hairline">
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
    </div>
  )
}
