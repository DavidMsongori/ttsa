
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let active = true

    async function checkAdmin() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        if (active) setStatus('unauthenticated')
        return
      }

      const { data, error } = await supabase.rpc('is_admin')

      if (!active) return

      if (error) {
        console.error('Administrator check failed:', error.message)
        setStatus('error')
        return
      }

      setStatus(data === true ? 'authorized' : 'unauthorized')
    }

    checkAdmin()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setStatus('unauthenticated')
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (status === 'checking') {
    return <main className="dashboard-state">Checking administrator access...</main>
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (status === 'unauthorized') {
    return <Navigate to="/dashboard" replace />
  }

  if (status === 'error') {
    return (
      <main className="dashboard-state">
        <h1>Administrator access unavailable</h1>
        <p>We could not verify your permissions. Please refresh or try again.</p>
      </main>
    )
  }

  return children
}
