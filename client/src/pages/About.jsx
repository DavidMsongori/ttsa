
import { Link } from 'react-router-dom'
import './About.css'

const values = [
  {
    number: '01',
    title: 'Unity',
    description:
      'Bringing students together across institutions and communities to strengthen solidarity and promote a shared student voice.',
  },
  {
    number: '02',
    title: 'Peace',
    description:
      'Promoting peaceful coexistence, dialogue and harmony among students and the wider community.',
  },
  {
    number: '03',
    title: 'Integrity, Transparency & Accountability',
    description:
      'Upholding honesty, openness and responsible leadership in all TTSA activities and decisions.',
  },
  {
    number: '04',
    title: 'Teamwork',
    description:
      'Encouraging collaboration, shared responsibility and collective action to achieve the association’s objectives.',
  },
  {
    number: '05',
    title: 'Respect',
    description:
      'Valuing every student’s dignity, opinions, diversity and contribution, while fostering mutual understanding.',
  },
]

const focusAreas = [
  {
    icon: '◈',
    title: 'Unity & Student Solidarity',
    description:
      'Promoting unity among university, college and TVET students from Taita Taveta County, regardless of ethnicity, religion, gender, age or social status.',
  },
  {
    icon: '↗',
    title: 'Leadership & Mentorship',
    description:
      'Connecting students with local and national leaders for guidance, mentorship and leadership development to prepare the next generation of leaders.',
  },
  {
    icon: '◎',
    title: 'Student Advocacy & Representation',
    description:
      'Providing a collective platform for students to raise grievances, advocate for their interests and engage relevant authorities on matters affecting them.',
  },
  {
    icon: '✳',
    title: 'Opportunities & Student Welfare',
    description:
      'Expanding awareness and access to bursaries, youth funds and other opportunities while mobilising support for students’ social welfare.',
  },
  {
    icon: '⌂',
    title: 'Youth Empowerment & Innovation',
    description:
      'Building entrepreneurial skills, professional competence and problem-solving capacity through training, networking and youth exchange forums.',
  },
  {
    icon: '◇',
    title: 'Civic Engagement, Peace & Community Development',
    description:
      'Promoting civic participation, peaceful coexistence and community outreach while empowering students to drive positive social and economic change.',
  },
]

export default function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-overlay" />
        <div className="about-container about-hero-inner">
          <span className="about-eyebrow">
            TAITA TAVETA STUDENTS ASSOCIATION
          </span>

          <h1>
            One Association.
            <br />
            <span>One Student Voice.</span>
          </h1>

          <p>
            Bringing students together, championing their interests and
            building opportunities for the next generation of leaders
            from Taita Taveta County.
          </p>

          <div className="about-hero-actions">
            <Link to="/register" className="about-btn about-btn-light">
              Become a Member <span>→</span>
            </Link>
            <a href="#who-we-are" className="about-btn about-btn-outline">
              Discover TTSA
            </a>
          </div>

          <div className="about-hero-note">
            <span className="about-live-dot" />
            A united voice for students and their future
          </div>
        </div>
      </section>

      <section id="who-we-are" className="about-intro about-section">
        <div className="about-container about-intro-grid">
          <div className="about-intro-heading">
            <span className="about-eyebrow about-eyebrow-green">
              WHO WE ARE
            </span>
            <h2>
              Students united by a <span>shared future.</span>
            </h2>
            <div className="about-heading-line" />
          </div>

          <div className="about-intro-copy">
            <p>
              The Taita Taveta Students Association (TTSA) is a student
              association dedicated to bringing together students from
              Taita Taveta County and strengthening their collective voice.
            </p>
            <p>
              We believe students are not only beneficiaries of education
              but also partners in shaping their communities and the
              future of the county. Through representation, collaboration
              and leadership, TTSA seeks to help students connect with
              opportunities and participate meaningfully in development.
            </p>
            <p>
              Our goal is to foster a connected student community where
              every member can contribute, grow and help create lasting
              positive change.
            </p>
          </div>
        </div>
      </section>

      <section className="about-purpose about-section">
  <div className="about-container">
    <div className="about-purpose-intro">
      <span className="about-section-eyebrow">OUR PURPOSE</span>
      <h2>Driven by Purpose.<br />United by a Vision.</h2>
      <p>
        Guiding our commitment to empower students and build a stronger
        future for Taita Taveta.
      </p>
    </div>

    <div className="about-purpose-grid">
      <article className="about-purpose-card about-mission">
        <div className="about-purpose-top">
          <div className="about-purpose-icon">◎</div>
          <span className="about-card-label">OUR MISSION</span>
        </div>

        <h3>Empowering Youth. Strengthening Communities.</h3>

        <div className="about-purpose-line" />

        <p>
          To build and strengthen peaceful interactions within society
          through youth empowerment trainings, awareness creation,
          advocacy and collaborations.
        </p>

        <span className="about-purpose-number">01</span>
      </article>

      <article className="about-purpose-card about-vision">
        <div className="about-purpose-top">
          <div className="about-purpose-icon">✧</div>
          <span className="about-card-label">OUR VISION</span>
        </div>

        <h3>A Future of Competent and Reliable Graduates.</h3>

        <div className="about-purpose-line" />

        <p>
          To make Taita Taveta shine in producing competent and reliable
          graduates who contribute meaningfully to society.
        </p>

        <span className="about-purpose-number">02</span>
      </article>
    </div>
  </div>
</section>

      <section className="about-values about-section">
        <div className="about-container">
          <div className="about-section-heading">
            <span className="about-eyebrow about-eyebrow-green">
              WHAT GUIDES US
            </span>
            <h2>Our core values</h2>
            <p>
              Our core values shall be the principles that will guide the internal and external actions of TTSA 
and drive our accountability to each other and our stakeholders. 
            </p>
          </div>

          <div className="about-values-grid">
            {values.map((value) => (
              <article className="about-value-card" key={value.number}>
                <span className="about-value-number">{value.number}</span>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-focus about-section">
        <div className="about-container">
          <div className="about-section-heading about-focus-heading">
            <span className="about-eyebrow">
              HOW WE MAKE A DIFFERENCE
            </span>
            <h2>Our areas of focus</h2>
            <p>
              Building a stronger student community through representation,
              collaboration and practical action.
            </p>
          </div>

          <div className="about-focus-grid">
            {focusAreas.map((area) => (
              <article className="about-focus-card" key={area.title}>
                <div className="about-focus-icon">{area.icon}</div>
                <h3>{area.title}</h3>
                <p>{area.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-commitment about-section">
        <div className="about-container about-commitment-inner">
          <span className="about-eyebrow about-eyebrow-green">
            OUR COMMITMENT
          </span>
          <h2>
            Every student deserves a voice, an opportunity and a chance
            to lead.
          </h2>
          <p>
            TTSA is committed to building bridges between students,
            institutions and stakeholders so that student concerns are
            heard and student potential can be realised.
          </p>
        </div>
      </section>

      <section className="about-cta">
        <div className="about-container about-cta-inner">
          <div>
            <span className="about-eyebrow">
              BE PART OF THE MOVEMENT
            </span>
            <h2>Your voice belongs here.</h2>
            <p>
              Join the TTSA community and take part in building a better
              future for students across Taita Taveta County.
            </p>
          </div>

          <div className="about-cta-actions">
            <Link to="/register" className="about-btn about-btn-light">
              Register Now <span>→</span>
            </Link>
            <Link to="/news" className="about-btn about-btn-outline">
              Explore News
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
