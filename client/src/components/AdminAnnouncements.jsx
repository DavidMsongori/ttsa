
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './AdminAnnouncements.css'

const CATEGORIES = [
  'General',
  'Events',
  'Scholarships',
  'Bursaries',
  'Opportunities',
  'Urgent',
]

const EMPTY_FORM = {
  title: '',
  content: '',
  category: 'General',
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [publishNow, setPublishNow] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('All')

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('ttsa_announcements')
      .select(
        'id, title, content, category, is_published, published_at, created_at, updated_at'
      )
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Could not load announcements:', fetchError)
      setError('Could not load announcements. Check your administrator permissions.')
      setAnnouncements([])
    } else {
      setAnnouncements(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setPublishNow(true)
  }

  function startEditing(announcement) {
    setForm({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category || 'General',
    })

    setEditingId(announcement.id)
    setPublishNow(announcement.is_published)
    setError('')
    setNotice('')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    const title = form.title.trim()
    const content = form.content.trim()

    if (!title || !content) {
      setError('Enter both an announcement title and its content.')
      return
    }

    setSaving(true)

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        throw new Error('Your session has expired. Please sign in again.')
      }

      const payload = {
        title,
        content,
        category: form.category,
        is_published: publishNow,
        published_at: publishNow ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      let result

      if (editingId) {
        result = await supabase
          .from('ttsa_announcements')
          .update(payload)
          .eq('id', editingId)
      } else {
        result = await supabase
          .from('ttsa_announcements')
          .insert({
            ...payload,
            created_by: authData.user.id,
          })
      }

      if (result.error) {
        throw result.error
      }

      resetForm()
      setNotice(
        publishNow
          ? 'Announcement published successfully.'
          : 'Announcement saved as a draft.'
      )

      await loadAnnouncements()
    } catch (err) {
      console.error('Announcement save failed:', err)
      setError(
        err.message ||
          'Could not save this announcement. Please check your permissions.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function togglePublished(announcement) {
    setError('')
    setNotice('')

    const nextPublished = !announcement.is_published

    const { error: updateError } = await supabase
      .from('ttsa_announcements')
      .update({
        is_published: nextPublished,
        published_at: nextPublished
          ? new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', announcement.id)

    if (updateError) {
      console.error('Publication status update failed:', updateError)
      setError('Could not update the announcement publication status.')
      return
    }

    setNotice(
      nextPublished
        ? 'Announcement published.'
        : 'Announcement moved back to drafts.'
    )

    await loadAnnouncements()
  }

  async function deleteAnnouncement(announcement) {
    const confirmed = window.confirm(
      `Delete "${announcement.title}" permanently? This action cannot be undone.`
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    const { error: deleteError } = await supabase
      .from('ttsa_announcements')
      .delete()
      .eq('id', announcement.id)

    if (deleteError) {
      console.error('Announcement deletion failed:', deleteError)
      setError('Could not delete this announcement.')
      return
    }

    if (editingId === announcement.id) {
      resetForm()
    }

    setNotice('Announcement deleted.')
    await loadAnnouncements()
  }

  const filteredAnnouncements = announcements.filter((item) => {
    if (filter === 'Published') return item.is_published
    if (filter === 'Drafts') return !item.is_published
    return true
  })

  function formatDate(date) {
    if (!date) return 'Not published'

    return new Date(date).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="admin-announcements">
      <div className="admin-announcements-heading">
        <div>
          <p className="dashboard-eyebrow">ADMINISTRATION</p>
          <h1>Announcements Manager</h1>
          <p className="dashboard-subtitle">
            Create and manage official TTSA student announcements.
          </p>
        </div>

        <button
          type="button"
          className="admin-announcements-refresh"
          onClick={loadAnnouncements}
          disabled={loading}
        >
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div className="admin-announcements-alert error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="admin-announcements-alert success" role="status">
          {notice}
        </div>
      )}

      <section className="admin-announcement-form-panel">
        <div className="admin-announcement-form-heading">
          <div>
            <h2>{editingId ? 'Edit Announcement' : 'Create Announcement'}</h2>
            <p>
              Draft your message and choose whether to publish it immediately.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="admin-announcement-cancel"
              onClick={resetForm}
            >
              Cancel editing
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="admin-announcement-form">
          <label>
            Announcement title
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. TTSA Annual Students Forum"
              maxLength={180}
              required
            />
          </label>

          <label>
            Category
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Announcement content
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write the full announcement here..."
              rows={7}
              required
            />
          </label>

          <label className="admin-announcement-publish-option">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(event) => setPublishNow(event.target.checked)}
            />
            <span>
              <strong>Publish announcement</strong>
              <small>
                {publishNow
                  ? 'Students can see this announcement.'
                  : 'Save as a draft that students cannot see.'}
              </small>
            </span>
          </label>

          <div className="admin-announcement-form-actions">
            <button
              type="submit"
              className="admin-announcement-primary"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Save Changes'
                  : publishNow
                    ? 'Publish Announcement'
                    : 'Save Draft'}
            </button>

            <button
              type="button"
              className="admin-announcement-secondary"
              onClick={resetForm}
              disabled={saving}
            >
              Clear Form
            </button>
          </div>
        </form>
      </section>

      <section className="admin-announcement-list-panel">
        <div className="admin-announcement-list-heading">
          <div>
            <h2>Manage Announcements</h2>
            <p>{announcements.length} total announcement(s)</p>
          </div>

          <div className="admin-announcement-filters">
            {['All', 'Published', 'Drafts'].map((item) => (
              <button
                type="button"
                key={item}
                className={filter === item ? 'active' : ''}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="admin-announcement-empty">Loading announcements...</p>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="admin-announcement-empty">
            <h3>No announcements found</h3>
            <p>Create your first announcement using the form above.</p>
          </div>
        ) : (
          <div className="admin-announcement-list">
            {filteredAnnouncements.map((announcement) => (
              <article
                className="admin-announcement-item"
                key={announcement.id}
              >
                <div className="admin-announcement-item-top">
                  <span className="admin-announcement-category">
                    {announcement.category}
                  </span>

                  <span
                    className={`admin-announcement-status ${
                      announcement.is_published ? 'published' : 'draft'
                    }`}
                  >
                    {announcement.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>

                <h3>{announcement.title}</h3>

                <p className="admin-announcement-preview">
                  {announcement.content.length > 220
                    ? `${announcement.content.slice(0, 220).trim()}…`
                    : announcement.content}
                </p>

                <div className="admin-announcement-item-footer">
                  <span>
                    {announcement.is_published
                      ? `Published ${formatDate(announcement.published_at)}`
                      : `Created ${formatDate(announcement.created_at)}`}
                  </span>

                  <div className="admin-announcement-item-actions">
                    <button
                      type="button"
                      onClick={() => startEditing(announcement)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePublished(announcement)}
                    >
                      {announcement.is_published ? 'Unpublish' : 'Publish'}
                    </button>

                    <button
                      type="button"
                      className="delete"
                      onClick={() => deleteAnnouncement(announcement)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
