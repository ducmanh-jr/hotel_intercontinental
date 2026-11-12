import {
  BankOutlined,
  CompassOutlined,
  FireOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Button, Space, Tag } from 'antd'
import { useNavigate } from 'react-router'

export type DiscoveryViewState = 'success' | 'loading' | 'empty' | 'error'

interface StayVibeHeaderProps {
  viewState: DiscoveryViewState
  onViewStateChange: (nextState: DiscoveryViewState) => void
  savedCount: number
}

export function StayVibeHeader({
  viewState,
  onViewStateChange,
  savedCount,
}: StayVibeHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="stayvibe-top-header" role="banner">
      <div className="stayvibe-top-header__inner">
        <div className="stayvibe-brand-cluster">
          <button
            type="button"
            className="stayvibe-logo-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="StayVibe - Cuộn lên đầu trang"
          >
            <span className="stayvibe-logo-mark" aria-hidden="true">
              <CompassOutlined />
            </span>
            <span className="stayvibe-logo-text">
              Stay<span className="stayvibe-logo-accent">Vibe</span>
            </span>
          </button>
          <Tag color="gold" className="stayvibe-skeleton-pill">
            Private Collection
          </Tag>
        </div>

        <nav
          className="stayvibe-header-nav"
          aria-label="Điều hướng khám phá StayVibe"
        >
          <a href="#vibe-section" className="stayvibe-nav-link">
            <ThunderboltOutlined aria-hidden="true" /> Phong cách lưu trú
          </a>
          <a href="#bento-section" className="stayvibe-nav-link">
            <CompassOutlined aria-hidden="true" /> Điểm đến nổi bật
          </a>
          <a href="#hotels-section" className="stayvibe-nav-link">
            <FireOutlined aria-hidden="true" /> Khu nghỉ dưỡng tiêu biểu
          </a>
          <button
            type="button"
            className="stayvibe-nav-link stayvibe-nav-link--btn"
            onClick={() => void navigate('/management/hotels')}
          >
            <BankOutlined aria-hidden="true" /> Quản trị khách sạn
          </button>
        </nav>

        <div className="stayvibe-header-actions">
          <div
            className="stayvibe-state-switcher"
            role="group"
            aria-label="Chuyển đổi trạng thái màn hình (UI State Preview)"
          >
            {(
              [
                { key: 'success', label: 'Success' },
                { key: 'loading', label: 'Skeleton' },
                { key: 'empty', label: 'Empty' },
                { key: 'error', label: 'Error' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                className={`stayvibe-state-btn ${
                  viewState === item.key ? 'is-active' : ''
                }`}
                aria-pressed={viewState === item.key}
                onClick={() => onViewStateChange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Space size={8}>
            <span className="stayvibe-locale-pill" title="Ngôn ngữ & Tiền tệ">
              <GlobalOutlined aria-hidden="true" /> VI · VND
            </span>
            {savedCount > 0 && (
              <span
                className="stayvibe-wishlist-counter"
                aria-live="polite"
                title="Số chỗ nghỉ đã thả tim"
              >
                ♥ {savedCount}
              </span>
            )}
            <Button
              type="primary"
              icon={<UserOutlined aria-hidden="true" />}
              onClick={() => void navigate('/login')}
            >
              Đăng nhập
            </Button>
          </Space>
        </div>
      </div>
    </header>
  )
}

