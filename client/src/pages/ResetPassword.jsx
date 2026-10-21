
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

export default function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [validSession, setValidSession] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let active = true

    async function checkSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (!active) return

      setValidSession(!error && !!session)
      setCheckingSession(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return

      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
        setCheckingSession(false)
      } else if (event === 'SIGNED_OUT') {
        setValidSession(false)
      } else if (session) {
        setValidSession(true)
        setCheckingSession(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsError(false)

    if (password.length < 8) {
      setMessage('Your password must be at least 8 characters long.')
      setIsError(true)
      return
    }

    if (password !== confirmPassword) {
      setMessage('The passwords do not match.')
      setIsError(true)
      return
    }

    setLoading(true)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error(
          'Your reset link is invalid or has expired. Request a new password-reset email.'
        )
      }

      const { error: updateError } =
        await supabase.auth.updateUser({ password })

      if (updateError) throw updateError

      await supabase.auth.signOut()

      navigate('/login', {
        replace: true,
        state: {
          message: 'Your password has been updated. Please log in with your new password.',
        },
      })
    } catch (err) {
      setMessage(err.message || 'Unable to reset your password.')
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <p>Verifying your password-reset link...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          TTSA
        </Link>

        <p className="auth-eyebrow">ACCOUNT RECOVERY</p>
        <h1>Reset your password</h1>

        {validSession ? (
          <>
            <p className="auth-subtitle">
              Choose a new password for your TTSA account.
            </p>

            {message && (
              <div
                className={`auth-alert ${isError ? 'error' : ''}`}
                role="alert"
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <label>
                New password
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </label>

              <label>
                Confirm new password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? 'Updating password...' : 'Update password'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-subtitle">
              This reset link is invalid, expired, or has already been used.
              Request a new one to continue.
            </p>

            <Link to="/login" className="auth-back">
              Return to login
            </Link>
          </>
        )}

        <Link to="/" className="auth-back">
          ← Back to homepage
        </Link>
      </section>
    </main>
  )
}
