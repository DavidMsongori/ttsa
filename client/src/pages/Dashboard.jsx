
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Dashboard.css'

import MembershipCard from '../components/MembershipCard'
import Notifications from '../components/Notifications'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'profile', label: 'My Profile', icon: '♙' },
  { id: 'membership', label: 'Membership Card', icon: '▣' },
  { id: 'notifications', label: 'Notifications', icon: '♧' },
]

const EMPTY_FORM = {
  full_name: '',
  phone: '',
  institution: '',
  course: '',
  course_level: '',
  course_duration_years: '',
  year_joined: '',
  admission_number: '',
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const pictureInputRef = useRef(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (!active) return

        if (authError || !user) {
          navigate('/login', { replace: true })
          return
        }

        setEmail(user.email || '')

        const { data, error: profileError } = await supabase
          .from('student_profiles')
          .select(`
            registration_code,
            full_name,
            phone,
            county,
            constituency,
            ward,
            institution,
            course,
            course_level,
            course_duration_years,
            year_joined,
            admission_number,
            profile_picture_url,
            created_at
          `)
          .eq('id', user.id)
          .maybeSingle()

        if (!active) return

        if (profileError) {
          console.error('Profile loading failed:', profileError.message)
          setError('We could not load your profile. Please refresh and try again.')
        } else if (!data) {
          setError('Your profile is not available yet. Please contact TTSA support.')
        } else {
          setProfile(data)
          setEditForm({
            full_name: data.full_name || '',
            phone: data.phone || '',
            institution: data.institution || '',
            course: data.course || '',
            course_level: data.course_level || '',
            course_duration_years: data.course_duration_years ?? '',
            year_joined: data.year_joined ?? '',
            admission_number: data.admission_number || '',
          })
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load your profile.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [navigate])

async function handleProfilePictureUpload(event) {
  const file = event.target.files?.[0]

  // Allow the same image to be selected again later.
  event.target.value = ''

  if (!file) return

  setError('')
  setNotice('')

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    setError('Please select a JPG, PNG or WebP image.')
    return
  }

  // Limit uploads to 5 MB.
  if (file.size > 5 * 1024 * 1024) {
    setError('Your image must be 5 MB or smaller.')
    return
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    setError('Image uploads are not configured. Please contact TTSA support.')
    return
  }

  setUploadingPicture(true)

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      setError('Your session has expired. Please log in again.')
      return
    }

   const formData = new FormData()
formData.append('file', file)
formData.append('upload_preset', uploadPreset)
formData.append('folder', 'ttsa/profile-pictures')
formData.append('public_id', `${user.id}_${Date.now()}`)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    const result = await response.json()

    if (!response.ok || !result.secure_url) {
      console.error('Cloudinary upload failed:', result)
      throw new Error(
        result.error?.message || 'The image upload failed. Please try again.'
      )
    }

    const { data, error: updateError } = await supabase
      .from('student_profiles')
      .update({
        profile_picture_url: result.secure_url,
      })
      .eq('id', user.id)
      .select(`
        registration_code,
        full_name,
        phone,
        county,
        constituency,
        ward,
        institution,
        course,
        course_level,
        course_duration_years,
        year_joined,
        admission_number,
        profile_picture_url,
        created_at
      `)
      .maybeSingle()

    if (updateError) {
  console.error('Profile picture save failed:', updateError)

  throw new Error(
    `Supabase error: ${updateError.message}`
  )
}

    if (!data) {
      throw new Error(
        'Your profile picture was not saved. Please check your Supabase update permissions.'
      )
    }

    setProfile(data)
    setNotice('Your profile picture has been updated successfully.')
  } catch (err) {
    console.error('Profile picture update error:', err)
    setError(err.message || 'Unable to update your profile picture.')
  } finally {
    setUploadingPicture(false)
  }
}

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut()

    if (logoutError) {
      setError('Unable to log out. Please try again.')
      return
    }

    navigate('/login', { replace: true })
  }

  function openSection(section) {
    setActiveSection(section)
    setSidebarOpen(false)
    setError('')
    setNotice('')
  }

  function startEditing() {
    setEditForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      institution: profile.institution || '',
      course: profile.course || '',
      course_level: profile.course_level || '',
      course_duration_years: profile.course_duration_years ?? '',
      year_joined: profile.year_joined ?? '',
      admission_number: profile.admission_number || '',
    })
    setError('')
    setNotice('')
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
    setEditForm({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      institution: profile.institution || '',
      course: profile.course || '',
      course_level: profile.course_level || '',
      course_duration_years: profile.course_duration_years ?? '',
      year_joined: profile.year_joined ?? '',
      admission_number: profile.admission_number || '',
    })
  }

  function handleFieldChange(event) {
    const { name, value } = event.target

    setEditForm(previous => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSaveProfile(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    const fullName = editForm.full_name.trim()
    const institution = editForm.institution.trim()
    const course = editForm.course.trim()
    const phone = editForm.phone.trim()

    if (!fullName || !institution || !course) {
      setError('Full name, institution and course are required.')
      return
    }

    const duration =
      editForm.course_duration_years === ''
        ? null
        : Number(editForm.course_duration_years)

    const yearJoined =
      editForm.year_joined === ''
        ? null
        : Number(editForm.year_joined)

    if (
      duration !== null &&
      (!Number.isFinite(duration) || duration <= 0 || duration > 15)
    ) {
      setError('Enter a valid course duration greater than 0 and not more than 15 years.')
      return
    }

    if (
      yearJoined !== null &&
      (!Number.isInteger(yearJoined) || yearJoined < 1950 || yearJoined > new Date().getFullYear())
    ) {
      setError('Enter a valid year joined.')
      return
    }

    setSaving(true)

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        setError('Your session has expired. Please log in again.')
        return
      }

      const updates = {
        full_name: fullName,
        phone: phone || null,
        institution,
        course,
        course_level: editForm.course_level || null,
        course_duration_years: duration,
        year_joined: yearJoined,
        admission_number: editForm.admission_number.trim() || null,
      }

      const { data, error: updateError } = await supabase
        .from('student_profiles')
        .update(updates)
        .eq('id', authData.user.id)
        .select(`
          registration_code,
          full_name,
          phone,
          county,
          constituency,
          ward,
          institution,
          course,
          course_level,
          course_duration_years,
          year_joined,
          admission_number,
          profile_picture_url,
          created_at
        `)
        .maybeSingle()

      if (updateError) {
        console.error('Profile update failed:', updateError.message)
        setError(
          'We could not save your changes. Please try again. If the problem continues, check your Supabase permissions.'
        )
        return
      }

      if (!data) {
        setError(
          'Your profile was not updated. Please check your Supabase update policy and column permissions.'
        )
        return
      }

      setProfile(data)
      setEditForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        institution: data.institution || '',
        course: data.course || '',
        course_level: data.course_level || '',
        course_duration_years: data.course_duration_years ?? '',
        year_joined: data.year_joined ?? '',
        admission_number: data.admission_number || '',
      })
      setEditing(false)
      setNotice('Your profile has been updated successfully.')
    } catch (err) {
      console.error('Profile update error:', err)
      setError('An unexpected error occurred while saving your profile.')
    } finally {
      setSaving(false)
    }
  }

  const formatDuration = value => {
    if (value == null || value === '') return 'Not provided'
    return `${value} ${Number(value) === 1 ? 'year' : 'years'}`
  }

  const formatDate = value => {
    if (!value) return 'Not available'

    return new Date(value).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const registrationNumber =
    profile?.registration_code || 'Pending assignment'

  const expectedCompletionYear =
    profile?.year_joined != null &&
    profile?.course_duration_years != null
      ? Number(profile.year_joined) +
        Number(profile.course_duration_years)
      : null

function renderProfilePictureEditor() {
  return (
    <section className="profile-picture-panel">
      <div className="profile-picture-preview">
        {profile?.profile_picture_url ? (
          <img
            src={profile.profile_picture_url}
            alt={`${profile.full_name || 'Student'} profile`}
            className="profile-picture-large"
          />
        ) : (
          <div className="profile-picture-placeholder-large">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
        )}
      </div>

      <div className="profile-picture-details">
        <h2>Profile Picture</h2>

        <p>
          {profile?.profile_picture_url
            ? 'Your profile picture is saved. You can replace it whenever you need to.'
            : 'You have not added a profile picture yet. Upload one to complete your TTSA profile.'}
        </p>

        <input
          ref={pictureInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleProfilePictureUpload}
          hidden
        />

        <button
          type="button"
          className="dashboard-primary-button"
          onClick={() => pictureInputRef.current?.click()}
          disabled={uploadingPicture}
        >
          {uploadingPicture
            ? 'Uploading Picture...'
            : profile?.profile_picture_url
              ? 'Change Picture'
              : 'Upload Profile Picture'}
        </button>

        <small>JPG, PNG or WebP · Maximum size: 5 MB</small>
      </div>
    </section>
  )
}

  if (loading) {
    return (
      <main className="dashboard-state">
        Loading your TTSA account...
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="dashboard-state">
        <h1>TTSA Student Portal</h1>
        <p>{error || 'Your profile could not be loaded.'}</p>
        <Link to="/login">Return to login</Link>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-layout">
        <button
          type="button"
          aria-label="Close navigation menu"
          className={`dashboard-sidebar-backdrop ${
            sidebarOpen ? 'is-visible' : ''
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`dashboard-sidebar ${
            sidebarOpen ? 'is-open' : ''
          }`}
        >
          <Link
            to="/"
            className="dashboard-sidebar-brand"
            onClick={() => setSidebarOpen(false)}
          >
           <img
  src="/ttsa-logo.png"
  alt="TTSA Logo"
  className="dashboard-brand-symbol"
/>
            <span>
              TTSA
              <span className="dashboard-brand-caption">
                STUDENT PORTAL
              </span>
            </span>
          </Link>

          <p className="dashboard-nav-label">STUDENT MENU</p>

          <nav className="dashboard-nav" aria-label="Student navigation">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                type="button"
                className={`dashboard-nav-link ${
                  activeSection === item.id ? 'active' : ''
                }`}
                onClick={() => openSection(item.id)}
                aria-current={
                  activeSection === item.id ? 'page' : undefined
                }
              >
                <span className="dashboard-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="dashboard-sidebar-bottom">
            <div className="dashboard-sidebar-user">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt=""
                  className="student-profile-picture"
                />
              ) : (
                <div className="student-profile-placeholder">
                  {profile.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
              )}

              <div className="dashboard-sidebar-user-info">
                <strong>{profile.full_name || 'TTSA Student'}</strong>
                <span>{profile.constituency || 'TTSA Member'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="dashboard-logout"
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="dashboard-main">
          <header className="dashboard-header">
            <button
              type="button"
              className="dashboard-mobile-menu"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>

            <Link to="/" className="dashboard-mobile-brand">
              TTSA
            </Link>

            <div>
              <h2 className="dashboard-header-title">
                {NAV_ITEMS.find(
                  item => item.id === activeSection
                )?.label || 'Dashboard'}
              </h2>
              <p className="dashboard-header-subtitle">
                Taita Taveta Students Association
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="dashboard-logout"
            >
              Log out
            </button>
          </header>

          <div className="dashboard-content">
            {error && (
              <p className="dashboard-error" role="alert">
                {error}
              </p>
            )}

            {notice && (
              <p className="dashboard-success" role="status">
                {notice}
              </p>
            )}

            {activeSection === 'dashboard' && (
              <>
              {renderProfilePictureEditor()}
                <p className="dashboard-eyebrow">STUDENT PORTAL</p>

                <div className="student-welcome">
                  {profile.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt={`${profile.full_name}'s profile`}
                      className="student-profile-picture"
                    />
                  ) : (
                    <div className="student-profile-placeholder">
                      {profile.full_name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                  )}

                  <div>
                    <h1>Welcome, {profile.full_name}</h1>
                    <p className="dashboard-subtitle">
                      Welcome to your TTSA membership portal. Access your
                      profile, membership card, and announcements from here.
                    </p>
                  </div>
                </div>

                <div className="dashboard-summary-grid">
                  <div className="dashboard-summary-card">
                    <span className="dashboard-summary-label">
                      Registration Number
                    </span>
                    <strong className="dashboard-summary-value">
                      {registrationNumber}
                    </strong>
                    <p className="dashboard-summary-detail">
                      Your unique TTSA member number
                    </p>
                  </div>

                  <div className="dashboard-summary-card">
                    <span className="dashboard-summary-label">
                      Constituency
                    </span>
                    <strong className="dashboard-summary-value">
                      {profile.constituency || 'Not provided'}
                    </strong>
                    <p className="dashboard-summary-detail">
                      Your constituency of registration
                    </p>
                  </div>

                  <div className="dashboard-summary-card">
                    <span className="dashboard-summary-label">
                      Member Since
                    </span>
                    <strong className="dashboard-summary-value">
                      {formatDate(profile.created_at)}
                    </strong>
                    <p className="dashboard-summary-detail">
                      Your TTSA registration date
                    </p>
                  </div>
                </div>

                <section className="profile-panel">
                  <h2>Student Overview</h2>
                  <div className="profile-grid">
                    <div>
                      <span>Institution</span>
                      <strong>{profile.institution || 'Not provided'}</strong>
                    </div>
                    <div>
                      <span>Course / Programme</span>
                      <strong>{profile.course || 'Not provided'}</strong>
                    </div>
                    <div>
                      <span>Email address</span>
                      <strong>{email || 'Not provided'}</strong>
                    </div>
                    <div>
                      <span>Membership registration</span>
                      <strong>
                        {profile.registration_code
                          ? 'Registration number assigned'
                          : 'Pending assignment'}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="dashboard-next">
                  <h2>Quick Access</h2>
                  <p>
                    Manage your personal information, access your membership
                    card, and view communications from TTSA.
                  </p>

                  <div className="dashboard-summary-grid">
                    <button
                      type="button"
                      className="dashboard-summary-card dashboard-quick-link"
                      onClick={() => openSection('profile')}
                    >
                      <strong>My Profile →</strong>
                      <p className="dashboard-summary-detail">
                        View and edit your student details
                      </p>
                    </button>

                    <button
                      type="button"
                      className="dashboard-summary-card dashboard-quick-link"
                      onClick={() => openSection('membership')}
                    >
                      <strong>Membership Card →</strong>
                      <p className="dashboard-summary-detail">
                        Access your digital membership card
                      </p>
                    </button>

                    <button
                      type="button"
                      className="dashboard-summary-card dashboard-quick-link"
                      onClick={() => openSection('notifications')}
                    >
                      <strong>Notifications →</strong>
                      <p className="dashboard-summary-detail">
                        View TTSA announcements
                      </p>
                    </button>
                  </div>
                </section>
              </>
            )}

            {activeSection === 'profile' && (
              <>
              {renderProfilePictureEditor()}
                <p className="dashboard-eyebrow">ACCOUNT DETAILS</p>
                <h1>My Profile</h1>
                <p className="dashboard-subtitle">
                  Keep your personal and education information up to date.
                </p>

                {!editing ? (
                  <>
                    <section className="profile-panel">
                      <div className="profile-section-heading">
                        <h2>Personal Information</h2>
                        <button
                          type="button"
                          className="dashboard-primary-button"
                          onClick={startEditing}
                        >
                          Edit Profile
                        </button>
                      </div>

                      <div className="profile-grid">
                        <div>
                          <span>Full name</span>
                          <strong>{profile.full_name || 'Not provided'}</strong>
                        </div>
                        <div>
                          <span>Email address</span>
                          <strong>{email || 'Not provided'}</strong>
                        </div>
                        <div>
                          <span>Phone number</span>
                          <strong>{profile.phone || 'Not provided'}</strong>
                        </div>
                        <div>
                          <span>County</span>
                          <strong>{profile.county || 'Taita Taveta'}</strong>
                        </div>
                        <div>
                          <span>Constituency</span>
                          <strong>{profile.constituency || 'Not provided'}</strong>
                        </div>
                        <div>
                          <span>Ward</span>
                          <strong>{profile.ward || 'Not provided'}</strong>
                        </div>
                      </div>
                    </section>

                    <section className="profile-panel">
                      <h2>Education Information</h2>
                      <div className="profile-grid">
                        <div>
                          <span>University / College</span>
                          <strong>{profile.institution || 'Not provided'}</strong>
                        </div>
                        <div>
                          <span>Course / Programme</span>
                          <strong>{profile.course || 'Not provided'}</strong>
                        </div>
                        <div>
                          <span>Course level</span>
                          <strong>{profile.course_level || 'Not provided'}</strong>
                        </div>
                        <div>
                          <span>Course duration</span>
                          <strong>
                            {formatDuration(profile.course_duration_years)}
                          </strong>
                        </div>
                        <div>
                          <span>Year joined</span>
                          <strong>{profile.year_joined || 'Not provided'}</strong>
                        </div>
                        <div>
                          <span>Expected completion year</span>
                          <strong>{expectedCompletionYear ?? 'Not available'}</strong>
                        </div>
                        <div>
                          <span>Admission number</span>
                          <strong>{profile.admission_number || 'Not provided'}</strong>
                        </div>
                        <div>
                          <span>Member since</span>
                          <strong>{formatDate(profile.created_at)}</strong>
                        </div>
                      </div>
                    </section>
                  </>
                ) : (
                  <form
                    className="profile-panel profile-edit-form"
                    onSubmit={handleSaveProfile}
                  >
                    <h2>Edit Personal Information</h2>
                    <p className="dashboard-form-help">
                      Update your details below. Fields marked with * are required.
                    </p>

                    <div className="profile-form-grid">
                      <label className="profile-field">
                        Full name *
                        <input
                          name="full_name"
                          type="text"
                          value={editForm.full_name}
                          onChange={handleFieldChange}
                          autoComplete="name"
                          maxLength={150}
                          required
                        />
                      </label>

                      <label className="profile-field">
                        Phone number
                        <input
                          name="phone"
                          type="tel"
                          value={editForm.phone}
                          onChange={handleFieldChange}
                          autoComplete="tel"
                          maxLength={30}
                          placeholder="e.g. 07XXXXXXXX"
                        />
                      </label>

                      <label className="profile-field">
                        Email address
                        <input
                          type="email"
                          value={email}
                          readOnly
                          disabled
                        />
                        <small>Contact support if you need to change your email.</small>
                      </label>

                      <label className="profile-field">
                        County
                        <input
                          type="text"
                          value={profile.county || 'Taita Taveta'}
                          readOnly
                          disabled
                        />
                      </label>

                      <label className="profile-field">
                        Constituency
                        <input
                          type="text"
                          value={profile.constituency || 'Not provided'}
                          readOnly
                          disabled
                        />
                      </label>

                      <label className="profile-field">
                        Ward
                        <input
                          type="text"
                          value={profile.ward || 'Not provided'}
                          readOnly
                          disabled
                        />
                      </label>
                    </div>

                    <h2 className="profile-form-subheading">
                      Education Information
                    </h2>

                    <div className="profile-form-grid">
                      <label className="profile-field">
                        University / College *
                        <input
                          name="institution"
                          type="text"
                          value={editForm.institution}
                          onChange={handleFieldChange}
                          maxLength={200}
                          required
                        />
                      </label>

                      <label className="profile-field">
                        Course / Programme *
                        <input
                          name="course"
                          type="text"
                          value={editForm.course}
                          onChange={handleFieldChange}
                          maxLength={200}
                          required
                        />
                      </label>

                      <label className="profile-field">
                        Course level
                        <select
                          name="course_level"
                          value={editForm.course_level}
                          onChange={handleFieldChange}
                        >
                          <option value="">Select course level</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Higher Diploma">Higher Diploma</option>
                          <option value="Undergraduate">Undergraduate</option>
                          <option value="Postgraduate Diploma">Postgraduate Diploma</option>
                          <option value="Masters">Masters</option>
                          <option value="PhD">PhD</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>

                      <label className="profile-field">
                        Course duration (years)
                        <input
                          name="course_duration_years"
                          type="number"
                          min="0.5"
                          max="15"
                          step="0.5"
                          value={editForm.course_duration_years}
                          onChange={handleFieldChange}
                        />
                      </label>

                      <label className="profile-field">
                        Year joined
                        <input
                          name="year_joined"
                          type="number"
                          min="1950"
                          max={new Date().getFullYear()}
                          step="1"
                          value={editForm.year_joined}
                          onChange={handleFieldChange}
                        />
                      </label>

                      <label className="profile-field">
                        Admission number
                        <input
                          name="admission_number"
                          type="text"
                          value={editForm.admission_number}
                          onChange={handleFieldChange}
                          maxLength={100}
                        />
                      </label>
                    </div>

                    <div className="profile-form-actions">
                      <button
                        type="button"
                        className="dashboard-secondary-button"
                        onClick={cancelEditing}
                        disabled={saving}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="dashboard-primary-button"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    <p className="dashboard-form-help">
                      Your TTSA registration code and county registration
                      details cannot be changed through this form.
                    </p>
                  </form>
                )}
              </>
            )}

            {activeSection === 'membership' && (
  <MembershipCard profile={profile} />
)}

           {activeSection === 'notifications' && (
  <Notifications />
)}
          </div>
        </div>
      </div>
    </main>
  )
}
