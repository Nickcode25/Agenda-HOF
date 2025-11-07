import { DollarSign, TrendingUp, AlertCircle, Users, Calendar, CheckCircle } from 'lucide-react'
import { useSubscriptionStore } from '../../store/subscriptions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { normalizeDateString } from '@/utils/dateHelpers'

export default function SubscriptionReports() {
  const {
    subscriptions,
    getMonthlyRecurringRevenue,
    getReceivedRevenue,
    getOverdueRevenue,
    getActiveSubscriptionsCount,
  } = useSubscriptionStore()

  const mrr = getMonthlyRecurringRevenue()
  const receivedRevenue = getReceivedRevenue()
  const overdueRevenue = getOverdueRevenue()
  const activeCount = getActiveSubscriptionsCount()

  // Calcular receitas por plano
  const revenueByPlan = subscriptions.reduce((acc, sub) => {
    if (sub.status === 'active') {
      const planName = sub.planName
      if (!acc[planName]) {
        acc[planName] = { total: 0, count: 0 }
      }
      acc[planName].total += sub.price
      acc[planName].count += 1
    }
    return acc
  }, {} as Record<string, { total: number; count: number }>)

  // Pagamentos recentes
  const recentPayments = subscriptions
    .flatMap((sub) =>
      sub.payments
        .filter((p) => p.status === 'paid')
        .map((p) => ({
          ...p,
          patientName: sub.patientName,
          planName: sub.planName,
        }))
    )
    .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime())
    .slice(0, 5)

  // Pagamentos atrasados
  const overduePayments = subscriptions
    .flatMap((sub) =>
      sub.payments
        .filter((p) => p.status === 'overdue')
        .map((p) => ({
          ...p,
          patientName: sub.patientName,
          planName: sub.planName,
        }))
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const stats = [
    {
      label: 'Receita Recorrente (MRR)',
      value: `R$ ${mrr.toFixed(2).replace('.', ',')}`,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
    },
    {
      label: 'Receita Recebida',
      value: `R$ ${receivedRevenue.toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
    },
    {
      label: 'Mensalidades em Atraso',
      value: `R$ ${overdueRevenue.toFixed(2).replace('.', ',')}`,
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
    },
    {
      label: 'Assinantes Ativos',
      value: activeCount.toString(),
      icon: Users,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
    },
  ]

  return (
    <div className="p-8">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Receita por Plano */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Receita por Plano</h2>
          {Object.keys(revenueByPlan).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(revenueByPlan).map(([planName, data]) => (
                <div key={planName} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white font-medium">{planName}</div>
                    <div className="text-sm text-gray-400">{data.count} assinantes</div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-400 font-bold">
                      R$ {data.total.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-xs text-gray-500">mensal</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum plano com assinantes ativos
            </div>
          )}
        </div>

        {/* Pagamentos Recentes */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Pagamentos Recentes</h2>
          {recentPayments.length > 0 ? (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg mt-1">
                    <CheckCircle className="text-green-400" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{payment.patientName}</div>
                    <div className="text-sm text-gray-400">{payment.planName}</div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const paidAtStr = payment.paidAt!
                        // Se tiver horário (formato ISO completo), usar diretamente
                        if (paidAtStr.includes('T')) {
                          return format(new Date(paidAtStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        }
                        // Se for apenas data, normalizar
                        const [year, month, day] = paidAtStr.split('-').map(Number)
                        const date = new Date(year, month - 1, day)
                        return format(date, "dd/MM/yyyy", { locale: ptBR })
                      })()}
                    </div>
                  </div>
                  <div className="text-green-400 font-bold text-sm whitespace-nowrap">
                    R$ {payment.amount.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum pagamento registrado
            </div>
          )}
        </div>
      </div>

      {/* Mensalidades em Atraso */}
      {overduePayments.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-red-500/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-400" size={24} />
            <h2 className="text-xl font-bold text-white">Mensalidades em Atraso</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Paciente</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Plano</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Vencimento</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Valor</th>
                </tr>
              </thead>
              <tbody>
                {overduePayments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-700">
                    <td className="px-4 py-3 text-white">{payment.patientName}</td>
                    <td className="px-4 py-3 text-gray-300">{payment.planName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-red-400">
                        <Calendar size={16} />
                        {(() => {
                          const dateStr = payment.dueDate.split('T')[0]
                          const [year, month, day] = dateStr.split('-').map(Number)
                          const date = new Date(year, month - 1, day)
                          return format(date, 'dd/MM/yyyy', { locale: ptBR })
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-red-400 font-bold">
                      R$ {payment.amount.toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
