import type { ClientDestination } from '../model/client-home'
import { ClientIcon } from './ClientSiteIcons'

interface ClientDestinationsSectionProps {
  destinations: ClientDestination[]
  selectedCity: string
  onSelectCity: (cityName: string) => void
  onResetAll: () => void
}

export function ClientDestinationsSection({
  destinations,
  selectedCity,
  onSelectCity,
  onResetAll,
}: ClientDestinationsSectionProps) {
  return (
    <section
      className="section"
      id="destinations"
      data-od-id="destinations-section"
      aria-labelledby="destinations-title"
    >
      <div className="container">
        <div className="section-head">
          <div>
            <p className="eyebrow">Điểm đến</p>
            <h2
              className="section-title"
              id="destinations-title"
              data-od-id="destinations-title"
            >
              Đi đâu <em>mùa này?</em>
            </h2>
          </div>
          <div className="section-aside">
            <p>
              Từ sương sớm Đà Lạt đến nước biển trong veo Phú Quốc — chọn một nhịp
              sống khác cho vài ngày tới.
            </p>
            <button
              className="text-link"
              type="button"
              data-reset-all
              onClick={onResetAll}
            >
              Xem tất cả điểm đến <ClientIcon name="arrow" />
            </button>
          </div>
        </div>

        <div className="destination-grid" data-od-id="destinations-grid">
          {destinations.map((dest) => {
            const isSelected = selectedCity === dest.city
            return (
              <button
                key={dest.id}
                className="destination-card"
                type="button"
                data-city={dest.city}
                data-od-id={`destination-card-${dest.id}`}
                aria-pressed={isSelected}
                onClick={() => onSelectCity(dest.city)}
              >
                <img
                  src={dest.image}
                  alt={dest.city}
                  width="1400"
                  height="934"
                  loading="lazy"
                />
                <span className="destination-top">
                  <span className="destination-tag">
                    {dest.hasSparkle && <ClientIcon name="spark" />} {dest.tag}
                  </span>
                  <span className="destination-count">{dest.count}</span>
                </span>
                <span className="destination-body">
                  <span className="destination-kicker">{dest.kicker}</span>
                  <h3>{dest.city}</h3>
                  <span className="destination-desc">{dest.desc}</span>
                  <span className="destination-cta">
                    {dest.ctaText} <ClientIcon name="arrow" />
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
