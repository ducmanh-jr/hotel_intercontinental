import type { ClientStay } from '../model/client-home'
import { formatPrice } from '../hooks/use-client-home'
import { ClientIcon } from './ClientSiteIcons'

interface ClientStayCardProps {
  stay: ClientStay
  isSaved: boolean
  onToggleSaved: (id: string) => void
  onOpenStay: (id: string) => void
}

export function ClientStayCard({
  stay,
  isSaved,
  onToggleSaved,
  onOpenStay,
}: ClientStayCardProps) {
  return (
    <article
      className="stay-card"
      role="listitem"
      data-od-id={`stay-card-${stay.id}`}
    >
      <div className="stay-media">
        <img
          src={stay.image}
          alt={`${stay.name} tại ${stay.city}`}
          loading="lazy"
        />
        <span className={`stay-badge stay-badge--${stay.badgeClass}`}>
          {stay.badge}
        </span>
        <button
          className={`heart-btn ${isSaved ? 'is-saved' : ''}`}
          type="button"
          data-save={stay.id}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Bỏ lưu ${stay.name}` : `Lưu ${stay.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSaved(stay.id)
          }}
        >
          <ClientIcon name="heart" />
        </button>
        <span className="stay-media-note">{stay.note}</span>
      </div>

      <div className="stay-body">
        <div className="stay-location">
          <ClientIcon name="pin" /> {stay.city} <span /> {stay.location}
        </div>
        <h3>
          <button type="button" data-open={stay.id} onClick={() => onOpenStay(stay.id)}>
            {stay.name}
          </button>
        </h3>

        <ul className="amenities" aria-label="Tiện ích nổi bật">
          {stay.amenities.map((amenity) => (
            <li key={amenity}>
              <ClientIcon name="check" /> {amenity}
            </li>
          ))}
        </ul>

        <div className="stay-rating">
          <ClientIcon name="star" />
          <strong>{stay.rating.toFixed(1)}</strong>
          <span>({stay.reviews} đánh giá)</span>
          <span className="stay-type">{stay.type}</span>
        </div>

        <div className="stay-footer">
          <div className="stay-price">
            <div className="price-header">
              <span className="price-label">Từ</span>
              {stay.oldPrice > 0 && (
                <span className="old-price">{formatPrice(stay.oldPrice)}</span>
              )}
            </div>
            <div className="price-main">
              <strong>{formatPrice(stay.price)}</strong>
              <span className="price-unit">/ đêm</span>
            </div>
          </div>
          <button
            className="stay-link"
            type="button"
            data-open={stay.id}
            onClick={() => onOpenStay(stay.id)}
          >
            <span>Xem chi tiết</span>
            <ClientIcon name="arrow" />
          </button>
        </div>
      </div>
    </article>
  )
}
