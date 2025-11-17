import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface StatItem {
  label: string
  value: string | number
  icon?: LucideIcon
  color?: string
}

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle: string
  stats?: StatItem[]
  primaryAction?: {
    label: string
    icon?: LucideIcon
    onClick?: () => void
    href?: string
    className?: string
  }
  secondaryAction?: {
    label: string
    icon?: LucideIcon
    onClick?: () => void
    href?: string
    className?: string
  }
  children?: ReactNode
}

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  stats = [],
  primaryAction,
  secondaryAction,
  children
}: PageHeaderProps) {
  const renderActionButton = (action: NonNullable<PageHeaderProps['primaryAction']>, isPrimary: boolean) => {
    const ActionIcon = action.icon
    const defaultClassName = isPrimary
      ? 'inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all'
      : 'inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium border border-gray-200 shadow-sm transition-all'

    const className = action.className
      ? `inline-flex items-center gap-2 ${action.className} text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all`
      : defaultClassName

    if (action.href) {
      return (
        <a href={action.href} className={className}>
          {ActionIcon && <ActionIcon size={18} />}
          {action.label}
        </a>
      )
    }

    return (
      <button onClick={action.onClick} className={className}>
        {ActionIcon && <ActionIcon size={18} />}
        {action.label}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-xl">
            <Icon size={28} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {secondaryAction && renderActionButton(secondaryAction, false)}
          {primaryAction && renderActionButton(primaryAction, true)}
        </div>
      </div>

      {stats.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const StatIcon = stat.icon
            return (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  {StatIcon && <StatIcon size={16} className={stat.color || 'text-gray-500'} />}
                  <span className="text-sm text-gray-600">{stat.label}</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              </div>
            )
          })}
        </div>
      )}

      {children}
    </div>
  )
}
