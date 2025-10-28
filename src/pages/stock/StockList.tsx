import { Link, useSearchParams } from 'react-router-dom'
import { useStock } from '@/store/stock'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, Package, AlertTriangle, Calendar, TrendingDown, TrendingUp, Edit, Trash2, Tag } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'


export default function StockList() {
  const { items, removeItem, generateAlerts, getUnreadAlerts, fetchItems } = useStock()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('categoria') || '')
  const { hasActiveSubscription } = useSubscription()

  useEffect(() => {
    fetchItems(true) // Força reload ao montar o componente
  }, [])

  // Atualizar URL quando o filtro mudar
  useEffect(() => {
    if (categoryFilter) {
      setSearchParams({ categoria: categoryFilter })
    } else {
      setSearchParams({})
    }
  }, [categoryFilter, setSearchParams])
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
        item.category.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query)
      )
    }
    
    if (categoryFilter) {
      result = result.filter(item => item.category === categoryFilter)
    }
    
    return result
  }, [items, searchQuery, categoryFilter])

  const { confirm, ConfirmDialog } = useConfirm()

  const categories = useMemo(() => {
    return Array.from(new Set(items.map(item => item.category)))
  }, [items])

  const getStockStatus = (item: any) => {
    if (item.quantity === 0) return { status: 'out', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }
    if (item.quantity <= item.minQuantity) return { status: 'low', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' }
    return { status: 'ok', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' }
  }

  const handleDelete = async (id: string) => {
    if (await confirm({ title: 'Confirmação', message: 'Tem certeza que deseja remover este item do estoque?' })) {
      removeItem(id)
    }
  }

  return (
    <>
    <div className="space-y-6 relative">
      {!hasActiveSubscription && <UpgradeOverlay message="Estoque bloqueado" feature="o controle completo de estoque e alertas" />}
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Package size={32} className="text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Estoque</h1>
                <p className="text-gray-400">Gerencie seus produtos e suprimentos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/app/procedimentos/categorias"
                className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap border border-gray-600"
              >
                <Tag size={18} />
                Categorias
              </Link>
              <Link
                to="/app/estoque/novo"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 whitespace-nowrap"
              >
                <Plus size={18} />
                Adicionar Produto
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>

            {/* Quick Category Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  !categoryFilter
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600/50'
                }`}
              >
                Todas
              </button>
              {categories.sort().map(category => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    categoryFilter === category
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 to-orange-500/5 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
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
        </div>
      )}

      {/* Stock Grid */}
      {filtered.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <Package size={40} className="text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || categoryFilter ? 'Tente ajustar os filtros de busca' : 'Comece adicionando produtos ao seu estoque'}
            </p>
            <Link
              to="/app/estoque/novo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
            >
              <Plus size={18} />
              Adicionar Produto
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => {
            const stockStatus = getStockStatus(item)

            return (
              <div key={item.id} className={`group relative bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border rounded-2xl p-6 hover:border-gray-600/80 transition-all duration-300 ${stockStatus.border}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{item.name}</h3>
                      {item.supplier && (
                        <span className="text-xs px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/30">
                          {item.supplier}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{item.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/app/estoque/${item.id}/editar${categoryFilter ? `?categoria=${encodeURIComponent(categoryFilter)}` : ''}`}
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
                  {item.dosesPerUnit && item.dosesPerUnit > 1 && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-blue-400">Aplicações disponíveis:</span>
                      <span className="text-xs text-blue-400 font-bold">
                        {Math.floor(item.quantity * item.dosesPerUnit)} doses
                      </span>
                    </div>
                  )}
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
                    <span className="text-white">{formatCurrency(item.costPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor total:</span>
                    <span className="text-green-400 font-medium">
                      {formatCurrency(item.quantity * item.costPrice)}
                    </span>
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
