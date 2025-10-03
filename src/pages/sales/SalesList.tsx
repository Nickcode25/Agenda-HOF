import { Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState } from 'react'
import { Search, Plus, ShoppingCart, User, Calendar, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function SalesList() {
  const { sales, professionals, getTotalRevenue, getTotalProfit } = useSales()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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
    
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [sales, searchQuery, statusFilter])

  const totalRevenue = getTotalRevenue()
  const totalProfit = getTotalProfit()

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Venda de Produtos</h1>
          <p className="text-gray-400">Gerencie vendas para outros profissionais</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/vendas/profissionais/novo"
            className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <User size={16} />
            Cadastrar Profissional
          </Link>
          <Link
            to="/vendas/nova"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
          >
            <Plus size={18} />
            Nova Venda
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign size={20} className="text-green-400" />
            </div>
            <h3 className="font-medium text-gray-300">Faturamento Total</h3>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp size={20} className="text-blue-400" />
            </div>
            <h3 className="font-medium text-gray-300">Lucro Total</h3>
          </div>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalProfit)}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ShoppingCart size={20} className="text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-300">Total de Vendas</h3>
          </div>
          <p className="text-2xl font-bold text-purple-400">{sales.length}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <User size={20} className="text-orange-400" />
            </div>
            <h3 className="font-medium text-gray-300">Profissionais</h3>
          </div>
          <p className="text-2xl font-bold text-orange-400">{professionals.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por profissional, produto ou ID da venda..."
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
        >
          <option value="">Todos os status</option>
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
          <option value="overdue">Vencido</option>
        </select>
      </div>

      {/* Sales List */}
      {filtered.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={40} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhuma venda encontrada</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || statusFilter ? 'Tente ajustar os filtros de busca' : 'Comece registrando sua primeira venda'}
          </p>
          <Link
            to="/vendas/nova"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Nova Venda
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(sale => {
            const statusConfig = getPaymentStatusConfig(sale.paymentStatus)
            const StatusIcon = statusConfig.icon

            return (
              <div key={sale.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{sale.professionalName}</h3>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.bg} ${statusConfig.border} border`}>
                        <StatusIcon size={12} className={statusConfig.color} />
                        <span className={statusConfig.color}>{statusConfig.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(sale.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <span>•</span>
                      <span>{getPaymentMethodLabel(sale.paymentMethod)}</span>
                      <span>•</span>
                      <span>ID: {sale.id.slice(0, 8)}</span>
                    </div>
                    
                    {/* Items */}
                    <div className="space-y-2 mb-4">
                      {sale.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-700/30 rounded-lg p-3">
                          <div className="flex-1">
                            <span className="text-white font-medium">{item.stockItemName}</span>
                            <span className="text-gray-400 ml-2">x{item.quantity}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">{formatCurrency(item.totalPrice)}</div>
                            <div className="text-xs text-green-400">
                              Lucro: {formatCurrency(item.profit)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    {sale.items.length} {sale.items.length === 1 ? 'produto' : 'produtos'}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      Total: {formatCurrency(sale.totalAmount)}
                    </div>
                    <div className="text-sm text-blue-400">
                      Lucro: {formatCurrency(sale.totalProfit)}
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
