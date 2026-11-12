import type { ReactNode } from 'react'

export interface SectionCardProps {
  id?: string
  title: string
  description?: string
  extra?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({
  id,
  title,
  description,
  extra,
  footer,
  children,
  className = '',
}: SectionCardProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className={`bg-white rounded-2xl border border-[#dce7e3] overflow-hidden shadow-xs ${className}`}
    >
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-[#eef4f2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2
            id={id ? `${id}-heading` : undefined}
            className="text-base font-bold text-[#12211d] m-0"
          >
            {title}
          </h2>
          {description && (
            <p className="text-xs text-[#5f736e] mt-1 mb-0 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {extra && <div className="shrink-0">{extra}</div>}
      </div>

      {/* Body */}
      <div className="p-5 md:p-6">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="px-5 md:px-6 py-3.5 bg-[#f7fbfa] border-t border-[#eef4f2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {footer}
        </div>
      )}
    </section>
  )
}
