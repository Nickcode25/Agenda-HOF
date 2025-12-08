import { Link, useSearchParams } from 'react-router-dom'
import { useStock } from '@/store/stock'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { Search, Plus, Package, AlertTriangle, Edit, Trash2, Minus } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { useToast } from '@/hooks/useToast'

export default function StockList() {
  const { items, removeItem, generateAlerts, getUnreadAlerts, fetchItems, loading, fetched, addStock, removeStock } = useStock()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('categoria') || '')
  const { hasActiveSubscription } = useSubscription()
  const { show: showToast } = useToast()


  useEffect(() => {
    fetchItems(true)
  }, [])

  useEffect(() => {
    if (categoryFilter) {
      setSearchParams({ categoria: categoryFilter })
    } else {
      setSearchParams({})
    }
  }, [categoryFilter, setSearchParams])

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

    // Ordenar por nome
    return [...result].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [items, searchQuery, categoryFilter])

  const { confirm, ConfirmDialog } = useConfirm()

  // Categorias nativas do sistema
  const NATIVE_CATEGORIES = [
    'Anestésicos',
    'Bioestimuladores de Colágeno',
    'Fios de Sustentação',
    'Insumos',
    'Peeling e Microagulhamento',
    'Preenchedores com Ácido Hialurônico',
    'Toxina Botulínica',
    'Tratamentos Vasculares'
  ]

  // Combinar categorias nativas com categorias dos itens existentes
  const categories = useMemo(() => {
    const itemCategories = items.map(item => item.category).filter(Boolean)
    return [...new Set([...NATIVE_CATEGORIES, ...itemCategories])].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [items])

  const getStockStatus = (item: { quantity: number; minQuantity: number }) => {
    if (item.quantity === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-50', label: 'Esgotado' }
    if (item.quantity <= item.minQuantity) return { status: 'low', color: 'text-amber-600', bg: 'bg-amber-50', label: 'Baixo' }
    return { status: 'ok', color: 'text-green-600', bg: 'bg-green-50', label: 'OK' }
  }

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (await confirm({ title: 'Remover Produto', message: `Tem certeza que deseja remover "${name}" do estoque?` })) {
      await removeItem(id)
      showToast('Produto removido com sucesso', 'success')
    }
  }, [confirm, removeItem, showToast])


  const handleQuickAdjust = useCallback(async (itemId: string, adjustment: number) => {
    if (adjustment > 0) {
      await addStock(itemId, adjustment, 'Ajuste rápido')
    } else if (adjustment < 0) {
      await removeStock(itemId, Math.abs(adjustment), 'Ajuste rápido')
    }
  }, [addStock, removeStock])

  const isInitialLoading = loading && !fetched

  // Stats simplificadas
  const stats = useMemo(() => {
    const lowStockCount = items.filter(item => item.quantity <= item.minQuantity && item.quantity > 0).length
    const outOfStockCount = items.filter(item => item.quantity === 0).length
    return { total: items.length, lowStock: lowStockCount, outOfStock: outOfStockCount }
  }, [items])

  return (
    <>
      <div className="min-h-screen bg-gray-50 -m-8 p-8 space-y-6 relative">
        {!hasActiveSubscription && <UpgradeOverlay message="Estoque bloqueado" feature="o controle completo de estoque" />}

        {/* Header Simplificado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <Package size={28} className="text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Estoque</h1>
                <p className="text-gray-500 mt-0.5">
                  {stats.total} produtos
                  {stats.lowStock > 0 && <span className="text-amber-600 ml-2">• {stats.lowStock} baixo</span>}
                  {stats.outOfStock > 0 && <span className="text-red-600 ml-2">• {stats.outOfStock} esgotado</span>}
                </p>
              </div>
            </div>

            <Link
              to="/app/estoque/novo"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
            >
              <Plus size={18} />
              Novo Produto
            </Link>
          </div>
        </div>

        {/* Busca */}
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

        {/* Alertas */}
        {unreadAlerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 border-l-4 border-l-amber-400 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={20} className="text-amber-600" />
              <h3 className="font-semibold text-amber-800">Alertas de Estoque ({unreadAlerts.length})</h3>
            </div>
            <div className="space-y-1">
              {unreadAlerts.slice(0, 3).map(alert => (
                <p key={alert.id} className="text-sm text-amber-700">{alert.message}</p>
              ))}
              {unreadAlerts.length > 3 && (
                <p className="text-sm text-amber-600 font-medium">+ {unreadAlerts.length - 3} outros alertas</p>
              )}
            </div>
          </div>
        )}

        {/* Filtros por Categoria */}
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
          {categories.map(category => (
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

        {/* Tabela de Estoque */}
        {isInitialLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" />
            </div>
          </div>
        ) : filtered.length === 0 ? (
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Produto</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-gray-600 w-36">Ajustar</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-gray-600 w-28">Quantidade</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-gray-600 w-24">Mínimo</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-gray-600 w-24">Status</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-gray-600 w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => {
                  const status = getStockStatus(item)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.supplier && <div className="text-sm text-gray-500">{item.supplier}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleQuickAdjust(item.id, -1)}
                            disabled={item.quantity <= 0}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remover 1"
                          >
                            <Minus size={16} />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(item.id, 1)}
                            className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                            title="Adicionar 1"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-bold ${status.color}`}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-600">
                        {item.minQuantity}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={`/app/estoque/${item.id}/editar${categoryFilter ? `?categoria=${encodeURIComponent(categoryFilter)}` : ''}`}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </>
  )
}
