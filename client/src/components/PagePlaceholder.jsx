
import { Link } from 'react-router-dom'
import './PagePlaceholder.css'

export default function PagePlaceholder({
  eyebrow,
  title,
  description,
  pageName,
}) {
  return (
    <section className="page-placeholder">
      <div className="page-placeholder-container">
        <span className="page-placeholder-eyebrow">
          {eyebrow || 'TAITA TAVETA STUDENTS ASSOCIATION'}
        </span>

        <h1>{title}</h1>

        <p className="page-placeholder-description">{description}</p>

        <div className="page-placeholder-status">
          <span className="page-placeholder-status-dot" />
          <span>{pageName} page is under development</span>
        </div>

        <Link to="/" className="page-placeholder-home-link">
          <span aria-hidden="true">←</span> Back to Home
        </Link>
      </div>
    </section>
  )
}
