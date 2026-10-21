
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './MembershipRecords.css'

const PAGE_SIZE = 25

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  email: '',
  county: 'Taita Taveta',
  constituency: '',
  ward: '',
  institution: '',
  course: '',
  admission_number: '',
  course_level: '',
  course_duration_years: '',
  year_joined: '',
}

const EDITABLE_FIELDS = [
  { name: 'full_name', label: 'Full name', required: true },
  { name: 'phone', label: 'Phone number' },
  { name: 'email', label: 'Contact email', type: 'email' },
  { name: 'county', label: 'County', required: true },
  { name: 'constituency', label: 'Constituency' },
  { name: 'ward', label: 'Ward' },
  { name: 'institution', label: 'Institution', required: true },
  { name: 'course', label: 'Course / programme', required: true },
  { name: 'admission_number', label: 'Admission number' },
  { name: 'course_level', label: 'Course level' },
  {
    name: 'course_duration_years',
    label: 'Course duration (years)',
    type: 'number',
  },
  { name: 'year_joined', label: 'Year joined', type: 'number' },
]

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
}

function registrationCode(member) {
  if (member.registration_code) return member.registration_code

  if (member.registration_number == null) return 'Not assigned'

  const year = new Date(member.created_at).getFullYear()

  return `TTSA-${year}-${String(member.registration_number).padStart(5, '0')}`
}

