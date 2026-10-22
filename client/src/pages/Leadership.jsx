
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Leadership.css'

import Hero from '../components/leadership/Hero'
import County from '../components/leadership/County'
import Constituency from '../components/leadership/Constituency'
import Vacant from '../components/leadership/Vacant'
import BOT from '../components/leadership/BOT'

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

const CONSTITUENCIES = [
  'Voi',
  'Wundanyi',
  'Mwatate',
  'Taveta',
]

function LeaderCard({ leader }) {
  return (
    <article className="ttsa-public-leader-card">
      {leader.profile_picture_url ? (
        <img
          className="ttsa-public-leader-photo"
          src={leader.profile_picture_url}
          alt={leader.full_name}
          loading="lazy"
        />
      ) : (
        <div className="ttsa-public-leader-photo ttsa-public-leader-avatar">
          {leader.full_name?.charAt(0)?.toUpperCase() || 'T'}
        </div>
      )}

      <div className="ttsa-public-leader-info">
        <span className="ttsa-public-leader-position">
          {leader.position}
        </span>
        <h3>{leader.full_name || 'TTSA Leader'}</h3>
        {leader.constituency && (
          <p>{leader.constituency} Constituency</p>
        )}
      </div>
    </article>
  )
}

function VacancyCard({ position, constituency }) {
  return (
    <article className="ttsa-vacancy-card">
      <div className="ttsa-vacancy-icon" aria-hidden="true">＋</div>
      <div>
        <span className="ttsa-vacancy-status">Position vacant</span>
        <h4>{position}</h4>
        <p>
          {constituency
            ? `${constituency} Constituency Committee`
            : 'County Committee'}
        </p>
      </div>
    </article>
  )
}

export default function Leadership() {
  const [assignments, setAssignments] = useState([])
  const [leaders, setLeaders] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function fetchLeadership() {
      setLoading(true)
      setError('')

      try {
        const { data: assignmentData, error: assignmentError } =
          await supabase
            .from('leadership_assignments')
            .select(
              'id, student_id, committee_type, position, constituency, appointed_at'
            )
            .eq('is_current', true)
            .order('appointed_at', { ascending: true })

        if (assignmentError) throw assignmentError

        const currentAssignments = assignmentData || []
        const studentIds = [
          ...new Set(currentAssignments.map((item) => item.student_id)),
        ]

        let profilesById = {}

        if (studentIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('student_profiles')
            .select('id, full_name, profile_picture_url')
            .in('id', studentIds)

          if (profileError) throw profileError

          profilesById = Object.fromEntries(
            (profileData || []).map((profile) => [
              profile.id,
              profile,
            ])
          )
        }

        const enrichedAssignments = currentAssignments.map((item) => ({
          ...item,
          ...(profilesById[item.student_id] || {}),
        }))

        if (active) {
          setAssignments(enrichedAssignments)
          setLeaders(profilesById)
        }
      } catch (err) {
        console.error('Unable to load TTSA leadership:', err.message)

        if (active) {
          setError(
            'We could not load the leadership directory. Please refresh the page and try again.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchLeadership()

    return () => {
      active = false
    }
  }, [])

  const countyLeaders = assignments.filter(
    (item) => item.committee_type === 'county'
  )

  const constituencyLeaders = assignments.filter(
    (item) => item.committee_type === 'constituency'
  )

  const countyVacancies = COUNTY_POSITIONS.filter(
    (position) =>
      !countyLeaders.some((leader) => leader.position === position)
  )

  const constituencyVacancies = CONSTITUENCIES.flatMap((constituency) =>
    CONSTITUENCY_POSITIONS.filter(
      (position) =>
        !constituencyLeaders.some(
          (leader) =>
            leader.position === position &&
            leader.constituency?.toLowerCase() ===
              constituency.toLowerCase()
        )
    ).map((position) => ({
      position,
      constituency,
    }))
  )

  return (
    <main className="ttsa-public-leadership">
      {/* HERO */}
     <Hero /> 

      {/* COUNTY COMMITTEE */}
      <County
  countyLeaders={countyLeaders}
  loading={loading}
  error={error}
/> 

      {/* CONSTITUENCY COMMITTEES */}
      <Constituency
  constituencyLeaders={constituencyLeaders}
  loading={loading}
  error={error}
/>


      {/* VACANT POSITIONS */}
    <Vacant
  countyVacancies={countyVacancies}
  constituencyVacancies={constituencyVacancies}
  loading={loading}
  error={error}
/>

        {/* BOARD OF TRUSTEES */}   
        <BOT /> 

      {/* CTA */}
      <section className="ttsa-leadership-cta">
        <div className="ttsa-leadership-cta-inner">
          <span className="ttsa-leadership-eyebrow">
            YOUR VOICE. YOUR FUTURE.
          </span>

          <h2>Stronger students. Stronger representation.</h2>

          <p>
            TTSA exists to bring students together, champion their
            interests and build a more connected student community.
          </p>

          <div className="ttsa-leadership-cta-actions">
            <Link to="/register" className="ttsa-leadership-cta-primary">
              Join TTSA <span aria-hidden="true">→</span>
            </Link>

            <Link to="/" className="ttsa-leadership-cta-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
