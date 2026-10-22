
import './LeaderCard.css'

export default function LeaderCard({ leader }) {
  const name = leader?.full_name || 'Position vacant'
  const position = leader?.position || 'Committee Member'
  const photo = leader?.profile_picture_url
  const constituency = leader?.constituency

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return (
    <article className="ttsa-leader-card">
      <div className="ttsa-leader-card-photo-wrap">
        {photo ? (
          <img
            className="ttsa-leader-card-photo"
            src={photo}
            alt={`${name} - ${position}`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
              event.currentTarget.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}

        <div
          className="ttsa-leader-card-initials"
          style={{ display: photo ? 'none' : 'flex' }}
          aria-hidden="true"
        >
          {initials || 'TT'}
        </div>
      </div>

      <div className="ttsa-leader-card-content">
        <span className="ttsa-leader-card-position">
          {position}
        </span>

        <h3 className="ttsa-leader-card-name">
          {name}
        </h3>

        {constituency && (
          <p className="ttsa-leader-card-constituency">
            {constituency}
          </p>
        )}
      </div>
    </article>
  )
}
