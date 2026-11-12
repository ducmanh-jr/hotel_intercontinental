import { CLIENT_PARTNER_STATS } from '../mocks/client-home-data'
import { ClientIcon } from './ClientSiteIcons'

interface ClientPartnerSectionProps {
  onPartnerAction: (message: string) => void
}

export function ClientPartnerSection({
  onPartnerAction,
}: ClientPartnerSectionProps) {
  return (
    <section
      className="section partner"
      id="partner"
      data-od-id="partner-section"
      aria-labelledby="partner-title"
    >
      <div className="container">
        <div className="partner-card">
          <div className="partner-media">
            <img
              src="/assets/client/experience.jpg"
              alt="Khu nghỉ dưỡng bên hồ bơi lúc hoàng hôn"
              width="1600"
              height="1200"
              loading="lazy"
            />
            <span className="partner-badge">Dành cho đối tác lưu trú</span>
          </div>

          <div className="partner-copy">
            <p className="eyebrow">Hợp tác cùng StayHub</p>
            <h2 id="partner-title" data-od-id="partner-title">
              Bạn có một nơi <em>đáng để ở?</em>
            </h2>
            <p>
              Đưa chỗ nghỉ của bạn đến những vị khách đang tìm đúng điều mình muốn.
              Quản lý hồ sơ, bảng giá và trải nghiệm trên một nơi duy nhất.
            </p>

            <div className="partner-stats">
              {CLIENT_PARTNER_STATS.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="partner-actions">
              <button
                className="btn btn--dark"
                type="button"
                onClick={() =>
                  onPartnerAction(
                    'Bản xem trước: biểu mẫu đăng ký đối tác sẽ mở tại đây.',
                  )
                }
              >
                Bắt đầu hợp tác <ClientIcon name="arrow" />
              </button>
              <button
                className="btn btn--outline"
                type="button"
                onClick={() =>
                  onPartnerAction(
                    'Bản xem trước: trang thông tin đối tác sẽ mở tại đây.',
                  )
                }
              >
                Tìm hiểu thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
