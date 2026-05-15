import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function SignupPage() {
  const { user, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  if (success) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-[#efe9de] rounded-xl p-8 text-center">
          <h2 className="font-[500] text-[18px] text-[#141413] mb-2">Check your email</h2>
          <p className="text-sm text-[#3d3d3a]">We sent a confirmation link to {email}</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const err = await signUp(email, password)
    if (err) setError(err)
    else setSuccess(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-[36px] font-[400] tracking-[-0.5px] text-[#141413] text-center mb-8">
          MUN Prep
        </h1>
        <form onSubmit={handleSubmit} className="bg-[#efe9de] rounded-xl p-8 space-y-4">
          <h2 className="font-[500] text-[18px] text-[#141413]">Create account</h2>
          {error && (
            <div className="text-sm text-[#c64545] bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label htmlFor="signup-email" className="block text-sm font-[500] text-[#3d3d3a] mb-1">Email</label>
            <input
              id="signup-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-[#e6dfd8] px-3 py-2 text-sm bg-[#faf9f5] text-[#141413] placeholder:text-[#8e8b82] focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-[500] text-[#3d3d3a] mb-1">Password</label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-[#e6dfd8] px-3 py-2 text-sm bg-[#faf9f5] text-[#141413] placeholder:text-[#8e8b82] focus:border-[#cc785c] focus:outline-none focus:ring-1 focus:ring-[#cc785c]"
              placeholder="Minimum 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-[500] bg-[#cc785c] text-white hover:bg-[#a9583e] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
          <p className="text-sm text-[#6c6a64] text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-[#cc785c] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
