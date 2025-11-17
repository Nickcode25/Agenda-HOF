import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    icon?: LucideIcon
    onClick?: () => void
    href?: string
    className?: string
  }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const ActionIcon = action?.icon

  const renderAction = () => {
    if (!action) return null

    const defaultClassName = 'inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all'
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
      <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon size={32} className="text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {renderAction()}
    </div>
  )
}
