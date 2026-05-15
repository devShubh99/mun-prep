import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { user, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const err = await signIn(email, password)
    if (err) setError(err)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-[36px] font-[400] tracking-[-0.5px] text-[#141413] text-center mb-8">
          MUN Prep
        </h1>
        <form onSubmit={handleSubmit} className="bg-[#efe9de] rounded-xl p-8 space-y-4">
          <h2 className="font-[500] text-[18px] text-[#141413]">Sign in</h2>
          {error && (
            <div className="text-sm text-[#c64545] bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-[500] text-[#3d3d3a] mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-[#e6dfd8] px-3 py-2 text-sm bg-[#faf9f5] text-[#141413] placeholder:text-[#8e8b82] focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-[500] text-[#3d3d3a] mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-[#e6dfd8] px-3 py-2 text-sm bg-[#faf9f5] text-[#141413] placeholder:text-[#8e8b82] focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-[500] bg-[#cc785c] text-white hover:bg-[#a9583e] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-sm text-[#6c6a64] text-center">
            No account?{' '}
            <Link to="/signup" className="text-[#cc785c] hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
