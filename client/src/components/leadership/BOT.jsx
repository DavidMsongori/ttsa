
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import LeaderCard from './LeaderCard'
import './BOT.css'

const BOT_POSITIONS = [
  {
    value: 'CEO',
    title: 'Chief Executive Officer',
    subtitle: 'Founder of TTSA',
    seats: 1,
  },
  {
    value: 'Director',
    title: 'Directors',
    subtitle: 'Co-Founders of TTSA',
    seats: 4,
  },
  {
    value: 'Alumni Representative',
    title: 'Alumni Representatives',
    subtitle: 'Representing TTSA alumni',
    seats: 2,
  },
]

export default function BOT() {
  const [members, setMembers] = useState([])
  const [president, setPresident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadBoard() {
      setLoading(true)
      setError('')

      try {
        const [membersResult, presidentResult] = await Promise.all([
          supabase
            .from('board_of_trustees')
            .select(
              'id, full_name, position, seat_number, image_url, display_order'
            )
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .order('seat_number', { ascending: true }),

          supabase
            .from('leadership_assignments')
            .select('student_id')
            .eq('is_current', true)
            .eq('committee_type', 'county')
            .eq('position', 'President')
            .limit(1)
            .maybeSingle(),
        ])

        if (membersResult.error) throw membersResult.error
        if (presidentResult.error) throw presidentResult.error

        let presidentProfile = null

        if (presidentResult.data?.student_id) {
          const { data, error: profileError } = await supabase
            .from('student_profiles')
            .select('id, full_name, profile_picture_url')
            .eq('id', presidentResult.data.student_id)
            .maybeSingle()

          if (profileError) throw profileError

          presidentProfile = data
        }

        if (!cancelled) {
          setMembers(membersResult.data || [])
          setPresident(presidentProfile)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              'The Board of Trustees information could not be loaded.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBoard()

    return () => {
      cancelled = true
    }
  }, [])

  function getSubtitle(member) {
    if (member.position === 'CEO') return 'Founder'
    if (member.position === 'Director') return 'Co-Founder'

    return `Alumni Representative ${member.seat_number}`
  }

  function renderGroup(group) {
    const groupMembers = members
      .filter((member) => member.position === group.value)
      .sort((a, b) => a.seat_number - b.seat_number)

    return (
      <section
        className={`ttsa-bot-public-group ttsa-bot-${group.value
          .toLowerCase()
          .replaceAll(' ', '-')}-group`}
        key={group.value}
      >
        <div className="ttsa-bot-public-group-heading">
          <div>
            <span className="ttsa-bot-public-group-kicker">
              {group.value === 'CEO'
                ? 'EXECUTIVE FOUNDER'
                : group.value === 'Director'
                  ? 'FOUNDING LEADERSHIP'
                  : 'ALUMNI VOICE'}
            </span>

            <h3>{group.title}</h3>
            <p>{group.subtitle}</p>
          </div>

          <span className="ttsa-bot-public-seat-count">
            {groupMembers.length} of {group.seats}
          </span>
        </div>

        {groupMembers.length > 0 ? (
          <div
            className={`ttsa-bot-public-grid ttsa-bot-grid-${group.value
              .toLowerCase()
              .replaceAll(' ', '-')}`}
          >
            {groupMembers.map((member) => (
              <LeaderCard
                key={member.id}
                leader={{
                  id: member.id,
                  full_name: member.full_name,
                  position: group.value,
                  profile_picture_url: member.image_url,
                  constituency: getSubtitle(member),
                }}
              />
            ))}
          </div>
        ) : (
          <div className="ttsa-bot-public-empty">
            <p>
              {group.title} will appear here once appointments have
              been published.
            </p>
          </div>
        )}
      </section>
    )
  }

  return (
    <section className="ttsa-bot-public-section" id="board-of-trustees">
      <div className="ttsa-bot-public-container">
        <header className="ttsa-bot-public-heading">
          <span className="ttsa-bot-public-eyebrow">
            GOVERNANCE &amp; OVERSIGHT
          </span>

          <h2>
            Board of <span>Trustees</span>
          </h2>

          <p>
            Meet the founders, alumni representatives and directors
            providing strategic guidance and long-term direction for
            the Taita Taveta Students Association.
          </p>

          <div className="ttsa-bot-public-heading-rule">
            <span />
          </div>
        </header>

        {loading ? (
          <div className="ttsa-bot-public-message" role="status">
            <span className="ttsa-bot-public-loader" />
            <p>Loading Board of Trustees...</p>
          </div>
        ) : error ? (
          <div
            className="ttsa-bot-public-message ttsa-bot-public-error"
            role="alert"
          >
            <h3>Board information temporarily unavailable</h3>
            <p>
              Please try again later or contact the TTSA website
              administrator.
            </p>
          </div>
        ) : (
          <div className="ttsa-bot-public-rows">
            {/* ROW 1: CEO AND DIRECTORS */}
            <div className="ttsa-bot-public-row ttsa-bot-row-founders">
              {renderGroup(BOT_POSITIONS[0])}
              {renderGroup(BOT_POSITIONS[1])}
            </div>

            {/* ROW 2: ALUMNI AND BOARD SECRETARY */}
            <div className="ttsa-bot-public-row ttsa-bot-row-representation">
              {renderGroup(BOT_POSITIONS[2])}

              <section className="ttsa-bot-public-group ttsa-bot-secretary-group">
                <div className="ttsa-bot-public-group-heading">
                  <div>
                    <span className="ttsa-bot-public-group-kicker">
                      EX-OFFICIO MEMBERSHIP
                    </span>

                    <h3>Board Secretary</h3>
                    <p>
                      TTSA President serving in an ex-officio capacity
                    </p>
                  </div>
                </div>

                {president ? (
                  <div className="ttsa-bot-public-grid ttsa-bot-grid-president">
                    <LeaderCard
                      leader={{
                        id: president.id,
                        full_name: president.full_name,
                        position: 'Board Secretary (Ex-Officio)',
                        profile_picture_url:
                          president.profile_picture_url,
                        constituency: 'TTSA President',
                      }}
                    />
                  </div>
                ) : (
                  <div className="ttsa-bot-public-empty">
                    <p>
                      The current TTSA President will appear here when
                      a President is appointed in the County Committee.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
