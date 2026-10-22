import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './News.css'

const OPPORTUNITY_TYPES = [
  'All Types',
  'Scholarship',
  'Internship',
  'Job',
  'Fellowship',
  'Training',
  'Grant',
  'Competition',
  'Other',
]

const NEWS_CATEGORIES = [
  'All Categories',
  'Announcement',
  'Event',
  'Achievement',
  'Update',
]

function formatDate(date) {
  if (!date) return 'Date to be announced'

  return new Date(date).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isDeadlinePassed(deadline) {
  if (!deadline) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return new Date(`${deadline}T00:00:00`) < today
}

function NewsCard({ item, onRead }) {
  return (
    <article className="news-card">
      {item.cover_image_url ? (
        <img
          className="news-card-image"
          src={item.cover_image_url}
          alt={item.title}
          loading="lazy"
        />
      ) : (
        <div className="news-card-image news-image-placeholder">
          <span>TTSA</span>
        </div>
      )}

      <div className="news-card-body">
        <div className="news-card-meta">
          <span className="news-category">
            {item.category || 'Announcement'}
          </span>

          <span>{formatDate(item.published_at || item.created_at)}</span>
        </div>

        <h3>{item.title}</h3>

        <p className="news-card-excerpt">
          {item.excerpt || item.content?.slice(0, 160)}
        </p>

        <button
          type="button"
          className="news-text-button"
          onClick={() => onRead(item)}
        >
          Read full story <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  )
}

function OpportunityCard({ item, onRead }) {
  const expired = isDeadlinePassed(item.deadline)
  const closed = item.status === 'closed' || expired

  return (
    <article className="opportunity-card">
      {item.cover_image_url ? (
        <img
          className="opportunity-card-image"
          src={item.cover_image_url}
          alt={item.title}
          loading="lazy"
        />
      ) : (
        <div className="opportunity-card-image opportunity-image-placeholder">
          <span aria-hidden="true">✦</span>
        </div>
      )}

      <div className="opportunity-card-body">
        <div className="opportunity-card-top">
          <span className="opportunity-type">
            {item.opportunity_type || 'Opportunity'}
          </span>

          <span className={`opportunity-status ${closed ? 'closed' : 'open'}`}>
            {closed ? 'Closed' : 'Open'}
          </span>
        </div>

        <h3>{item.title}</h3>

        <p className="opportunity-organization">
          {item.organization}
        </p>

        <p className="opportunity-description">
          {item.description?.slice(0, 160)}
          {item.description?.length > 160 ? '…' : ''}
        </p>

        <div className="opportunity-details">
          {item.location && (
            <p>
              <span aria-hidden="true">⌖</span> {item.location}
            </p>
          )}

          <p>
            <span aria-hidden="true">◷</span>{' '}
            {item.deadline
              ? `Deadline: ${formatDate(item.deadline)}`
              : 'Deadline not specified'}
          </p>
        </div>

        <button
          type="button"
          className="news-text-button"
          onClick={() => onRead(item)}
        >
          View opportunity <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  )
}

function DetailModal({ item, kind, onClose }) {
  useEffect(() => {
    if (!item) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [item, onClose])

  if (!item) return null

  const isOpportunity = kind === 'opportunity'
  const expired = isOpportunity && isDeadlinePassed(item.deadline)
  const closed =
    isOpportunity && (item.status === 'closed' || expired)

  return (
    <div
      className="news-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="news-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-detail-title"
      >
        <button
          type="button"
          className="news-modal-close"
          onClick={onClose}
          aria-label="Close details"
        >
          ×
        </button>

        {item.cover_image_url && (
          <img
            className="news-modal-image"
            src={item.cover_image_url}
            alt={item.title}
          />
        )}

        <div className="news-modal-content">
          <span className="news-category">
            {isOpportunity
              ? item.opportunity_type || 'Opportunity'
              : item.category || 'Announcement'}
          </span>

          <h2 id="news-detail-title">{item.title}</h2>

          {isOpportunity && (
            <p className="news-modal-organization">
              {item.organization}
            </p>
          )}

          <p className="news-modal-date">
            {isOpportunity
              ? `Application deadline: ${formatDate(item.deadline)}`
              : `Published: ${formatDate(item.published_at || item.created_at)}`}
          </p>

          {isOpportunity && (
            <div className="news-modal-facts">
              {item.location && <p><strong>Location:</strong> {item.location}</p>}
              {item.eligibility && <p><strong>Eligibility:</strong> {item.eligibility}</p>}
              {item.start_date && <p><strong>Start date:</strong> {formatDate(item.start_date)}</p>}
            </div>
          )}

          <div className="news-modal-text">
            {isOpportunity ? item.description : item.content}
          </div>

          {isOpportunity && item.how_to_apply && (
            <div className="news-how-to-apply">
              <h3>How to apply</h3>
              <p>{item.how_to_apply}</p>
            </div>
          )}

          {isOpportunity && !closed && (
            <div className="news-application-actions">
              {item.application_url && (
                <a
                  href={item.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-primary-button"
                >
                  Apply now <span aria-hidden="true">↗</span>
                </a>
              )}

              {item.application_email && (
                <a
                  href={`mailto:${item.application_email}`}
                  className="news-secondary-button"
                >
                  Contact by email
                </a>
              )}
            </div>
          )}

          {isOpportunity && closed && (
            <p className="news-closed-notice">
              Applications for this opportunity are closed.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default function News() {
  const [news, setNews] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [opportunityType, setOpportunityType] = useState('All Types')
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedKind, setSelectedKind] = useState('news')

  useEffect(() => {
    let cancelled = false

    async function loadPublicContent() {
      setLoading(true)
      setError('')

      const [newsResult, opportunitiesResult] = await Promise.all([
        supabase
          .from('ttsa_news')
          .select(
            'id, title, slug, excerpt, content, category, cover_image_url, featured, published_at, created_at'
          )
          .eq('status', 'published')
          .order('published_at', { ascending: false }),

        supabase
          .from('ttsa_opportunities')
          .select(
            'id, title, slug, organization, description, opportunity_type, category, location, eligibility, how_to_apply, application_url, application_email, cover_image_url, deadline, start_date, status, featured, published_at, created_at'
          )
          .in('status', ['published', 'closed'])
          .order('featured', { ascending: false })
          .order('published_at', { ascending: false }),
      ])

      if (cancelled) return

      if (newsResult.error || opportunitiesResult.error) {
        console.error(
          'Unable to load TTSA public content:',
          newsResult.error || opportunitiesResult.error
        )

        setError(
          'We could not load the latest updates right now. Please try again.'
        )
      } else {
        setNews(newsResult.data || [])
        setOpportunities(opportunitiesResult.data || [])
      }

      setLoading(false)
    }

    loadPublicContent()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredNews = useMemo(() => {
    const term = search.trim().toLowerCase()

    return news.filter((item) => {
      const matchesSearch =
        !term ||
        [item.title, item.excerpt, item.content, item.category]
          .some((value) => value?.toLowerCase().includes(term))

      const matchesCategory =
        category === 'All Categories' || item.category === category

      return matchesSearch && matchesCategory
    })
  }, [news, search, category])

  const filteredOpportunities = useMemo(() => {
    const term = search.trim().toLowerCase()

    return opportunities.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item.title,
          item.organization,
          item.description,
          item.opportunity_type,
          item.location,
          item.category,
        ].some((value) => value?.toLowerCase().includes(term))

      const matchesType =
        opportunityType === 'All Types' ||
        item.opportunity_type === opportunityType

      return matchesSearch && matchesType
    })
  }, [opportunities, search, opportunityType])

  const featuredNews = news.find((item) => item.featured)
  const featuredOpportunity = opportunities.find(
    (item) =>
      item.featured &&
      item.status === 'published' &&
      !isDeadlinePassed(item.deadline)
  )

  function openNews(item) {
    setSelectedItem(item)
    setSelectedKind('news')
  }

  function openOpportunity(item) {
    setSelectedItem(item)
    setSelectedKind('opportunity')
  }

  function closeDetails() {
    setSelectedItem(null)
  }

  return (
    <div className="public-news-page">
      <section className="news-hero">
        <div className="news-hero-pattern" aria-hidden="true" />

        <div className="news-container news-hero-content">
          <span className="news-eyebrow">THE TTSA INFORMATION HUB</span>

          <h1>
            News, opportunities
            <br />
            <span>and possibilities.</span>
          </h1>

          <p>
            Stay connected to what is happening across Taita Taveta.
            Discover TTSA announcements, student achievements, scholarships,
            internships and opportunities designed to move you forward.
          </p>

          <a href="#news-explorer" className="news-hero-button">
            Explore updates <span aria-hidden="true">↓</span>
          </a>

          <div className="news-hero-stats">
            <div>
              <strong>{news.length}</strong>
              <span>News & updates</span>
            </div>
            <div>
              <strong>{opportunities.filter((item) => item.status === 'published' && !isDeadlinePassed(item.deadline)).length}</strong>
              <span>Open opportunities</span>
            </div>
          </div>
        </div>
      </section>

      <section className="news-container news-explorer" id="news-explorer">
        <div className="news-section-heading">
          <div>
            <span className="news-eyebrow news-eyebrow-dark">
              STAY INFORMED
            </span>
            <h2>Explore the latest</h2>
            <p>
              Find the updates that matter to your student journey.
            </p>
          </div>
        </div>

        <div className="news-explorer-controls">
          <div className="news-tabs" role="tablist" aria-label="Content type">
            {[
              { value: 'all', label: 'All updates' },
              { value: 'news', label: 'News & announcements' },
              { value: 'opportunities', label: 'Opportunities' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                className={activeTab === tab.value ? 'active' : ''}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="news-filters">
            <label className="news-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search news or opportunities..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search news and opportunities"
              />
            </label>

            {(activeTab === 'all' || activeTab === 'news') && (
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filter news by category"
              >
                {NEWS_CATEGORIES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            )}

            {(activeTab === 'all' || activeTab === 'opportunities') && (
              <select
                value={opportunityType}
                onChange={(event) => setOpportunityType(event.target.value)}
                aria-label="Filter opportunities by type"
              >
                {OPPORTUNITY_TYPES.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {loading && (
          <div className="news-state">
            <div className="news-loader" />
            <p>Loading the latest TTSA updates...</p>
          </div>
        )}

        {!loading && error && (
          <div className="news-state news-state-error">
            <h3>Unable to load updates</h3>
            <p>{error}</p>
            <button
              type="button"
              className="news-primary-button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {(activeTab === 'all' || activeTab === 'news') && (
              <>
                {activeTab === 'all' && featuredNews && (
                  <section className="news-featured">
                    <div className="news-featured-image">
                      {featuredNews.cover_image_url ? (
                        <img
                          src={featuredNews.cover_image_url}
                          alt={featuredNews.title}
                        />
                      ) : (
                        <div className="news-featured-placeholder">TTSA</div>
                      )}
                    </div>

                    <div className="news-featured-content">
                      <span className="news-featured-label">
                        FEATURED UPDATE
                      </span>
                      <span className="news-category">
                        {featuredNews.category || 'Announcement'}
                      </span>
                      <h2>{featuredNews.title}</h2>
                      <p>
                        {featuredNews.excerpt || featuredNews.content.slice(0, 220)}
                      </p>
                      <span className="news-featured-date">
                        {formatDate(featuredNews.published_at)}
                      </span>
                      <button
                        type="button"
                        className="news-primary-button"
                        onClick={() => openNews(featuredNews)}
                      >
                        Read story <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </section>
                )}

                <section className="news-content-section">
                  <div className="news-subheading">
                    <h2>News & announcements</h2>
                    <span>{filteredNews.length} {filteredNews.length === 1 ? 'story' : 'stories'}</span>
                  </div>

                  {filteredNews.length ? (
                    <div className="news-card-grid">
                      {filteredNews.map((item) => (
                        <NewsCard
                          key={item.id}
                          item={item}
                          onRead={openNews}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="news-empty">
                      <h3>No news found</h3>
                      <p>Try a different search term or category.</p>
                    </div>
                  )}
                </section>
              </>
            )}

            {(activeTab === 'all' || activeTab === 'opportunities') && (
              <section className="news-content-section opportunities-section">
                <div className="news-subheading">
                  <div>
                    <span className="news-eyebrow news-eyebrow-dark">
                      YOUR NEXT STEP
                    </span>
                    <h2>Opportunities for students</h2>
                  </div>
                  <span>
                    {filteredOpportunities.length}{' '}
                    {filteredOpportunities.length === 1 ? 'listing' : 'listings'}
                  </span>
                </div>

                {activeTab === 'all' && featuredOpportunity && (
                  <div className="opportunity-featured-banner">
                    <div>
                      <span className="news-featured-label">
                        FEATURED OPPORTUNITY
                      </span>
                      <h3>{featuredOpportunity.title}</h3>
                      <p>{featuredOpportunity.organization}</p>
                    </div>
                    <button
                      type="button"
                      className="news-primary-button"
                      onClick={() => openOpportunity(featuredOpportunity)}
                    >
                      View details <span aria-hidden="true">→</span>
                    </button>
                  </div>
                )}

                {filteredOpportunities.length ? (
                  <div className="opportunity-card-grid">
                    {filteredOpportunities.map((item) => (
                      <OpportunityCard
                        key={item.id}
                        item={item}
                        onRead={openOpportunity}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="news-empty">
                    <h3>No opportunities found</h3>
                    <p>
                      Check back soon for scholarships, internships,
                      training and other student opportunities.
                    </p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>

      <section className="news-cta">
        <div className="news-container news-cta-content">
          <div>
            <span className="news-eyebrow">BE PART OF THE MOVEMENT</span>
            <h2>Your student journey matters.</h2>
            <p>
              Connect with TTSA, stay informed and take advantage of
              opportunities created to support students across the county.
            </p>
          </div>

          <Link to="/register" className="news-cta-button">
            Join TTSA <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <DetailModal
        item={selectedItem}
        kind={selectedKind}
        onClose={closeDetails}
      />
    </div>
  )
}