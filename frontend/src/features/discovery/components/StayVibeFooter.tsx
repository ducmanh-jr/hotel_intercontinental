import {
  ArrowRightOutlined,
  DollarOutlined,
  ShopOutlined,
  ThunderboltFilled,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import type { FooterLinkGroup } from '../model/discovery'

interface StayVibeFooterProps {
  groups: FooterLinkGroup[]
}

export function StayVibeFooter({ groups }: StayVibeFooterProps) {
  const navigate = useNavigate()

  function handleFooterLinkClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    if (href.startsWith('/')) {
      event.preventDefault()
      void navigate(href)
    }
  }

  return (
    <footer className="w-full mt-12 sm:mt-16" role="contentinfo">
      {/* Partner Banner */}
      <div className="w-full rounded-3xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] p-6 sm:p-8 border border-[var(--md-sys-color-outline-subtle)] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-12">
        <div className="max-w-xl">
          <span className="text-xs font-bold tracking-wider uppercase text-[var(--md-sys-color-primary)] flex items-center gap-1.5">
            <ThunderboltFilled aria-hidden="true" />
            <span>Dành cho đối tác lưu trú</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--md-sys-color-on-surface)] mt-2 mb-2 leading-snug">
            Đồng hành vận hành khách sạn, bảng giá &amp; hợp đồng trên một nền tảng
          </h2>
          <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
            Quản lý hồ sơ khách sạn, cập nhật tiện ích, theo dõi bảng giá phòng theo ngày và đối soát hợp đồng minh bạch.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          <button
            type="button"
            className="m3-btn-filled !h-11 !px-5 !rounded-full !text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            onClick={() => void navigate('/management/hotels')}
          >
            <span>Quản lý khách sạn</span>
            <ArrowRightOutlined aria-hidden="true" />
          </button>
          <button
            type="button"
            className="m3-btn-outlined !h-11 !px-5 !rounded-full !text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer bg-white"
            onClick={() => void navigate('/management/rates')}
          >
            <DollarOutlined aria-hidden="true" />
            <span>Xem bảng giá phòng</span>
          </button>
        </div>
      </div>

      {/* Footer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-t border-[var(--md-sys-color-outline-subtle)]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary)] text-white flex items-center justify-center text-base shadow-xs">
              <ShopOutlined aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[var(--md-sys-color-on-surface)]">
                Stay<span className="text-[var(--md-sys-color-primary)]">Hub</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--md-sys-color-on-surface-variant)]">
                Nền tảng đặt phòng
              </span>
            </div>
          </div>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed max-w-sm mt-1">
            Nền tảng đặt phòng du lịch, homestay và khách sạn với trải nghiệm khám phá hiện đại và dữ liệu minh bạch.
          </p>
        </div>

        {groups.map((group) => (
          <nav key={group.id} className="flex flex-col gap-2" aria-label={group.title}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
              {group.title}
            </h3>
            <ul className="flex flex-col gap-2 p-0 m-0 list-none mt-1">
              {group.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition inline-flex items-center gap-2"
                    onClick={(e) => handleFooterLinkClick(e, link.href)}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                        {link.badge}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Copyright */}
      <div className="pt-6 border-t border-[var(--md-sys-color-outline-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
        <p>© 2026 StayHub. Nền tảng đặt phòng du lịch trải nghiệm.</p>
        <p>Giá niêm yết minh bạch · Hỗ trợ khách hàng 24/7.</p>
      </div>
    </footer>
  )
}
