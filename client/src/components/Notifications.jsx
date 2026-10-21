
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Notifications.css'

const CATEGORIES = [
  'All',
  'General',
  'Events',
  'Scholarships',
  'Bursaries',
  'Opportunities',
  'Urgent',
]

export default function Notifications() {
  const [announcements, setAnnouncements] = useState([])
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('ttsa_announcements')
      .select(
        'id, title, content, category, published_at, created_at'
      )
      .eq('is_published', true)
      .order('published_at', {
        ascending: false,
        nullsFirst: false,
      })
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Failed to load TTSA announcements:', fetchError)
      setError('We could not load announcements. Please try again.')
      setAnnouncements([])
    } else {
      setAnnouncements(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  const filteredAnnouncements =
    category === 'All'
      ? announcements
      : announcements.filter(
          (announcement) => announcement.category === category
        )

  function formatDate(date) {
    if (!date) return 'Date unavailable'

    return new Date(date).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function getDate(announcement) {
    return announcement.published_at || announcement.created_at
  }

  function getCategoryClass(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }

  return (
    <div className="ttsa-notifications">
      <div className="notifications-heading">
        <div>
          <p className="dashboard-eyebrow">STUDENT COMMUNICATIONS</p>
          <h1>Notifications & Announcements</h1>
          <p className="dashboard-subtitle">
            Stay informed about TTSA news, events, bursaries,
            scholarships and student opportunities.
          </p>
        </div>

        <button
          type="button"
          className="notifications-refresh"
          onClick={loadAnnouncements}
          disabled={loading}
        >
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      <div className="notifications-summary">
        <div className="notifications-summary-icon">♧</div>
        <div>
          <span>Published announcements</span>
          <strong>{announcements.length}</strong>
        </div>
      </div>

      <div className="notifications-filters">
        {CATEGORIES.map((item) => (
          <button
            type="button"
            key={item}
            className={`notifications-filter ${
              category === item ? 'active' : ''
            }`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="notifications-state">
          <div className="notifications-spinner" />
          <p>Loading the latest TTSA announcements...</p>
        </div>
      ) : error ? (
        <div className="notifications-state notifications-error">
          <h3>Unable to load announcements</h3>
          <p>{error}</p>
          <button
            type="button"
            className="notifications-action"
            onClick={loadAnnouncements}
          >
            Try again
          </button>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="notifications-state">
          <div className="notifications-empty-icon">♧</div>
          <h3>
            {category === 'All'
              ? 'No announcements yet'
              : `No ${category.toLowerCase()} announcements`}
          </h3>
          <p>
            {category === 'All'
              ? 'Official TTSA announcements will appear here when they are published.'
              : 'There are no published announcements in this category right now.'}
          </p>

          {category !== 'All' && (
            <button
              type="button"
              className="notifications-action"
              onClick={() => setCategory('All')}
            >
              View all announcements
            </button>
          )}
        </div>
      ) : (
        <div className="notifications-list">
          {filteredAnnouncements.map((announcement) => (
            <article
              className={`notification-card ${
                announcement.category === 'Urgent'
                  ? 'notification-card-urgent'
                  : ''
              }`}
              key={announcement.id}
            >
              <div className="notification-card-top">
                <span
                  className={`notification-category category-${getCategoryClass(
                    announcement.category || 'General'
                  )}`}
                >
                  {announcement.category || 'General'}
                </span>

                <time dateTime={getDate(announcement)}>
                  {formatDate(getDate(announcement))}
                </time>
              </div>

              <h2>{announcement.title}</h2>

              <p className="notification-preview">
                {announcement.content.length > 220
                  ? `${announcement.content.slice(0, 220).trim()}…`
                  : announcement.content}
              </p>

              <button
                type="button"
                className="notification-read-more"
                onClick={() => setSelectedAnnouncement(announcement)}
              >
                Read announcement <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      )}

      {selectedAnnouncement && (
        <div
          className="notification-modal-backdrop"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <section
            className="notification-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="notification-modal-header">
              <span
                className={`notification-category category-${getCategoryClass(
                  selectedAnnouncement.category || 'General'
                )}`}
              >
                {selectedAnnouncement.category || 'General'}
              </span>

              <button
                type="button"
                className="notification-modal-close"
                onClick={() => setSelectedAnnouncement(null)}
                aria-label="Close announcement"
              >
                ×
              </button>
            </div>

            <time dateTime={getDate(selectedAnnouncement)}>
              {formatDate(getDate(selectedAnnouncement))}
            </time>

            <h2 id="notification-modal-title">
              {selectedAnnouncement.title}
            </h2>

            <div className="notification-full-content">
              {selectedAnnouncement.content}
            </div>

            <button
              type="button"
              className="notifications-action"
              onClick={() => setSelectedAnnouncement(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
