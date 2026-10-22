
import { Link } from 'react-router-dom'
import './About.css'

export default function About() {
  return (
    <section className="ttsa-section ttsa-about" id="about">
      <div className="ttsa-container ttsa-about-grid">
        {/* Left column */}
        <div className="ttsa-about-heading">
          <span className="ttsa-kicker">WHO WE ARE</span>

          <h2>
            A stronger student community starts with <span>us.</span>
          </h2>

          <div className="ttsa-about-accent" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* Right column */}
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
            Learn more about TTSA
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
