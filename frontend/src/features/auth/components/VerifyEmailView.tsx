import { Link } from 'react-router'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  CompassOutlined,
  ExclamationCircleFilled,
  InfoCircleFilled,
  LoadingOutlined,
  LoginOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useVerifyEmail, type VerifyEmailResult, type VerifyEmailStatus } from '../hooks/use-verify-email'

export interface VerifyEmailViewProps {
  overrideToken?: string
  overrideStatus?: VerifyEmailStatus
  countdown?: number | null
  onSuccess?: (result: VerifyEmailResult) => void
  onNavigateHome?: () => void
}

export function VerifyEmailView({
  overrideToken,
  overrideStatus,
  countdown,
  onSuccess,
  onNavigateHome,
}: VerifyEmailViewProps) {
  const { status: liveStatus, errorMessage, isVerifying, retry } = useVerifyEmail({
    overrideToken,
    onSuccess: overrideStatus ? undefined : onSuccess,
  })
  const status = overrideStatus ?? liveStatus

  return (
    <div className="client-theme min-h-screen min-h-[100dvh] flex flex-col justify-between bg-[var(--paper,#fbf9f5)] text-[var(--ink,#1a1918)] selection:bg-[var(--accent-pale,#f8eee6)] selection:text-[var(--ink,#1a1918)] font-sans">
      {/* 1. Header gọn */}
      <header className="w-full border-b border-[var(--line-soft,#ece5dc)] bg-white/80 backdrop-blur-md sticky top-0 z-10 transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3 no-underline group focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)] rounded-lg"
            aria-label="StayHub – Về trang chủ"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--accent,#b66d3a)] text-white flex items-center justify-center text-base sm:text-lg shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
              <CompassOutlined aria-hidden="true" />
            </div>
            <div className="flex flex-col leading-none shrink-0">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink,#1a1918)]">
                Stay<span className="text-[var(--accent,#b66d3a)]">Hub</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-[var(--muted,#706a62)] mt-0.5">
                Bộ sưu tập lưu trú
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--muted,#706a62)] hover:text-[var(--accent,#b66d3a)] transition-colors py-2 px-3.5 rounded-full hover:bg-[var(--paper-deep,#f3ede2)] focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)]"
          >
            <ArrowLeftOutlined className="text-xs" aria-hidden="true" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </header>

      {/* 2. Khối nội dung chính */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-16"
      >
        <section
          className="w-full max-w-[480px] bg-white border border-[var(--line,#e3dcd1)] rounded-2xl p-6 sm:p-10 shadow-[0_10px_28px_-6px_rgba(26,25,24,0.06)] text-center transition-all"
          aria-live="polite"
        >
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === 'verifying' && (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--accent-pale,#f8eee6)] text-[var(--accent,#b66d3a)] flex items-center justify-center text-2xl sm:text-3xl"
                role="status"
                aria-label="Đang xử lý"
              >
                <LoadingOutlined spin aria-hidden="true" />
              </div>
            )}

            {status === 'success' && (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--forest-pale,#eef5f1)] text-[var(--forest,#2a583e)] border border-[#c6ded0] flex items-center justify-center text-3xl sm:text-4xl"
                role="img"
                aria-label="Thành công"
              >
                <CheckCircleFilled aria-hidden="true" />
              </div>
            )}

            {status === 'missing-token' && (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-3xl sm:text-4xl"
                role="img"
                aria-label="Thiếu mã xác minh"
              >
                <ExclamationCircleFilled aria-hidden="true" />
              </div>
            )}

            {status === 'expired' && (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-3xl sm:text-4xl"
                role="img"
                aria-label="Liên kết hết hạn"
              >
                <ClockCircleFilled aria-hidden="true" />
              </div>
            )}

            {status === 'invalid' && (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center text-3xl sm:text-4xl"
                role="img"
                aria-label="Liên kết không hợp lệ"
              >
                <CloseCircleFilled aria-hidden="true" />
              </div>
            )}

            {status === 'already-used' && (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-3xl sm:text-4xl"
                role="img"
                aria-label="Liên kết đã dùng"
              >
                <InfoCircleFilled aria-hidden="true" />
              </div>
            )}

            {status === 'error' && (
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center text-3xl sm:text-4xl"
                role="img"
                aria-label="Lỗi xác minh"
              >
                <ExclamationCircleFilled aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Status Badge when verified with countdown */}
          {status === 'success' && countdown !== undefined && countdown !== null && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--forest-pale,#eef5f1)] text-[var(--forest,#2a583e)] border border-[#c6ded0] text-xs font-semibold mb-3 mx-auto">
              <CheckCircleFilled className="text-xs" aria-hidden="true" />
              <span>Đăng ký &amp; kích hoạt tài khoản thành công</span>
            </div>
          )}

          {/* Heading */}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink,#1a1918)] mb-3">
            {status === 'verifying' && 'Đang xác minh email'}
            {status === 'success' && 'Xác minh email thành công'}
            {status === 'missing-token' && 'Liên kết xác minh không hợp lệ'}
            {status === 'expired' && 'Liên kết xác minh đã hết hạn'}
            {status === 'invalid' && 'Liên kết không hợp lệ'}
            {status === 'already-used' && 'Liên kết đã được sử dụng'}
            {status === 'error' && 'Không thể hoàn tất xác minh'}
          </h1>

          {/* Description */}
          <div className="text-sm sm:text-base text-[var(--ink-soft,#423f3b)] leading-relaxed mb-8 max-w-sm mx-auto">
            {status === 'verifying' && (
              <p>Hệ thống đang kiểm tra liên kết xác minh tài khoản của bạn. Vui lòng đợi trong giây lát.</p>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-3">
                <p>
                  Email của bạn đã được xác minh thành công. Bạn đã được đăng nhập tự động vào hệ thống StayHub.
                </p>
                {countdown !== undefined && countdown !== null && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--paper-deep,#f3ede2)] border border-[var(--line,#e3dcd1)] text-xs sm:text-sm font-medium text-[var(--ink-soft,#423f3b)] shadow-xs">
                    <ClockCircleFilled className="text-[var(--accent,#b66d3a)] text-sm animate-pulse" aria-hidden="true" />
                    <span>
                      Tự động chuyển về trang chủ sau{' '}
                      <strong className="text-[var(--accent,#b66d3a)] font-bold text-base tabular-nums">
                        {countdown}
                      </strong>{' '}
                      giây...
                    </span>
                  </div>
                )}
              </div>
            )}

            {status === 'missing-token' && (
              <p>
                Không tìm thấy mã xác minh trong đường dẫn. Vui lòng kiểm tra và mở đầy đủ liên kết được gửi trong email của bạn.
              </p>
            )}

            {status === 'expired' && (
              <p>
                Liên kết xác minh này đã hết hiệu lực. Vì lý do an toàn, mã xác nhận chỉ có giá trị trong một khoảng thời gian nhất định.
              </p>
            )}

            {status === 'invalid' && (
              <p>
                Mã xác minh không tồn tại hoặc sai định dạng. Vui lòng kiểm tra lại liên kết trong email mới nhất.
              </p>
            )}

            {status === 'already-used' && (
              <p>
                Liên kết xác minh này đã được sử dụng trước đó. Bạn có thể tiến hành đăng nhập vào tài khoản ngay.
              </p>
            )}

            {status === 'error' && (
              <p>{errorMessage || 'Đã xảy ra sự cố khi kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'}</p>
            )}
          </div>

          {/* 3. Khối hành động */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
            {status === 'verifying' && (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-[var(--line-soft,#ece5dc)] text-[var(--muted,#706a62)] font-semibold text-sm cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <LoadingOutlined spin aria-hidden="true" />
                <span>Đang xử lý...</span>
              </button>
            )}

            {status === 'success' && (
              <>
                {countdown !== undefined && countdown !== null ? (
                  <>
                    <button
                      type="button"
                      onClick={onNavigateHome}
                      className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 rounded-xl bg-[var(--accent,#b66d3a)] hover:bg-[var(--accent-hover,#9e5b2c)] text-white font-semibold text-sm shadow-sm transition-all inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)] active:scale-[0.99] cursor-pointer"
                    >
                      <span>Đến trang chủ ngay</span>
                      <ArrowRightOutlined aria-hidden="true" />
                    </button>
                    <Link
                      to="/"
                      className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl border border-[var(--line,#e3dcd1)] hover:bg-[var(--paper-deep,#f3ede2)] text-[var(--ink-soft,#423f3b)] font-semibold text-sm transition-colors inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)]"
                    >
                      <span>Khám phá chỗ nghỉ</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 rounded-xl bg-[var(--accent,#b66d3a)] hover:bg-[var(--accent-hover,#9e5b2c)] text-white font-semibold text-sm shadow-sm transition-all inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)] active:scale-[0.99]"
                    >
                      <LoginOutlined aria-hidden="true" />
                      <span>Đăng nhập</span>
                    </Link>
                    <Link
                      to="/"
                      className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl border border-[var(--line,#e3dcd1)] hover:bg-[var(--paper-deep,#f3ede2)] text-[var(--ink-soft,#423f3b)] font-semibold text-sm transition-colors inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)]"
                    >
                      <span>Khám phá chỗ nghỉ</span>
                    </Link>
                  </>
                )}
              </>
            )}

            {status === 'already-used' && (
              <>
                <Link
                  to="/login"
                  className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 rounded-xl bg-[var(--accent,#b66d3a)] hover:bg-[var(--accent-hover,#9e5b2c)] text-white font-semibold text-sm shadow-sm transition-all inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)] active:scale-[0.99]"
                >
                  <LoginOutlined aria-hidden="true" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  to="/"
                  className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl border border-[var(--line,#e3dcd1)] hover:bg-[var(--paper-deep,#f3ede2)] text-[var(--ink-soft,#423f3b)] font-semibold text-sm transition-colors inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)]"
                >
                  <span>Về trang chủ</span>
                </Link>
              </>
            )}

            {(status === 'missing-token' || status === 'expired' || status === 'invalid') && (
              <>
                <Link
                  to="/"
                  className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-[var(--accent,#b66d3a)] hover:bg-[var(--accent-hover,#9e5b2c)] text-white font-semibold text-sm shadow-sm transition-all inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)] active:scale-[0.99]"
                >
                  <span>Về trang chủ</span>
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl border border-[var(--line,#e3dcd1)] hover:bg-[var(--paper-deep,#f3ede2)] text-[var(--ink-soft,#423f3b)] font-semibold text-sm transition-colors inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)]"
                >
                  <span>Đăng nhập</span>
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <button
                  type="button"
                  onClick={retry}
                  disabled={isVerifying}
                  className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 rounded-xl bg-[var(--accent,#b66d3a)] hover:bg-[var(--accent-hover,#9e5b2c)] text-white font-semibold text-sm shadow-sm transition-all inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)] cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  <ReloadOutlined aria-hidden="true" />
                  <span>Thử lại</span>
                </button>
                <Link
                  to="/"
                  className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl border border-[var(--line,#e3dcd1)] hover:bg-[var(--paper-deep,#f3ede2)] text-[var(--ink-soft,#423f3b)] font-semibold text-sm transition-colors inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--accent,#b66d3a)]"
                >
                  <span>Về trang chủ</span>
                </Link>
              </>
            )}
          </div>
        </section>
      </main>

      {/* 4. Footer gọn */}
      <footer className="w-full py-6 text-center text-xs text-[var(--meta,#948d84)] border-t border-[var(--line-soft,#ece5dc)] px-4">
        <p>© 2026 StayHub · Nền tảng đặt phòng nghỉ dưỡng. Mọi quyền được bảo lưu.</p>
      </footer>
    </div>
  )
}
