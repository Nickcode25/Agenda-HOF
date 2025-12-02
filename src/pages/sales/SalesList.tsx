import { Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect, useCallback, memo } from 'react'
import { Search, Plus, ShoppingCart, User, Calendar, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Trash2, Edit, BarChart3, Filter } from 'lucide-react'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'
import { formatInSaoPaulo } from '@/utils/timezone'
import { useConfirm } from '@/hooks/useConfirm'

// Skeleton loader para vendas
const SaleSkeleton = memo(() => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden border-l-4 border-l-amber-400 animate-pulse">
    <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div>
          <div className="h-5 w-32 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
    <div className="px-6 py-4 bg-white border-l-4 border-l-amber-100">
      <div className="py-3">
        <div className="h-4 w-40 bg-gray-100 rounded mb-2" />
        <div className="h-3 w-24 bg-gray-100 rounded" />
      </div>
    </div>
    <div className="bg-orange-50 px-6 py-3 border-t border-orange-100">
      <div className="flex justify-between">
        <div className="h-4 w-40 bg-gray-100 rounded" />
        <div className="h-4 w-20 bg-gray-100 rounded" />
      </div>
    </div>
  </div>
))

type PeriodFilter = 'day' | 'week' | 'month' | 'year'

export default function SalesList() {
  const { sales, fetchProfessionals, fetchSales, removeSale, loading } = useSales()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { hasActiveSubscription } = useSubscription()
  const { confirm, ConfirmDialog } = useConfirm()
  const [hasFetched, setHasFetched] = useState(false)

  // Filtros de período
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day')
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchProfessionals(), fetchSales()])
      setHasFetched(true)
    }
    loadData()
  }, [])

  // Atualizar datas quando o período mudar
  useEffect(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    switch (periodFilter) {
      case 'day':
        setStartDate(todayStr)
        setEndDate(todayStr)
        break

      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        setStartDate(weekStart.toISOString().split('T')[0])
        setEndDate(weekEnd.toISOString().split('T')[0])
        break

      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setStartDate(monthStart.toISOString().split('T')[0])
        setEndDate(monthEnd.toISOString().split('T')[0])
        break

      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        const yearEnd = new Date(now.getFullYear(), 11, 31)
        setStartDate(yearStart.toISOString().split('T')[0])
        setEndDate(yearEnd.toISOString().split('T')[0])
        break
    }
  }, [periodFilter])

  const filtered = useMemo(() => {
    let result = sales

    // Filtrar por período (datas)
    if (startDate && endDate) {
      result = result.filter(sale => {
        const saleDate = (sale.soldAt || sale.createdAt)?.split('T')[0]
        return saleDate && saleDate >= startDate && saleDate <= endDate
      })
    }

    if (searchQuery.trim()) {
      result = result.filter(sale =>
        containsIgnoringAccents(sale.professionalName, searchQuery) ||
        containsIgnoringAccents(sale.id, searchQuery) ||
        sale.items.some(item => containsIgnoringAccents(item.stockItemName, searchQuery))
      )
    }

    if (statusFilter) {
      result = result.filter(sale => sale.paymentStatus === statusFilter)
    }

    return result.sort((a, b) => new Date(b.soldAt || b.createdAt).getTime() - new Date(a.soldAt || a.createdAt).getTime())
  }, [sales, searchQuery, statusFilter, startDate, endDate])


  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Pago', dot: 'bg-green-500' }
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-orange-50', border: 'border-yellow-200', label: 'Pendente', dot: 'bg-orange-500' }
      case 'overdue':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Vencido', dot: 'bg-red-500' }
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Pendente', dot: 'bg-gray-500' }
    }
  }

  const handleDeleteSale = useCallback(async (saleId: string, saleName: string) => {
    const confirmed = await confirm({
      title: 'Excluir Venda',
      message: `Tem certeza que deseja excluir a venda para ${saleName}? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    })
    if (confirmed) {
      await removeSale(saleId)
      await fetchSales()
    }
  }, [confirm, removeSale, fetchSales])

  // Verificar se está carregando inicialmente
  const isInitialLoading = loading && !hasFetched

  // Calcula estatísticas reais baseadas nas vendas
  const stats = useMemo(() => {
    const now = new Date()

    // Início e fim do mês atual
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Início e fim do mês anterior
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Início e fim da semana atual (domingo a sábado)
    const currentWeekStart = new Date(now)
    currentWeekStart.setDate(now.getDate() - now.getDay())
    currentWeekStart.setHours(0, 0, 0, 0)
    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6)
    currentWeekEnd.setHours(23, 59, 59, 999)

    // Início e fim da semana anterior
    const lastWeekStart = new Date(currentWeekStart)
    lastWeekStart.setDate(currentWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(currentWeekStart)
    lastWeekEnd.setDate(currentWeekStart.getDate() - 1)
    lastWeekEnd.setHours(23, 59, 59, 999)

    // Filtrar vendas por período
    const getSaleDate = (sale: typeof sales[0]) => new Date(sale.soldAt || sale.createdAt)

    const currentMonthSales = sales.filter(sale => {
      const date = getSaleDate(sale)
      return date >= currentMonthStart && date <= currentMonthEnd
    })

    const lastMonthSales = sales.filter(sale => {
      const date = getSaleDate(sale)
      return date >= lastMonthStart && date <= lastMonthEnd
    })

    const currentWeekSalesCount = sales.filter(sale => {
      const date = getSaleDate(sale)
      return date >= currentWeekStart && date <= currentWeekEnd
    }).length

    const lastWeekSalesCount = sales.filter(sale => {
      const date = getSaleDate(sale)
      return date >= lastWeekStart && date <= lastWeekEnd
    }).length

    // Calcular faturamento e lucro por período
    const currentMonthRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.totalAmount, 0)

    const currentMonthProfit = currentMonthSales.reduce((sum, sale) => sum + sale.totalProfit, 0)
    const lastMonthProfit = lastMonthSales.reduce((sum, sale) => sum + sale.totalProfit, 0)

    // Calcular crescimento
    const revenueGrowth = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
      : currentMonthRevenue > 0 ? 100 : 0

    const profitGrowth = lastMonthProfit > 0
      ? ((currentMonthProfit - lastMonthProfit) / lastMonthProfit * 100)
      : currentMonthProfit > 0 ? 100 : 0

    const salesGrowth = lastWeekSalesCount > 0
      ? ((currentWeekSalesCount - lastWeekSalesCount) / lastWeekSalesCount * 100)
      : currentWeekSalesCount > 0 ? 100 : 0

    return {
      currentMonthRevenue,
      lastMonthRevenue,
      currentMonthProfit,
      lastMonthProfit,
      currentWeekSalesCount,
      lastWeekSalesCount,
      revenueGrowth: Math.round(revenueGrowth),
      profitGrowth: Math.round(profitGrowth),
      salesGrowth: Math.round(salesGrowth)
    }
  }, [sales])

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8 relative">
      {!hasActiveSubscription && <UpgradeOverlay message="Vendas bloqueadas" feature="a gestão completa de vendas e relatórios" />}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-200">
                <ShoppingCart size={24} className="text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vendas de Produtos</h1>
                <p className="text-sm text-gray-500">Gerencie suas vendas e comissões</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="historico"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Ver Histórico
            </Link>
            <Link
              to="profissionais"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Profissionais
            </Link>
            <Link
              to="nova"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
            >
              <Plus size={18} />
              Nova Venda
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Faturamento do Mês */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-orange-600">Faturamento do Mês</span>
              <DollarSign size={18} className="text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.currentMonthRevenue)}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className={stats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'} />
              <span className={stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}%
              </span>
              <span className="text-gray-500">vs {formatCurrency(stats.lastMonthRevenue)}</span>
            </div>
          </div>

          {/* Lucro do Mês */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-600">Lucro do Mês</span>
              <BarChart3 size={18} className="text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.currentMonthProfit)}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className={stats.profitGrowth >= 0 ? 'text-green-500' : 'text-red-500'} />
              <span className={stats.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stats.profitGrowth >= 0 ? '+' : ''}{stats.profitGrowth}%
              </span>
              <span className="text-gray-500">vs {formatCurrency(stats.lastMonthProfit)}</span>
            </div>
          </div>

          {/* Vendas da Semana */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-600">Vendas da Semana</span>
              <ShoppingCart size={18} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.currentWeekSalesCount}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className={stats.salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'} />
              <span className={stats.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stats.salesGrowth >= 0 ? '+' : ''}{stats.salesGrowth}%
              </span>
              <span className="text-gray-500">vs {stats.lastWeekSalesCount} semana anterior</span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPeriodFilter('day')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'day'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Dia
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'week'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Semana
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'month'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Mês
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('year')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'year'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Ano
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por profissional, produto ou ID da venda..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm min-w-[160px]"
            >
              <option value="">Todos os status</option>
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>
        </div>

        {/* Sales List */}
        {isInitialLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SaleSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200">
              <ShoppingCart size={32} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter ? 'Tente ajustar os filtros de busca' : 'Comece registrando sua primeira venda'}
            </p>
            <Link
              to="nova"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
            >
              <Plus size={18} />
              Nova Venda
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(sale => {
              const statusConfig = getPaymentStatusConfig(sale.paymentStatus)

              return (
                <div key={sale.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden border-l-4 border-l-amber-400 hover:shadow-md transition-all">
                  {/* Header da venda - Fundo amarelo claro */}
                  <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {sale.professionalName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{sale.professionalName}</h3>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></div>
                            <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Produtos */}
                  <div className="px-6 py-4 bg-white border-l-4 border-l-amber-100">
                    {sale.items.map((item, index) => (
                      <div key={item.id} className={`py-3 ${index !== sale.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShoppingCart size={16} className="text-orange-500" />
                            <span className="font-medium text-gray-900">{item.stockItemName}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-orange-600 font-semibold">{formatCurrency(item.totalPrice)}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 ml-6">Quantidade: {item.quantity}</div>
                      </div>
                    ))}
                  </div>

                  {/* Footer - Detalhes da venda */}
                  <div className="bg-orange-50 px-6 py-3 border-t border-orange-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-orange-600" />
                          <span className="text-orange-700 font-medium">Data:</span>
                          <span className="text-gray-900">{formatDateTimeBRSafe(sale.soldAt || sale.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign size={14} className="text-green-600" />
                          <span className="text-green-700 font-medium">Total:</span>
                          <span className="text-gray-900 font-semibold">{formatCurrency(sale.totalAmount)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-gray-600" />
                        <span className="text-gray-700 font-medium">Hora:</span>
                        <span className="text-gray-900">{formatInSaoPaulo(sale.soldAt || sale.createdAt, 'HH:mm')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <BarChart3 size={14} className="text-blue-600" />
                      <span className="text-blue-700 font-medium">Lucro:</span>
                      <span className="text-blue-600 font-semibold">{formatCurrency(sale.totalProfit)}</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/app/vendas/editar/${sale.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-all border border-gray-200 hover:border-orange-300"
                      >
                        <Edit size={16} />
                        <span className="text-sm font-medium">Editar</span>
                      </Link>
                      <button
                        onClick={() => handleDeleteSale(sale.id, sale.professionalName)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-gray-200 hover:border-red-200"
                      >
                        <Trash2 size={16} />
                        <span className="text-sm font-medium">Deletar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </div>
  )
}
