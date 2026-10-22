
import { useState } from 'react'
import LeaderCard from './LeaderCard'
import './Constituency.css'

const CONSTITUENCIES = ['Voi', 'Wundanyi', 'Mwatate', 'Taveta']

const COMMITTEE_POSITIONS = [
  'Chairperson',
  'Deputy Chairperson',
  'Secretary',
]

export default function Constituency({
  constituencyLeaders = [],
  loading = false,
  error = '',
}) {
  const [selectedConstituency, setSelectedConstituency] =
    useState(CONSTITUENCIES[0])

  const committee = constituencyLeaders.filter(
    (leader) =>
      leader.constituency?.trim().toLowerCase() ===
      selectedConstituency.toLowerCase()
  )

  const filledPositions = new Set(
    committee.map((leader) => leader.position?.trim().toLowerCase())
  )

  const vacancies = COMMITTEE_POSITIONS.filter(
    (position) => !filledPositions.has(position.toLowerCase())
  )

  return (
    <section
      className="ttsa-constituency-section"
      id="constituency-committee"
    >
      <div className="ttsa-leadership-container">
        <div className="ttsa-leadership-section-heading ttsa-constituency-section-heading">
          <div>
            <span className="ttsa-leadership-eyebrow">
              LOCAL REPRESENTATION
            </span>

            <h2>Constituency Committees</h2>

            <p>
              Student representatives connecting TTSA with students
              within each constituency.
            </p>
          </div>
        </div>

        {/* HORIZONTAL CONSTITUENCY SELECTOR */}
        <div
          className="ttsa-constituency-tabs"
          role="group"
          aria-label="Select a constituency"
        >
          {CONSTITUENCIES.map((constituency) => {
            const isActive =
              selectedConstituency === constituency

            const leaderCount = constituencyLeaders.filter(
              (leader) =>
                leader.constituency?.trim().toLowerCase() ===
                constituency.toLowerCase()
            ).length

            return (
              <button
                key={constituency}
                type="button"
                className={`ttsa-constituency-tab ${
                  isActive ? 'active' : ''
                }`}
                aria-pressed={isActive}
                onClick={() => setSelectedConstituency(constituency)}
              >
                <span className="ttsa-constituency-tab-name">
                  {constituency}
                </span>

                <span className="ttsa-constituency-tab-count">
                  {leaderCount}{' '}
                  {leaderCount === 1 ? 'Leader' : 'Leaders'}
                </span>
              </button>
            )
          })}
        </div>

        {/* SELECTED CONSTITUENCY CONTENT */}
        <div className="ttsa-selected-constituency">
          <div className="ttsa-selected-constituency-heading">
            <div>
              <span className="ttsa-constituency-overline">
                CONSTITUENCY COMMITTEE
              </span>

              <h3>{selectedConstituency}</h3>

              <p>
                Meet the student leaders representing{' '}
                {selectedConstituency} Constituency.
              </p>
            </div>

            <span className="ttsa-constituency-member-count">
              {committee.length}{' '}
              {committee.length === 1 ? 'Leader' : 'Leaders'}
            </span>
          </div>

          {loading ? (
            <p className="ttsa-leadership-message">
              Loading constituency committees...
            </p>
          ) : error ? (
            <p
              className="ttsa-leadership-message ttsa-leadership-error"
              role="alert"
            >
              {error}
            </p>
          ) : (
            <>
              {committee.length > 0 ? (
                <div className="ttsa-public-leaders-grid ttsa-constituency-leaders-grid">
                  {committee.map((leader) => (
                    <LeaderCard
                      key={leader.id}
                      leader={leader}
                    />
                  ))}
                </div>
              ) : (
                <div className="ttsa-constituency-empty">
                  <div className="ttsa-constituency-empty-icon">
                    <span aria-hidden="true">⌂</span>
                  </div>

                  <h4>No appointments published yet</h4>

                  <p>
                    The {selectedConstituency} Constituency Committee
                    does not have any current appointments published.
                    Check back for updates.
                  </p>
                </div>
              )}

              {vacancies.length > 0 && (
                <div className="ttsa-constituency-vacancies">
                  <h4>
                    Vacant positions
                    <span>{vacancies.length}</span>
                  </h4>

                  <div className="ttsa-constituency-vacancy-list">
                    {vacancies.map((position) => (
                      <div
                        className="ttsa-constituency-vacancy"
                        key={position}
                      >
                        <span
                          className="ttsa-constituency-vacancy-dot"
                          aria-hidden="true"
                        />
                        {position}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
