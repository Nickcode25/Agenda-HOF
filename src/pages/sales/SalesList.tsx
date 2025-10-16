import { Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, ShoppingCart, User, Calendar, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function SalesList() {
  const { sales, professionals, getTotalRevenue, getTotalProfit, fetchProfessionals, fetchSales } = useSales()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchProfessionals()
    fetchSales()
  }, [])

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div className="flex gap-3">
          <Link
            to="profissionais/novo"
            className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <User size={16} />
            Cadastrar Profissional
          </Link>
          <Link
            to="nova"
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

        <Link to="historico" className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all">
              <ShoppingCart size={20} className="text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-300 group-hover:text-purple-400 transition-all">Total de Vendas</h3>
          </div>
          <p className="text-2xl font-bold text-purple-400">{sales.length}</p>
        </Link>

        <Link to="profissionais-lista" className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all cursor-pointer group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-all">
              <User size={20} className="text-orange-400" />
            </div>
            <h3 className="font-medium text-gray-300 group-hover:text-orange-400 transition-all">Profissionais</h3>
          </div>
          <p className="text-2xl font-bold text-orange-400">{professionals.length}</p>
        </Link>
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
            to="nova"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Nova Venda
          </Link>
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
