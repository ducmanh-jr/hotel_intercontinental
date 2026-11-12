import type {
  ClientSortOption,
  ClientStay,
  ClientVibeKey,
} from '../model/client-home'
import { CLIENT_VIBES } from '../mocks/client-home-data'
import { ClientStayCard } from './ClientStayCard'
import { ClientIcon } from './ClientSiteIcons'

interface ClientStaysSectionProps {
  stays: ClientStay[]
  totalStaysCount: number
  selectedVibe: ClientVibeKey
  selectedSort: ClientSortOption
  filterLabel: string
  hasActiveFilters: boolean
  savedIds: Set<string>
  isLoading: boolean
  isError: boolean
  onSelectVibe: (vibe: ClientVibeKey) => void
  onSelectSort: (sort: ClientSortOption) => void
  onToggleSaved: (id: string) => void
  onOpenStay: (id: string) => void
  onResetAll: () => void
}

export function ClientStaysSection({
  stays,
  totalStaysCount,
  selectedVibe,
  selectedSort,
  filterLabel,
  hasActiveFilters,
  savedIds,
  isLoading,
  isError,
  onSelectVibe,
  onSelectSort,
  onToggleSaved,
  onOpenStay,
  onResetAll,
}: ClientStaysSectionProps) {
  return (
    <section
      className="section stays-section"
      id="stays"
      data-od-id="stays-section"
      aria-labelledby="stays-title"
    >
      <div className="container">
        <div className="section-head stays-head">
          <div>
            <p className="eyebrow">Bộ sưu tập chỗ nghỉ</p>
            <h2
              className="section-title"
              id="stays-title"
              data-od-id="stays-title"
            >
              Những nơi <em>đáng để lưu lại.</em>
            </h2>
          </div>
          <div className="section-aside">
            <p>
              Mỗi chỗ nghỉ được chọn vì một lý do riêng: một khung cửa, một bữa
              sáng, hay cảm giác được ở đúng nơi mình thuộc về.
            </p>
            <p className="collection-note" style={{ color: 'var(--muted)', fontSize: '13px' }}>
              Bộ sưu tập minh họa · {stays.length} chỗ nghỉ đang hiển thị
            </p>
          </div>
        </div>

        <div className="filter-toolbar" data-od-id="filter-toolbar">
          <div
            className="vibe-row"
            role="toolbar"
            aria-label="Lọc theo phong cách nghỉ dưỡng"
          >
            {CLIENT_VIBES.map((vibe) => {
              const isActive = selectedVibe === vibe.key
              return (
                <button
                  key={vibe.key}
                  className={`vibe-chip ${isActive ? 'is-active' : ''}`}
                  type="button"
                  data-vibe={vibe.key}
                  aria-pressed={isActive}
                  onClick={() => onSelectVibe(vibe.key)}
                >
                  <ClientIcon name={vibe.icon} />
                  <span>{vibe.label}</span>
                </button>
              )
            })}
          </div>

          <div className="stays-controls">
            <div className="stays-count">
              Đang hiển thị <strong id="result-count">{stays.length}</strong> chỗ nghỉ{' '}
              <span id="filter-label">{filterLabel}</span>
              {hasActiveFilters && (
                <button
                  className="reset-btn"
                  id="reset-filters"
                  type="button"
                  onClick={onResetAll}
                >
                  Đặt lại bộ lọc
                </button>
              )}
            </div>

            <div className="sort-wrap">
              <label htmlFor="sort">Sắp xếp theo</label>
              <select
                id="sort"
                name="sort"
                value={selectedSort}
                onChange={(e) => onSelectSort(e.target.value as ClientSortOption)}
              >
                <option value="featured">Được yêu thích nhất</option>
                <option value="price-asc">Giá: thấp đến cao</option>
                <option value="price-desc">Giá: cao đến thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">
            <ClientIcon name="compass" />
            <h3>Đang tải bộ sưu tập chỗ nghỉ...</h3>
            <p>Vui lòng chờ trong giây lát.</p>
          </div>
        ) : isError ? (
          <div className="empty-state">
            <ClientIcon name="compass" />
            <h3>Không thể tải danh sách chỗ nghỉ</h3>
            <p>Vui lòng thử lại sau.</p>
            <button className="btn btn--primary" type="button" onClick={onResetAll}>
              Thử lại
            </button>
          </div>
        ) : stays.length === 0 ? (
          <div className="empty-state" id="empty-state">
            <ClientIcon name="compass" />
            <h3>Không tìm thấy chỗ nghỉ phù hợp</h3>
            <p>
              Thử đổi điểm đến, phong cách hoặc từ khóa tìm kiếm để khám phá thêm
              nhiều chỗ nghỉ trong bộ sưu tập.
            </p>
            <button
              className="btn btn--primary"
              type="button"
              data-reset-all
              onClick={onResetAll}
            >
              Xem tất cả chỗ nghỉ
            </button>
          </div>
        ) : (
          <div className="stays-grid" id="stays-grid" data-od-id="stays-grid" role="list">
            {stays.map((stay) => (
              <ClientStayCard
                key={stay.id}
                stay={stay}
                isSaved={savedIds.has(stay.id)}
                onToggleSaved={onToggleSaved}
                onOpenStay={onOpenStay}
              />
            ))}
          </div>
        )}

        <div className="collection-foot">
          <p>
            Giá hiển thị là giá tham khảo cho một đêm, đã gồm thuế và phí dịch vụ.
          </p>
          <button
            className="text-link"
            type="button"
            data-reset-all
            onClick={onResetAll}
          >
            Xem toàn bộ bộ sưu tập ({totalStaysCount}) <ClientIcon name="arrow" />
          </button>
        </div>
      </div>
    </section>
  )
}
