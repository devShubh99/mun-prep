import { useAuth } from '../hooks/useAuth'
import { LogOut } from 'lucide-react'

export default function Settings() {
  const { user, signOut } = useAuth()

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="font-serif text-[28px] font-[400] tracking-[-0.3px] text-ink">Settings</h1>
      <div className="card">
        <h2 className="font-[500] text-sm text-body mb-1">Account</h2>
        <p className="text-sm text-muted mb-4">{user?.email}</p>
        <p className="text-sm text-muted-soft mb-6">Account management coming soon.</p>
        <button onClick={signOut} className="btn-secondary">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )
}
