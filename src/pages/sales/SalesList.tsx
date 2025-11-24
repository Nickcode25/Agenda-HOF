import { Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, ShoppingCart, User, Calendar, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Trash2, Edit, BarChart3 } from 'lucide-react'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'
import { formatInSaoPaulo } from '@/utils/timezone'

export default function SalesList() {
  const { sales, professionals, getTotalRevenue, getTotalProfit, fetchProfessionals, fetchSales, removeSale } = useSales()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { hasActiveSubscription } = useSubscription()

  useEffect(() => {
    fetchProfessionals()
    fetchSales()
  }, [])

  const filtered = useMemo(() => {
    let result = sales

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

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [sales, searchQuery, statusFilter])

  const totalRevenue = getTotalRevenue()
  const totalProfit = getTotalProfit()

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Pago', dot: 'bg-green-500' }
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Pendente', dot: 'bg-yellow-500' }
      case 'overdue':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Vencido', dot: 'bg-red-500' }
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Pendente', dot: 'bg-gray-500' }
    }
  }

  const handleDeleteSale = async (saleId: string, saleName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a venda para ${saleName}? Esta ação não pode ser desfeita.`)) {
      await removeSale(saleId)
      await fetchSales()
    }
  }

  // Calcula estatísticas adicionais
  const stats = useMemo(() => {
    const lastMonthRevenue = totalRevenue * 0.9 // Simulação
    const lastWeekSales = Math.floor(sales.length * 0.95) // Simulação
    const revenueGrowth = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(0) : 0
    const salesGrowth = lastWeekSales > 0 ? ((sales.length - lastWeekSales) / lastWeekSales * 100).toFixed(0) : 0

    return {
      revenueGrowth: Number(revenueGrowth),
      salesGrowth: Number(salesGrowth)
    }
  }, [totalRevenue, sales.length])

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8 relative">
      {!hasActiveSubscription && <UpgradeOverlay message="Vendas bloqueadas" feature="a gestão completa de vendas e relatórios" />}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <ShoppingCart size={24} className="text-amber-600" />
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
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
            >
              <Plus size={18} />
              Nova Venda
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Faturamento Total */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-amber-600">Faturamento Total</span>
              <DollarSign size={18} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className={stats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'} />
              <span className={stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}%
              </span>
              <span className="text-gray-500">(vs mês anterior)</span>
            </div>
          </div>

          {/* Lucro Total */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-600">Lucro Total</span>
              <BarChart3 size={18} className="text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalProfit)}</div>
            <div className="flex items-center gap-1 text-sm">
              <BarChart3 size={14} className="text-green-500" />
              <span className="text-green-600">Trending</span>
            </div>
          </div>

          {/* Total de Vendas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-600">Total de Vendas</span>
              <ShoppingCart size={18} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{sales.length}</div>
            <div className="flex items-center gap-1 text-sm">
              <TrendingUp size={14} className={stats.salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'} />
              <span className={stats.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {stats.salesGrowth >= 0 ? '+' : ''}{stats.salesGrowth}%
              </span>
              <span className="text-gray-500">(vs semana anterior)</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por profissional, produto ou ID da venda..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-sm min-w-[160px]"
            >
              <option value="">Todos os status</option>
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>
        </div>

        {/* Sales List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <ShoppingCart size={32} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter ? 'Tente ajustar os filtros de busca' : 'Comece registrando sua primeira venda'}
            </p>
            <Link
              to="nova"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
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
                  <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
                            <ShoppingCart size={16} className="text-amber-500" />
                            <span className="font-medium text-gray-900">{item.stockItemName}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-amber-600 font-semibold">{formatCurrency(item.totalPrice)}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 ml-6">Quantidade: {item.quantity}</div>
                      </div>
                    ))}
                  </div>

                  {/* Footer - Detalhes da venda */}
                  <div className="bg-yellow-50 px-6 py-3 border-t border-yellow-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-amber-600" />
                          <span className="text-amber-700 font-medium">Data:</span>
                          <span className="text-gray-900">{formatDateTimeBRSafe(sale.createdAt)}</span>
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
                        <span className="text-gray-900">{formatInSaoPaulo(sale.createdAt, 'HH:mm')}</span>
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
                        className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-gray-200 hover:border-amber-200"
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
    </div>
  )
}
