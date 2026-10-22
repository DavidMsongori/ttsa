
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in the user
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

      if (loginError) throw loginError

      // Verify whether the signed-in user is an administrator
      const { data: isAdmin, error: adminError } =
        await supabase.rpc('is_admin')

      if (adminError) {
        console.error(
          'Administrator verification failed:',
          adminError.message
        )

        // Do not continue if the user's role cannot be verified
        await supabase.auth.signOut()

        throw new Error(
          'We could not verify your account role. Please try logging in again.'
        )
      }

      // Redirect according to the verified role
      if (isAdmin === true) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Unable to log in.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordReset() {
    setError('')

    if (!email.trim()) {
      setError('Enter your email address first.')
      return
    }

    setLoading(true)

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        )

      if (resetError) throw resetError

      setError(
        'If the account exists, a password reset email will be sent.'
      )
    } catch (err) {
      setError(err.message || 'Unable to request a password reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand" aria-label="TTSA homepage">
  <img
    src="/ttsa-logo.png"
    alt="Taita Taveta Students Association (TTSA) Logo"
    className="auth-logo"
  />
</Link>

        <p className="auth-eyebrow">STUDENT PORTAL</p>

        <h1>Welcome back</h1>

        <p className="auth-subtitle">
          Log in to access your TTSA membership account.
        </p>

        {error && (
          <div className="auth-alert error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <button
          type="button"
          className="auth-text-button"
          onClick={handlePasswordReset}
          disabled={loading}
        >
          Forgot your password?
        </button>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register">Register for free</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Back to homepage
        </Link>
      </section>
    </main>
  )
}
