import { DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react'

interface PlanStatsGridProps {
  totalSubscribers: number
  monthlyRevenue: number
  receivedRevenue: number
  overdueRevenue: number
}

export default function PlanStatsGrid({
  totalSubscribers,
  monthlyRevenue,
  receivedRevenue,
  overdueRevenue
}: PlanStatsGridProps) {
  const stats = [
    {
      label: 'Assinantes Ativos',
      value: totalSubscribers.toString(),
      icon: Users,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
    },
    {
      label: 'Receita Mensal',
      value: `R$ ${monthlyRevenue.toFixed(2).replace('.', ',')}`,
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
      label: 'Em Atraso',
      value: `R$ ${overdueRevenue.toFixed(2).replace('.', ',')}`,
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
    },
  ]

  return (
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
  )
}
