
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './Impact.css'

export default function Impact() {
  const [memberCount, setMemberCount] = useState(null)

  useEffect(() => {
    let isMounted = true

    
async function fetchMemberCount() {
  const { data, error } = await supabase.rpc(
    'get_public_member_count'
  )

  if (error) {
    console.error(
      'Unable to fetch TTSA member count:',
      error.message
    )
    return
  }

  if (isMounted) {
    setMemberCount(Number(data ?? 0))
  }
}


    fetchMemberCount()

    return () => {
      isMounted = false
    }
  }, [])

  const impactItems = [
    {
      symbol: '◎',
      number:
        memberCount === null
          ? '—'
          : memberCount.toLocaleString('en-KE'),
      label: 'Registered Student Members',
      note: '',
    },
    {
      symbol: '⌂',
      number: '—',
      label: 'Institutions Represented',
      note: 'Official figure to be confirmed',
    },
    {
      symbol: '✦',
      number: '—',
      label: 'Programs Delivered',
      note: 'Official figure to be confirmed',
    },
    {
      symbol: '↗',
      number: '—',
      label: 'Students Reached',
      note: 'Official figure to be confirmed',
    },
  ]

  return (
    <section className="ttsa-impact-section" id="impact">
      <div className="ttsa-container ttsa-impact-container">
        <div className="ttsa-section-heading ttsa-impact-heading">
          <div className="ttsa-impact-title">
            <span className="ttsa-kicker">
              OUR COLLECTIVE STRENGTH
            </span>

            <h2>
              A stronger voice, <span>together.</span>
            </h2>
          </div>

          <p>
            Every student adds strength to our collective voice
            and our ability to advocate for meaningful change.
          </p>
        </div>

        <div className="ttsa-impact-grid">
          {impactItems.map((item) => (
            <article
              className="ttsa-impact-card"
              key={item.label}
            >
              <span
                className="ttsa-impact-symbol"
                aria-hidden="true"
              >
                {item.symbol}
              </span>

              <strong
                className="ttsa-impact-number"
                aria-live={
                  item.label === 'Registered Student Members'
                    ? 'polite'
                    : 'off'
                }
              >
                {item.number}
              </strong>

              <span className="ttsa-impact-label">
                {item.label}
              </span>

              {item.note && (
                <small className="ttsa-impact-note">
                  {item.note}
                </small>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
