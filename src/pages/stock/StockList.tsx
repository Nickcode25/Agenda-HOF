import { Link } from 'react-router-dom'
import { useStock } from '@/store/stock'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState } from 'react'
import { Search, Plus, Package, AlertTriangle, Calendar, TrendingDown, TrendingUp, Edit, Trash2 } from 'lucide-react'

export default function StockList() {
  const { items, removeItem, generateAlerts, getUnreadAlerts } = useStock()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Gerar alertas ao carregar a página
  useMemo(() => {
    generateAlerts()
  }, [generateAlerts])

  const unreadAlerts = getUnreadAlerts()

  const filtered = useMemo(() => {
    let result = items
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      )
    }
    
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter)
    }
    
    return result
  }, [items, searchQuery, categoryFilter])

  const categories = useMemo(() => {
    return Array.from(new Set(items.map(item => item.category)))
  }, [items])

  const getStockStatus = (item: any) => {
    if (item.quantity === 0) return { status: 'out', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }
    if (item.quantity <= item.minQuantity) return { status: 'low', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' }
    return { status: 'ok', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' }
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este item do estoque?')) {
      removeItem(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Estoque</h1>
          <p className="text-gray-400">Gerencie seus produtos e materiais</p>
        </div>
        <Link
          to="/estoque/novo"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
        >
          <Plus size={18} />
          Adicionar Produto
        </Link>
      </div>

      {/* Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-yellow-400" />
            <h3 className="font-medium text-yellow-400">Alertas de Estoque ({unreadAlerts.length})</h3>
          </div>
          <div className="space-y-1">
            {unreadAlerts.slice(0, 3).map(alert => (
              <p key={alert.id} className="text-sm text-yellow-300">{alert.message}</p>
            ))}
            {unreadAlerts.length > 3 && (
              <p className="text-sm text-yellow-400">+ {unreadAlerts.length - 3} outros alertas</p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
        >
          <option value="">Todas as categorias</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Stock Grid */}
      {filtered.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={40} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || categoryFilter ? 'Tente ajustar os filtros de busca' : 'Comece adicionando produtos ao seu estoque'}
          </p>
          <Link
            to="/estoque/novo"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Adicionar Produto
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => {
            const stockStatus = getStockStatus(item)
            const isExpiringSoon = item.expirationDate && 
              new Date(item.expirationDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

            return (
              <div key={item.id} className={`bg-gray-800 border rounded-2xl p-6 hover:border-gray-600 transition-all ${stockStatus.border}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-400 mb-2">{item.category}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500 mb-3">{item.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/estoque/${item.id}/editar`}
                      className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className={`p-3 rounded-lg mb-4 ${stockStatus.bg}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Quantidade</span>
                    <span className={`font-bold ${stockStatus.color}`}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">Mínimo: {item.minQuantity} {item.unit}</span>
                    {item.quantity === 0 && <span className="text-xs text-red-400">Esgotado</span>}
                    {item.quantity > 0 && item.quantity <= item.minQuantity && (
                      <span className="text-xs text-yellow-400">Estoque baixo</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Custo unitário:</span>
                    <span className="text-white">{formatCurrency(item.cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor total:</span>
                    <span className="text-green-400 font-medium">
                      {formatCurrency(item.quantity * item.cost)}
                    </span>
                  </div>
                  {item.supplier && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fornecedor:</span>
                      <span className="text-white">{item.supplier}</span>
                    </div>
                  )}
                  {item.expirationDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vencimento:</span>
                      <span className={isExpiringSoon ? 'text-yellow-400' : 'text-white'}>
                        {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
