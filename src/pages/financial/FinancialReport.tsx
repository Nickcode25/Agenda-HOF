import { useState, useMemo, useEffect } from 'react'
import { usePatients } from '@/store/patients'
import { useSales } from '@/store/sales'
import { useSubscriptionStore } from '@/store/subscriptions'
import { formatCurrency } from '@/utils/currency'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ShoppingCart,
  Activity,
  CreditCard,
  Filter
} from 'lucide-react'

type PeriodFilter = 'day' | 'week' | 'month' | 'year'

export default function FinancialReport() {
  const { patients } = usePatients()
  const { sales, fetchSales } = useSales()
  const { subscriptions } = useSubscriptionStore()
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchSales()
  }, [])

  // Função para filtrar por período
  const filterByPeriod = (date: Date, itemDate: Date): boolean => {
    const selected = new Date(date)
    const item = new Date(itemDate)

    switch (periodFilter) {
      case 'day':
        return selected.toDateString() === item.toDateString()

      case 'week':
        const weekStart = new Date(selected)
        weekStart.setDate(selected.getDate() - selected.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return item >= weekStart && item <= weekEnd

      case 'month':
        return selected.getMonth() === item.getMonth() && selected.getFullYear() === item.getFullYear()

      case 'year':
        return selected.getFullYear() === item.getFullYear()

      default:
        return true
    }
  }

  // Receitas de procedimentos
  const procedureRevenue = useMemo(() => {
    const completedProcedures = patients.flatMap(patient =>
      patient.plannedProcedures?.filter(proc => {
        if (proc.status !== 'completed' || !proc.completedAt) return false
        return filterByPeriod(new Date(selectedDate), new Date(proc.completedAt))
      }) || []
    )

    const total = completedProcedures.reduce((sum, proc) => sum + (proc.totalValue || 0), 0)
    const count = completedProcedures.length

    return { total, count, items: completedProcedures }
  }, [patients, periodFilter, selectedDate])

  // Receitas de vendas
  const salesRevenue = useMemo(() => {
    const filteredSales = sales.filter(sale =>
      sale.paymentStatus === 'paid' && filterByPeriod(new Date(selectedDate), new Date(sale.createdAt))
    )

    const total = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const profit = filteredSales.reduce((sum, sale) => sum + sale.totalProfit, 0)
    const count = filteredSales.length

    return { total, profit, count, items: filteredSales }
  }, [sales, periodFilter, selectedDate])

  // Receitas de mensalidades
  const subscriptionRevenue = useMemo(() => {
    const paidPayments = subscriptions.flatMap(sub =>
      sub.payments?.filter(payment =>
        payment.status === 'paid' &&
        payment.paidAt &&
        filterByPeriod(new Date(selectedDate), new Date(payment.paidAt))
      ) || []
    )

    const total = paidPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const count = paidPayments.length

    return { total, count, items: paidPayments }
  }, [subscriptions, periodFilter, selectedDate])

  const totalRevenue = procedureRevenue.total + salesRevenue.total + subscriptionRevenue.total
  const totalTransactions = procedureRevenue.count + salesRevenue.count + subscriptionRevenue.count

  // Calcular percentuais
  const procedurePercentage = totalRevenue > 0 ? (procedureRevenue.total / totalRevenue) * 100 : 0
  const salesPercentage = totalRevenue > 0 ? (salesRevenue.total / totalRevenue) * 100 : 0
  const subscriptionPercentage = totalRevenue > 0 ? (subscriptionRevenue.total / totalRevenue) * 100 : 0

  const getPeriodLabel = () => {
    const date = new Date(selectedDate)
    switch (periodFilter) {
      case 'day':
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
      case 'month':
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      case 'year':
        return date.getFullYear().toString()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <TrendingUp size={32} className="text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Relatório Financeiro</h1>
              <p className="text-gray-400">{getPeriodLabel()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Filtros</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setPeriodFilter('day')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  periodFilter === 'day'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setPeriodFilter('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  periodFilter === 'week'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriodFilter('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  periodFilter === 'month'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setPeriodFilter('year')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  periodFilter === 'year'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Ano
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data de Referência</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Resumo Total */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign size={24} className="text-green-400" />
            </div>
            <h3 className="font-medium text-gray-300">Receita Total</h3>
          </div>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">{totalTransactions} transações</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity size={24} className="text-blue-400" />
            </div>
            <h3 className="font-medium text-gray-300">Procedimentos</h3>
          </div>
          <p className="text-3xl font-bold text-blue-400">{formatCurrency(procedureRevenue.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{procedureRevenue.count} realizados</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <ShoppingCart size={24} className="text-orange-400" />
            </div>
            <h3 className="font-medium text-gray-300">Vendas de Produtos</h3>
          </div>
          <p className="text-3xl font-bold text-orange-400">{formatCurrency(salesRevenue.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{salesRevenue.count} vendas • Lucro: {formatCurrency(salesRevenue.profit)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <CreditCard size={24} className="text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-300">Mensalidades</h3>
          </div>
          <p className="text-3xl font-bold text-purple-400">{formatCurrency(subscriptionRevenue.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{subscriptionRevenue.count} pagamentos</p>
        </div>
      </div>

      {/* Distribuição de Receitas */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp size={20} className="text-green-400" />
          <h3 className="text-lg font-semibold text-white">Distribuição de Receitas</h3>
        </div>
        <div className="space-y-4">
          {/* Procedimentos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-blue-400" />
                <span className="text-white font-medium">Procedimentos</span>
              </div>
              <div className="text-right">
                <span className="text-blue-400 font-bold">{formatCurrency(procedureRevenue.total)}</span>
                <span className="text-gray-400 text-sm ml-2">({procedurePercentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${procedurePercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Vendas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-orange-400" />
                <span className="text-white font-medium">Vendas de Produtos</span>
              </div>
              <div className="text-right">
                <span className="text-orange-400 font-bold">{formatCurrency(salesRevenue.total)}</span>
                <span className="text-gray-400 text-sm ml-2">({salesPercentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${salesPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Mensalidades */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-purple-400" />
                <span className="text-white font-medium">Mensalidades</span>
              </div>
              <div className="text-right">
                <span className="text-purple-400 font-bold">{formatCurrency(subscriptionRevenue.total)}</span>
                <span className="text-gray-400 text-sm ml-2">({subscriptionPercentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${subscriptionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Procedimentos */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Procedimentos Realizados</h3>
          </div>
          <div className="space-y-2">
            {procedureRevenue.items.length > 0 ? (
              procedureRevenue.items
                .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
                .slice(0, 5)
                .map((proc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-white font-medium">{proc.procedureName}</span>
                    </div>
                    <span className="text-blue-400 font-bold">{formatCurrency(proc.totalValue || 0)}</span>
                  </div>
                ))
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhum procedimento no período</p>
            )}
          </div>
        </div>

        {/* Top Vendas */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart size={20} className="text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Maiores Vendas</h3>
          </div>
          <div className="space-y-2">
            {salesRevenue.items.length > 0 ? (
              salesRevenue.items
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .slice(0, 5)
                .map((sale, index) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-white font-medium block">{sale.professionalName}</span>
                        <span className="text-xs text-gray-400">{sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-orange-400 font-bold block">{formatCurrency(sale.totalAmount)}</span>
                      <span className="text-xs text-green-400">+{formatCurrency(sale.totalProfit)}</span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma venda no período</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