export default function MembershipRecords() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [constituencyFilter, setConstituencyFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedMember, setSelectedMember] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error: queryError } = await supabase
        .from('student_profiles')
        .select(`
          id,
          registration_number,
          registration_code,
          full_name,
          phone,
          email,
          county,
          constituency,
          ward,
          institution,
          course,
          admission_number,
          course_level,
          course_duration_years,
          year_joined,
          profile_picture_url,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      setMembers(data ?? [])
    } catch (err) {
      console.error('Membership records failed to load:', err.message)
      setError(
        'Unable to load membership records. Check administrator permissions and try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const constituencies = useMemo(() => {
    return [
      ...new Set(
        members
          .map((member) => member.constituency?.trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b))
  }, [members])

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase()

    return members.filter((member) => {
      const matchesConstituency =
        constituencyFilter === 'all' ||
        member.constituency === constituencyFilter

      const searchableText = [
        member.full_name,
        member.registration_code,
        member.registration_number,
        member.phone,
        member.email,
        member.institution,
        member.course,
        member.admission_number,
        member.constituency,
        member.ward,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase()

      return matchesConstituency && searchableText.includes(term)
    })
  }, [members, search, constituencyFilter])

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE))

  const paginatedMembers = filteredMembers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  )

  useEffect(() => {
    setPage(1)
  }, [search, constituencyFilter])

  function viewMember(member) {
    setSelectedMember(member)
  }

  function startEditing(member) {
    setSelectedMember(null)
    setEditingMember(member)

    setForm({
      full_name: member.full_name ?? '',
      phone: member.phone ?? '',
      email: member.email ?? '',
      county: member.county ?? 'Taita Taveta',
      constituency: member.constituency ?? '',
      ward: member.ward ?? '',
      institution: member.institution ?? '',
      course: member.course ?? '',
      admission_number: member.admission_number ?? '',
      course_level: member.course_level ?? '',
      course_duration_years: member.course_duration_years ?? '',
      year_joined: member.year_joined ?? '',
    })

    setError('')
    setSuccess('')
  }

  function closeEditor() {
    if (saving) return

    setEditingMember(null)
    setForm(EMPTY_FORM)
  }

  async function saveMember(event) {
    event.preventDefault()

    if (!editingMember) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const updates = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        county: form.county.trim(),
        constituency: form.constituency.trim() || null,
        ward: form.ward.trim() || null,
        institution: form.institution.trim(),
        course: form.course.trim(),
        admission_number: form.admission_number.trim() || null,
        course_level: form.course_level.trim() || null,
        course_duration_years:
          form.course_duration_years === ''
            ? null
            : Number(form.course_duration_years),
        year_joined:
          form.year_joined === '' ? null : Number(form.year_joined),
      }

      if (
        !updates.full_name ||
        !updates.county ||
        !updates.institution ||
        !updates.course
      ) {
        throw new Error(
          'Please fill in the full name, county, institution and course.'
        )
      }

      if (
        updates.course_duration_years !== null &&
        (!Number.isFinite(updates.course_duration_years) ||
          updates.course_duration_years <= 0)
      ) {
        throw new Error('Course duration must be a positive number.')
      }

      if (
        updates.year_joined !== null &&
        (!Number.isInteger(updates.year_joined) ||
          updates.year_joined < 1900 ||
          updates.year_joined > new Date().getFullYear())
      ) {
        throw new Error('Please enter a valid year joined.')
      }

      const { data, error: updateError } = await supabase
        .from('student_profiles')
        .update(updates)
        .eq('id', editingMember.id)
        .select('id')

      if (updateError) throw updateError

      if (!data || data.length === 0) {
        throw new Error(
          'The record was not updated. Confirm that your administrator account has permission to edit student profiles.'
        )
      }

      setSuccess('Membership record updated successfully.')
      setEditingMember(null)
      await loadMembers()
    } catch (err) {
      console.error('Membership update failed:', err.message)
      setError(err.message || 'Unable to update this membership record.')
    } finally {
      setSaving(false)
    }
  }

  const totalMembers = members.length
  const currentYear = new Date().getFullYear()
  const registeredThisYear = members.filter(
    (member) =>
      member.created_at &&
      new Date(member.created_at).getFullYear() === currentYear
  ).length
  const completeProfiles = members.filter(
    (member) =>
      member.full_name &&
      member.institution &&
      member.course &&
      member.constituency &&
      member.phone
  ).length

  return (
    <div className="membership-page">
      <header className="membership-header">
        <div>
          <p className="membership-eyebrow">TTSA ADMINISTRATION</p>
          <h1>Membership Records</h1>
          <p className="membership-subtitle">
            Search, review and update registered student membership details.
          </p>
        </div>

        <button
          type="button"
          className="membership-refresh"
          onClick={loadMembers}
          disabled={loading}
        >
          {loading ? 'Loading...' : '↻ Refresh records'}
        </button>
      </header>

      {error && !editingMember && (
        <div className="membership-alert membership-alert-error" role="alert">
          {error}
          <button type="button" onClick={loadMembers}>
            Try again
          </button>
        </div>
      )}

      {success && (
        <div className="membership-alert membership-alert-success" role="status">
          {success}
          <button type="button" onClick={() => setSuccess('')}>
            Dismiss
          </button>
        </div>
      )}

      <section className="membership-summary">
        <article className="membership-summary-card">
          <span>Total registered members</span>
          <strong>{loading ? '—' : totalMembers.toLocaleString()}</strong>
          <small>Records in the membership register</small>
        </article>

        <article className="membership-summary-card">
          <span>Registered this year</span>
          <strong>{loading ? '—' : registeredThisYear.toLocaleString()}</strong>
          <small>{currentYear} registrations</small>
        </article>

        <article className="membership-summary-card">
          <span>Complete profiles</span>
          <strong>{loading ? '—' : completeProfiles.toLocaleString()}</strong>
          <small>Name, contact and study details available</small>
        </article>
      </section>

      <section className="membership-register">
        <div className="membership-register-heading">
          <div>
            <h2>Member register</h2>
            <p>
              {loading
                ? 'Loading member records...'
                : `${filteredMembers.length.toLocaleString()} record(s) found`}
            </p>
          </div>
        </div>

        <div className="membership-filters">
          <label className="membership-search">
            <span>Search members</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, TTSA code, phone, institution..."
            />
          </label>

          <label className="membership-constituency-filter">
            <span>Constituency</span>
            <select
              value={constituencyFilter}
              onChange={(event) => setConstituencyFilter(event.target.value)}
            >
              <option value="all">All constituencies</option>
              {constituencies.map((constituency) => (
                <option key={constituency} value={constituency}>
                  {constituency}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <div className="membership-empty">Loading membership records...</div>
        ) : error && members.length === 0 ? (
          <div className="membership-empty">
            Membership records could not be loaded.
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="membership-empty">
            No members match your search or selected constituency.
          </div>
        ) : (
          <>
            <div className="membership-table-wrap">
              <table className="membership-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Registration code</th>
                    <th>Constituency</th>
                    <th>Institution</th>
                    <th>Date registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="membership-member-cell">
                          {member.profile_picture_url ? (
                            <img
                              src={member.profile_picture_url}
                              alt=""
                              className="membership-avatar"
                            />
                          ) : (
                            <span className="membership-avatar membership-avatar-placeholder">
                              {(member.full_name || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}

                          <div>
                            <strong>{member.full_name || 'Unnamed member'}</strong>
                            <small>{member.email || member.phone || 'No contact details'}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="membership-code">
                          {registrationCode(member)}
                        </span>
                      </td>
                      <td>{member.constituency || '—'}</td>
                      <td>{member.institution || '—'}</td>
                      <td>{formatDate(member.created_at)}</td>
                      <td>
                        <div className="membership-row-actions">
                          <button
                            type="button"
                            onClick={() => viewMember(member)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditing(member)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="membership-pagination">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filteredMembers.length)} of{' '}
                {filteredMembers.length}
              </span>

              <div>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedMember && (
        <div
          className="membership-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedMember(null)
            }
          }}
        >
          <section
            className="membership-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-view-title"
          >
            <div className="membership-modal-heading">
              <div>
                <p className="membership-eyebrow">MEMBER PROFILE</p>
                <h2 id="membership-view-title">
                  {selectedMember.full_name}
                </h2>
                <span className="membership-code">
                  {registrationCode(selectedMember)}
                </span>
              </div>
              <button
                type="button"
                className="membership-modal-close"
                onClick={() => setSelectedMember(null)}
                aria-label="Close member profile"
              >
                ×
              </button>
            </div>

            {selectedMember.profile_picture_url && (
              <img
                src={selectedMember.profile_picture_url}
                alt={`${selectedMember.full_name}'s profile`}
                className="membership-profile-photo"
              />
            )}

            <div className="membership-detail-grid">
              {[
                ['Full name', selectedMember.full_name],
                ['Phone', selectedMember.phone],
                ['Email', selectedMember.email],
                ['County', selectedMember.county],
                ['Constituency', selectedMember.constituency],
                ['Ward', selectedMember.ward],
                ['Institution', selectedMember.institution],
                ['Course', selectedMember.course],
                ['Admission number', selectedMember.admission_number],
                ['Course level', selectedMember.course_level],
                ['Course duration (years)', selectedMember.course_duration_years],
                ['Year joined', selectedMember.year_joined],
                ['Date registered', formatDate(selectedMember.created_at)],
              ].map(([label, value]) => (
                <div className="membership-detail-item" key={label}>
                  <span>{label}</span>
                  <strong>{value ?? '—'}</strong>
                </div>
              ))}
            </div>

            <div className="membership-modal-actions">
              <button
                type="button"
                className="membership-button-secondary"
                onClick={() => setSelectedMember(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="membership-button-primary"
                onClick={() => startEditing(selectedMember)}
              >
                Edit member details
              </button>
            </div>
          </section>
        </div>
      )}

      {editingMember && (
        <div
          className="membership-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeEditor()
            }
          }}
        >
          <section
            className="membership-modal membership-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-edit-title"
          >
            <div className="membership-modal-heading">
              <div>
                <p className="membership-eyebrow">EDIT MEMBERSHIP</p>
                <h2 id="membership-edit-title">
                  {editingMember.full_name}
                </h2>
                <span className="membership-code">
                  {registrationCode(editingMember)}
                </span>
              </div>
              <button
                type="button"
                className="membership-modal-close"
                onClick={closeEditor}
                disabled={saving}
                aria-label="Close edit form"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="membership-alert membership-alert-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={saveMember}>
              <div className="membership-edit-grid">
                {EDITABLE_FIELDS.map((field) => (
                  <label className="membership-form-field" key={field.name}>
                    <span>
                      {field.label}
                      {field.required && <b> *</b>}
                    </span>
                    <input
                      type={field.type || 'text'}
                      name={field.name}
                      value={form[field.name]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.name]: event.target.value,
                        }))
                      }
                      required={field.required}
                      min={field.name === 'course_duration_years' ? '0.5' : undefined}
                      step={field.name === 'course_duration_years' ? '0.5' : undefined}
                      disabled={saving}
                    />
                  </label>
                ))}
              </div>

              <p className="membership-edit-note">
                The registration code and original registration date are
                protected and cannot be edited here.
              </p>

              <div className="membership-modal-actions">
                <button
                  type="button"
                  className="membership-button-secondary"
                  onClick={closeEditor}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="membership-button-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving changes...' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
