import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react'
import { Bell, Check, CheckCheck, X, AlertCircle, AlertTriangle, Info, Calendar, Package } from 'lucide-react'
import { useNotifications } from '@/store/notifications'
import { useNavigate } from 'react-router-dom'
import type { Notification } from '@/types/notification'

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  useEffect(() => {
    fetchNotifications()
    // Atualizar a cada 2 minutos
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id)
      }
      if (notification.actionUrl) {
        navigate(notification.actionUrl)
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Erro ao processar notificação:', error)
    }
  }, [markAsRead, navigate])

  const getIcon = useCallback((type: Notification['type']) => {
    switch (type) {
      case 'appointment_reminder':
      case 'appointment_confirmed':
      case 'appointment_cancelled':
        return <Calendar size={18} className="text-blue-500" />
      case 'low_stock':
      case 'stock_out':
        return <Package size={18} className="text-orange-500" />
      case 'subscription_due':
      case 'subscription_overdue':
        return <AlertCircle size={18} className="text-yellow-500" />
      default:
        return <Info size={18} className="text-gray-500" />
    }
  }, [])

  const getPriorityColor = useCallback((priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-4 border-l-orange-500 bg-orange-50'
      case 'medium':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50'
      default:
        return 'border-l-4 border-l-gray-300 bg-gray-50'
    }
  }, [])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    return date.toLocaleDateString('pt-BR')
  }

  const recentNotifications = notifications.slice(0, 10)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Nenhuma nova notificação'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Carregando...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-3 opacity-20" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              recentNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${getPriorityColor(notification.priority)} ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Marcar como lida"
                            >
                              <Check size={14} className="text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Remover"
                          >
                            <X size={14} className="text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  navigate('/app/notificacoes')
                  setIsOpen(false)
                }}
                className="w-full text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Export memoized component for performance optimization
export default memo(NotificationBell)
