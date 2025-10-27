import { useEffect, useState } from 'react'
import { Bell, Check, CheckCheck, Trash2, Settings, Calendar, Package, AlertCircle, Filter } from 'lucide-react'
import { useNotifications } from '@/store/notifications'
import { useNavigate } from 'react-router-dom'
import type { Notification, NotificationType } from '@/types/notification'
import { useConfirm } from '@/hooks/useConfirm'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all')
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)
  const { confirm, ConfirmDialog } = useConfirm()

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
  }, [])

  const filteredNotifications = notifications.filter(n => {
    if (showOnlyUnread && n.isRead) return false
    if (filterType !== 'all' && n.type !== filterType) return false
    return true
  })

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment_reminder':
      case 'appointment_confirmed':
      case 'appointment_cancelled':
        return <Calendar size={20} className="text-blue-400" />
      case 'low_stock':
      case 'stock_out':
        return <Package size={20} className="text-orange-400" />
      case 'subscription_due':
      case 'subscription_overdue':
        return <AlertCircle size={20} className="text-yellow-400" />
      default:
        return <Bell size={20} className="text-gray-400" />
    }
  }

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">Urgente</span>
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full">Alta</span>
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full">Média</span>
      default:
        return <span className="px-2 py-0.5 text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full">Baixa</span>
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const typeLabels: Record<NotificationType, string> = {
    appointment_reminder: 'Lembrete de Agendamento',
    low_stock: 'Estoque Baixo',
    stock_out: 'Produto Esgotado',
    appointment_confirmed: 'Agendamento Confirmado',
    appointment_cancelled: 'Agendamento Cancelado',
    subscription_due: 'Mensalidade a Vencer',
    subscription_overdue: 'Mensalidade Vencida',
    payment_overdue: 'Pagamento Atrasado',
    planned_procedure: 'Procedimento Planejado'
  }

  return (
    <>
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all flex items-center gap-2"
            >
              <CheckCheck size={18} />
              Marcar todas como lidas
            </button>
          )}
          <button
            onClick={() => navigate('/app/configuracoes/notificacoes')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2"
          >
            <Settings size={18} />
            Configurar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm text-gray-400">Filtros:</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
            className="px-3 py-1.5 bg-gray-700 border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos os tipos</option>
            <option value="appointment_reminder">Agendamentos</option>
            <option value="low_stock">Estoque</option>
            <option value="subscription_due">Mensalidades</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyUnread}
              onChange={(e) => setShowOnlyUnread(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-800"
            />
            <span className="text-sm text-gray-300">Apenas não lidas</span>
          </label>

          <div className="ml-auto text-sm text-gray-400">
            {filteredNotifications.length} de {notifications.length} notificações
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Carregando notificações...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={64} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">Nenhuma notificação encontrada</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-gray-800 border rounded-xl p-4 transition-all ${
                !notification.isRead
                  ? 'border-orange-500/30 bg-orange-500/5'
                  : 'border-gray-700 hover:border-gray-600'
              } ${notification.actionUrl ? 'cursor-pointer' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${!notification.isRead ? 'text-white' : 'text-gray-300'}`}>
                        {notification.title}
                      </h3>
                      {getPriorityBadge(notification.priority)}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Marcar como lida"
                        >
                          <Check size={18} className="text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (await confirm({ title: 'Confirmação', message: 'Deseja realmente excluir esta notificação?' })) {
                            deleteNotification(notification.id)
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-3">{notification.message}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatDateTime(notification.createdAt)}</span>
                    <span>•</span>
                    <span>{typeLabels[notification.type]}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
