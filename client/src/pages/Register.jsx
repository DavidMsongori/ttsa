
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

// Taita-Taveta County constituencies and wards
const CONSTITUENCIES = {
  'Taveta': [
    'Chala',
    'Mahoo',
    'Bomani',
    'Mboghoni',
    'Mata',
  ],
  'Wundanyi': [
    'Wundanyi/Mbale',
    'Werugha',
    'Wumingu/Kishushe',
    'Mwanda/Mghange',
  ],
  'Mwatate': [
    'Ronge',
    'Mwatate',
    'Bura',
    'Chawia',
    'Wusi/Kishamba',
  ],
  'Voi': [
    'Mbololo',
    'Sagalla',
    'Kaloleni',
    'Marungu',
    'Kasigau',
    'Ngolia',
  ],
}

const COURSE_LEVELS = [
  'Certificate',
  'Diploma',
  'Higher Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate (PhD)',
  'Other',
]

const CURRENT_YEAR = new Date().getFullYear()

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    constituency: '',
    ward: '',
    institution: '',
    course: '',
    course_level: '',
    course_duration_years: '',
    year_joined: '',
    password: '',
    confirmPassword: '',
  })

  const [picture, setPicture] = useState(null)
  const [picturePreview, setPicturePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const wards = form.constituency
    ? CONSTITUENCIES[form.constituency] || []
    : []

  const expectedCompletionYear =
    form.year_joined && form.course_duration_years
      ? Number(form.year_joined) + Number(form.course_duration_years)
      : null

  useEffect(() => {
    return () => {
      if (picturePreview) {
        URL.revokeObjectURL(picturePreview)
      }
    }
  }, [picturePreview])

  function handleChange(event) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: value,
      ...(name === 'constituency' ? { ward: '' } : {}),
    }))
  }

  function handlePictureChange(event) {
    const file = event.target.files?.[0]

    setError('')
    setPicture(null)
    setPicturePreview('')

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      event.target.value = ''
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPG, PNG, or WebP image.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Your picture must be 2 MB or smaller.')
      event.target.value = ''
      return
    }

    setPicture(file)
    setPicturePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (form.password.length < 8) {
      setError('Your password must be at least 8 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    if (!form.constituency || !form.ward) {
      setError('Please select your constituency and ward.')
      return
    }

    if (!wards.includes(form.ward)) {
      setError('Please select a valid ward for your constituency.')
      return
    }

    if (
      Number(form.year_joined) < 1980 ||
      Number(form.year_joined) > CURRENT_YEAR
    ) {
      setError('Please enter a valid year joined.')
      return
    }

    if (
      !Number.isFinite(Number(form.course_duration_years)) ||
      Number(form.course_duration_years) <= 0 ||
      Number(form.course_duration_years) > 15
    ) {
      setError('Course duration must be greater than 0 and no more than 15 years.')
      return
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (picture && (!cloudName || !uploadPreset)) {
      setError('Cloudinary is not configured. Check the Cloudinary variables in Client/.env.local.')
      return
    }

    setLoading(true)

    try {
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              full_name: form.full_name.trim(),
              phone: form.phone.trim(),
              constituency: form.constituency,
              ward: form.ward,
              institution: form.institution.trim(),
              course: form.course.trim(),
              course_level: form.course_level,
              course_duration_years: Number(form.course_duration_years),
              year_joined: Number(form.year_joined),
            },
          },
        })

      if (signupError) throw signupError

      if (!data.session) {
        setMessage(
          picture
            ? 'Your account has been created. Verify your email and log in; then you can upload your profile picture.'
            : 'Your account has been created. Check your email to verify your account, then log in.'
        )
        return
      }

      if (picture) {
        setMessage('Account created. Uploading your profile picture...')

        const uploadData = new FormData()
        uploadData.append('file', picture)
        uploadData.append('upload_preset', uploadPreset)

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
          {
            method: 'POST',
            body: uploadData,
          }
        )

        const uploadedImage = await uploadResponse.json()

        if (!uploadResponse.ok || !uploadedImage.secure_url) {
          throw new Error(
            uploadedImage.error?.message ||
              'The account was created, but Cloudinary could not upload your picture.'
          )
        }

        const { error: profilePictureError } = await supabase.rpc(
          'save_own_profile_picture',
          { image_url: uploadedImage.secure_url }
        )

        if (profilePictureError) {
          throw new Error(
            `Your account was created and the picture uploaded, but saving it to your profile failed: ${profilePictureError.message}`
          )
        }
      }

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">TTSA</Link>
        <p className="auth-eyebrow">MEMBERSHIP REGISTRATION</p>
        <h1>Join TTSA</h1>
        <p className="auth-subtitle">
          Register to become part of the Taita Taveta student community.
        </p>

        {error && (
          <div className="auth-alert error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-alert success" role="status">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <h3>Personal information</h3>

          <label>
            Full names
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </label>

          <label>
            Email address
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Phone number
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              required
              autoComplete="tel"
              placeholder="e.g. 07XX XXX XXX"
            />
          </label>

          <label>
            Profile picture
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePictureChange}
            />
            <small>JPG, PNG or WebP; maximum 2 MB.</small>
          </label>

          {picturePreview && (
            <div className="profile-picture-preview">
              <img
                src={picturePreview}
                alt="Selected profile preview"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '50%',
                }}
              />
            </div>
          )}

          <h3>Location information</h3>

          <label>
            Constituency
            <select
              name="constituency"
              value={form.constituency}
              onChange={handleChange}
              required
            >
              <option value="">Select constituency</option>
              {Object.keys(CONSTITUENCIES).map(constituency => (
                <option key={constituency} value={constituency}>
                  {constituency}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ward
            <select
              name="ward"
              value={form.ward}
              onChange={handleChange}
              required
              disabled={!form.constituency}
            >
              <option value="">Select ward</option>
              {wards.map(ward => (
                <option key={ward} value={ward}>
                  {ward}
                </option>
              ))}
            </select>
          </label>

          <h3>Education information</h3>

          <label>
            University or college
            <input
              name="institution"
              value={form.institution}
              onChange={handleChange}
              required
            />
          </label>

         <label>
  Course or programme
  <input
    name="course"
    type="text"
    value={form.course}
    onChange={handleChange}
    required
    autoComplete="off"
    spellCheck={false}
    placeholder="e.g. Bachelor of Science in Computer Science"
  />
</label>

          <label>
            Course level
            <select
              name="course_level"
              value={form.course_level}
              onChange={handleChange}
              required
            >
              <option value="">Select course level</option>
              {COURSE_LEVELS.map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>

          <label>
            Course duration (years)
            <input
              name="course_duration_years"
              type="number"
              value={form.course_duration_years}
              onChange={handleChange}
              min="0.5"
              max="15"
              step="0.5"
              required
              placeholder="e.g. 4"
            />
          </label>

          <label>
            Year joined
            <input
              name="year_joined"
              type="number"
              value={form.year_joined}
              onChange={handleChange}
              min="1980"
              max={CURRENT_YEAR}
              required
              placeholder={String(CURRENT_YEAR)}
            />
          </label>

          {expectedCompletionYear && (
            <p>
              Expected completion year: <strong>{expectedCompletionYear}</strong>
            </p>
          )}

          <h3>Account security</h3>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirm password
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? (picture ? 'Creating account and uploading picture...' : 'Creating account...') : 'Register for free'}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Back to homepage
        </Link>
      </section>
    </main>
  )
}
