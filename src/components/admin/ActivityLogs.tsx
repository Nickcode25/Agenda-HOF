import { useEffect, useState } from 'react'
import { Activity, User, ShoppingCart, CreditCard, UserPlus, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type ActivityLog = {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  actionType: string
  actionDescription: string
  metadata: Record<string, any>
  createdAt: string
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_recent_activity_logs', { p_limit: 50 })

      if (error) throw error

      const logs = (data || []).map((log: any) => ({
        id: log.id,
        customerId: log.customer_id,
        customerName: log.customer_name,
        customerEmail: log.customer_email,
        actionType: log.action_type,
        actionDescription: log.action_description,
        metadata: log.metadata || {},
        createdAt: log.created_at,
      }))

      setLogs(logs)
    } catch (error) {
      console.error('Erro ao buscar logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'customer_registered':
        return <UserPlus className="w-5 h-5 text-green-400" />
      case 'purchase_created':
        return <ShoppingCart className="w-5 h-5 text-blue-400" />
      case 'purchase_status_changed':
        return <CreditCard className="w-5 h-5 text-yellow-400" />
      case 'login':
        return <User className="w-5 h-5 text-purple-400" />
      default:
        return <Activity className="w-5 h-5 text-gray-400" />
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'customer_registered':
        return 'bg-green-500/10 border-green-500/20'
      case 'purchase_created':
        return 'bg-blue-500/10 border-blue-500/20'
      case 'purchase_status_changed':
        return 'bg-yellow-500/10 border-yellow-500/20'
      case 'login':
        return 'bg-purple-500/10 border-purple-500/20'
      default:
        return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Agora mesmo'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d atrás`

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Atividade Recente</h2>
        </div>
        <div className="text-center py-8 text-gray-400">Carregando atividades...</div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-bold text-white">Atividade Recente</h2>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma atividade registrada ainda</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-4 p-4 rounded-lg border ${getActionColor(log.actionType)} hover:bg-gray-700/30 transition-colors`}
            >
              <div className="flex-shrink-0 mt-1">
                {getActionIcon(log.actionType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium mb-1">{log.actionDescription}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="truncate">
                    {log.customerName || log.customerEmail}
                  </span>
                  <span>•</span>
                  <span className="flex-shrink-0">{formatDate(log.createdAt)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={fetchLogs}
          className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Atualizar
        </button>
      </div>
    </div>
  )
}
