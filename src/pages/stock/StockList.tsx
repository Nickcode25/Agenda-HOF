import { Link, useSearchParams } from 'react-router-dom'
import { useStock } from '@/store/stock'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, Package, AlertTriangle, Edit, Trash2, Tag, CheckCircle } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { containsIgnoringAccents } from '@/utils/textSearch'


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
      result = result.filter(item =>
        containsIgnoringAccents(item.name, searchQuery) ||
        containsIgnoringAccents(item.category, searchQuery) ||
        containsIgnoringAccents(item.notes || '', searchQuery)
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
    if (item.quantity === 0) return {
      status: 'out',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '🔴',
      label: 'Esgotado'
    }
    if (item.quantity <= item.minQuantity) return {
      status: 'low',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '⚠️',
      label: 'Estoque baixo'
    }
    return {
      status: 'ok',
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✅',
      label: 'OK'
    }
  }

  const handleDelete = async (id: string) => {
    if (await confirm({ title: 'Confirmação', message: 'Tem certeza que deseja remover este item do estoque?' })) {
      removeItem(id)
    }
  }

  // Estatísticas do estoque
  const stats = useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0)
    const lowStockCount = items.filter(item => item.quantity <= item.minQuantity && item.quantity > 0).length
    const outOfStockCount = items.filter(item => item.quantity === 0).length
    return {
      total: items.length,
      totalValue,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount
    }
  }, [items])

  return (
    <>
    <div className="min-h-screen bg-gray-50 -m-8 p-8 space-y-6 relative">
      {!hasActiveSubscription && <UpgradeOverlay message="Estoque bloqueado" feature="o controle completo de estoque e alertas" />}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Package size={28} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
              <p className="text-gray-500 mt-0.5">Gerencie seus produtos e suprimentos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/app/procedimentos/categorias"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-medium border border-gray-200 shadow-sm transition-all"
            >
              <Tag size={18} />
              Categorias
            </Link>
            <Link
              to="/app/estoque/novo"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
            >
              <Plus size={18} />
              Adicionar Produto
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-orange-600" />
              <span className="text-sm text-gray-600">Total de Produtos</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm text-gray-600">Valor em Estoque</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-yellow-600" />
              <span className="text-sm text-gray-600">Estoque Baixo</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{stats.lowStock}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm text-gray-600">Esgotados</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{stats.outOfStock}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
      </div>

      {/* Alerts */}
      {unreadAlerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 border-l-4 border-l-yellow-400 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Alertas de Estoque ({unreadAlerts.length})</h3>
          </div>
          <div className="space-y-1">
            {unreadAlerts.slice(0, 3).map(alert => (
              <p key={alert.id} className="text-sm text-yellow-700">{alert.message}</p>
            ))}
            {unreadAlerts.length > 3 && (
              <p className="text-sm text-yellow-600 font-medium">+ {unreadAlerts.length - 3} outros alertas</p>
            )}
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            !categoryFilter
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Todos
        </button>
        {categories.sort().map(category => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              categoryFilter === category
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Stock Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchQuery || categoryFilter ? 'Tente ajustar os filtros de busca' : 'Comece adicionando produtos ao seu estoque'}
          </p>
          <Link
            to="/app/estoque/novo"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={18} />
            Adicionar Produto
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(item => {
            const stockStatus = getStockStatus(item)

            return (
              <div key={item.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${stockStatus.status === 'ok' ? 'border-l-orange-500' : stockStatus.status === 'low' ? 'border-l-yellow-500' : 'border-l-red-500'} p-5 hover:shadow-md transition-all`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full font-medium">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                    {item.supplier && (
                      <p className="text-sm text-gray-500">{item.supplier}</p>
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-lg mb-4 ${stockStatus.bg} border ${stockStatus.border}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Quantidade:</span>
                    <span className={`font-bold ${stockStatus.color}`}>
                      {stockStatus.icon} {item.quantity} {item.unit}
                    </span>
                  </div>
                  {item.dosesPerUnit && item.dosesPerUnit > 1 && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-blue-600">Aplicações disponíveis:</span>
                      <span className="text-xs text-blue-600 font-bold">
                        {Math.floor(item.quantity * item.dosesPerUnit)} doses
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600">Mínimo: {item.minQuantity} {item.unit}</span>
                    <span className={`text-xs font-medium ${stockStatus.color}`}>{stockStatus.label}</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Custo unit.:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(item.costPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valor total:</span>
                    <span className="text-orange-600 font-bold">
                      {formatCurrency(item.quantity * item.costPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Link
                    to={`/app/estoque/${item.id}/editar${categoryFilter ? `?categoria=${encodeURIComponent(categoryFilter)}` : ''}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-sm transition-all border border-gray-200"
                  >
                    <Edit size={14} />
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-lg font-medium text-sm transition-all border border-gray-200 hover:border-red-200"
                  >
                    <Trash2 size={14} />
                    Deletar
                  </button>
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
