
import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import './MembershipCard.css'

export default function MembershipCard({ profile }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function formatDate(date) {
    if (!date) return 'Not available'

    return new Date(date).toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  async function handleDownload() {
    if (!profile?.registration_code) {
      setError('Your membership number has not been assigned yet.')
      return
    }

    if (!cardRef.current || downloading) return

    setDownloading(true)
    setError('')
    setSuccess('')

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#103624',
        useCORS: true,
        logging: false,
      })

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result)
          else reject(new Error('Could not create the card image.'))
        }, 'image/png')
      })

      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = downloadUrl
      link.download = `TTSA-Membership-${profile.registration_code.replaceAll('/', '-')}.png`

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)

      setSuccess('Your membership card has been downloaded.')
    } catch (err) {
      console.error('Membership card download failed:', err)
      setError(
        'We could not download your card. Please try again. If your profile photo is missing, check its image permissions.'
      )
    } finally {
      setDownloading(false)
    }
  }

  if (!profile) {
    return (
      <div className="membership-card-message">
        Your membership profile could not be loaded.
      </div>
    )
  }

  return (
    <div className="membership-page">
      <p className="dashboard-eyebrow">MEMBERSHIP SERVICES</p>
      <h1>Digital Membership Card</h1>
      <p className="dashboard-subtitle">
        View your TTSA membership identification card and download a copy
        for your records.
      </p>

      <section className="ttsa-membership-card" ref={cardRef}>
        <div className="ttsa-card-header">
         <img
  src="/ttsa-logo.png"
  alt="TTSA Logo"
  className="ttsa-card-logo"
/>

          <div className="ttsa-card-organisation">
            <strong>TTSA</strong>
            <span>TAITA TAVETA STUDENTS ASSOCIATION</span>
            <small>STUDENT MEMBERSHIP CARD</small>
          </div>
        </div>

        <div className="ttsa-card-content">
          <div className="ttsa-card-information">
            <span className="ttsa-card-label">MEMBERSHIP NUMBER</span>
            <h2>{profile.registration_code || 'PENDING'}</h2>

            <div className="ttsa-card-field">
              <span>FULL NAME</span>
              <strong>{profile.full_name || 'Not provided'}</strong>
            </div>

            <div className="ttsa-card-field">
              <span>INSTITUTION</span>
              <strong>{profile.institution || 'Not provided'}</strong>
            </div>

            <div className="ttsa-card-field">
              <span>CONSTITUENCY</span>
              <strong>{profile.constituency || 'Not provided'}</strong>
            </div>

            <div className="ttsa-card-field">
              <span>MEMBER SINCE</span>
              <strong>{formatDate(profile.created_at)}</strong>
            </div>
          </div>

          <div className="ttsa-card-portrait-wrap">
            {profile.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt={`${profile.full_name || 'Member'} portrait`}
                className="ttsa-card-portrait"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="ttsa-card-portrait-placeholder">
                {profile.full_name?.charAt(0)?.toUpperCase() || 'T'}
              </div>
            )}

            <span className="ttsa-card-member-tag">MEMBER</span>
          </div>
        </div>

        <div className="ttsa-card-footer">
          <span>TAITA TAVETA COUNTY, KENYA</span>
          <span>TTSA • STUDENT PORTAL</span>
        </div>
      </section>

      <div className="ttsa-card-actions">
        <button
          type="button"
          className="dashboard-primary-button"
          onClick={handleDownload}
          disabled={downloading || !profile.registration_code}
        >
          {downloading ? 'Preparing Download...' : '↓ Download Membership Card'}
        </button>

        {!profile.registration_code && (
          <p className="dashboard-form-help">
            Your card will be available once your registration number has
            been assigned.
          </p>
        )}

        {error && <p className="ttsa-card-error">{error}</p>}
        {success && <p className="ttsa-card-success">{success}</p>}
      </div>

      <section className="profile-panel ttsa-card-help">
        <h2>About your membership card</h2>
        <p>
          Keep a copy of your card on your phone or computer. Your membership
          number is assigned by TTSA and cannot be changed from your student
          account.
        </p>
      </section>
    </div>
  )
}
