type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusBadgeProps {
  label: string
  variant?: StatusVariant
  dot?: boolean
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string }> = {
  success: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500'
  },
  warning: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    dot: 'bg-yellow-500'
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500'
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  neutral: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-500'
  }
}

export default function StatusBadge({ label, variant = 'neutral', dot = false }: StatusBadgeProps) {
  const styles = variantStyles[variant]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}>
      {dot && <span className={`w-2 h-2 rounded-full ${styles.dot}`} />}
      {label}
    </span>
  )
}
