
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './LeadershipSection.css'

export default function LeadershipSection() {
  const [president, setPresident] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function fetchPresident() {
      try {
        const { data: assignment, error: assignmentError } = await supabase
          .from('leadership_assignments')
          .select('student_id, position')
          .eq('committee_type', 'county')
          .eq('position', 'President')
          .eq('is_current', true)
          .maybeSingle()

        if (assignmentError) throw assignmentError

        if (!assignment) {
          if (active) setPresident(null)
          return
        }

        const { data: student, error: studentError } = await supabase
          .from('student_profiles')
          .select('id, full_name, profile_picture_url')
          .eq('id', assignment.student_id)
          .maybeSingle()

        if (studentError) throw studentError

        if (active && student) {
          setPresident({
            ...student,
            position: assignment.position,
          })
        }
      } catch (error) {
        console.error('Unable to load TTSA President:', error.message)
        if (active) setPresident(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchPresident()

    return () => {
      active = false
    }
  }, [])

  return (
    <section
      className="ttsa-section ttsa-leadership-section"
      id="leadership"
    >
      <div className="ttsa-container ttsa-leadership-inner">
        <div className="ttsa-leadership-copy">
          <span className="ttsa-kicker">
            LEADERSHIP &amp; GOVERNANCE
          </span>

          <h2>
            Leadership that listens.
            <br />
            Representation that matters.
          </h2>

          <p>
            Meet the leaders working to represent student interests,
            champion welfare and strengthen the voice of Taita Taveta
            students.
          </p>

          <Link to="/leadership" className="ttsa-button">
            Meet Our Leaders <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="ttsa-home-president">
          <div className="ttsa-home-president-label">
            <span className="ttsa-home-president-dot" />
            COUNTY PRESIDENT
          </div>

          {loading ? (
            <div className="ttsa-home-president-placeholder">
              Loading President's profile...
            </div>
          ) : president ? (
            <div className="ttsa-home-president-content">
              {president.profile_picture_url ? (
                <img
                  className="ttsa-home-president-photo"
                  src={president.profile_picture_url}
                  alt={president.full_name}
                  loading="lazy"
                />
              ) : (
                <div className="ttsa-home-president-photo ttsa-home-president-no-photo">
                  {president.full_name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
              )}

              <div className="ttsa-home-president-details">
                <span className="ttsa-home-president-role">
                  {president.position}
                </span>

                <h3>{president.full_name}</h3>

                <Link to="/leadership">
                  View leadership team <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="ttsa-home-president-placeholder">
              <div className="ttsa-home-president-no-photo">
                <span>TTSA</span>
              </div>

              <h3>Meet Our Leadership</h3>

              <p>
                The County President's profile will appear here once
                an appointment has been published.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
