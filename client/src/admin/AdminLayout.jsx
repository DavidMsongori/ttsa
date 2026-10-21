
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './AdminLayout.css'

export default function AdminLayout() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout failed:', error.message)
      alert('Unable to log out. Please try again.')
      setLoggingOut(false)
      return
    }

    navigate('/login', { replace: true })
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <img
  src="/ttsa-logo.png"
  alt="TTSA Logo"
  className="admin-brand-mark"
/>
          <span>
            TTSA
            <small>ADMINISTRATION</small>
          </span>
        </Link>

        <p className="admin-nav-heading">WORKSPACE</p>

        <nav className="admin-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span>▦</span> Overview
          </NavLink>

          <NavLink
            to="/admin/students"
            end
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span>♙</span> Student Management
          </NavLink>

          <NavLink
            to="/admin/memberships"
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span>▤</span> Membership Records
          </NavLink>

          <NavLink
            to="/admin/announcements"
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span>♧</span> Announcements
          </NavLink>
        </nav>

        <div className="admin-sidebar-bottom">
          <span className="admin-status-dot" />
          Administrator session

          <button
            type="button"
            onClick={handleLogout}
            className="admin-sidebar-logout"
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
