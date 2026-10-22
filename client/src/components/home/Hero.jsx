
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

const HERO_SLIDES = [
  {
    image: '/images/hero-1.jpg',
    eyebrow: 'The Voice of Taita Taveta Students',
    title: 'One Voice.',
    highlight: 'Shared Future.',
    description:
      'Bringing students together to speak with one voice, champion their interests and shape a better future for Taita Taveta.',
  },
  {
    image: '/images/hero-2.jpg',
    eyebrow: 'Together We Can Achieve More',
    title: 'Stronger Students.',
    highlight: 'Stronger Community.',
    description:
      'Building connections across institutions, empowering student leaders and creating opportunities for every student.',
  },
  {
    image: '/images/hero-3.jpg',
    eyebrow: 'Leadership. Welfare. Advocacy.',
    title: 'Your Voice.',
    highlight: 'Your Future.',
    description:
      'Championing student welfare, accountable leadership and meaningful representation throughout Taita Taveta County.',
  },
  {
    image: '/images/hero-4.jpg',
    eyebrow: 'United for a Common Purpose',
    title: 'Together We Lead.',
    highlight: 'Together We Grow.',
    description:
      'A united student community committed to service, opportunity and a brighter future for Taita Taveta.',
  },
]

const SLIDE_INTERVAL = 5000

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0)

  const currentSlide = HERO_SLIDES[activeSlide]

  // Automatically change slides every 5 seconds.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % HERO_SLIDES.length)
    }, SLIDE_INTERVAL)

    return () => window.clearInterval(interval)
  }, [])

  function showPrevious() {
    setActiveSlide(
      (current) =>
        (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
    )
  }

  function showNext() {
    setActiveSlide((current) => (current + 1) % HERO_SLIDES.length)
  }

  return (
    <section
      className="ttsa-hero-modern"
      aria-label="TTSA introduction"
    >
      <div className="ttsa-hero-slides" aria-hidden="true">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.image}
            className={`ttsa-hero-slide ${
              index === activeSlide ? 'is-active' : ''
            }`}
            style={{ backgroundImage: `url("${slide.image}")` }}
          />
        ))}
      </div>

      <div className="ttsa-hero-shade" />

      <div className="ttsa-hero-content ttsa-container" key={activeSlide}>
        <span className="ttsa-hero-eyebrow">
          {currentSlide.eyebrow}
        </span>

        <h1>
          {currentSlide.title}
          <span>{currentSlide.highlight}</span>
        </h1>

        <h2>
          United for Student Representation, Welfare and Advocacy.
        </h2>

        <p>{currentSlide.description}</p>

        <div className="ttsa-hero-buttons">
          <Link to="/register" className="ttsa-hero-primary">
            Become a Member <span aria-hidden="true">→</span>
          </Link>

          <Link to="/about" className="ttsa-hero-secondary">
            Discover TTSA
          </Link>
        </div>

        <div className="ttsa-hero-caption">
          <span className="ttsa-hero-caption-line" />
          <span>United Students. Stronger Representation.</span>
        </div>
      </div>

      <div className="ttsa-hero-controls" aria-label="Slideshow controls">
        <button
          type="button"
          className="ttsa-hero-arrow"
          onClick={showPrevious}
          aria-label="Previous slide"
        >
          &#8592;
        </button>

        <div className="ttsa-hero-dots">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              className={`ttsa-hero-dot ${
                index === activeSlide ? 'is-active' : ''
              }`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === activeSlide ? 'true' : undefined}
            />
          ))}
        </div>

        <button
          type="button"
          className="ttsa-hero-arrow"
          onClick={showNext}
          aria-label="Next slide"
        >
          &#8594;
        </button>
      </div>

      <a
        className="ttsa-hero-scroll"
        href="#about"
        aria-label="Scroll to learn about TTSA"
      >
        <span />
        Scroll to explore
      </a>
    </section>
  )
}
