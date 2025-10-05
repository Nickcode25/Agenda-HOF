import { useMemo } from 'react'
import { AlertTriangle, AlertCircle, CheckCircle, TrendingDown, DollarSign, Users, Clock } from 'lucide-react'
import type { Purchase, Customer } from '@/types/admin'

type Alert = {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  description: string
  icon: any
  action?: () => void
  actionLabel?: string
}

type AlertsPanelProps = {
  purchases: Purchase[]
  customers: Customer[]
}

export default function AlertsPanel({ purchases, customers }: AlertsPanelProps) {

  const alerts = useMemo(() => {
    const alertsList: Alert[] = []

    // 1. Pagamentos pendentes há mais de 7 dias
    const oldPendingPayments = purchases.filter(p => {
      if (p.paymentStatus !== 'pending') return false
      const daysSince = (Date.now() - new Date(p.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince > 7
    })

    if (oldPendingPayments.length > 0) {
      alertsList.push({
        id: 'old-pending',
        type: 'warning',
        title: `${oldPendingPayments.length} pagamento(s) pendente(s) há mais de 7 dias`,
        description: 'Clientes com pagamentos atrasados podem precisar de atenção',
        icon: Clock,
      })
    }

    // 2. Alto volume de cancelamentos
    const recentCancellations = purchases.filter(p => {
      if (p.paymentStatus !== 'cancelled') return false
      const daysSince = (Date.now() - new Date(p.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 30
    })

    if (recentCancellations.length > 5) {
      alertsList.push({
        id: 'high-churn',
        type: 'error',
        title: `${recentCancellations.length} cancelamentos nos últimos 30 dias`,
        description: 'Taxa de cancelamento acima do normal - investigar causas',
        icon: TrendingDown,
      })
    }

    // 3. Clientes inativos (sem compras nos últimos 60 dias)
    const activeCustomerIds = new Set(
      purchases
        .filter(p => {
          const daysSince = (Date.now() - new Date(p.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
          return daysSince <= 60
        })
        .map(p => p.customerId)
    )

    const inactiveCustomers = customers.filter(c => !activeCustomerIds.has(c.id))

    if (inactiveCustomers.length > 10) {
      alertsList.push({
        id: 'inactive-customers',
        type: 'warning',
        title: `${inactiveCustomers.length} clientes inativos`,
        description: 'Clientes sem compras há mais de 60 dias',
        icon: Users,
      })
    }

    // 4. Receita abaixo da média
    const thisMonth = new Date()
    const firstDay = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
    const monthlyRevenue = purchases
      .filter(p => p.paymentStatus === 'paid' && new Date(p.purchaseDate) >= firstDay)
      .reduce((sum, p) => sum + p.amount, 0)

    // Calcular média dos últimos 3 meses
    const lastThreeMonthsRevenue = []
    for (let i = 1; i <= 3; i++) {
      const month = new Date()
      month.setMonth(month.getMonth() - i)
      const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)

      const revenue = purchases
        .filter(p => {
          const date = new Date(p.purchaseDate)
          return p.paymentStatus === 'paid' && date >= firstDay && date <= lastDay
        })
        .reduce((sum, p) => sum + p.amount, 0)

      lastThreeMonthsRevenue.push(revenue)
    }

    const avgRevenue = lastThreeMonthsRevenue.reduce((a, b) => a + b, 0) / 3

    if (monthlyRevenue < avgRevenue * 0.7 && avgRevenue > 0) {
      alertsList.push({
        id: 'low-revenue',
        type: 'error',
        title: 'Receita mensal abaixo da média',
        description: `Receita 30% abaixo da média dos últimos 3 meses`,
        icon: DollarSign,
      })
    }

    // 5. Crescimento positivo
    if (monthlyRevenue > avgRevenue * 1.2 && avgRevenue > 0) {
      alertsList.push({
        id: 'high-growth',
        type: 'success',
        title: 'Crescimento acima da média! 🎉',
        description: `Receita 20% acima da média dos últimos 3 meses`,
        icon: CheckCircle,
      })
    }

    // 6. Novos clientes em alta
    const newCustomersThisMonth = customers.filter(c => {
      const createdAt = new Date(c.createdAt)
      return createdAt >= firstDay
    }).length

    if (newCustomersThisMonth > 10) {
      alertsList.push({
        id: 'new-customers',
        type: 'success',
        title: `${newCustomersThisMonth} novos clientes este mês`,
        description: 'Ótimo crescimento na base de clientes!',
        icon: Users,
      })
    }

    return alertsList
  }, [purchases, customers])

  const getAlertStyle = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-400'
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    }
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return AlertCircle
      case 'warning':
        return AlertTriangle
      case 'success':
        return CheckCircle
      case 'info':
      default:
        return AlertCircle
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-bold text-white">Alertas</h2>
        </div>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-400">Tudo certo! Nenhum alerta no momento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Alertas ({alerts.length})</h2>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.icon || getAlertIcon(alert.type)

          return (
            <div
              key={alert.id}
              className={`flex items-start gap-4 p-4 rounded-lg border ${getAlertStyle(alert.type)}`}
            >
              <div className="flex-shrink-0 mt-1">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">{alert.title}</h3>
                <p className="text-sm opacity-80">{alert.description}</p>
                {alert.action && alert.actionLabel && (
                  <button
                    onClick={alert.action}
                    className="mt-2 text-sm font-medium hover:underline"
                  >
                    {alert.actionLabel}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
