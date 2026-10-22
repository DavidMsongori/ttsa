
import './Hero.css'

export default function Hero() {
  return (
    <section className="ttsa-leadership-hero">
      <div className="ttsa-leadership-hero-inner">
        <span className="ttsa-leadership-eyebrow">
          TTSA · LEADERSHIP &amp; GOVERNANCE
        </span>

        <h1>
          Meet the leaders
          <br />
          <span>representing our students.</span>
        </h1>

        <p>
          Discover the student leaders working to champion welfare,
          strengthen representation and create opportunities for
          students across Taita Taveta County.
        </p>

        <a
          href="#county-committee"
          className="ttsa-leadership-hero-link"
        >
          Explore our leadership
          <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  )
}
