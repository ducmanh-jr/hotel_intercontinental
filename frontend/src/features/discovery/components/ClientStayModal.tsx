import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import type { ClientStay } from '../model/client-home'
import { formatPrice } from '../hooks/use-client-home'
import { ClientIcon } from './ClientSiteIcons'

interface ClientStayModalProps {
  stay: ClientStay | null
  isOpen: boolean
  onClose: () => void
  onBookStay: (stay: ClientStay) => void
}

export function ClientStayModal({
  stay,
  isOpen,
  onClose,
  onBookStay,
}: ClientStayModalProps) {
  const navigate = useNavigate()
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !stay) return null

  return (
    <div
      className={`modal-overlay ${isOpen ? 'is-open' : ''}`}
      id="stay-modal"
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-backdrop" onClick={onClose} />
      <div
        className="modal-card"
        data-od-id="stay-modal-card"
      >
        <button
          className="modal-close"
          type="button"
          aria-label="Đóng chi tiết chỗ nghỉ"
          onClick={onClose}
        >
          <ClientIcon name="close" />
        </button>

        <div className="modal-layout">
          <div className="modal-media">
            <img src={stay.image} alt={`${stay.name} tại ${stay.city}`} />
            <span className="modal-media-tag">{stay.note}</span>
          </div>

          <div className="modal-copy">
            <p className="eyebrow">
              {stay.type} · {stay.city}
            </p>
            <h2 id="modal-title">{stay.name}</h2>
            <div className="modal-location">
              <ClientIcon name="pin" /> {stay.location}
            </div>
            <p className="modal-desc">{stay.desc}</p>

            <div className="modal-rating">
              <ClientIcon name="star" />
              <strong>{stay.rating.toFixed(1)}</strong>
              <span>· {stay.reviews} đánh giá</span>
            </div>

            <ul className="modal-amenities">
              {stay.amenities.map((amenity) => (
                <li key={amenity}>
                  <ClientIcon name="check" /> {amenity}
                </li>
              ))}
            </ul>

            <div className="modal-price">
              <div>
                {stay.oldPrice > 0 && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--meta)',
                      textDecoration: 'line-through',
                      marginBottom: '2px',
                    }}
                  >
                    {formatPrice(stay.oldPrice)}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <strong>{formatPrice(stay.price)}</strong>
                  <span>/ đêm · đã gồm thuế &amp; phí</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn--outline"
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate(`/hotels/${stay.id}`)
                  }}
                >
                  Xem chi tiết đầy đủ
                </button>
                <button
                  className="btn btn--dark"
                  type="button"
                  onClick={() => onBookStay(stay)}
                >
                  Chọn chỗ nghỉ <ClientIcon name="arrow" />
                </button>
              </div>
            </div>

            <p className="modal-note">
              Bản xem trước giao diện · Giá và tình trạng phòng là dữ liệu minh họa.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
