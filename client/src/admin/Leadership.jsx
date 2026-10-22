
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Leadership.css'

import BoardOfTrustees from './BoardOfTrustees'

const COUNTY_POSITIONS = [
  'President',
  'Deputy President',
  'Secretary General',
  'Treasurer',
  'Administrator General',
  'Organizing Secretary',
  'Public Relations and Communications',
  'PWD Representative',
  'Chief of Staff',
]

const CONSTITUENCY_POSITIONS = [
  'Chairperson',
  'Deputy Chairperson',
  'Secretary',
]

export default function Leadership() {
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [committeeType, setCommitteeType] = useState('county')
  const [studentId, setStudentId] = useState('')
  const [position, setPosition] = useState('')
  const [constituency, setConstituency] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [endingId, setEndingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const positions =
    committeeType === 'county'
      ? COUNTY_POSITIONS
      : CONSTITUENCY_POSITIONS

  const constituencies = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.constituency?.trim())
          .filter(Boolean)
      ),
    ].sort()
  }, [students])

  const selectedStudent = students.find(
    (student) => student.id === studentId
  )

  const filteredStudents = students.filter((student) => {
    const query = search.toLowerCase()

    return (
      student.full_name?.toLowerCase().includes(query) ||
      String(student.registration_number || '')
        .toLowerCase()
        .includes(query) ||
      student.constituency?.toLowerCase().includes(query)
    )
  })

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [studentsResult, assignmentsResult] = await Promise.all([
        supabase
          .from('student_profiles')
          .select(
            'id, full_name, registration_number, constituency, ward, course, profile_picture_url'
          )
          .order('full_name'),

        supabase
          .from('leadership_assignments')
          .select('*')
          .eq('is_current', true)
          .order('appointed_at', { ascending: false }),
      ])

      if (studentsResult.error) throw studentsResult.error
      if (assignmentsResult.error) throw assignmentsResult.error

      setStudents(studentsResult.data || [])
      setAssignments(assignmentsResult.data || [])
    } catch (err) {
      setError(err.message || 'Unable to load leadership information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  function resetForm() {
    setStudentId('')
    setPosition('')
    setConstituency('')
    setSearch('')
  }

  async function handleAssign(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!studentId || !position) {
      setError('Please select a student and a leadership position.')
      return
    }

    if (committeeType === 'constituency' && !constituency) {
      setError('Please select the constituency for this appointment.')
      return
    }

    const duplicate = assignments.some((assignment) => {
      if (
        assignment.position !== position ||
        assignment.committee_type !== committeeType
      ) {
        return false
      }

      if (committeeType === 'county') {
        return true
      }

      return (
        assignment.constituency?.toLowerCase() ===
        constituency.trim().toLowerCase()
      )
    })

    if (duplicate) {
      setError(
        'This position already has a current leader in the selected committee. End the existing appointment first.'
      )
      return
    }

    const alreadyAssigned = assignments.some(
      (assignment) => assignment.student_id === studentId
    )

    if (alreadyAssigned) {
      setError(
        'This student already has a current leadership appointment. End that appointment first.'
      )
      return
    }

    setSaving(true)

    try {
      const { error: insertError } = await supabase
        .from('leadership_assignments')
        .insert({
          student_id: studentId,
          committee_type: committeeType,
          position,
          constituency:
            committeeType === 'constituency'
              ? constituency.trim()
              : null,
        })

      if (insertError) throw insertError

      setSuccess(`${selectedStudent?.full_name || 'Student'} assigned as ${position}.`)
      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to assign this student.')
    } finally {
      setSaving(false)
    }
  }

  async function handleEndAppointment(id) {
    const confirmed = window.confirm(
      'End this leadership appointment? The student account will remain unchanged.'
    )

    if (!confirmed) return

    setError('')
    setSuccess('')
    setEndingId(id)

    try {
      const { error: updateError } = await supabase
        .from('leadership_assignments')
        .update({ is_current: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      setSuccess('Leadership appointment ended.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to end the appointment.')
    } finally {
      setEndingId('')
    }
  }

  function getStudent(studentIdToFind) {
    return students.find((student) => student.id === studentIdToFind)
  }

  return (
    <div className="ttsa-leadership-admin">
      <div className="ttsa-leadership-header">
        <div>
          <span className="ttsa-leadership-eyebrow">TTSA ADMINISTRATION</span>
          <h1>Leadership Management</h1>
          <p>Assign registered students to TTSA leadership positions.</p>
        </div>

        <div className="ttsa-leadership-count">
          <strong>{assignments.length}</strong>
          <span>Current leaders</span>
        </div>
      </div>

      {error && (
        <div className="ttsa-leadership-alert error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="ttsa-leadership-alert success" role="status">
          {success}
        </div>
      )}

      <div className="ttsa-leadership-layout">
        <section className="ttsa-leadership-panel">
          <div className="ttsa-leadership-panel-heading">
            <h2>Assign a Leader</h2>
            <p>Choose a registered student and appoint them to a position.</p>
          </div>

          <form onSubmit={handleAssign} className="ttsa-leadership-form">
            <label htmlFor="committeeType">Committee</label>
            <select
              id="committeeType"
              value={committeeType}
              onChange={(event) => {
                setCommitteeType(event.target.value)
                setPosition('')
                setConstituency('')
              }}
            >
              <option value="county">County Committee</option>
              <option value="constituency">Constituency Committee</option>
            </select>

            {committeeType === 'constituency' && (
              <>
                <label htmlFor="leadershipConstituency">
                  Constituency
                </label>
                <select
                  id="leadershipConstituency"
                  value={constituency}
                  onChange={(event) => setConstituency(event.target.value)}
                  required
                >
                  <option value="">Select constituency</option>
                  {constituencies.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>

                {constituencies.length === 0 && (
                  <small>
                    No constituencies found in student records. Add the
                    constituency to a student profile first.
                  </small>
                )}
              </>
            )}

            <label htmlFor="leadershipPosition">Position</label>
            <select
              id="leadershipPosition"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              required
            >
              <option value="">Select position</option>
              {positions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label htmlFor="studentSearch">Find registered student</label>
            <input
              id="studentSearch"
              type="search"
              placeholder="Search by name, registration number or constituency"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <label htmlFor="leadershipStudent">Select student</label>
            <select
              id="leadershipStudent"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              required
            >
              <option value="">Choose a student</option>
              {filteredStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                  {student.registration_number
                    ? ` — #${student.registration_number}`
                    : ''}
                </option>
              ))}
            </select>

            {selectedStudent && (
              <div className="ttsa-leadership-student-preview">
                {selectedStudent.profile_picture_url ? (
                  <img
                    src={selectedStudent.profile_picture_url}
                    alt={selectedStudent.full_name}
                  />
                ) : (
                  <div className="ttsa-leadership-avatar-placeholder">
                    {selectedStudent.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}

                <div>
                  <strong>{selectedStudent.full_name}</strong>
                  <span>
                    {selectedStudent.constituency || 'Constituency not set'}
                  </span>
                  <span>
                    {selectedStudent.course || 'Course not provided'}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="ttsa-leadership-submit"
              disabled={saving || loading}
            >
              {saving ? 'Assigning...' : 'Assign Leader'}
            </button>
          </form>
        </section>

        <section className="ttsa-leadership-panel ttsa-current-leaders">
          <div className="ttsa-leadership-panel-heading">
            <h2>Current Leadership</h2>
            <p>Manage active County and Constituency Committee appointments.</p>
          </div>

          {loading ? (
            <p className="ttsa-leadership-empty">Loading leadership records...</p>
          ) : assignments.length === 0 ? (
            <p className="ttsa-leadership-empty">
              No leaders have been assigned yet.
            </p>
          ) : (
            <div className="ttsa-leadership-list">
              {assignments.map((assignment) => {
                const student = getStudent(assignment.student_id)

                return (
                  <article
                    className="ttsa-leadership-record"
                    key={assignment.id}
                  >
                    {student?.profile_picture_url ? (
                      <img
                        className="ttsa-leadership-record-photo"
                        src={student.profile_picture_url}
                        alt={student.full_name}
                      />
                    ) : (
                      <div className="ttsa-leadership-record-photo placeholder">
                        {student?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}

                    <div className="ttsa-leadership-record-details">
                      <strong>{student?.full_name || 'Student record unavailable'}</strong>
                      <span>{assignment.position}</span>
                      <small>
                        {assignment.committee_type === 'county'
                          ? 'County Committee'
                          : `${assignment.constituency} Constituency Committee`}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="ttsa-leadership-end"
                      onClick={() => handleEndAppointment(assignment.id)}
                      disabled={endingId === assignment.id}
                    >
                      {endingId === assignment.id ? 'Ending...' : 'End'}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

        <BoardOfTrustees /> 

    </div>
  )
}
