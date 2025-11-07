import { useEffect, memo, useMemo } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const config = useMemo(() => ({
    success: {
      icon: CheckCircle,
      gradient: 'from-green-500/20 to-green-600/30',
      borderColor: 'border-green-500/50',
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/20',
      progressBar: 'from-green-500 to-green-600',
      shadow: 'shadow-green-500/20'
    },
    error: {
      icon: XCircle,
      gradient: 'from-red-500/20 to-red-600/30',
      borderColor: 'border-red-500/50',
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/20',
      progressBar: 'from-red-500 to-red-600',
      shadow: 'shadow-red-500/20'
    },
    warning: {
      icon: AlertCircle,
      gradient: 'from-yellow-500/20 to-yellow-600/30',
      borderColor: 'border-yellow-500/50',
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
      progressBar: 'from-yellow-500 to-yellow-600',
      shadow: 'shadow-yellow-500/20'
    },
    info: {
      icon: Info,
      gradient: 'from-orange-500/20 to-orange-600/30',
      borderColor: 'border-orange-500/50',
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/20',
      progressBar: 'from-orange-500 to-orange-600',
      shadow: 'shadow-orange-500/20'
    }
  }), [])

  const { icon: Icon, gradient, borderColor, iconColor, iconBg, progressBar, shadow } = config[type]

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      <div className={`bg-gradient-to-br ${gradient} backdrop-blur-xl border-2 ${borderColor} rounded-2xl shadow-2xl ${shadow} overflow-hidden min-w-[320px] max-w-md`}>
        {/* Content */}
        <div className="p-4 flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${iconBg} p-2 rounded-xl`}>
            <Icon size={20} className={iconColor} />
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-white font-medium text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-900/30">
          <div
            className={`h-full bg-gradient-to-r ${progressBar} transition-all`}
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

// Export memoized component for performance optimization
export default memo(Toast)
