import { Link } from 'react-router-dom'
import { useSales } from '@/store/sales'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, ShoppingCart, User, Calendar, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Trash2, Edit } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'

export default function SalesList() {
  const { sales, professionals, getTotalRevenue, getTotalProfit, fetchProfessionals, fetchSales, removeSale } = useSales()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchProfessionals()
    fetchSales()
  }, [])

  const { confirm, ConfirmDialog } = useConfirm()

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

  const handleDeleteSale = async (saleId: string, saleName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a venda para ${saleName}? Esta ação não pode ser desfeita.`)) {
      await removeSale(saleId)
      await fetchSales()
    }
  }

  const stats = [
    {
      label: 'Faturamento Total',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-gradient-to-br from-green-500/10 to-green-600/5',
      border: 'border-green-500/30',
      iconBg: 'bg-green-500/20',
      subtitle: 'Receita de vendas'
    },
    {
      label: 'Lucro Total',
      value: formatCurrency(totalProfit),
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      subtitle: 'Margem de lucro'
    },
    {
      label: 'Total de Vendas',
      value: sales.length.toString(),
      icon: ShoppingCart,
      color: 'text-purple-400',
      bg: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5',
      border: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20',
      subtitle: 'Vendas realizadas',
      link: 'historico'
    },
    {
      label: 'Profissionais',
      value: professionals.length.toString(),
      icon: User,
      color: 'text-orange-400',
      bg: 'bg-gradient-to-br from-orange-500/10 to-orange-600/5',
      border: 'border-orange-500/30',
      iconBg: 'bg-orange-500/20',
      subtitle: 'Cadastrados',
      link: 'profissionais'
    }
  ]

  return (
    <>
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <ShoppingCart size={32} className="text-orange-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Vendas de Produtos</h1>
                <p className="text-gray-400">Gerencie suas vendas e comissões</p>
              </div>
            </div>
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const content = (
            <div className={`${stat.bg} border ${stat.border} rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl ${stat.link ? 'cursor-pointer' : ''}`}>
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

          return stat.link ? (
            <Link key={index} to={stat.link}>
              {content}
            </Link>
          ) : (
            <div key={index}>
              {content}
            </div>
          )
        })}
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
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <ShoppingCart size={40} className="text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma venda encontrada</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || statusFilter ? 'Tente ajustar os filtros de busca' : 'Comece registrando sua primeira venda'}
            </p>
            <Link
              to="nova"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
            >
              <Plus size={18} />
              Nova Venda
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(sale => {
            const statusConfig = getPaymentStatusConfig(sale.paymentStatus)
            const StatusIcon = statusConfig.icon

            return (
              <div key={sale.id} className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden hover:border-gray-600/80 transition-all duration-300 hover:shadow-xl">
                {/* Header da venda */}
                <div className="px-6 py-4 border-b border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white text-lg">{sale.professionalName}</h3>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.border} border`}>
                        <StatusIcon size={12} className={statusConfig.color} />
                        <span className={statusConfig.color}>{statusConfig.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>{new Date(sale.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-600/50">
                        <DollarSign size={14} />
                        <span>{getPaymentMethodLabel(sale.paymentMethod)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Produtos */}
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {sale.items.map((item, index) => (
                      <div key={item.id} className={`flex items-center justify-between py-3 ${index !== sale.items.length - 1 ? 'border-b border-gray-700/30' : ''}`}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl flex items-center justify-center border border-orange-500/20">
                            <ShoppingCart size={16} className="text-orange-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{item.stockItemName}</p>
                            <p className="text-xs text-gray-400">Quantidade: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{formatCurrency(item.totalPrice)}</p>
                          <p className="text-xs text-green-400 font-medium">+{formatCurrency(item.profit)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer com totais */}
                <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/30 px-6 py-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-400">
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                      </div>
                      <Link
                        to={`/app/vendas/editar/${sale.id}`}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all border border-transparent hover:border-blue-500/30"
                        title="Editar venda"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDeleteSale(sale.id, sale.professionalName)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/30"
                        title="Excluir venda"
                      >
                        <Trash2 size={16} />
                      </button>
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

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
