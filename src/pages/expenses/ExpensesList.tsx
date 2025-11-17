import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useExpenses } from '@/store/expenses'
import { formatCurrency } from '@/utils/currency'
import { formatDateBR } from '@/utils/dateHelpers'
import {
  Plus, Receipt, Search, Calendar, DollarSign, TrendingDown,
  CheckCircle, Clock, AlertCircle, Edit, Trash2, Tag, Filter
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { containsIgnoringAccents } from '@/utils/textSearch'

export default function ExpensesList() {
  const { hasActiveSubscription } = useSubscription()
  const {
    expenses,
    categories,
    fetchExpenses,
    fetchCategories,
    deleteExpense,
    getTotalExpenses,
    getExpensesByCategory
  } = useExpenses()
  const { show } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchExpenses()
  }, [])

  const { confirm, ConfirmDialog } = useConfirm()

  const filtered = useMemo(() => {
    let result = expenses

    if (searchQuery.trim()) {
      result = result.filter(expense =>
        containsIgnoringAccents(expense.description, searchQuery) ||
        containsIgnoringAccents(expense.categoryName, searchQuery)
      )
    }

    if (statusFilter) {
      result = result.filter(expense => expense.paymentStatus === statusFilter)
    }

    if (categoryFilter) {
      result = result.filter(expense => expense.categoryId === categoryFilter)
    }

    if (startDate) {
      result = result.filter(expense => {
        const expenseDate = expense.paidAt || expense.dueDate
        return expenseDate && expenseDate >= startDate
      })
    }

    if (endDate) {
      result = result.filter(expense => {
        const expenseDate = expense.paidAt || expense.dueDate
        return expenseDate && expenseDate <= endDate
      })
    }

    return result.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [expenses, searchQuery, statusFilter, categoryFilter, startDate, endDate])

  const totalExpenses = getTotalExpenses(startDate, endDate)
  const byCategory = getExpensesByCategory()

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Pago' }
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Pendente' }
      case 'overdue':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Vencido' }
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Pendente' }
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

  const handleDelete = async (id: string, description: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a despesa "${description}"?`)) {
      await deleteExpense(id)
      await fetchExpenses()
      show('Despesa excluída com sucesso!', 'success')
    }
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 -m-8 p-8 relative">
      {!hasActiveSubscription && <UpgradeOverlay message="Despesas bloqueadas" feature="o controle completo de despesas e categorias" />}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header com breadcrumb */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link to="/app" className="hover:text-red-600 transition-colors">Início</Link>
              <span>›</span>
              <span className="text-gray-900">Despesas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                <Receipt size={24} className="text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Controle de Despesas</h1>
                <p className="text-sm text-gray-500">Gerencie todas as despesas da clínica</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/despesas/categorias"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Tag size={16} />
              Categorias
            </Link>
            <Link
              to="/app/despesas/nova"
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
            >
              <Plus size={18} />
              Nova Despesa
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total de Despesas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-red-600">Total de Despesas</span>
              <TrendingDown size={18} className="text-red-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalExpenses)}</div>
            <div className="text-sm text-gray-500">Despesas pagas</div>
          </div>

          {/* Total de Lançamentos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-orange-600">Total de Lançamentos</span>
              <Receipt size={18} className="text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{expenses.length}</div>
            <div className="text-sm text-gray-500">Despesas cadastradas</div>
          </div>

          {/* Categorias */}
          <Link to="/app/despesas/categorias">
            <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-purple-500 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-purple-600">Categorias</span>
                <Tag size={18} className="text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{categories.filter(c => c.isActive).length}</div>
              <div className="text-sm text-gray-500">Ativas</div>
            </div>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por descrição ou categoria..."
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
              >
                <option value="">Todas as categorias</option>
                {categories.filter(c => c.isActive).map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
              >
                <option value="">Todos os status</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <Receipt size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma despesa encontrada</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter || categoryFilter ? 'Tente ajustar os filtros de busca' : 'Comece registrando sua primeira despesa'}
            </p>
            <Link
              to="/app/despesas/nova"
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
            >
              <Plus size={18} />
              Nova Despesa
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(expense => {
              const statusConfig = getPaymentStatusConfig(expense.paymentStatus)
              const StatusIcon = statusConfig.icon
              const category = categories.find(c => c.id === expense.categoryId)

              return (
                <div key={expense.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden border-l-4 border-l-red-400 hover:shadow-md transition-all">
                  {/* Header da despesa */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {category && (
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}30` }}
                          >
                            <Tag size={20} style={{ color: category.color }} />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{expense.description}</h3>
                          <p className="text-sm text-gray-500">{expense.categoryName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.border} border`}>
                          <StatusIcon size={12} className={statusConfig.color} />
                          <span className={statusConfig.color}>{statusConfig.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(expense.amount)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer - Detalhes */}
                  <div className="px-6 py-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          <span>
                            {expense.paidAt
                              ? `Pago em ${formatDateBR(expense.paidAt.split('T')[0])}`
                              : expense.dueDate
                              ? `Vence em ${formatDateBR(expense.dueDate.split('T')[0])}`
                              : 'Sem data'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                          <DollarSign size={14} />
                          <span>{getPaymentMethodLabel(expense.paymentMethod)}</span>
                        </div>
                        {expense.isRecurring && (
                          <div className="flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
                            <span className="text-purple-600 text-xs font-medium">Recorrente</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/app/despesas/editar/${expense.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar despesa"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(expense.id, expense.description)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir despesa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
