
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './NewsOpportunities.css'

const NEWS_CATEGORIES = [
  'Announcement',
  'Events',
  'Education',
  'Student Affairs',
  'Achievements',
  'Other',
]

const OPPORTUNITY_TYPES = [
  'Scholarship',
  'Internship',
  'Job',
  'Fellowship',
  'Training',
  'Grant',
  'Competition',
  'Other',
]

const EMPTY_NEWS = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'Announcement',
  cover_image_url: '',
  status: 'draft',
  featured: false,
}

const EMPTY_OPPORTUNITY = {
  title: '',
  slug: '',
  organization: '',
  description: '',
  opportunity_type: 'Other',
  category: '',
  location: '',
  eligibility: '',
  how_to_apply: '',
  application_url: '',
  application_email: '',
  cover_image_url: '',
  deadline: '',
  start_date: '',
  status: 'draft',
  featured: false,
}

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDate(value) {
  if (!value) return 'Not set'

  return new Date(value).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function NewsOpportunities() {
  const [section, setSection] = useState('news')
  const [news, setNews] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [newsForm, setNewsForm] = useState(EMPTY_NEWS)
  const [opportunityForm, setOpportunityForm] =
    useState(EMPTY_OPPORTUNITY)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const isNews = section === 'news'
  const records = isNews ? news : opportunities
  const form = isNews ? newsForm : opportunityForm

  const setForm = isNews ? setNewsForm : setOpportunityForm

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [newsResult, opportunitiesResult] = await Promise.all([
        supabase
          .from('ttsa_news')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('ttsa_opportunities')
          .select('*')
          .order('created_at', { ascending: false }),
      ])

      if (newsResult.error) throw newsResult.error
      if (opportunitiesResult.error) throw opportunitiesResult.error

      setNews(newsResult.data || [])
      setOpportunities(opportunitiesResult.data || [])
    } catch (err) {
      setError(err.message || 'Could not load content.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  function switchSection(nextSection) {
    setSection(nextSection)
    setEditingId(null)
    setNewsForm(EMPTY_NEWS)
    setOpportunityForm(EMPTY_OPPORTUNITY)
    setError('')
    setNotice('')
  }

  function updateField(name, value) {
    setForm((previous) => {
      const updated = { ...previous, [name]: value }

      if (name === 'title' && !editingId) {
        updated.slug = makeSlug(value)
      }

      return updated
    })
  }

  function editRecord(record) {
    setEditingId(record.id)
    setError('')
    setNotice('')

    if (isNews) {
      setNewsForm({
        ...EMPTY_NEWS,
        ...record,
      })
    } else {
      setOpportunityForm({
        ...EMPTY_OPPORTUNITY,
        ...record,
        deadline: record.deadline || '',
        start_date: record.start_date || '',
      })
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setEditingId(null)
    setNewsForm(EMPTY_NEWS)
    setOpportunityForm(EMPTY_OPPORTUNITY)
    setError('')
    setNotice('')
  }

  async function uploadCoverImage(file) {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must not exceed 10 MB.')
      return
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      setError('Cloudinary environment variables are not configured.')
      return
    }

    setUploading(true)
    setError('')
    setNotice('')

    try {
      const data = new FormData()
      data.append('file', file)
      data.append('upload_preset', uploadPreset)
      data.append('folder', 'ttsa/news-opportunities')

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: data,
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Image upload failed.')
      }

      updateField('cover_image_url', result.secure_url)
      setNotice('Cover image uploaded successfully.')
    } catch (err) {
      setError(err.message || 'Could not upload image.')
    } finally {
      setUploading(false)
    }
  }

  async function saveRecord(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const title = form.title.trim()
      const slug = makeSlug(form.slug || title)

      if (!title || !slug) {
        throw new Error('Enter a title before saving.')
      }

      if (isNews && !form.content.trim()) {
        throw new Error('Enter the news article content.')
      }

      if (!isNews && !form.description.trim()) {
        throw new Error('Enter the opportunity description.')
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('Please sign in again.')

      const common = {
        title,
        slug,
        status: form.status,
        featured: Boolean(form.featured),
        cover_image_url: form.cover_image_url || null,
        updated_at: new Date().toISOString(),
      }

      let payload

      if (isNews) {
        payload = {
          ...common,
          excerpt: form.excerpt.trim() || null,
          content: form.content.trim(),
          category: form.category,
        }
      } else {
        if (
          form.application_url &&
          !/^https?:\/\//i.test(form.application_url.trim())
        ) {
          throw new Error(
            'Application URL must start with https:// or http://.'
          )
        }

        payload = {
          ...common,
          organization: form.organization.trim() || null,
          description: form.description.trim(),
          opportunity_type: form.opportunity_type,
          category: form.category.trim() || null,
          location: form.location.trim() || null,
          eligibility: form.eligibility.trim() || null,
          how_to_apply: form.how_to_apply.trim() || null,
          application_url: form.application_url.trim() || null,
          application_email: form.application_email.trim() || null,
          deadline: form.deadline || null,
          start_date: form.start_date || null,
        }
      }

      if (!editingId) {
        payload.created_by = user.id
      }

      if (form.status === 'published' && !editingId) {
        payload.published_at = new Date().toISOString()
      } else if (form.status === 'published') {
        const existing = records.find((item) => item.id === editingId)

        payload.published_at =
          existing?.published_at || new Date().toISOString()
      } else {
        payload.published_at = null
      }

      const table = isNews ? 'ttsa_news' : 'ttsa_opportunities'

      let query = supabase.from(table)

      if (editingId) {
        query = query.update(payload).eq('id', editingId)
      } else {
        query = query.insert(payload)
      }

      const { error: saveError } = await query

      if (saveError) throw saveError

      setNotice(
        `${isNews ? 'News article' : 'Opportunity'} ${
          editingId ? 'updated' : 'created'
        } successfully.`
      )

      resetForm()
      await loadRecords()
    } catch (err) {
      setError(err.message || 'Could not save content.')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(record, nextStatus) {
    const table = isNews ? 'ttsa_news' : 'ttsa_opportunities'

    setError('')
    setNotice('')

    try {
      const payload = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
      }

      if (nextStatus === 'published') {
        payload.published_at =
          record.published_at || new Date().toISOString()
      } else {
        payload.published_at = null
      }

      const { error: updateError } = await supabase
        .from(table)
        .update(payload)
        .eq('id', record.id)

      if (updateError) throw updateError

      setNotice(`Content status changed to ${nextStatus}.`)
      await loadRecords()
    } catch (err) {
      setError(err.message || 'Could not update status.')
    }
  }

  async function deleteRecord(record) {
    const confirmed = window.confirm(
      `Permanently delete "${record.title}"? This cannot be undone.`
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      const table = isNews ? 'ttsa_news' : 'ttsa_opportunities'

      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', record.id)

      if (deleteError) throw deleteError

      if (editingId === record.id) resetForm()

      setNotice('Content deleted successfully.')
      await loadRecords()
    } catch (err) {
      setError(err.message || 'Could not delete content.')
    }
  }

  const titleField = (
    <label className="ttsa-content-field">
      <span>Title *</span>
      <input
        required
        value={form.title}
        onChange={(event) => updateField('title', event.target.value)}
        placeholder={
          isNews ? 'Enter news headline' : 'Enter opportunity title'
        }
      />
    </label>
  )

  const slugField = (
    <label className="ttsa-content-field">
      <span>URL slug *</span>
      <input
        required
        value={form.slug}
        onChange={(event) => updateField('slug', makeSlug(event.target.value))}
        placeholder="example-article-title"
      />
      <small>Used in the public page URL. Must be unique.</small>
    </label>
  )

  const imageField = (
    <div className="ttsa-content-field">
      <span>Cover image</span>

      {form.cover_image_url && (
        <img
          className="ttsa-content-image-preview"
          src={form.cover_image_url}
          alt="Cover preview"
        />
      )}

      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) uploadCoverImage(file)
          event.target.value = ''
        }}
      />

      {uploading && <small>Uploading image...</small>}

      {form.cover_image_url && (
        <button
          type="button"
          className="ttsa-content-text-button"
          onClick={() => updateField('cover_image_url', '')}
        >
          Remove cover image
        </button>
      )}
    </div>
  )

  return (
    <section className="ttsa-content-admin">
      <header className="ttsa-content-admin-header">
        <div>
          <span className="ttsa-content-eyebrow">
            CONTENT MANAGEMENT
          </span>
          <h1>News &amp; Opportunities</h1>
          <p>
            Publish news, announcements and opportunities for TTSA
            members.
          </p>
        </div>
      </header>

      <div className="ttsa-content-tabs">
        <button
          type="button"
          className={isNews ? 'active' : ''}
          onClick={() => switchSection('news')}
        >
          News ({news.length})
        </button>

        <button
          type="button"
          className={!isNews ? 'active' : ''}
          onClick={() => switchSection('opportunities')}
        >
          Opportunities ({opportunities.length})
        </button>
      </div>

      {error && (
        <div className="ttsa-content-alert error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="ttsa-content-alert success" role="status">
          {notice}
        </div>
      )}

      <div className="ttsa-content-admin-layout">
        <form className="ttsa-content-form" onSubmit={saveRecord}>
          <div className="ttsa-content-form-heading">
            <div>
              <h2>{editingId ? 'Edit content' : isNews ? 'Create news article' : 'Add opportunity'}</h2>
              <p>Fields marked * are required.</p>
            </div>

            {editingId && (
              <button
                type="button"
                className="ttsa-content-text-button"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </div>

          {titleField}
          {slugField}
          {imageField}

          {isNews ? (
            <>
              <label className="ttsa-content-field">
                <span>Category</span>
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField('category', event.target.value)
                  }
                >
                  {NEWS_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ttsa-content-field">
                <span>Short summary</span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.excerpt || ''}
                  onChange={(event) =>
                    updateField('excerpt', event.target.value)
                  }
                  placeholder="A short introduction for the news listing"
                />
              </label>

              <label className="ttsa-content-field">
                <span>Article content *</span>
                <textarea
                  required
                  rows={10}
                  value={form.content}
                  onChange={(event) =>
                    updateField('content', event.target.value)
                  }
                  placeholder="Write the full news article here..."
                />
              </label>
            </>
          ) : (
            <>
              <label className="ttsa-content-field">
                <span>Organization / provider</span>
                <input
                  value={form.organization || ''}
                  onChange={(event) =>
                    updateField('organization', event.target.value)
                  }
                  placeholder="Organization offering the opportunity"
                />
              </label>

              <label className="ttsa-content-field">
                <span>Opportunity type *</span>
                <select
                  required
                  value={form.opportunity_type}
                  onChange={(event) =>
                    updateField('opportunity_type', event.target.value)
                  }
                >
                  {OPPORTUNITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ttsa-content-field">
                <span>Short category / tags</span>
                <input
                  value={form.category || ''}
                  onChange={(event) =>
                    updateField('category', event.target.value)
                  }
                  placeholder="e.g. Undergraduate, County-wide"
                />
              </label>

              <label className="ttsa-content-field">
                <span>Description *</span>
                <textarea
                  required
                  rows={6}
                  value={form.description}
                  onChange={(event) =>
                    updateField('description', event.target.value)
                  }
                  placeholder="Describe the opportunity..."
                />
              </label>

              <label className="ttsa-content-field">
                <span>Eligibility requirements</span>
                <textarea
                  rows={4}
                  value={form.eligibility || ''}
                  onChange={(event) =>
                    updateField('eligibility', event.target.value)
                  }
                  placeholder="Who can apply?"
                />
              </label>

              <label className="ttsa-content-field">
                <span>How to apply</span>
                <textarea
                  rows={4}
                  value={form.how_to_apply || ''}
                  onChange={(event) =>
                    updateField('how_to_apply', event.target.value)
                  }
                  placeholder="Application instructions"
                />
              </label>

              <label className="ttsa-content-field">
                <span>Application URL</span>
                <input
                  type="url"
                  value={form.application_url || ''}
                  onChange={(event) =>
                    updateField('application_url', event.target.value)
                  }
                  placeholder="https://example.com/apply"
                />
              </label>

              <label className="ttsa-content-field">
                <span>Application email</span>
                <input
                  type="email"
                  value={form.application_email || ''}
                  onChange={(event) =>
                    updateField('application_email', event.target.value)
                  }
                  placeholder="applications@example.com"
                />
              </label>

              <label className="ttsa-content-field">
                <span>Location</span>
                <input
                  value={form.location || ''}
                  onChange={(event) =>
                    updateField('location', event.target.value)
                  }
                  placeholder="Remote, Kenya, or specific location"
                />
              </label>

              <div className="ttsa-content-two-columns">
                <label className="ttsa-content-field">
                  <span>Application deadline</span>
                  <input
                    type="date"
                    value={form.deadline || ''}
                    onChange={(event) =>
                      updateField('deadline', event.target.value)
                    }
                  />
                </label>

                <label className="ttsa-content-field">
                  <span>Start date</span>
                  <input
                    type="date"
                    value={form.start_date || ''}
                    onChange={(event) =>
                      updateField('start_date', event.target.value)
                    }
                  />
                </label>
              </div>
            </>
          )}

          <label className="ttsa-content-field">
            <span>Publication status</span>
            <select
              value={form.status}
              onChange={(event) =>
                updateField('status', event.target.value)
              }
            >
              {(isNews
                ? ['draft', 'published', 'archived']
                : ['draft', 'published', 'closed', 'archived']
              ).map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="ttsa-content-checkbox">
            <input
              type="checkbox"
              checked={Boolean(form.featured)}
              onChange={(event) =>
                updateField('featured', event.target.checked)
              }
            />
            <span>Feature this content on the website</span>
          </label>

          <button
            className="ttsa-content-primary-button"
            type="submit"
            disabled={saving || uploading}
          >
            {saving
              ? 'Saving...'
              : editingId
                ? 'Save changes'
                : isNews
                  ? 'Create news article'
                  : 'Create opportunity'}
          </button>
        </form>

        <div className="ttsa-content-list-panel">
          <div className="ttsa-content-list-heading">
            <div>
              <h2>{isNews ? 'News articles' : 'Opportunities'}</h2>
              <p>{records.length} total records</p>
            </div>

            <button
              type="button"
              className="ttsa-content-refresh-button"
              onClick={loadRecords}
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="ttsa-content-muted">Loading content...</p>
          ) : records.length === 0 ? (
            <div className="ttsa-content-empty">
              <h3>No content yet</h3>
              <p>Create your first {isNews ? 'news article' : 'opportunity'} using the form.</p>
            </div>
          ) : (
            <div className="ttsa-content-records">
              {records.map((record) => (
                <article
                  className="ttsa-content-record"
                  key={record.id}
                >
                  {record.cover_image_url && (
                    <img
                      src={record.cover_image_url}
                      alt=""
                      className="ttsa-content-record-image"
                    />
                  )}

                  <div className="ttsa-content-record-body">
                    <div className="ttsa-content-record-top">
                      <span
                        className={`ttsa-content-status status-${record.status}`}
                      >
                        {record.status}
                      </span>

                      {record.featured && (
                        <span className="ttsa-content-featured">
                          Featured
                        </span>
                      )}
                    </div>

                    <h3>{record.title}</h3>

                    <p className="ttsa-content-record-meta">
                      {isNews
                        ? record.category
                        : record.opportunity_type}
                      {' · '}
                      {formatDate(record.created_at)}
                    </p>

                    {!isNews && (
                      <p className="ttsa-content-record-meta">
                        Deadline: {formatDate(record.deadline)}
                      </p>
                    )}

                    <div className="ttsa-content-record-actions">
                      <button
                        type="button"
                        onClick={() => editRecord(record)}
                      >
                        Edit
                      </button>

                      {record.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => changeStatus(record, 'published')}
                        >
                          Publish
                        </button>
                      )}

                      {record.status === 'published' && (
                        <button
                          type="button"
                          onClick={() =>
                            changeStatus(
                              record,
                              isNews ? 'draft' : 'closed'
                            )
                          }
                        >
                          {isNews ? 'Unpublish' : 'Close'}
                        </button>
                      )}

                      <button
                        type="button"
                        className="delete"
                        onClick={() => deleteRecord(record)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
