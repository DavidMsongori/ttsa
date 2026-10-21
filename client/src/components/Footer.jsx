
import { Link } from 'react-router-dom'
import './Footer.css'

const footerLinks = {
  Organization: [
    { label: 'About TTSA', to: '/about' },
    { label: 'Leadership', to: '/leadership' },
    { label: 'Programs', to: '/programs' },
    { label: 'News & Updates', to: '/news' },
  ],
  Membership: [
    { label: 'Join TTSA', to: '/register' },
    { label: 'Member Login', to: '/login' },
    { label: 'Contact Us', to: '/contact' },
  ],
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="public-footer">
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-about">
            <Link to="/" className="footer-brand">
             <img
  src="/ttsa-logo.png"
  alt="TTSA logo"
  className="footer-logo"
/>

              <span>
                <strong>TTSA</strong>
                <small>Taita Taveta Students Association</small>
              </span>
            </Link>

            <p>
              Bringing together students from Taita Taveta County to
              strengthen student representation, leadership, unity and
              opportunities.
            </p>

            <span className="footer-tagline">
              Unity · Leadership · Opportunity
            </span>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div className="footer-column" key={heading}>
              <h3>{heading}</h3>

              {links.map((item) => (
                <Link key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}

          <div className="footer-contact">
            <h3>Get in touch</h3>
            <p>Have a question, partnership idea or student initiative?</p>
            <Link to="/contact" className="footer-contact-link">
              Contact TTSA <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container footer-bottom-inner">
          <p>
            © {year} Taita Taveta Students Association. All rights reserved.
          </p>

          <Link to="/" className="footer-back-top">
            Back to home ↑
          </Link>
        </div>
      </div>
    </footer>
  )
}
