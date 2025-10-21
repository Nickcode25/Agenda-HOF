import { Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect } from 'react'
import { Search, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, Edit, ArrowLeft, ShoppingCart } from 'lucide-react'

type PeriodFilter = 'day' | 'week' | 'month' | 'year' | 'custom'

export default function SalesHistory() {
  const { sales, fetchSales } = useSales()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchSales()
  }, [])

  // Calcular datas baseado no período selecionado
  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDate()

    switch (periodFilter) {
      case 'day':
        const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        setStartDate(todayStr)
        setEndDate(todayStr)
        break
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(day - today.getDay())
        const weekEnd = new Date(today)
        weekEnd.setDate(day + (6 - today.getDay()))
        setStartDate(`${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`)
        setEndDate(`${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`)
        break
      case 'month':
        const monthStart = new Date(year, month, 1)
        const monthEnd = new Date(year, month + 1, 0)
        setStartDate(`${year}-${String(month + 1).padStart(2, '0')}-01`)
        setEndDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`)
        break
      case 'year':
        setStartDate(`${year}-01-01`)
        setEndDate(`${year}-12-31`)
        break
      case 'custom':
        // Não fazer nada, usuário vai definir as datas manualmente
        break
    }
  }, [periodFilter])

  const filtered = useMemo(() => {
    let result = sales

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(sale =>
        sale.professionalName.toLowerCase().includes(query) ||
        sale.id.toLowerCase().includes(query) ||
        sale.items.some(item => item.stockItemName.toLowerCase().includes(query))
      )
    }

    if (statusFilter) {
      result = result.filter(sale => sale.paymentStatus === statusFilter)
    }

    // Filtrar por data
    if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      result = result.filter(sale => {
        const saleDate = new Date(sale.createdAt)
        return saleDate >= start && saleDate <= end
      })
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [sales, searchQuery, statusFilter, startDate, endDate])

  // Calcular totais do período
  const periodTotals = useMemo(() => {
    const total = filtered.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const profit = filtered.reduce((sum, sale) => sum + sale.totalProfit, 0)
    const count = filtered.length
    return { total, profit, count }
  }, [filtered])

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Pago' }
      case 'pending':
        return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Pendente' }
      case 'overdue':
        return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Vencido' }
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'Pendente' }
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      cash: 'Dinheiro',
      card: 'Cartão',
      pix: 'PIX',
      transfer: 'Transferência',
      check: 'Cheque'
    }
    return methods[method as keyof typeof methods] || method
  }

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/app/vendas" className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
              <ArrowLeft size={24} className="text-gray-400 hover:text-white" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <ShoppingCart size={32} className="text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Histórico de Vendas</h1>
                <p className="text-gray-400">Visualize todas as vendas realizadas</p>
              </div>
            </div>
          </div>
          {/* Filtros de Período */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setPeriodFilter('day')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                periodFilter === 'day'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                periodFilter === 'week'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                periodFilter === 'month'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setPeriodFilter('year')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                periodFilter === 'year'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Ano
            </button>
            <button
              onClick={() => setPeriodFilter('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                periodFilter === 'custom'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Campos de Data */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (periodFilter !== 'custom') setPeriodFilter('custom')
                }}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  if (periodFilter !== 'custom') setPeriodFilter('custom')
                }}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>

          {/* Busca e Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por profissional, produto ou ID da venda..."
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Todos os status</option>
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Totais do Período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={24} className="text-green-400" />
            <span className="text-sm text-gray-400">Faturamento Total</span>
          </div>
          <div className="text-3xl font-bold text-green-400">{formatCurrency(periodTotals.total)}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={24} className="text-blue-400" />
            <span className="text-sm text-gray-400">Lucro Total</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">{formatCurrency(periodTotals.profit)}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart size={24} className="text-purple-400" />
            <span className="text-sm text-gray-400">Total de Vendas</span>
          </div>
          <div className="text-3xl font-bold text-purple-400">{periodTotals.count}</div>
        </div>
      </div>

      {/* Sales List */}
      {filtered.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <ShoppingCart size={40} className="text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-400">
              {searchQuery || statusFilter ? 'Tente ajustar os filtros de busca' : 'Ainda não há vendas registradas'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sale => {
            const statusConfig = getPaymentStatusConfig(sale.paymentStatus)
            const StatusIcon = statusConfig.icon

            return (
              <div key={sale.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all">
                {/* Header da venda */}
                <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white text-lg">{sale.professionalName}</h3>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.border} border`}>
                        <StatusIcon size={12} className={statusConfig.color} />
                        <span className={statusConfig.color}>{statusConfig.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          <span>{new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 bg-gray-700/50 px-2 py-1 rounded">
                          <DollarSign size={14} />
                          <span>{getPaymentMethodLabel(sale.paymentMethod)}</span>
                        </div>
                      </div>
                      <Link
                        to={`/app/vendas/editar/${sale.id}`}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit size={18} className="text-gray-400 hover:text-orange-400" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Produtos */}
                <div className="px-4 py-3">
                  <div className="space-y-2">
                    {sale.items.map((item, index) => (
                      <div key={item.id} className={`flex items-center justify-between py-2 ${index !== sale.items.length - 1 ? 'border-b border-gray-700/50' : ''}`}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <ShoppingCart size={14} className="text-orange-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{item.stockItemName}</p>
                            <p className="text-xs text-gray-400">Quantidade: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{formatCurrency(item.totalPrice)}</p>
                          <p className="text-xs text-green-400">+{formatCurrency(item.profit)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer com totais */}
                <div className="bg-gray-750 px-4 py-3 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-0.5">Total</p>
                        <p className="text-lg font-bold text-green-400">{formatCurrency(sale.totalAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-0.5">Lucro</p>
                        <p className="text-lg font-bold text-blue-400">{formatCurrency(sale.totalProfit)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
