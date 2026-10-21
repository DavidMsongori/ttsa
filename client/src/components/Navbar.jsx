
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './Navbar.css'

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'About TTSA', to: '/about' },
  { label: 'Leadership', to: '/leadership' },
  { label: 'Programs', to: '/programs' },
  { label: 'News & Updates', to: '/news' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="public-navbar">
      <div className="navbar-container">
        <Link
          to="/"
          className="navbar-brand"
          aria-label="TTSA home"
          onClick={closeMenu}
        >
         <img
  src="/ttsa-logo.png"
  alt="TTSA logo"
  className="navbar-logo"
/>

          <span className="navbar-brand-text">
            <strong>TTSA</strong>
            <small>Taita Taveta Students Association</small>
          </span>
        </Link>

        <button
          type="button"
          className="navbar-menu-toggle"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="public-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="public-navigation"
          className={`navbar-links ${menuOpen ? 'is-open' : ''}`}
          aria-label="Main navigation"
        >
          {publicLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `navbar-link ${isActive ? 'active' : ''}`
              }
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
          ))}

          <div className="navbar-actions">
            <Link
              to="/login"
              className="navbar-login"
              onClick={closeMenu}
            >
              Member Login
            </Link>

            <Link
              to="/register"
              className="navbar-register"
              onClick={closeMenu}
            >
              Join TTSA <span aria-hidden="true">→</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
