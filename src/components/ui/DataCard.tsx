import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface DataCardProps {
  children: ReactNode
  onClick?: () => void
  href?: string
  className?: string
  hoverEffect?: boolean
}

export default function DataCard({
  children,
  onClick,
  href,
  className = '',
  hoverEffect = true
}: DataCardProps) {
  const baseClasses = `bg-white rounded-xl border border-gray-100 p-5 transition-all ${
    hoverEffect ? 'hover:shadow-md hover:border-gray-200' : ''
  } ${className}`

  if (href) {
    return (
      <a href={href} className={`block ${baseClasses} cursor-pointer`}>
        {children}
      </a>
    )
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={`w-full text-left ${baseClasses} cursor-pointer`}>
        {children}
      </button>
    )
  }

  return <div className={baseClasses}>{children}</div>
}

// Sub-components for structured card content
interface CardHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  iconBgColor?: string
  iconColor?: string
  badge?: ReactNode
  avatar?: string | null
  avatarFallback?: string
}

export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-orange-50',
  iconColor = 'text-orange-500',
  badge,
  avatar,
  avatarFallback
}: CardHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      {avatar !== undefined ? (
        avatar ? (
          <img
            src={avatar}
            alt={title}
            className="w-14 h-14 rounded-lg object-cover border border-gray-100"
          />
        ) : (
          <div className={`w-14 h-14 rounded-lg ${iconBgColor} flex items-center justify-center`}>
            {avatarFallback ? (
              <span className={`text-lg font-bold ${iconColor}`}>{avatarFallback}</span>
            ) : Icon ? (
              <Icon size={24} className={iconColor} />
            ) : null}
          </div>
        )
      ) : Icon ? (
        <div className={`p-3 ${iconBgColor} rounded-lg`}>
          <Icon size={24} className={iconColor} />
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-semibold text-gray-900 truncate">{title}</h3>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
      </div>
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`mt-4 ${className}`}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 ${className}`}>
      {children}
    </div>
  )
}

interface CardMetaItemProps {
  icon: LucideIcon
  label: string
  value?: string
  iconColor?: string
}

export function CardMetaItem({ icon: Icon, label, value, iconColor = 'text-orange-500' }: CardMetaItemProps) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-600">
      <Icon size={14} className={iconColor} />
      <span>{value || label}</span>
    </div>
  )
}
