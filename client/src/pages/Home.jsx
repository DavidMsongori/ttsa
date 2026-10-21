
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './Home.css'

import Hero from '../components/home/Hero'

const programs = [
  {
    number: '01',
    title: 'Student Leadership',
    description:
      'Develop confident student leaders through mentorship, leadership training and civic engagement.',
  },
  {
    number: '02',
    title: 'Education & Welfare',
    description:
      'Champion student interests, educational opportunities and the welfare of learners across the county.',
  },
  {
    number: '03',
    title: 'Innovation & Opportunity',
    description:
      'Connect students with skills, partnerships, opportunities and initiatives that prepare them for the future.',
  },
]

function formatDate(date) {
  if (!date) return 'Recently published'

  return new Date(date).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getExcerpt(content, limit = 150) {
  const plainText = (content || '').replace(/<[^>]*>/g, '').trim()

  if (plainText.length <= limit) return plainText
  return `${plainText.slice(0, limit).trim()}...`
}

export default function Home() {
  const [memberCount, setMemberCount] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState(false)

  useEffect(() => {
    let active = true

    async function loadHomePageData() {
      const [membersResult, announcementsResult] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('ttsa_announcements')
          .select('id, title, content, category, published_at, created_at')
          .eq('is_published', true)
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      if (!active) return

      if (!membersResult.error) {
        setMemberCount(membersResult.count ?? 0)
      }

      if (announcementsResult.error) {
        setNewsError(true)
        setAnnouncements([])
      } else {
        setAnnouncements(announcementsResult.data || [])
      }

      setNewsLoading(false)
    }

    loadHomePageData()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="ttsa-home">
      <main>   
       <Hero />
        {/* VALUES */}
        <section className="ttsa-values-strip">
          <div className="ttsa-container ttsa-values-grid">
            <div>
              <span>01</span>
              <strong>Representation</strong>
              <small>Amplifying student voices</small>
            </div>
            <div>
              <span>02</span>
              <strong>Welfare</strong>
              <small>Championing student interests</small>
            </div>
            <div>
              <span>03</span>
              <strong>Advocacy</strong>
              <small>Working for meaningful change</small>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="ttsa-section" id="about">
          <div className="ttsa-container ttsa-about-grid">
            <div>
              <span className="ttsa-kicker">WHO WE ARE</span>
              <h2>
                A stronger student community starts with <span>us.</span>
              </h2>
            </div>

            <div className="ttsa-about-copy">
              <p>
                TTSA brings together students connected to Taita Taveta
                to strengthen student representation, champion welfare
                and amplify the collective voice of learners.
              </p>
              <p>
                Through collaboration, advocacy and meaningful
                engagement, we seek to address student concerns and
                build a more connected and empowered student community.
              </p>
              <Link to="/about" className="ttsa-inline-link">
                Learn more about TTSA →
              </Link>
            </div>
          </div>
        </section>

        {/* IMPACT */}
        <section className="ttsa-impact-section">
          <div className="ttsa-container">
            <div className="ttsa-section-heading">
              <div>
                <span className="ttsa-kicker">OUR COLLECTIVE STRENGTH</span>
                <h2>A stronger voice, together.</h2>
              </div>
              <p>
                Every student adds strength to our collective voice
                and our ability to advocate for meaningful change.
              </p>
            </div>

            <div className="ttsa-impact-grid">
              <article className="ttsa-impact-card">
                <span className="ttsa-impact-symbol">◎</span>
                <strong className="ttsa-impact-number">
                  {memberCount === null
                    ? '—'
                    : memberCount.toLocaleString('en-KE')}
                </strong>
                <span className="ttsa-impact-label">
                  Registered Student Members
                </span>
              </article>

              <article className="ttsa-impact-card">
                <span className="ttsa-impact-symbol">⌂</span>
                <strong className="ttsa-impact-number">—</strong>
                <span className="ttsa-impact-label">
                  Institutions Represented
                </span>
                <small>Official figure to be confirmed</small>
              </article>

              <article className="ttsa-impact-card">
                <span className="ttsa-impact-symbol">✦</span>
                <strong className="ttsa-impact-number">—</strong>
                <span className="ttsa-impact-label">
                  Programs Delivered
                </span>
                <small>Official figure to be confirmed</small>
              </article>

              <article className="ttsa-impact-card">
                <span className="ttsa-impact-symbol">↗</span>
                <strong className="ttsa-impact-number">—</strong>
                <span className="ttsa-impact-label">
                  Students Reached
                </span>
                <small>Official figure to be confirmed</small>
              </article>
            </div>
          </div>
        </section>

        {/* PROGRAMS */}
        <section className="ttsa-section ttsa-programs" id="programs">
          <div className="ttsa-container">
            <div className="ttsa-section-heading">
              <div>
                <span className="ttsa-kicker">WHAT WE DO</span>
                <h2>Creating impact beyond the classroom.</h2>
              </div>
              <p>
                Building pathways for students to participate,
                develop their potential and contribute to the community.
              </p>
            </div>

            <div className="ttsa-program-grid">
              {programs.map((program) => (
                <article
                  className="ttsa-program-card"
                  key={program.number}
                >
                  <span className="ttsa-program-number">
                    {program.number}
                  </span>
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                  <Link to="/programs">
                    Explore programs <span>→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* LEADERSHIP */}
        <section className="ttsa-section ttsa-leadership-section">
          <div className="ttsa-container ttsa-leadership-inner">
            <div className="ttsa-leadership-mark" aria-hidden="true">
              <span>TTSA</span>
              <strong>Leadership</strong>
            </div>

            <div className="ttsa-leadership-copy">
              <span className="ttsa-kicker">LEADERSHIP & GOVERNANCE</span>
              <h2>Leadership that listens. Representation that matters.</h2>
              <p>
                Meet the leaders working to represent student interests,
                champion welfare and strengthen the voice of Taita Taveta
                students.
              </p>
              <Link to="/leadership" className="ttsa-button">
                Meet Our Leaders <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* LATEST ANNOUNCEMENTS */}
        <section className="ttsa-section ttsa-news-section" id="news">
          <div className="ttsa-container">
            <div className="ttsa-section-heading">
              <div>
                <span className="ttsa-kicker">STAY INFORMED</span>
                <h2>News, updates and opportunities.</h2>
              </div>
              <Link to="/news" className="ttsa-inline-link">
                View all updates →
              </Link>
            </div>

            {newsLoading ? (
              <p className="ttsa-news-message" role="status">
                Loading the latest announcements...
              </p>
            ) : newsError ? (
              <div className="ttsa-news-message" role="status">
                <p>
                  Announcements are temporarily unavailable. Please visit
                  the News page to check for updates.
                </p>
                <Link to="/news" className="ttsa-inline-link">
                  Visit News & Updates →
                </Link>
              </div>
            ) : announcements.length === 0 ? (
              <div className="ttsa-news-message">
                <h3>No new announcements yet</h3>
                <p>
                  Check back soon for TTSA news, events and student
                  opportunities.
                </p>
              </div>
            ) : (
              <div className="ttsa-news-grid">
                {announcements.map((announcement) => (
                  <article
                    className="ttsa-news-card"
                    key={announcement.id}
                  >
                    <div className="ttsa-news-meta">
                      <span className="ttsa-news-category">
                        {announcement.category || 'General'}
                      </span>
                      <time
                        dateTime={
                          announcement.published_at ||
                          announcement.created_at
                        }
                      >
                        {formatDate(
                          announcement.published_at ||
                          announcement.created_at
                        )}
                      </time>
                    </div>

                    <h3>{announcement.title}</h3>
                    <p>{getExcerpt(announcement.content)}</p>

                    <Link
                      to="/news"
                      className="ttsa-inline-link"
                      aria-label={`Read ${announcement.title} on the News page`}
                    >
                      Read announcement →
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* MEMBERSHIP CTA */}
        <section className="ttsa-membership" id="membership">
          <div className="ttsa-container ttsa-membership-inner">
            <div>
              <span className="ttsa-kicker ttsa-kicker-light">
                YOUR COMMUNITY. YOUR FUTURE.
              </span>
              <h2>
                Your voice matters.
                <br />
                Your journey matters.
              </h2>
              <p>
                Join the TTSA student community, make your voice heard
                and participate in building a stronger student association.
              </p>
            </div>

            <div className="ttsa-membership-actions">
              <Link
                to="/register"
                className="ttsa-button ttsa-button-light"
              >
                Become a Member <span>→</span>
              </Link>
              <Link to="/login" className="ttsa-membership-login">
                Already registered? Log in
              </Link>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="ttsa-section ttsa-contact" id="contact">
          <div className="ttsa-container ttsa-contact-inner">
            <div>
              <span className="ttsa-kicker">LET'S CONNECT</span>
              <h2>Be part of the conversation.</h2>
              <p>
                Have a student concern, an idea, or a proposal for
                collaboration? Get in touch with TTSA.
              </p>
            </div>

            <Link to="/contact" className="ttsa-button">
              Contact TTSA <span>→</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
