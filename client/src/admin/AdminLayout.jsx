import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './AdminLayout.css'

export default function AdminLayout() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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

  function closeMenu() {
    setMenuOpen(false)
  }

  const navItems = [
    {
      to: '/admin',
      label: 'Overview',
      icon: '▦',
      end: true,
    },
    {
      to: '/admin/students',
      label: 'Student Management',
      icon: '♙',
    },
    {
      to: '/admin/memberships',
      label: 'Membership Records',
      icon: '▤',
    },
    {
      to: '/admin/leadership',
      label: 'Leadership',
      icon: '♔',
    },
    {
      to: '/admin/programs',
      label: 'Programs & Initiatives',
      icon: '📋',
    },
    {
      to: '/admin/announcements',
      label: 'Announcements',
      icon: '♧',
    },
    {
      to: '/admin/news-opportunities',
      label: 'News & Opportunities',
      icon: '📰',
    },
    {
      to: '/admin/contact-messages',
      label: 'Contact Messages',
      icon: '✉',
    },
  ]

  return (
    <div className="admin-layout">
      {menuOpen && (
        <button
          type="button"
          className="admin-menu-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMenu}
        />
      )}

      <aside
        id="admin-navigation"
        className={`admin-sidebar ${menuOpen ? 'menu-open' : ''}`}
      >
        <Link to="/" className="admin-brand" onClick={closeMenu}>
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

        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeMenu}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
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

      <div className="admin-main-area">
        <header className="admin-mobile-header">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="admin-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{menuOpen ? '✕' : '☰'}</span>
          </button>

          <Link
            to="/"
            className="admin-mobile-brand"
            onClick={closeMenu}
          >
            <img src="/ttsa-logo.png" alt="" />
            <span>TTSA Admin</span>
          </Link>
        </header>

        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}