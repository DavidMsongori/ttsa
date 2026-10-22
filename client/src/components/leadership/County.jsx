
import LeaderCard from './LeaderCard'
import './County.css'

export default function County({ countyLeaders = [], loading = false, error = '' }) {
  return (
    <section
      className="ttsa-leadership-content-section ttsa-county-section"
      id="county-committee"
    >
      <div className="ttsa-leadership-container">
        <div className="ttsa-leadership-section-heading ttsa-county-heading">
          <div>
            <span className="ttsa-leadership-eyebrow">
              COUNTY STUDENT REPRESENTATION
            </span>

            <h2>County Committee</h2>

            <p>
              Meet the team providing countywide leadership and
              representing the collective interests of TTSA students.
            </p>
          </div>

          <span className="ttsa-leadership-count">
            {countyLeaders.length}{' '}
            {countyLeaders.length === 1 ? 'Leader' : 'Leaders'}
          </span>
        </div>

        {loading ? (
          <p className="ttsa-leadership-message">
            Loading county leadership...
          </p>
        ) : error ? (
          <p
            className="ttsa-leadership-message ttsa-leadership-error"
            role="alert"
          >
            {error}
          </p>
        ) : countyLeaders.length > 0 ? (
          <div className="ttsa-public-leaders-grid ttsa-county-leaders-grid">
            {countyLeaders.map((leader) => (
              <LeaderCard key={leader.id} leader={leader} />
            ))}
          </div>
        ) : (
          <div className="ttsa-leadership-empty">
            <h3>County leadership coming soon</h3>
            <p>
              County Committee appointments will appear here once they
              have been published.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
