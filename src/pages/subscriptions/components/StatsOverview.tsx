import { TrendingUp, DollarSign, AlertCircle, Users } from 'lucide-react'

interface Stat {
  label: string
  value: string
  icon: typeof TrendingUp
  color: string
  bg: string
  border: string
  iconBg: string
}

interface StatsOverviewProps {
  mrr: number
  receivedRevenue: number
  overdueRevenue: number
  activeCount: number
}

export default function StatsOverview({ mrr, receivedRevenue, overdueRevenue, activeCount }: StatsOverviewProps) {
  const stats: Stat[] = [
    {
      label: 'Receita Recorrente (MRR)',
      value: `R$ ${mrr.toFixed(2).replace('.', ',')}`,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-gradient-to-br from-green-500/10 to-green-600/5',
      border: 'border-green-500/30',
      iconBg: 'bg-green-500/20'
    },
    {
      label: 'Receita Recebida',
      value: `R$ ${receivedRevenue.toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: 'text-blue-400',
      bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20'
    },
    {
      label: 'Em Atraso',
      value: `R$ ${overdueRevenue.toFixed(2).replace('.', ',')}`,
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-gradient-to-br from-red-500/10 to-red-600/5',
      border: 'border-red-500/30',
      iconBg: 'bg-red-500/20'
    },
    {
      label: 'Assinantes Ativos',
      value: activeCount.toString(),
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5',
      border: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20'
    },
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className={`${stat.bg} border ${stat.border} rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-${stat.color}/10`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                <Icon className={stat.color} size={24} />
              </div>
              <div className="flex-1">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
