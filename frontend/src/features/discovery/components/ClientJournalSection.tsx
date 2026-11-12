import { CLIENT_STORIES } from '../mocks/client-home-data'
import { ClientIcon } from './ClientSiteIcons'

interface ClientJournalSectionProps {
  onJournalCta: () => void
}

export function ClientJournalSection({ onJournalCta }: ClientJournalSectionProps) {
  return (
    <section
      className="journal"
      id="journal"
      data-od-id="journal-section"
      aria-labelledby="journal-title"
    >
      <div className="container journal-inner">
        <div className="journal-media">
          <img
            src="/assets/client/hotel-pine.jpg"
            alt="Nhà gỗ giữa rừng thông, ánh sáng buổi sớm"
            width="1200"
            height="800"
            loading="lazy"
          />
          <div className="journal-media-caption">
            <span>Đà Lạt · 06:12</span>
            <span>StayHub Journal / 04</span>
          </div>
        </div>

        <div className="journal-copy">
          <p className="eyebrow">Câu chuyện StayHub</p>
          <h2 id="journal-title" data-od-id="journal-title">
            Một kỳ nghỉ hay bắt đầu từ <em>những điều rất nhỏ.</em>
          </h2>
          <p className="journal-lede">
            Không phải mọi chuyến đi đều cần một lịch trình dày đặc. Đôi khi chỉ
            cần một căn phòng đúng gu, một ly cà phê nóng và đủ thời gian để nhìn
            thấy mọi thứ chậm lại.
          </p>

          <ul className="journal-list">
            {CLIENT_STORIES.map((story) => (
              <li key={story.step}>
                <b>{story.step}</b>
                <div>
                  <strong>{story.title}</strong>
                  <span>{story.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <button
            className="journal-cta"
            data-od-id="journal-cta-btn"
            type="button"
            onClick={onJournalCta}
          >
            Xem chỗ nghỉ cho một kỳ nghỉ chậm <ClientIcon name="arrow" />
          </button>
        </div>
      </div>
    </section>
  )
}
