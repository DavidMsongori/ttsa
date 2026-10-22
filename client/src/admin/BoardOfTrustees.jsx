
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './BoardOfTrustees.css'

const POSITIONS = [
  {
    value: 'CEO',
    label: 'CEO — Founder',
    seats: 1,
  },
  {
    value: 'Alumni Representative',
    label: 'Alumni Representative',
    seats: 2,
  },
  {
    value: 'Director',
    label: 'Director — Co-Founder',
    seats: 4,
  },
]

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

export default function BoardOfTrustees() {
  const [members, setMembers] = useState([])
  const [president, setPresident] = useState(null)

  const [editingId, setEditingId] = useState(null)
  const [fullName, setFullName] = useState('')
  const [position, setPosition] = useState('CEO')
  const [seatNumber, setSeatNumber] = useState('1')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [existingImage, setExistingImage] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedPosition = POSITIONS.find(
    (item) => item.value === position
  )

  const occupiedSeats = useMemo(
    () =>
      members
        .filter(
          (member) =>
            member.position === position &&
            member.id !== editingId
        )
        .map((member) => member.seat_number),
    [members, position, editingId]
  )

  const availableSeats = useMemo(() => {
    if (!selectedPosition) return []

    return Array.from(
      { length: selectedPosition.seats },
      (_, index) => index + 1
    ).filter(
      (seat) =>
        !occupiedSeats.includes(seat) ||
        (editingId &&
          members.some(
            (member) =>
              member.id === editingId &&
              member.position === position &&
              member.seat_number === seat
          ))
    )
  }, [selectedPosition, occupiedSeats, editingId, members, position])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [membersResult, presidentResult] = await Promise.all([
        supabase
          .from('board_of_trustees')
          .select('*')
          .order('display_order')
          .order('seat_number'),

        supabase
          .from('leadership_assignments')
          .select('id, student_id, position, committee_type')
          .eq('is_current', true)
          .eq('committee_type', 'county')
          .eq('position', 'President')
          .limit(1)
          .maybeSingle(),
      ])

      if (membersResult.error) throw membersResult.error
      if (presidentResult.error) throw presidentResult.error

      setMembers(membersResult.data || [])

      if (presidentResult.data?.student_id) {
        const { data: profile, error: profileError } = await supabase
          .from('student_profiles')
          .select('id, full_name, profile_picture_url')
          .eq('id', presidentResult.data.student_id)
          .maybeSingle()

        if (profileError) throw profileError

        setPresident(
          profile
            ? {
                ...profile,
                position: 'Board Secretary (Ex-Officio)',
              }
            : null
        )
      } else {
        setPresident(null)
      }
    } catch (err) {
      setError(
        err.message || 'Unable to load Board of Trustees information.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!imageFile) return

    const previewUrl = URL.createObjectURL(imageFile)
    setImagePreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [imageFile])

  useEffect(() => {
    if (availableSeats.length > 0) {
      if (!availableSeats.includes(Number(seatNumber))) {
        setSeatNumber(String(availableSeats[0]))
      }
    } else if (!editingId) {
      setSeatNumber('')
    }
  }, [availableSeats, seatNumber, editingId])

  function resetForm() {
    setEditingId(null)
    setFullName('')
    setPosition('CEO')
    setSeatNumber('1')
    setImageFile(null)
    setImagePreview('')
    setExistingImage('')
  }

  function startEditing(member) {
    setEditingId(member.id)
    setFullName(member.full_name)
    setPosition(member.position)
    setSeatNumber(String(member.seat_number))
    setExistingImage(member.image_url || '')
    setImageFile(null)
    setImagePreview('')
    setError('')
    setSuccess('')

    document
      .getElementById('ttsa-bot-form')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function uploadImage(file) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      throw new Error(
        'Cloudinary is not configured. Check your client .env file.'
      )
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const result = await response.json()

    if (!response.ok || !result.secure_url) {
      throw new Error(
        result.error?.message || 'Image upload failed.'
      )
    }

    return result.secure_url
  }

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const cleanName = fullName.trim()
    const selectedSeat = Number(seatNumber)

    if (!cleanName) {
      setError('Please enter the Board member’s full name.')
      return
    }

    if (!selectedPosition || !selectedSeat) {
      setError('Please select an available position and seat.')
      return
    }

    if (
      !editingId &&
      members.some(
        (member) =>
          member.position === position &&
          member.seat_number === selectedSeat
      )
    ) {
      setError('That position and seat are already occupied.')
      return
    }

    if (imageFile) {
      if (!ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
        setError('Choose a JPG, PNG or WebP image.')
        return
      }

      if (imageFile.size > MAX_IMAGE_SIZE) {
        setError('The image must be 2 MB or smaller.')
        return
      }
    }

    setSaving(true)

    try {
      let imageUrl = existingImage || null

      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const record = {
        full_name: cleanName,
        position,
        seat_number: selectedSeat,
        image_url: imageUrl,
        is_active: true,
        display_order:
          position === 'CEO'
            ? 1
            : position === 'Alumni Representative'
              ? 10 + selectedSeat
              : 20 + selectedSeat,
        updated_at: new Date().toISOString(),
      }

      const result = editingId
        ? await supabase
            .from('board_of_trustees')
            .update(record)
            .eq('id', editingId)
        : await supabase
            .from('board_of_trustees')
            .insert(record)

      if (result.error) throw result.error

      setSuccess(
        editingId
          ? `${cleanName}’s Board record has been updated.`
          : `${cleanName} has been added to the Board of Trustees.`
      )

      resetForm()
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to save this Board member.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(member) {
    const confirmed = window.confirm(
      `Permanently remove ${member.full_name} from the Board of Trustees?`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')
    setDeletingId(member.id)

    try {
      const { error: deleteError } = await supabase
        .from('board_of_trustees')
        .delete()
        .eq('id', member.id)

      if (deleteError) throw deleteError

      if (editingId === member.id) resetForm()

      setSuccess(`${member.full_name} has been removed from the Board.`)
      await loadData()
    } catch (err) {
      setError(err.message || 'Unable to remove this Board member.')
    } finally {
      setDeletingId('')
    }
  }

  function getPositionMembers(positionValue) {
    return members
      .filter(
        (member) =>
          member.position === positionValue && member.is_active
      )
      .sort((a, b) => a.seat_number - b.seat_number)
  }

  return (
    <section className="ttsa-bot-admin">
      <div className="ttsa-bot-header">
        <div>
          <span className="ttsa-bot-eyebrow">
            TTSA GOVERNANCE
          </span>
          <h2>Board of Trustees</h2>
          <p>
            Manage the Founder, Alumni Representatives and Co-Founder
            Directors. The sitting President is included automatically.
          </p>
        </div>

        <div className="ttsa-bot-total">
          <strong>{members.filter((m) => m.is_active).length + (president ? 1 : 0)}</strong>
          <span>Active board members</span>
        </div>
      </div>

      {error && (
        <div className="ttsa-bot-alert error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="ttsa-bot-alert success" role="status">
          {success}
        </div>
      )}

      <div className="ttsa-bot-layout">
        <section className="ttsa-bot-panel" id="ttsa-bot-form">
          <div className="ttsa-bot-panel-heading">
            <h3>{editingId ? 'Edit Board Member' : 'Add Board Member'}</h3>
            <p>
              Enter the member’s details and select their designated seat.
            </p>
          </div>

          <form className="ttsa-bot-form" onSubmit={handleSave}>
            <label htmlFor="botFullName">Full name</label>
            <input
              id="botFullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter the member’s full name"
              autoComplete="name"
              maxLength={150}
              required
            />

            <label htmlFor="botPosition">Board position</label>
            <select
              id="botPosition"
              value={position}
              onChange={(event) => {
                setPosition(event.target.value)
                setSeatNumber('')
              }}
              required
            >
              {POSITIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <label htmlFor="botSeat">Seat</label>
            <select
              id="botSeat"
              value={seatNumber}
              onChange={(event) => setSeatNumber(event.target.value)}
              disabled={availableSeats.length === 0}
              required
            >
              <option value="">Select available seat</option>
              {availableSeats.map((seat) => (
                <option key={seat} value={seat}>
                  {position === 'CEO'
                    ? 'CEO seat'
                    : `${selectedPosition?.value} ${seat}`}
                </option>
              ))}
            </select>

            {availableSeats.length === 0 && (
              <small className="ttsa-bot-hint">
                All seats for this position are occupied. Edit an existing
                member or remove a member before assigning another person.
              </small>
            )}

            <label htmlFor="botPhoto">Profile photograph</label>
            <input
              id="botPhoto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] || null
                setImageFile(file)
              }}
            />
            <small className="ttsa-bot-hint">
              JPG, PNG or WebP. Maximum file size: 2 MB.
              {editingId ? ' Leave empty to keep the existing photograph.' : ''}
            </small>

            {(imagePreview || existingImage) && (
              <div className="ttsa-bot-photo-preview">
                <img
                  src={imagePreview || existingImage}
                  alt="Board member preview"
                />
                <span>
                  {imageFile ? 'New photograph selected' : 'Current photograph'}
                </span>
              </div>
            )}

            <div className="ttsa-bot-form-actions">
              <button
                type="submit"
                className="ttsa-bot-primary-button"
                disabled={
                  saving ||
                  loading ||
                  availableSeats.length === 0 ||
                  !seatNumber
                }
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save Changes'
                    : 'Add Board Member'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="ttsa-bot-secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="ttsa-bot-panel">
          <div className="ttsa-bot-panel-heading">
            <h3>Board Composition</h3>
            <p>
              Seven manually managed seats, plus the sitting President.
            </p>
          </div>

          {loading ? (
            <p className="ttsa-bot-empty">Loading Board records...</p>
          ) : (
            <div className="ttsa-bot-groups">
              {POSITIONS.map((item) => {
                const positionMembers = getPositionMembers(item.value)

                return (
                  <div className="ttsa-bot-group" key={item.value}>
                    <div className="ttsa-bot-group-heading">
                      <div>
                        <h4>{item.label}</h4>
                        <span>
                          {positionMembers.length} of {item.seats} seats filled
                        </span>
                      </div>
                      <span className="ttsa-bot-seat-count">
                        {positionMembers.length}/{item.seats}
                      </span>
                    </div>

                    {positionMembers.length === 0 ? (
                      <p className="ttsa-bot-vacant">
                        No appointment recorded.
                      </p>
                    ) : (
                      positionMembers.map((member) => (
                        <article
                          className="ttsa-bot-member"
                          key={member.id}
                        >
                          {member.image_url ? (
                            <img
                              src={member.image_url}
                              alt={member.full_name}
                              className="ttsa-bot-member-photo"
                            />
                          ) : (
                            <div className="ttsa-bot-member-photo placeholder">
                              {member.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="ttsa-bot-member-details">
                            <strong>{member.full_name}</strong>
                            <span>
                              {item.value === 'CEO'
                                ? 'Founder'
                                : item.value === 'Director'
                                  ? 'Co-Founder'
                                  : `Seat ${member.seat_number}`}
                            </span>
                          </div>

                          <div className="ttsa-bot-member-actions">
                            <button
                              type="button"
                              onClick={() => startEditing(member)}
                              disabled={Boolean(deletingId)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="remove"
                              onClick={() => handleDelete(member)}
                              disabled={Boolean(deletingId)}
                            >
                              {deletingId === member.id
                                ? 'Removing...'
                                : 'Remove'}
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                )
              })}

              <div className="ttsa-bot-group ttsa-bot-president-group">
                <div className="ttsa-bot-group-heading">
                  <div>
                    <h4>Board Secretary (Ex-Officio)</h4>
                    <span>Automatically sourced from County Committee</span>
                  </div>
                  <span className="ttsa-bot-auto-badge">Automatic</span>
                </div>

                {president ? (
                  <article className="ttsa-bot-member">
                    {president.profile_picture_url ? (
                      <img
                        src={president.profile_picture_url}
                        alt={president.full_name}
                        className="ttsa-bot-member-photo"
                      />
                    ) : (
                      <div className="ttsa-bot-member-photo placeholder">
                        {president.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}

                    <div className="ttsa-bot-member-details">
                      <strong>{president.full_name}</strong>
                      <span>Current TTSA President</span>
                    </div>
                  </article>
                ) : (
                  <p className="ttsa-bot-vacant">
                    No current County Committee President was found.
                    Appoint a President in Leadership Management to populate
                    this section automatically.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
