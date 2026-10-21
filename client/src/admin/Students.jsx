
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Students.css'

const PAGE_SIZE = 25

function getRegistrationNumber(student) {
  if (student.registration_code) {
    return student.registration_code
  }

  if (student.registration_number == null) {
    return 'Not assigned'
  }

  const year = student.created_at
    ? new Date(student.created_at).getFullYear()
    : new Date().getFullYear()

  return `TTSA-${year}-${String(student.registration_number).padStart(5, '0')}`
}

function displayValue(value) {
  return value === null || value === undefined || value === ''
    ? 'Not provided'
    : value
}

function csvSafe(value) {
  const text = String(value ?? '')
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(text)
    ? `'${text}`
    : text

  return `"${safe.replace(/"/g, '""')}"`
}

function formatDate(value) {
  if (!value) return 'Not provided'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Not provided'
    : date.toLocaleDateString('en-KE')
}

export default function Students() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [page, setPage] = useState(1)

  const loadStudents = useCallback(async () => {
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

      setStudents(data ?? [])
      setPage(1)
    } catch (err) {
      console.error('Student directory error:', err.message)
      setError(
        'Could not load student records. Please check your connection and database permissions.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return students

    return students.filter((student) => {
      const fields = [
        getRegistrationNumber(student),
        student.full_name,
        student.phone,
        student.email,
        student.county,
        student.constituency,
        student.ward,
        student.institution,
        student.course,
        student.admission_number,
        student.course_level,
      ]

      return fields.some((field) =>
        String(field ?? '').toLowerCase().includes(term)
      )
    })
  }, [students, search])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / PAGE_SIZE)
  )

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredStudents.slice(start, start + PAGE_SIZE)
  }, [filteredStudents, page])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function exportCSV() {
    const headers = [
      'Registration Code',
      'Full Name',
      'Email',
      'Phone',
      'County',
      'Constituency',
      'Ward',
      'Institution',
      'Course',
      'Course Level',
      'Course Duration (Years)',
      'Year Joined',
      'Admission Number',
      'Date Registered',
    ]

    const rows = filteredStudents.map((student) => [
      getRegistrationNumber(student),
      student.full_name,
      student.email,
      student.phone,
      student.county,
      student.constituency,
      student.ward,
      student.institution,
      student.course,
      student.course_level,
      student.course_duration_years,
      student.year_joined,
      student.admission_number,
      formatDate(student.created_at),
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map(csvSafe).join(','))
      .join('\r\n')

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'ttsa-student-register.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="students-page">
      <header className="students-header">
        <div>
          <Link to="/admin" className="students-back">
            ← Back to dashboard
          </Link>
          <p className="students-eyebrow">TTSA ADMINISTRATION</p>
          <h1>Student Management</h1>
          <p className="students-subtitle">
            Search, review and export registered TTSA membership records.
          </p>
        </div>

        <button
          type="button"
          className="students-refresh"
          onClick={loadStudents}
          disabled={loading}
        >
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </header>

      <section className="students-summary">
        <div>
          <span>Total records loaded</span>
          <strong>{loading ? '—' : students.length.toLocaleString()}</strong>
        </div>
        <div>
          <span>Matching students</span>
          <strong>
            {loading ? '—' : filteredStudents.length.toLocaleString()}
          </strong>
        </div>
        <div>
          <span>Current page</span>
          <strong>{loading ? '—' : `${page} / ${totalPages}`}</strong>
        </div>
      </section>

      <section className="students-panel">
        <div className="students-toolbar">
          <div className="students-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search name, registration code, phone, institution..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              aria-label="Search student records"
            />
          </div>

          <button
            type="button"
            className="students-export"
            onClick={exportCSV}
            disabled={loading || filteredStudents.length === 0}
          >
            ↓ Export CSV
          </button>
        </div>

        {error && (
          <div className="students-error" role="alert">
            {error}
            <button type="button" onClick={loadStudents}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <p className="students-empty">Loading student records...</p>
        ) : !error && filteredStudents.length === 0 ? (
          <p className="students-empty">
            {search
              ? 'No students match your search.'
              : 'No student records found.'}
          </p>
        ) : !error ? (
          <>
            <div className="students-table-wrap">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Registration code</th>
                    <th>Student</th>
                    <th>Phone</th>
                    <th>Constituency</th>
                    <th>Institution</th>
                    <th>Course</th>
                    <th>Date registered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="students-reg-number">
                        {getRegistrationNumber(student)}
                      </td>
                      <td>
                        <div className="students-person">
                          {student.profile_picture_url ? (
                            <img
                              className="students-avatar"
                              src={student.profile_picture_url}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <span className="students-avatar students-avatar-placeholder">
                              {(student.full_name || '?')
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                          <div>
                            <strong>{displayValue(student.full_name)}</strong>
                            <small>{displayValue(student.email)}</small>
                          </div>
                        </div>
                      </td>
                      <td>{displayValue(student.phone)}</td>
                      <td>{displayValue(student.constituency)}</td>
                      <td>{displayValue(student.institution)}</td>
                      <td>{displayValue(student.course)}</td>
                      <td>{formatDate(student.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="students-view"
                          onClick={() => setSelectedStudent(student)}
                        >
                          View profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="students-pagination">
              <span>
                Showing {filteredStudents.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                {'–'}
                {Math.min(page * PAGE_SIZE, filteredStudents.length)} of{' '}
                {filteredStudents.length.toLocaleString()} records
              </span>

              <div>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                >
                  ← Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {selectedStudent && (
        <div
          className="students-modal-backdrop"
          onClick={() => setSelectedStudent(null)}
        >
          <section
            className="students-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="students-modal-heading">
              <div>
                <p className="students-eyebrow">MEMBERSHIP RECORD</p>
                <h2 id="student-modal-title">Student profile</h2>
              </div>
              <button
                type="button"
                className="students-modal-close"
                onClick={() => setSelectedStudent(null)}
                aria-label="Close profile"
              >
                ×
              </button>
            </div>

            <div className="students-profile-identity">
              {selectedStudent.profile_picture_url && (
                <img
                  className="students-profile-photo"
                  src={selectedStudent.profile_picture_url}
                  alt={`${selectedStudent.full_name || 'Student'} profile`}
                />
              )}
              <div>
                <h3>{displayValue(selectedStudent.full_name)}</h3>
                <div className="students-profile-number">
                  {getRegistrationNumber(selectedStudent)}
                </div>
              </div>
            </div>

            <dl className="students-profile-grid">
              <div><dt>Email address</dt><dd>{displayValue(selectedStudent.email)}</dd></div>
              <div><dt>Phone number</dt><dd>{displayValue(selectedStudent.phone)}</dd></div>
              <div><dt>County</dt><dd>{displayValue(selectedStudent.county)}</dd></div>
              <div><dt>Constituency</dt><dd>{displayValue(selectedStudent.constituency)}</dd></div>
              <div><dt>Ward</dt><dd>{displayValue(selectedStudent.ward)}</dd></div>
              <div><dt>Institution</dt><dd>{displayValue(selectedStudent.institution)}</dd></div>
              <div><dt>Course / programme</dt><dd>{displayValue(selectedStudent.course)}</dd></div>
              <div><dt>Course level</dt><dd>{displayValue(selectedStudent.course_level)}</dd></div>
              <div><dt>Course duration</dt><dd>{selectedStudent.course_duration_years ? `${selectedStudent.course_duration_years} years` : 'Not provided'}</dd></div>
              <div><dt>Year joined</dt><dd>{displayValue(selectedStudent.year_joined)}</dd></div>
              <div><dt>Admission number</dt><dd>{displayValue(selectedStudent.admission_number)}</dd></div>
              <div><dt>Date registered</dt><dd>{formatDate(selectedStudent.created_at)}</dd></div>
            </dl>

            <button
              type="button"
              className="students-export"
              onClick={() => setSelectedStudent(null)}
            >
              Close profile
            </button>
          </section>
        </div>
      )}
    </main>
  )
}
