import { useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, Target } from 'lucide-react'
import type { Purchase, Customer } from '@/types/admin'

type SaasMetricsProps = {
  purchases: Purchase[]
  customers: Customer[]
}

export default function SaasMetrics({ purchases, customers }: SaasMetricsProps) {

  // Calcular MRR (Monthly Recurring Revenue)
  const mrr = useMemo(() => {
    const thisMonth = new Date()
    const firstDay = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)

    return purchases
      .filter(p => p.paymentStatus === 'paid' && new Date(p.purchaseDate) >= firstDay)
      .reduce((sum, p) => sum + p.amount, 0)
  }, [purchases])

  // Calcular MRR do mês anterior
  const previousMrr = useMemo(() => {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const firstDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)
    const lastDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)

    return purchases
      .filter(p => {
        const date = new Date(p.purchaseDate)
        return p.paymentStatus === 'paid' && date >= firstDay && date <= lastDay
      })
      .reduce((sum, p) => sum + p.amount, 0)
  }, [purchases])

  // Growth Rate
  const growthRate = useMemo(() => {
    if (previousMrr === 0) return 0
    return ((mrr - previousMrr) / previousMrr) * 100
  }, [mrr, previousMrr])

  // Churn Rate (cancelamentos nos últimos 30 dias)
  const churnRate = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const cancelledPurchases = purchases.filter(p =>
      p.paymentStatus === 'cancelled' && new Date(p.purchaseDate) >= thirtyDaysAgo
    ).length

    const totalActivePurchases = purchases.filter(p =>
      p.paymentStatus === 'paid' || p.paymentStatus === 'pending'
    ).length

    if (totalActivePurchases === 0) return 0
    return (cancelledPurchases / totalActivePurchases) * 100
  }, [purchases])

  // Customer Lifetime Value (LTV)
  const ltv = useMemo(() => {
    const customerPurchases = customers.map(customer => {
      const customerTotal = purchases
        .filter(p => p.customerId === customer.id && p.paymentStatus === 'paid')
        .reduce((sum, p) => sum + p.amount, 0)
      return customerTotal
    }).filter(total => total > 0)

    if (customerPurchases.length === 0) return 0
    return customerPurchases.reduce((sum, val) => sum + val, 0) / customerPurchases.length
  }, [purchases, customers])

  // Active Customers
  const activeCustomers = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return new Set(
      purchases
        .filter(p => new Date(p.purchaseDate) >= thirtyDaysAgo)
        .map(p => p.customerId)
    ).size
  }, [purchases])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const metrics = [
    {
      label: 'MRR (Receita Mensal)',
      value: formatCurrency(mrr),
      change: growthRate,
      icon: DollarSign,
      color: 'blue'
    },
    {
      label: 'Growth Rate',
      value: formatPercent(growthRate),
      change: growthRate,
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: 'Churn Rate',
      value: `${churnRate.toFixed(1)}%`,
      change: -churnRate, // Negativo porque menor é melhor
      icon: TrendingDown,
      color: 'red',
      inverted: true
    },
    {
      label: 'Customer LTV',
      value: formatCurrency(ltv),
      change: 0,
      icon: Target,
      color: 'purple'
    },
    {
      label: 'Clientes Ativos (30d)',
      value: activeCustomers.toString(),
      change: 0,
      icon: Activity,
      color: 'cyan'
    },
    {
      label: 'Total de Clientes',
      value: customers.length.toString(),
      change: 0,
      icon: Users,
      color: 'indigo'
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500/10 text-blue-400',
      green: 'bg-green-500/10 text-green-400',
      red: 'bg-red-500/10 text-red-400',
      purple: 'bg-purple-500/10 text-purple-400',
      cyan: 'bg-cyan-500/10 text-cyan-400',
      indigo: 'bg-indigo-500/10 text-indigo-400',
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        const isPositive = metric.inverted ? metric.change < 0 : metric.change > 0
        const showChange = metric.change !== 0

        return (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${getColorClasses(metric.color)}`}>
                <Icon className="w-6 h-6" />
              </div>
              {showChange && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{formatPercent(Math.abs(metric.change))}</span>
                </div>
              )}
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">{metric.value}</h3>
            <p className="text-sm text-gray-400">{metric.label}</p>
          </div>
        )
      })}
    </div>
  )
}
