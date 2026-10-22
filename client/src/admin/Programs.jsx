
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Programs.css'

const initialForm = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  category: 'Leadership & Governance',
  program_status: 'upcoming',
  objectives: '',
  activities: '',
  expected_outcomes: '',
  impact_summary: '',
  cover_image_url: '',
  featured: false,
  display_order: 0,
  location: '',
  start_date: '',
  end_date: '',
  registration_url: '',
  contact_email: '',
  status: 'draft',
}

const categories = [
  'Leadership & Governance',
  'Education & Student Welfare',
  'Careers & Opportunities',
  'Innovation & Entrepreneurship',
  'Community Engagement',
  'Partnerships & Advocacy',
  'Other',
]

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDate(value) {
  if (!value) return 'Not set'

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function Programs() {
  const [programs, setPrograms] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    loadPrograms()
  }, [])

  async function loadPrograms() {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('ttsa_programs')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setPrograms([])
    } else {
      setPrograms(data || [])
    }

    setLoading(false)
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'title' && !editingId
        ? { slug: makeSlug(value) }
        : {}),
    }))
  }

  function openCreateForm() {
    setEditingId(null)
    setForm(initialForm)
    setMessage('')
    setError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openEditForm(program) {
    setEditingId(program.id)
    setForm({
      ...initialForm,
      ...program,
      start_date: program.start_date || '',
      end_date: program.end_date || '',
      display_order: program.display_order ?? 0,
    })
    setMessage('')
    setError('')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(initialForm)
    setError('')
  }

  async function uploadCoverImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('The image must be 5 MB or smaller.')
      return
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      setError(
        'Cloudinary is not configured. Check your client .env variables.'
      )
      return
    }

    setUploading(true)
    setError('')
    setMessage('')

    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('upload_preset', uploadPreset)
      uploadData.append('folder', 'ttsa/programs')

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: uploadData,
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Image upload failed.')
      }

      setForm((current) => ({
        ...current,
        cover_image_url: result.secure_url,
      }))

      setMessage('Cover image uploaded successfully.')
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload image.')
    } finally {
      setUploading(false)
    }
  }

  async function saveProgram(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    const title = form.title.trim()
    const slug = makeSlug(form.slug || title)

    if (!title || !slug || !form.description.trim()) {
      setError('Please provide a title, slug and description.')
      setSaving(false)
      return
    }

    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      setError('The end date cannot be earlier than the start date.')
      setSaving(false)
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setError(userError.message)
      setSaving(false)
      return
    }

    const payload = {
      title,
      slug,
      summary: form.summary.trim() || null,
      description: form.description.trim(),
      category: form.category,
      program_status: form.program_status,
      objectives: form.objectives.trim() || null,
      activities: form.activities.trim() || null,
      expected_outcomes: form.expected_outcomes.trim() || null,
      impact_summary: form.impact_summary.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      featured: form.featured,
      display_order: Number(form.display_order) || 0,
      location: form.location.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      registration_url: form.registration_url.trim() || null,
      contact_email: form.contact_email.trim() || null,
      status: form.status,
      published_at:
        form.status === 'published'
          ? new Date().toISOString()
          : null,
      created_by: user?.id || null,
    }

    let result

    if (editingId) {
      const { created_by, ...updatePayload } = payload

      result = await supabase
        .from('ttsa_programs')
        .update(updatePayload)
        .eq('id', editingId)
    } else {
      result = await supabase
        .from('ttsa_programs')
        .insert(payload)
    }

    if (result.error) {
      setError(
        result.error.code === '23505'
          ? 'This slug is already in use. Change the slug and try again.'
          : result.error.message
      )
      setSaving(false)
      return
    }

    setMessage(editingId ? 'Program updated successfully.' : 'Program created successfully.')
    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setForm(initialForm)

    await loadPrograms()
  }

  async function changeStatus(program, nextStatus) {
    const actionText = {
      draft: 'unpublish',
      published: 'publish',
      archived: 'archive',
    }[nextStatus]

    if (
      !window.confirm(
        `Are you sure you want to ${actionText} "${program.title}"?`
      )
    ) {
      return
    }

    setError('')
    setMessage('')

    const { error: updateError } = await supabase
      .from('ttsa_programs')
      .update({
        status: nextStatus,
        published_at:
          nextStatus === 'published'
            ? program.published_at || new Date().toISOString()
            : null,
      })
      .eq('id', program.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage(`Program ${actionText}ed successfully.`)
    await loadPrograms()
  }

  async function toggleFeatured(program) {
    setError('')
    setMessage('')

    const { error: updateError } = await supabase
      .from('ttsa_programs')
      .update({ featured: !program.featured })
      .eq('id', program.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage(
      program.featured
        ? 'Program removed from featured items.'
        : 'Program marked as featured.'
    )

    await loadPrograms()
  }

  async function deleteProgram(program) {
    if (
      !window.confirm(
        `Permanently delete "${program.title}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setError('')
    setMessage('')

    const { error: deleteError } = await supabase
      .from('ttsa_programs')
      .delete()
      .eq('id', program.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setMessage('Program deleted successfully.')
    await loadPrograms()
  }

  const filteredPrograms = programs.filter((program) => {
    const searchText = [
      program.title,
      program.summary,
      program.description,
      program.category,
      program.location,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch = searchText.includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' || program.status === statusFilter
    const matchesCategory =
      categoryFilter === 'all' || program.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const publishedCount = programs.filter(
    (program) => program.status === 'published'
  ).length

  const draftCount = programs.filter(
    (program) => program.status === 'draft'
  ).length

  const archivedCount = programs.filter(
    (program) => program.status === 'archived'
  ).length

  return (
    <div className="admin-programs">
      <header className="programs-admin-header">
        <div>
          <span className="programs-admin-eyebrow">CONTENT MANAGEMENT</span>
          <h1>Programs & Initiatives</h1>
          <p>
            Create, manage and publish TTSA programs and initiatives.
          </p>
        </div>

        <button
          type="button"
          className="programs-primary-btn"
          onClick={openCreateForm}
        >
          <span>＋</span> Add Program
        </button>
      </header>

      {message && (
        <div className="programs-alert programs-alert-success" role="status">
          {message}
          <button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="programs-alert programs-alert-error" role="alert">
          {error}
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      <section className="programs-admin-stats">
        <article className="programs-stat-card">
          <span className="programs-stat-icon">▤</span>
          <div>
            <span>Total programs</span>
            <strong>{programs.length}</strong>
          </div>
        </article>

        <article className="programs-stat-card">
          <span className="programs-stat-icon published">✓</span>
          <div>
            <span>Published</span>
            <strong>{publishedCount}</strong>
          </div>
        </article>

        <article className="programs-stat-card">
          <span className="programs-stat-icon draft">◷</span>
          <div>
            <span>Drafts</span>
            <strong>{draftCount}</strong>
          </div>
        </article>

        <article className="programs-stat-card">
          <span className="programs-stat-icon archived">▣</span>
          <div>
            <span>Archived</span>
            <strong>{archivedCount}</strong>
          </div>
        </article>
      </section>

      {showForm && (
        <section className="programs-form-panel" id="program-editor">
          <div className="programs-form-heading">
            <div>
              <span className="programs-admin-eyebrow">
                {editingId ? 'UPDATE CONTENT' : 'NEW CONTENT'}
              </span>
              <h2>{editingId ? 'Edit Program' : 'Create a Program'}</h2>
              <p>Fields marked * are required.</p>
            </div>

            <button
              type="button"
              className="programs-close-btn"
              onClick={closeForm}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <form onSubmit={saveProgram}>
            <div className="programs-form-section">
              <h3>Basic information</h3>

              <div className="programs-form-grid">
                <label className="programs-field programs-field-full">
                  Program title *
                  <input
                    name="title"
                    value={form.title}
                    onChange={updateField}
                    placeholder="e.g. Student Leadership Academy"
                    required
                  />
                </label>

                <label className="programs-field">
                  URL slug *
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={updateField}
                    placeholder="student-leadership-academy"
                    required
                  />
                  <small>Used in the program's public web address.</small>
                </label>

                <label className="programs-field">
                  Category *
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    required
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="programs-field programs-field-full">
                  Short summary
                  <textarea
                    name="summary"
                    value={form.summary || ''}
                    onChange={updateField}
                    rows="2"
                    placeholder="A short introduction for program cards..."
                  />
                </label>

                <label className="programs-field programs-field-full">
                  Full description *
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    rows="5"
                    placeholder="Explain the program, who it serves and what it aims to achieve..."
                    required
                  />
                </label>
              </div>
            </div>

            <div className="programs-form-section">
              <h3>Objectives and activities</h3>

              <div className="programs-form-grid">
                <label className="programs-field">
                  Objectives
                  <textarea
                    name="objectives"
                    value={form.objectives || ''}
                    onChange={updateField}
                    rows="4"
                    placeholder="Describe the main objectives..."
                  />
                </label>

                <label className="programs-field">
                  Activities
                  <textarea
                    name="activities"
                    value={form.activities || ''}
                    onChange={updateField}
                    rows="4"
                    placeholder="Describe planned or completed activities..."
                  />
                </label>

                <label className="programs-field">
                  Expected outcomes
                  <textarea
                    name="expected_outcomes"
                    value={form.expected_outcomes || ''}
                    onChange={updateField}
                    rows="4"
                    placeholder="What outcomes do you expect?"
                  />
                </label>

                <label className="programs-field">
                  Impact summary
                  <textarea
                    name="impact_summary"
                    value={form.impact_summary || ''}
                    onChange={updateField}
                    rows="4"
                    placeholder="Record verified results and impact..."
                  />
                </label>
              </div>
            </div>

            <div className="programs-form-section">
              <h3>Cover image</h3>

              <div className="programs-upload-layout">
                <div className="programs-image-preview">
                  {form.cover_image_url ? (
                    <img src={form.cover_image_url} alt="Program cover preview" />
                  ) : (
                    <div>
                      <span>▧</span>
                      <p>Image preview</p>
                    </div>
                  )}
                </div>

                <div className="programs-upload-controls">
                  <label className="programs-upload-btn">
                    {uploading ? 'Uploading image...' : 'Choose and upload image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadCoverImage}
                      disabled={uploading}
                    />
                  </label>
                  <p>Images only. Maximum file size: 5 MB.</p>

                  {form.cover_image_url && (
                    <button
                      type="button"
                      className="programs-text-btn"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          cover_image_url: '',
                        }))
                      }
                    >
                      Remove image
                    </button>
                  )}

                  <label className="programs-field">
                    Or enter an image URL
                    <input
                      name="cover_image_url"
                      type="url"
                      value={form.cover_image_url || ''}
                      onChange={updateField}
                      placeholder="https://..."
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="programs-form-section">
              <h3>Schedule and participation</h3>

              <div className="programs-form-grid">
                <label className="programs-field">
                  Program lifecycle
                  <select
                    name="program_status"
                    value={form.program_status}
                    onChange={updateField}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>

                <label className="programs-field">
                  Location
                  <input
                    name="location"
                    value={form.location || ''}
                    onChange={updateField}
                    placeholder="e.g. Taita Taveta County"
                  />
                </label>

                <label className="programs-field">
                  Start date
                  <input
                    name="start_date"
                    type="date"
                    value={form.start_date || ''}
                    onChange={updateField}
                  />
                </label>

                <label className="programs-field">
                  End date
                  <input
                    name="end_date"
                    type="date"
                    value={form.end_date || ''}
                    onChange={updateField}
                    min={form.start_date || undefined}
                  />
                </label>

                <label className="programs-field">
                  Registration link
                  <input
                    name="registration_url"
                    type="url"
                    value={form.registration_url || ''}
                    onChange={updateField}
                    placeholder="https://..."
                  />
                </label>

                <label className="programs-field">
                  Contact email
                  <input
                    name="contact_email"
                    type="email"
                    value={form.contact_email || ''}
                    onChange={updateField}
                    placeholder="programs@example.org"
                  />
                </label>
              </div>
            </div>

            <div className="programs-form-section">
              <h3>Publishing and display</h3>

              <div className="programs-form-grid">
                <label className="programs-field">
                  Publication status
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>

                <label className="programs-field">
                  Display order
                  <input
                    name="display_order"
                    type="number"
                    min="0"
                    step="1"
                    value={form.display_order}
                    onChange={updateField}
                  />
                  <small>Lower numbers appear first.</small>
                </label>

                <label className="programs-checkbox-field programs-field-full">
                  <input
                    name="featured"
                    type="checkbox"
                    checked={Boolean(form.featured)}
                    onChange={updateField}
                  />
                  <span>
                    <strong>Feature this program</strong>
                    <small>Highlight it on the public Programs page.</small>
                  </span>
                </label>
              </div>
            </div>

            <div className="programs-form-actions">
              <button
                type="button"
                className="programs-secondary-btn"
                onClick={closeForm}
                disabled={saving || uploading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="programs-primary-btn"
                disabled={saving || uploading}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Create Program'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="programs-list-panel">
        <div className="programs-list-heading">
          <div>
            <h2>All Programs</h2>
            <p>Manage the programs available in your TTSA database.</p>
          </div>
          <span className="programs-record-count">
            {filteredPrograms.length} records
          </span>
        </div>

        <div className="programs-filters">
          <div className="programs-search">
            <span>⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search programs..."
              aria-label="Search programs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by publication status"
          >
            <option value="all">All publication statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="programs-empty-state">
            <span className="programs-loading-spinner" />
            <p>Loading programs...</p>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="programs-empty-state">
            <span>▤</span>
            <h3>No programs found</h3>
            <p>
              {programs.length === 0
                ? 'Create your first program to get started.'
                : 'Try changing your search or filters.'}
            </p>
            {programs.length === 0 && (
              <button
                type="button"
                className="programs-primary-btn"
                onClick={openCreateForm}
              >
                Add First Program
              </button>
            )}
          </div>
        ) : (
          <div className="programs-table-wrap">
            <table className="programs-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Category</th>
                  <th>Lifecycle</th>
                  <th>Publication</th>
                  <th>Start date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPrograms.map((program) => (
                  <tr key={program.id}>
                    <td>
                      <div className="programs-table-program">
                        {program.cover_image_url ? (
                          <img
                            src={program.cover_image_url}
                            alt=""
                          />
                        ) : (
                          <div className="programs-table-placeholder">▤</div>
                        )}

                        <div>
                          <strong>{program.title}</strong>
                          {program.featured && (
                            <span className="programs-featured-label">
                              ★ Featured
                            </span>
                          )}
                          <small>/{program.slug}</small>
                        </div>
                      </div>
                    </td>

                    <td>{program.category}</td>

                    <td>
                      <span className={`programs-lifecycle lifecycle-${program.program_status}`}>
                        {statusLabel(program.program_status)}
                      </span>
                    </td>

                    <td>
                      <span className={`programs-status status-${program.status}`}>
                        {statusLabel(program.status)}
                      </span>
                    </td>

                    <td>{formatDate(program.start_date)}</td>

                    <td>
                      <div className="programs-row-actions">
                        <button
                          type="button"
                          onClick={() => openEditForm(program)}
                          title="Edit program"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleFeatured(program)}
                          title="Toggle featured"
                        >
                          {program.featured ? 'Unfeature' : 'Feature'}
                        </button>

                        {program.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() => changeStatus(program, 'draft')}
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => changeStatus(program, 'published')}
                          >
                            Publish
                          </button>
                        )}

                        {program.status !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => changeStatus(program, 'archived')}
                          >
                            Archive
                          </button>
                        )}

                        <button
                          type="button"
                          className="programs-delete-action"
                          onClick={() => deleteProgram(program)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
