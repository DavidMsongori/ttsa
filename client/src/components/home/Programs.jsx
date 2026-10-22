
import { Link } from 'react-router-dom'
import './Programs.css'

const programs = [
  {
    number: '01',
    title: 'Student Welfare',
    description:
      'Champion student welfare, address shared concerns and promote a supportive student community.',
  },
  {
    number: '02',
    title: 'Leadership & Governance',
    description:
      'Develop responsible student leaders through leadership development, collaboration and representation.',
  },
  {
    number: '03',
    title: 'Education & Opportunities',
    description:
      'Connect students to educational opportunities, useful resources and pathways for personal growth.',
  },
]

export default function Programs() {
  return (
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

              <Link to="/programs" className="ttsa-program-link">
                Explore programs <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
