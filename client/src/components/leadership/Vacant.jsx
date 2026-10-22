
import { useState } from 'react'
import './Vacant.css'

const VACANCY_TABS = [
  { label: 'County', value: 'county' },
  { label: 'Voi', value: 'Voi' },
  { label: 'Mwatate', value: 'Mwatate' },
  { label: 'Wundanyi', value: 'Wundanyi' },
  { label: 'Taveta', value: 'Taveta' },
]

export default function Vacant({
  countyVacancies = [],
  constituencyVacancies = [],
  loading = false,
  error = '',
}) {
  const [selectedTab, setSelectedTab] = useState('county')

  const isCounty = selectedTab === 'county'

  const visibleVacancies = isCounty
    ? countyVacancies
    : constituencyVacancies.filter(
        (vacancy) =>
          vacancy.constituency?.trim().toLowerCase() ===
          selectedTab.toLowerCase()
      )

  const totalVacancies =
    countyVacancies.length + constituencyVacancies.length

  return (
    <section
      className="ttsa-vacancies-section"
      id="vacant-positions"
    >
      <div className="ttsa-leadership-container">
        {/* SECTION HEADING */}
        <div className="ttsa-leadership-section-heading ttsa-vacancies-heading">
          <div>
            <span className="ttsa-leadership-eyebrow">
              OPPORTUNITIES TO SERVE
            </span>

            <h2>Vacant Positions</h2>

            <p>
              Explore leadership opportunities across the TTSA County
              and Constituency Committees.
            </p>
          </div>

          <span className="ttsa-vacancy-total">
            {loading ? '…' : totalVacancies}{' '}
            {totalVacancies === 1 ? 'Vacancy' : 'Vacancies'}
          </span>
        </div>

        {/* HORIZONTAL TABS */}
        <div
          className="ttsa-vacancy-tabs"
          role="group"
          aria-label="Choose committee to view vacant positions"
        >
          {VACANCY_TABS.map((tab) => {
            const active = selectedTab === tab.value

            const count = loading
              ? null
              : tab.value === 'county'
                ? countyVacancies.length
                : constituencyVacancies.filter(
                    (vacancy) =>
                      vacancy.constituency?.trim().toLowerCase() ===
                      tab.value.toLowerCase()
                  ).length

            return (
              <button
                key={tab.value}
                type="button"
                className={`ttsa-vacancy-tab ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => setSelectedTab(tab.value)}
              >
                <span className="ttsa-vacancy-tab-name">
                  {tab.label}
                </span>

                <span className="ttsa-vacancy-tab-count">
                  {count === null
                    ? 'Checking…'
                    : `${count} ${count === 1 ? 'vacancy' : 'vacancies'}`}
                </span>
              </button>
            )
          })}
        </div>

        {/* SELECTED COMMITTEE VACANCIES */}
        <div className="ttsa-vacancy-results">
          <div className="ttsa-vacancy-results-heading">
            <div>
              <span className="ttsa-vacancy-overline">
                CURRENT OPEN POSITIONS
              </span>

              <h3>
                {isCounty
                  ? 'County Committee'
                  : `${selectedTab} Constituency Committee`}
              </h3>

              <p>
                {isCounty
                  ? 'Vacant positions in the countywide leadership team.'
                  : `Vacant positions in the ${selectedTab} Constituency Committee.`}
              </p>
            </div>

            {!loading && !error && (
              <span className="ttsa-vacancy-results-count">
                {visibleVacancies.length}{' '}
                {visibleVacancies.length === 1 ? 'Open Position' : 'Open Positions'}
              </span>
            )}
          </div>

          {loading ? (
            <p className="ttsa-leadership-message">
              Checking vacant positions...
            </p>
          ) : error ? (
            <p
              className="ttsa-leadership-message ttsa-leadership-error"
              role="alert"
            >
              Vacancies could not be calculated because leadership data
              failed to load.
            </p>
          ) : visibleVacancies.length > 0 ? (
            <div className="ttsa-vacancy-grid">
              {visibleVacancies.map((vacancy) => {
                const position =
                  typeof vacancy === 'string'
                    ? vacancy
                    : vacancy.position

                const constituency =
                  typeof vacancy === 'string'
                    ? null
                    : vacancy.constituency

                return (
                  <article
                    className="ttsa-vacancy-card"
                    key={`${selectedTab}-${position}-${constituency || ''}`}
                  >
                    <div className="ttsa-vacancy-card-icon" aria-hidden="true">
                      <span>+</span>
                    </div>

                    <div className="ttsa-vacancy-card-content">
                      <span className="ttsa-vacancy-card-label">
                        VACANT POSITION
                      </span>

                      <h4>{position}</h4>

                      {constituency && (
                        <p>{constituency} Constituency</p>
                      )}
                    </div>

                    <span className="ttsa-vacancy-open-indicator">
                      Open
                    </span>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="ttsa-vacancy-empty">
              <div className="ttsa-vacancy-empty-icon" aria-hidden="true">
                ✓
              </div>

              <h4>No vacancies listed</h4>

              <p>
                All listed positions in this committee currently have
                appointments recorded, or no vacancies are published.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
