import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Programs.css'

const categoryOptions = [
  'Leadership & Governance',
  'Education & Student Welfare',
  'Careers & Opportunities',
  'Innovation & Entrepreneurship',
  'Community Engagement',
  'Partnerships & Advocacy',
  'Other',
]

function formatDate(date) {
  if (!date) return null

  const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) return null

  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate)
}

function getLifecycleLabel(status) {
  const labels = {
    upcoming: 'Upcoming',
    ongoing: 'Ongoing',
    completed: 'Completed',
  }

  return labels[status] || 'Program'
}

function ProgramImage({ program, featured = false }) {
  if (program.cover_image_url) {
    return (
      <img
        className={`program-card-image ${featured ? 'featured-image' : ''}`}
        src={program.cover_image_url}
        alt={program.title}
        loading="lazy"
      />
    )
  }

  return (
    <div
      className={`program-image-placeholder ${
        featured ? 'featured-image' : ''
      }`}
      aria-label="Program image unavailable"
    >
      <span>TTSA</span>
      <strong>Programs & Initiatives</strong>
    </div>
  )
}

function ProgramDetails({ program, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const startDate = formatDate(program.start_date)
  const endDate = formatDate(program.end_date)

  return (
    <div
      className="program-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="program-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="program-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="program-modal-close"
          onClick={onClose}
          aria-label="Close program details"
        >
          ×
        </button>

        <div className="program-modal-image">
          <ProgramImage program={program} featured />
        </div>

        <div className="program-modal-content">
          <div className="program-card-tags">
            <span className="program-category">
              {program.category || 'Other'}
            </span>
            <span
              className={`program-lifecycle ${program.program_status || 'upcoming'}`}
            >
              {getLifecycleLabel(program.program_status)}
            </span>
          </div>

          <h2 id="program-modal-title">{program.title}</h2>

          {program.summary && (
            <p className="program-modal-summary">{program.summary}</p>
          )}

          <div className="program-modal-meta">
            {program.location && (
              <span>
                <strong>Location</strong>
                {program.location}
              </span>
            )}

            {startDate && (
              <span>
                <strong>Start date</strong>
                {startDate}
              </span>
            )}

            {endDate && (
              <span>
                <strong>End date</strong>
                {endDate}
              </span>
            )}
          </div>

          <div className="program-detail-section">
            <h3>About this program</h3>
            <p>{program.description}</p>
          </div>

          {program.objectives && (
            <div className="program-detail-section">
              <h3>Objectives</h3>
              <p className="program-preformatted">{program.objectives}</p>
            </div>
          )}

          {program.activities && (
            <div className="program-detail-section">
              <h3>Key activities</h3>
              <p className="program-preformatted">{program.activities}</p>
            </div>
          )}

          {program.expected_outcomes && (
            <div className="program-detail-section">
              <h3>Expected outcomes</h3>
              <p className="program-preformatted">
                {program.expected_outcomes}
              </p>
            </div>
          )}

          {program.impact_summary && (
            <div className="program-detail-section">
              <h3>Our impact</h3>
              <p className="program-preformatted">
                {program.impact_summary}
              </p>
            </div>
          )}

          {program.contact_email && (
            <p className="program-contact">
              Questions?{' '}
              <a href={`mailto:${program.contact_email}`}>
                {program.contact_email}
              </a>
            </p>
          )}

          {program.registration_url && (
            <a
              className="program-primary-button"
              href={program.registration_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Register / Learn More <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </section>
    </div>
  )
}

export default function Programs() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedProgram, setSelectedProgram] = useState(null)

  useEffect(() => {
    let active = true

    async function loadPrograms() {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('ttsa_programs')
        .select(`
          id,
          title,
          slug,
          summary,
          description,
          category,
          program_status,
          objectives,
          activities,
          expected_outcomes,
          impact_summary,
          cover_image_url,
          featured,
          display_order,
          location,
          start_date,
          end_date,
          registration_url,
          contact_email,
          published_at
        `)
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('published_at', { ascending: false })

      if (!active) return

      if (fetchError) {
        console.error('Failed to load TTSA programs:', fetchError.message)
        setError('We could not load programs right now. Please try again.')
        setPrograms([])
      } else {
        setPrograms(data || [])
      }

      setLoading(false)
    }

    loadPrograms()

    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(() => {
    const available = programs
      .map((program) => program.category)
      .filter(Boolean)

    return ['All', ...new Set(available)]
  }, [programs])

  const filteredPrograms = useMemo(() => {
    const term = search.trim().toLowerCase()

    return programs.filter((program) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        program.category === selectedCategory

      const matchesStatus =
        selectedStatus === 'All' ||
        program.program_status === selectedStatus

      const searchableText = [
        program.title,
        program.summary,
        program.description,
        program.category,
        program.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        matchesCategory &&
        matchesStatus &&
        (!term || searchableText.includes(term))
      )
    })
  }, [programs, search, selectedCategory, selectedStatus])

  const featuredPrograms = filteredPrograms.filter(
    (program) => program.featured
  )

  const featuredIds = new Set(
    featuredPrograms.map((program) => program.id)
  )

  const regularPrograms = filteredPrograms.filter(
    (program) => !featuredIds.has(program.id)
  )

  function resetFilters() {
    setSearch('')
    setSelectedCategory('All')
    setSelectedStatus('All')
  }

  return (
    <div className="programs-page">
      {/* Hero */}
      <section className="programs-hero">
        <div className="programs-hero-overlay" />

        <div className="programs-hero-content">
          <span className="programs-eyebrow">
            OUR INITIATIVES
          </span>

          <h1>
            Programs &amp; <span>Initiatives</span>
          </h1>

          <p>
            Discover how TTSA is empowering students through leadership,
            education, innovation, community engagement and opportunities
            that create lasting impact.
          </p>

          <div className="programs-hero-actions">
            <a href="#explore-programs" className="programs-hero-primary">
              Explore Programs <span aria-hidden="true">↓</span>
            </a>

            <a href="/contact" className="programs-hero-secondary">
              Partner With Us <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="programs-hero-stats">
            <div>
              <strong>{programs.length}</strong>
              <span>Published Programs</span>
            </div>

            <div>
              <strong>
                {programs.filter((p) => p.program_status === 'ongoing').length}
              </strong>
              <span>Ongoing Initiatives</span>
            </div>

            <div>
              <strong>
                {programs.filter((p) => p.program_status === 'completed').length}
              </strong>
              <span>Completed Programs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="programs-intro">
        <div className="programs-container">
          <span className="programs-section-eyebrow">WHAT WE DO</span>
          <h2>Turning student potential into progress.</h2>
          <p>
            Our programs are designed to strengthen student leadership,
            improve student welfare, open pathways to opportunity and
            connect students with meaningful community development.
          </p>
        </div>
      </section>

      {/* Program directory */}
      <section
        className="programs-directory"
        id="explore-programs"
      >
        <div className="programs-container">
          <div className="programs-directory-heading">
            <div>
              <span className="programs-section-eyebrow">
                THE PROGRAM DIRECTORY
              </span>
              <h2>Explore our initiatives</h2>
              <p>
                Find a program that matches your interests and aspirations.
              </p>
            </div>

            <span className="programs-result-count">
              {loading
                ? 'Loading programs…'
                : `${filteredPrograms.length} ${
                    filteredPrograms.length === 1 ? 'program' : 'programs'
                  } found`}
            </span>
          </div>

          <div className="programs-filters">
            <label className="programs-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search programs, topics or locations..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search programs"
              />
            </label>

            <label className="programs-filter-select">
              <span>Category</span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'All' ? 'All categories' : category}
                  </option>
                ))}
              </select>
            </label>

            <label className="programs-filter-select">
              <span>Program status</span>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
              >
                <option value="All">All statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="programs-state programs-error" role="alert">
              <h3>Unable to load programs</h3>
              <p>{error}</p>
              <button
                type="button"
                className="programs-reset-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          )}

          {loading && (
            <div className="programs-state">
              <div className="programs-spinner" />
              <h3>Loading our programs</h3>
              <p>Please wait while we fetch the latest initiatives.</p>
            </div>
          )}

          {!loading && !error && programs.length === 0 && (
            <div className="programs-state">
              <span className="programs-state-icon">✦</span>
              <h3>New initiatives are on the way</h3>
              <p>
                There are no published programs to display at the moment.
                Please check back soon.
              </p>
            </div>
          )}

          {!loading && !error && programs.length > 0 &&
            filteredPrograms.length === 0 && (
              <div className="programs-state">
                <span className="programs-state-icon">⌕</span>
                <h3>No matching programs</h3>
                <p>
                  Try changing your search or selecting a different category
                  or status.
                </p>
                <button
                  type="button"
                  className="programs-reset-button"
                  onClick={resetFilters}
                >
                  Clear Filters
                </button>
              </div>
            )}

          {!loading && !error && featuredPrograms.length > 0 && (
            <section className="programs-featured-section">
              <div className="programs-subheading">
                <span className="programs-featured-marker">★</span>
                <h3>Featured Programs</h3>
              </div>

              <div className="programs-featured-grid">
                {featuredPrograms.map((program) => (
                  <article
                    className="program-featured-card"
                    key={program.id}
                  >
                    <button
                      type="button"
                      className="program-featured-image-button"
                      onClick={() => setSelectedProgram(program)}
                      aria-label={`View ${program.title} details`}
                    >
                      <ProgramImage program={program} featured />
                      <span className="program-featured-badge">
                        Featured
                      </span>
                    </button>

                    <div className="program-featured-content">
                      <div className="program-card-tags">
                        <span className="program-category">
                          {program.category || 'Other'}
                        </span>
                        <span
                          className={`program-lifecycle ${
                            program.program_status || 'upcoming'
                          }`}
                        >
                          {getLifecycleLabel(program.program_status)}
                        </span>
                      </div>

                      <h3>{program.title}</h3>

                      <p className="program-card-summary">
                        {program.summary || program.description}
                      </p>

                      <div className="program-card-meta">
                        {program.location && (
                          <span>⌖ {program.location}</span>
                        )}
                        {program.start_date && (
                          <span>◷ {formatDate(program.start_date)}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="program-card-link"
                        onClick={() => setSelectedProgram(program)}
                      >
                        Explore Program <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {!loading && !error && regularPrograms.length > 0 && (
            <section className="programs-all-section">
              {featuredPrograms.length > 0 && (
                <div className="programs-subheading">
                  <h3>More Initiatives</h3>
                </div>
              )}

              <div className="programs-grid">
                {regularPrograms.map((program) => (
                  <article className="program-card" key={program.id}>
                    <button
                      type="button"
                      className="program-card-image-button"
                      onClick={() => setSelectedProgram(program)}
                      aria-label={`View ${program.title} details`}
                    >
                      <ProgramImage program={program} />
                    </button>

                    <div className="program-card-content">
                      <div className="program-card-tags">
                        <span className="program-category">
                          {program.category || 'Other'}
                        </span>
                        <span
                          className={`program-lifecycle ${
                            program.program_status || 'upcoming'
                          }`}
                        >
                          {getLifecycleLabel(program.program_status)}
                        </span>
                      </div>

                      <h3>{program.title}</h3>

                      <p className="program-card-summary">
                        {program.summary || program.description}
                      </p>

                      <div className="program-card-meta">
                        {program.location && (
                          <span>⌖ {program.location}</span>
                        )}
                        {program.start_date && (
                          <span>◷ {formatDate(program.start_date)}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="program-card-link"
                        onClick={() => setSelectedProgram(program)}
                      >
                        View Details <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      {/* Partnership call to action */}
      <section className="programs-cta">
        <div className="programs-cta-content">
          <span className="programs-section-eyebrow">
            BUILD WITH US
          </span>
          <h2>Help us create more opportunities for students.</h2>
          <p>
            Partner with TTSA to support student leadership, innovation,
            welfare and initiatives that make a difference in our communities.
          </p>
          <a href="/contact" className="programs-hero-primary">
            Become a Partner <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      {selectedProgram && (
        <ProgramDetails
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </div>
  )
}