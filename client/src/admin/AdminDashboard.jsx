
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const [totalStudents, setTotalStudents] = useState(null)
  const [recentStudents, setRecentStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        navigate('/login', { replace: true })
        return
      }

      const { data: isAdmin, error: adminError } =
        await supabase.rpc('is_admin')

      if (adminError) throw adminError

      if (isAdmin !== true) {
        navigate('/dashboard', { replace: true })
        return
      }

      const [countResult, studentsResult] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('student_profiles')
          .select(
            'id, registration_number, registration_code, full_name, institution, course, created_at'
          )
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      if (countResult.error) throw countResult.error
      if (studentsResult.error) throw studentsResult.error

      setTotalStudents(countResult.count ?? 0)
      setRecentStudents(studentsResult.data ?? [])
    } catch (err) {
      console.error('Dashboard loading failed:', err.message)
      setError('Unable to load dashboard information. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  function formatRegistrationNumber(student) {
    if (student.registration_code) {
      return student.registration_code
    }

    if (student.registration_number == null) {
      return 'Not assigned'
    }

    const year = new Date(student.created_at).getFullYear()

    return `TTSA-${year}-${String(student.registration_number).padStart(5, '0')}`
  }

  return (
    <div className="admin-dashboard-content">
      <header className="admin-topbar" id="overview">
        <div>
          <p className="admin-eyebrow">TTSA MANAGEMENT PORTAL</p>
          <h1>Admin Dashboard</h1>
        </div>

        <button
          type="button"
          className="admin-refresh"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? 'Loading...' : '↻ Refresh data'}
        </button>
      </header>

      <section className="admin-welcome">
        <div>
          <p>ADMINISTRATOR WORKSPACE</p>
          <h2>Welcome to TTSA Management</h2>
          <span>
            Monitor membership, manage student records and publish
            official announcements.
          </span>
        </div>

       <img
  src="/ttsa-logo.png"
  alt="TTSA Logo"
  className="admin-welcome-icon"
/>
      </section>

      {error && (
        <div className="admin-error" role="alert">
          {error}
          <button type="button" onClick={loadDashboard}>
            Try again
          </button>
        </div>
      )}

      <section className="admin-stats">
        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Total registered students</span>
            <span className="admin-stat-icon">♙</span>
          </div>

          <strong>
            {loading && totalStudents === null
              ? '—'
              : (totalStudents ?? '—').toLocaleString()}
          </strong>

          <small>Student profiles in the database</small>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Recent registrations</span>
            <span className="admin-stat-icon">＋</span>
          </div>

          <strong>{loading ? '—' : recentStudents.length}</strong>
          <small>Latest records displayed below</small>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-top">
            <span>Portal status</span>
            <span className="admin-stat-icon">✓</span>
          </div>

          <strong className="admin-status-text">Active</strong>
          <small>Administrator access verified</small>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Recent student registrations</h2>
            <p>The latest student profiles registered on TTSA.</p>
          </div>

          <Link to="/admin/students" className="admin-view-all">
            Manage students →
          </Link>
        </div>

        {loading ? (
          <p className="admin-empty">Loading student records...</p>
        ) : recentStudents.length === 0 ? (
          <p className="admin-empty">
            No student profiles have been registered yet.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Registration number</th>
                  <th>Institution</th>
                  <th>Course</th>
                  <th>Date registered</th>
                </tr>
              </thead>

              <tbody>
                {recentStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.full_name}</strong>
                    </td>
                    <td>{formatRegistrationNumber(student)}</td>
                    <td>{student.institution}</td>
                    <td>{student.course}</td>
                    <td>
                      {new Date(
                        student.created_at
                      ).toLocaleDateString('en-KE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer className="admin-footer">
        Taita Taveta Students Association · Administration Portal
      </footer>
    </div>
  )
}
