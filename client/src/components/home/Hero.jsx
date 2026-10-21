
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

const VIDEO_ID = 'l_UwsECR6cE'
const START_SECONDS = 30
const END_SECONDS = 50

export default function Hero() {
  const playerContainerRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let intervalId

    const createPlayer = () => {
      if (cancelled || !playerContainerRef.current || playerRef.current) {
        return
      }

      const player = new window.YT.Player(playerContainerRef.current, {
        width: '100%',
        height: '100%',
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          mute: 1,
          playsinline: 1,
          rel: 0,
          start: START_SECONDS,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) {
              event.target.destroy()
              return
            }

            playerRef.current = event.target
            event.target.mute()
            event.target.seekTo(START_SECONDS, true)
            event.target.playVideo()

            intervalId = window.setInterval(() => {
              const currentPlayer = playerRef.current

              if (
                !currentPlayer ||
                typeof currentPlayer.getCurrentTime !== 'function'
              ) {
                return
              }

              if (currentPlayer.getCurrentTime() >= END_SECONDS) {
                currentPlayer.seekTo(START_SECONDS, true)
                currentPlayer.playVideo()
              }
            }, 200)
          },

          onError: (event) => {
            console.error('TTSA hero YouTube error:', event.data)
          },
        },
      })

      playerRef.current = player
    }

    const previousCallback = window.onYouTubeIframeAPIReady

    const handleApiReady = () => {
      previousCallback?.()
      createPlayer()
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      window.onYouTubeIframeAPIReady = handleApiReady

      let script = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      )

      if (!script) {
        script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.async = true
        document.head.appendChild(script)
      }
    }

    return () => {
      cancelled = true
      window.clearInterval(intervalId)

      if (window.onYouTubeIframeAPIReady === handleApiReady) {
        window.onYouTubeIframeAPIReady = previousCallback
      }

      if (playerRef.current?.destroy) {
        playerRef.current.destroy()
      }

      playerRef.current = null
    }
  }, [])

  return (
    <section className="ttsa-hero-modern">
      <div className="ttsa-hero-video" aria-hidden="true">
        <div
          ref={playerContainerRef}
          className="ttsa-hero-video-player"
        />
      </div>

      <div className="ttsa-hero-shade" />

      <div className="ttsa-hero-content ttsa-container">
        <span className="ttsa-hero-eyebrow">
          THE VOICE OF TAITA TAVETA STUDENTS
        </span>

        <h1>
          One Voice.
          <span> Shared Future.</span>
        </h1>

        <h2>
          United for Student Representation, Welfare and Advocacy.
        </h2>

        <p>
          Bringing students together to speak with one voice, champion
          their interests and shape a better future for Taita Taveta.
        </p>

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
          <span>UNITED STUDENTS. STRONGER REPRESENTATION.</span>
        </div>
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
