import type { ReactNode } from 'react'
import { Breadcrumb } from 'antd'
import { Link } from 'react-router'

export interface PageBreadcrumbItem {
  label: string
  to?: string
}

export interface PageHeaderProps {
  breadcrumbItems?: PageBreadcrumbItem[]
  kicker?: ReactNode
  title: ReactNode
  description?: ReactNode
  extra?: ReactNode
  className?: string
}

export function PageHeader({
  breadcrumbItems = [],
  kicker,
  title,
  description,
  extra,
  className = '',
}: PageHeaderProps) {
  const antdBreadcrumbItems = breadcrumbItems.map((item, index) => {
    const isLast = index === breadcrumbItems.length - 1
    if (item.to && !isLast) {
      return {
        title: (
          <Link
            to={item.to}
            className="text-[#5f736e] hover:text-[#0b5f53] transition-colors"
          >
            {item.label}
          </Link>
        ),
      }
    }
    return {
      title: (
        <span className={isLast ? 'text-[#12211d] font-medium' : 'text-[#5f736e]'}>
          {item.label}
        </span>
      ),
    }
  })

  return (
    <header className={`page-header-container mb-6 ${className}`}>
      {breadcrumbItems.length > 0 && (
        <nav aria-label="Đường dẫn trang" className="mb-2">
          <Breadcrumb
            separator="›"
            items={antdBreadcrumbItems}
            className="text-xs text-[#5f736e]"
          />
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {kicker && (
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#0b5f53] mb-1">
              {kicker}
            </div>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-[#12211d] tracking-tight m-0 break-words">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[#5f736e] mt-1 mb-0 leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {extra && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {extra}
          </div>
        )}
      </div>
    </header>
  )
}
