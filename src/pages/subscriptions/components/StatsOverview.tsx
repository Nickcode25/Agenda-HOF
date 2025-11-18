import { TrendingUp, DollarSign, AlertCircle, Users } from 'lucide-react'

interface Stat {
  label: string
  value: string
  icon: typeof TrendingUp
  color: string
  textColor: string
  borderColor: string
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
      color: 'text-green-500',
      textColor: 'text-green-600',
      borderColor: 'border-l-green-500'
    },
    {
      label: 'Receita Recebida',
      value: `R$ ${receivedRevenue.toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: 'text-blue-500',
      textColor: 'text-blue-600',
      borderColor: 'border-l-blue-500'
    },
    {
      label: 'Em Atraso',
      value: `R$ ${overdueRevenue.toFixed(2).replace('.', ',')}`,
      icon: AlertCircle,
      color: 'text-red-500',
      textColor: 'text-red-600',
      borderColor: 'border-l-red-500'
    },
    {
      label: 'Assinantes Ativos',
      value: activeCount.toString(),
      icon: Users,
      color: 'text-purple-500',
      textColor: 'text-purple-600',
      borderColor: 'border-l-purple-500'
    },
  ]

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className={`bg-white rounded-xl border border-gray-200 p-5 border-l-4 ${stat.borderColor} hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${stat.textColor}`}>{stat.label}</span>
              <Icon size={18} className={stat.color} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
          </div>
        )
      })}
    </div>
  )
}
