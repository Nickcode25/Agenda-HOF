import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useExpenses } from '@/store/expenses'
import { formatCurrency } from '@/utils/currency'
import {
  Plus, Receipt, Search, Calendar, DollarSign, TrendingDown,
  CheckCircle, Clock, AlertCircle, Edit, Trash2, Tag, Filter
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'

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
      const query = searchQuery.toLowerCase()
      result = result.filter(expense =>
        expense.description.toLowerCase().includes(query) ||
        expense.categoryName.toLowerCase().includes(query)
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

  const handleDelete = async (id: string, description: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a despesa "${description}"?`)) {
      await deleteExpense(id)
      await fetchExpenses()
      show('Despesa excluída com sucesso!', 'success')
    }
  }

  const stats = [
    {
      label: 'Total de Despesas',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-gradient-to-br from-red-500/10 to-red-600/5',
      border: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      subtitle: 'Despesas pagas'
    },
    {
      label: 'Total de Lançamentos',
      value: expenses.length.toString(),
      icon: Receipt,
      color: 'text-orange-400',
      bg: 'bg-gradient-to-br from-orange-500/10 to-orange-600/5',
      border: 'border-orange-500/30',
      iconBg: 'bg-orange-500/20',
      subtitle: 'Despesas cadastradas'
    },
    {
      label: 'Categorias',
      value: categories.filter(c => c.isActive).length.toString(),
      icon: Tag,
      color: 'text-purple-400',
      bg: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5',
      border: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20',
      subtitle: 'Ativas',
      link: '/app/despesas/categorias'
    }
  ]

  return (
    <>
    <div className="space-y-6 relative">
      {!hasActiveSubscription && <UpgradeOverlay message="Despesas bloqueadas" feature="o controle completo de despesas e categorias" />}
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <Receipt size={32} className="text-red-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Controle de Despesas</h1>
                <p className="text-gray-400">Gerencie todas as despesas da clínica</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                to="/app/despesas/categorias"
                className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Tag size={16} />
                Categorias
              </Link>
              <Link
                to="/app/despesas/nova"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40"
              >
                <Plus size={18} />
                Nova Despesa
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative lg:col-span-2">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por descrição ou categoria..."
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
        >
          <option value="">Todas as categorias</option>
          {categories.filter(c => c.isActive).map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
        >
          <option value="">Todos os status</option>
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
          <option value="overdue">Vencido</option>
        </select>
      </div>

      {/* Date Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Data Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Data Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Receipt size={40} className="text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma despesa encontrada</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || statusFilter || categoryFilter ? 'Tente ajustar os filtros de busca' : 'Comece registrando sua primeira despesa'}
            </p>
            <Link
              to="/app/despesas/nova"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40"
            >
              <Plus size={18} />
              Nova Despesa
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(expense => {
            const statusConfig = getPaymentStatusConfig(expense.paymentStatus)
            const StatusIcon = statusConfig.icon
            const category = categories.find(c => c.id === expense.categoryId)

            return (
              <div key={expense.id} className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden hover:border-gray-600/80 transition-all duration-300 hover:shadow-xl">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
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
                        <h3 className="font-semibold text-white text-lg">{expense.description}</h3>
                        <p className="text-sm text-gray-400">{expense.categoryName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.border} border`}>
                        <StatusIcon size={12} className={statusConfig.color} />
                        <span className={statusConfig.color}>{statusConfig.label}</span>
                      </div>
                      <div className="text-2xl font-bold text-red-400">{formatCurrency(expense.amount)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>
                          {expense.paidAt
                            ? `Pago em ${new Date(expense.paidAt).toLocaleDateString('pt-BR')}`
                            : expense.dueDate
                            ? `Vence em ${new Date(expense.dueDate).toLocaleDateString('pt-BR')}`
                            : 'Sem data'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-600/50">
                        <DollarSign size={14} />
                        <span>{getPaymentMethodLabel(expense.paymentMethod)}</span>
                      </div>
                      {expense.isRecurring && (
                        <div className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/30">
                          <span className="text-purple-400 text-xs">Recorrente</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/app/despesas/editar/${expense.id}`}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all border border-transparent hover:border-blue-500/30"
                        title="Editar despesa"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(expense.id, expense.description)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/30"
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

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
