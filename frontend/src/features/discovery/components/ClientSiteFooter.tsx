import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import {
  newsletterSchema,
  type NewsletterFormValues,
} from '../model/client-search-schema'
import { ClientIcon } from './ClientSiteIcons'

interface ClientSiteFooterProps {
  onToast: (msg: string) => void
}

export function ClientSiteFooter({ onToast }: ClientSiteFooterProps) {
  const navigate = useNavigate()
  const { register, handleSubmit, reset } = useForm<NewsletterFormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: '' },
  })

  function onSubmit(values: NewsletterFormValues) {
    if (values.email) {
      onToast(`Bản xem trước: email ${values.email} đã được ghi nhận cho bản tin StayHub.`)
      reset()
    }
  }

  function handleAnchorClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    anchor: string,
  ) {
    e.preventDefault()
    const target = document.getElementById(anchor.replace('#', ''))
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <footer className="site-footer" data-od-id="site-footer">
      <div className="container">
        <div className="newsletter">
          <div>
            <h2>
              Những nơi <em>đáng ở,</em>
              <br />
              gửi một lần mỗi tháng.
            </h2>
            <p>
              Không spam. Chỉ những bộ sưu tập mới và vài gợi ý thật sự đáng để mở
              email.
            </p>
          </div>

          <form
            className="newsletter-form"
            id="newsletter-form"
            onSubmit={handleSubmit(onSubmit)}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Email
            </label>
            <input
              id="newsletter-email"
              className="newsletter-email"
              type="email"
              placeholder="Email của bạn"
              {...register('email')}
            />
            <button
              className="newsletter-btn"
              type="submit"
              aria-label="Đăng ký nhận bản tin"
            >
              <ClientIcon name="arrow" />
            </button>
          </form>
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <a
              className="brand"
              href="#top"
              data-od-id="brand-logo"
              aria-label="StayHub — về đầu trang"
              onClick={(e) => handleAnchorClick(e, '#top')}
            >
              <span className="brand-mark">
                <ClientIcon name="compass" />
              </span>
              <span className="brand-word">
                <strong>StayHub</strong>
                <span>Bộ sưu tập lưu trú</span>
              </span>
            </a>
            <p>
              Một cách chậm hơn để tìm chỗ nghỉ: ít lựa chọn hơn, nhưng đúng gu
              hơn.
            </p>
          </div>

          <div className="footer-col">
            <h3>Khám phá</h3>
            <ul>
              <li>
                <a
                  href="#destinations"
                  onClick={(e) => handleAnchorClick(e, '#destinations')}
                >
                  Điểm đến
                </a>
              </li>
              <li>
                <a
                  href="#stays"
                  onClick={(e) => handleAnchorClick(e, '#stays')}
                >
                  Bộ sưu tập chỗ nghỉ
                </a>
              </li>
              <li>
                <a
                  href="#journal"
                  onClick={(e) => handleAnchorClick(e, '#journal')}
                >
                  Câu chuyện trải nghiệm
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Hỗ trợ</h3>
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    onToast('Bản xem trước: trung tâm hỗ trợ sẽ mở tại đây.')
                  }
                >
                  Trung tâm hỗ trợ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    onToast('Bản xem trước: chính sách hoàn hủy sẽ mở tại đây.')
                  }
                >
                  Chính sách hoàn hủy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    onToast('Bản xem trước: thông tin liên hệ sẽ mở tại đây.')
                  }
                >
                  Liên hệ
                </button>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h3>Đối tác</h3>
            <ul>
              <li>
                <a
                  href="#partner"
                  onClick={(e) => handleAnchorClick(e, '#partner')}
                >
                  Hợp tác lưu trú
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/management/hotels')}
                >
                  Quản lý khách sạn
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    onToast('Bản xem trước: thông tin tuyển dụng sẽ mở tại đây.')
                  }
                >
                  Tuyển dụng
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 StayHub. Bộ sưu tập lưu trú được tuyển chọn.</p>
          <p className="preview-note">
            Bản xem trước giao diện · Dữ liệu chỗ nghỉ là minh họa
          </p>
        </div>
      </div>
    </footer>
  )
}
