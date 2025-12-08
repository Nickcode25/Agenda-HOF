import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { useExpenses } from '@/store/expenses'
import { formatCurrency } from '@/utils/currency'
import { formatDateBR } from '@/utils/dateHelpers'
import {
  Plus, Receipt, Search, Calendar, DollarSign, TrendingDown,
  CheckCircle, Clock, AlertCircle, Edit, Trash2, Tag, Filter, X
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription, Feature, FEATURE_REQUIRED_PLAN } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { containsIgnoringAccents } from '@/utils/textSearch'
import SearchableSelect from '@/components/SearchableSelect'

// Tipos para o modal de detalhes
type DetailModalType = 'paidPeriod' | 'pendingPeriod' | 'overdue' | 'monthlyAvg' | 'totalPeriod' | 'recurring' | null

// Skeleton loader para despesas
const ExpenseSkeleton = memo(() => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden border-l-4 border-l-red-400 animate-pulse">
    <div className="px-6 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-200 h-10 w-10" />
          <div>
            <div className="h-5 w-40 bg-gray-200 rounded mb-1" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
          <div className="h-7 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
    <div className="px-6 py-3 bg-gray-50">
      <div className="flex justify-between">
        <div className="h-4 w-40 bg-gray-100 rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
))

type PeriodFilter = 'day' | 'week' | 'month' | 'year'

export default function ExpensesList() {
  const { hasFeature, planType } = useSubscription()
  const {
    expenses,
    categories,
    fetchExpenses,
    fetchCategories,
    deleteExpense,
    getTotalExpenses,
    getExpensesByCategory,
    loading
  } = useExpenses()
  const { show } = useToast()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day')
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [hasFetched, setHasFetched] = useState(false)
  const [detailModal, setDetailModal] = useState<DetailModalType>(null)

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchCategories(), fetchExpenses()])
      setHasFetched(true)
    }
    loadData()
  }, [])

  // Atualizar datas quando o período mudar
  useEffect(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    switch (periodFilter) {
      case 'day':
        setStartDate(todayStr)
        setEndDate(todayStr)
        break

      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        setStartDate(weekStart.toISOString().split('T')[0])
        setEndDate(weekEnd.toISOString().split('T')[0])
        break

      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        setStartDate(monthStart.toISOString().split('T')[0])
        setEndDate(monthEnd.toISOString().split('T')[0])
        break

      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        const yearEnd = new Date(now.getFullYear(), 11, 31)
        setStartDate(yearStart.toISOString().split('T')[0])
        setEndDate(yearEnd.toISOString().split('T')[0])
        break
    }
  }, [periodFilter])

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
        const expenseDate = (expense.paidAt || expense.dueDate)?.split('T')[0]
        return expenseDate && expenseDate >= startDate
      })
    }

    if (endDate) {
      result = result.filter(expense => {
        const expenseDate = (expense.paidAt || expense.dueDate)?.split('T')[0]
        return expenseDate && expenseDate <= endDate
      })
    }

    return result.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [expenses, searchQuery, statusFilter, categoryFilter, startDate, endDate])

  const totalExpenses = getTotalExpenses(startDate, endDate)
  const byCategory = getExpensesByCategory()

  // Estatísticas melhoradas
  const stats = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Despesas do período filtrado
    const periodExpenses = expenses.filter(e => {
      const expenseDate = (e.paidAt || e.dueDate)?.split('T')[0]
      return expenseDate && expenseDate >= startDate && expenseDate <= endDate
    })

    // Total pago no período
    const paidInPeriod = periodExpenses
      .filter(e => e.paymentStatus === 'paid')
      .reduce((sum, e) => sum + e.amount, 0)

    // Total pendente no período
    const pendingInPeriod = periodExpenses
      .filter(e => e.paymentStatus === 'pending')
      .reduce((sum, e) => sum + e.amount, 0)

    // Quantidade pendente
    const pendingCount = periodExpenses.filter(e => e.paymentStatus === 'pending').length

    // Despesas vencidas (todas, não só do período)
    const overdueExpenses = expenses.filter(e => {
      if (e.paymentStatus === 'paid') return false
      const dueDate = e.dueDate?.split('T')[0]
      return dueDate && dueDate < today
    })
    const overdueTotal = overdueExpenses.reduce((sum, e) => sum + e.amount, 0)
    const overdueCount = overdueExpenses.length

    // Média mensal (últimos 12 meses)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const lastYearExpenses = expenses.filter(e => {
      if (e.paymentStatus !== 'paid') return false
      const paidDate = e.paidAt?.split('T')[0]
      return paidDate && new Date(paidDate) >= twelveMonthsAgo
    })
    const totalLastYear = lastYearExpenses.reduce((sum, e) => sum + e.amount, 0)
    const monthlyAverage = totalLastYear / 12

    // Despesas recorrentes
    const recurringCount = expenses.filter(e => e.isRecurring).length
    const recurringTotal = expenses
      .filter(e => e.isRecurring && e.paymentStatus !== 'paid')
      .reduce((sum, e) => sum + e.amount, 0)

    // Listas para o modal
    const paidList = periodExpenses.filter(e => e.paymentStatus === 'paid')
    const pendingList = periodExpenses.filter(e => e.paymentStatus === 'pending')
    const recurringList = expenses.filter(e => e.isRecurring)

    return {
      paidInPeriod,
      pendingInPeriod,
      pendingCount,
      overdueTotal,
      overdueCount,
      monthlyAverage,
      recurringCount,
      recurringTotal,
      periodCount: periodExpenses.length,
      paidCount: paidList.length,
      // Listas para o modal
      paidList,
      pendingList,
      overdueList: overdueExpenses,
      periodList: periodExpenses,
      recurringList
    }
  }, [expenses, startDate, endDate])

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

  const handleDelete = useCallback(async (id: string, description: string) => {
    const confirmed = await confirm({
      title: 'Excluir Despesa',
      message: `Tem certeza que deseja excluir a despesa "${description}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    })
    if (confirmed) {
      await deleteExpense(id)
      await fetchExpenses()
      show('Despesa excluída com sucesso!', 'success')
    }
  }, [confirm, deleteExpense, fetchExpenses, show])

  // Verificar se está carregando inicialmente
  const isInitialLoading = loading && !hasFetched

  return (
    <>
    <div className="min-h-screen bg-gray-50 -m-8 p-8 relative">
      {!hasFeature('expenses') && <UpgradeOverlay message="Despesas bloqueadas" feature="o controle completo de despesas e categorias" requiredPlan={FEATURE_REQUIRED_PLAN['expenses']} currentPlan={planType} />}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
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

        {/* Stats Cards - Linha 1 */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Pagas no Período */}
          <div
            onClick={() => setDetailModal('paidPeriod')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-green-500 cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-600">Pagas no Período</span>
              <CheckCircle size={18} className="text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.paidInPeriod)}</div>
            <div className="text-sm text-gray-500">{stats.paidCount} {stats.paidCount === 1 ? 'despesa' : 'despesas'}</div>
          </div>

          {/* Pendentes no Período */}
          <div
            onClick={() => setDetailModal('pendingPeriod')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-yellow-600">Pendentes no Período</span>
              <Clock size={18} className="text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.pendingInPeriod)}</div>
            <div className="text-sm text-gray-500">{stats.pendingCount} {stats.pendingCount === 1 ? 'despesa' : 'despesas'}</div>
          </div>

          {/* Vencidas */}
          <div
            onClick={() => setDetailModal('overdue')}
            className={`bg-white rounded-xl border border-gray-200 p-5 border-l-4 cursor-pointer hover:shadow-md transition-all ${stats.overdueCount > 0 ? 'border-l-red-500 hover:border-red-300' : 'border-l-gray-300 hover:border-gray-400'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${stats.overdueCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>Vencidas</span>
              <AlertCircle size={18} className={stats.overdueCount > 0 ? 'text-red-500' : 'text-gray-400'} />
            </div>
            <div className={`text-2xl font-bold mb-1 ${stats.overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(stats.overdueTotal)}
            </div>
            <div className="text-sm text-gray-500">
              {stats.overdueCount > 0
                ? `${stats.overdueCount} ${stats.overdueCount === 1 ? 'despesa atrasada' : 'despesas atrasadas'}`
                : 'Nenhuma despesa vencida'
              }
            </div>
          </div>

          {/* Média Mensal */}
          <div
            onClick={() => setDetailModal('monthlyAvg')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-600">Média Mensal</span>
              <TrendingDown size={18} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.monthlyAverage)}</div>
            <div className="text-sm text-gray-500">Últimos 12 meses</div>
          </div>
        </div>

        {/* Stats Cards - Linha 2 */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total no Período */}
          <div
            onClick={() => setDetailModal('totalPeriod')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-red-500 cursor-pointer hover:shadow-md hover:border-red-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-red-600">Total no Período</span>
              <Receipt size={18} className="text-red-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.paidInPeriod + stats.pendingInPeriod)}</div>
            <div className="text-sm text-gray-500">{stats.periodCount} {stats.periodCount === 1 ? 'lançamento' : 'lançamentos'}</div>
          </div>

          {/* Recorrentes */}
          <div
            onClick={() => setDetailModal('recurring')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-purple-500 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-purple-600">Despesas Recorrentes</span>
              <Receipt size={18} className="text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.recurringCount}</div>
            <div className="text-sm text-gray-500">
              {stats.recurringTotal > 0
                ? `${formatCurrency(stats.recurringTotal)} pendentes`
                : 'Todas em dia'
              }
            </div>
          </div>

          {/* Categorias */}
          <Link to="/app/despesas/categorias">
            <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-orange-500 hover:shadow-md transition-all cursor-pointer h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-orange-600">Categorias</span>
                <Tag size={18} className="text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{categories.filter(c => c.isActive).length}</div>
              <div className="text-sm text-gray-500">Categorias ativas</div>
            </div>
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPeriodFilter('day')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'day'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Dia
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'week'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Semana
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'month'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Mês
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodFilter('year')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'year'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Ano
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-4">
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
              <SearchableSelect
                options={[
                  { value: '', label: 'Todas as categorias' },
                  ...categories.filter(c => c.isActive).map(category => ({
                    value: category.id,
                    label: category.name
                  }))
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="Todas as categorias"
              />

              <SearchableSelect
                options={[
                  { value: '', label: 'Todos os status' },
                  { value: 'paid', label: 'Pago' },
                  { value: 'pending', label: 'Pendente' },
                  { value: 'overdue', label: 'Vencido' }
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Todos os status"
              />
            </div>
          </div>
        </div>

        {/* Expenses List */}
        {isInitialLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <ExpenseSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
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

    {/* Modal de Detalhes dos Cards */}
    {detailModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailModal(null)}>
        <div
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header do Modal */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">
              {detailModal === 'paidPeriod' && 'Despesas Pagas no Período'}
              {detailModal === 'pendingPeriod' && 'Despesas Pendentes no Período'}
              {detailModal === 'overdue' && 'Despesas Vencidas'}
              {detailModal === 'monthlyAvg' && 'Média Mensal de Despesas'}
              {detailModal === 'totalPeriod' && 'Total de Despesas no Período'}
              {detailModal === 'recurring' && 'Despesas Recorrentes'}
            </h2>
            <button
              onClick={() => setDetailModal(null)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Conteúdo do Modal */}
          <div className="p-5 overflow-y-auto max-h-[60vh]">
            {/* Resumo */}
            <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-red-600 font-medium">Total</span>
                  <div className="text-2xl font-bold text-gray-900">
                    {detailModal === 'paidPeriod' && formatCurrency(stats.paidInPeriod)}
                    {detailModal === 'pendingPeriod' && formatCurrency(stats.pendingInPeriod)}
                    {detailModal === 'overdue' && formatCurrency(stats.overdueTotal)}
                    {detailModal === 'monthlyAvg' && formatCurrency(stats.monthlyAverage)}
                    {detailModal === 'totalPeriod' && formatCurrency(stats.paidInPeriod + stats.pendingInPeriod)}
                    {detailModal === 'recurring' && formatCurrency(stats.recurringTotal)}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-red-600 font-medium">Quantidade</span>
                  <div className="text-2xl font-bold text-gray-900">
                    {detailModal === 'paidPeriod' && `${stats.paidCount} despesas`}
                    {detailModal === 'pendingPeriod' && `${stats.pendingCount} despesas`}
                    {detailModal === 'overdue' && `${stats.overdueCount} despesas`}
                    {detailModal === 'monthlyAvg' && 'Últimos 12 meses'}
                    {detailModal === 'totalPeriod' && `${stats.periodCount} despesas`}
                    {detailModal === 'recurring' && `${stats.recurringCount} despesas`}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de despesas */}
            <div className="space-y-3">
              {(() => {
                let expensesList: typeof expenses = []
                if (detailModal === 'paidPeriod') {
                  expensesList = stats.paidList
                } else if (detailModal === 'pendingPeriod') {
                  expensesList = stats.pendingList
                } else if (detailModal === 'overdue') {
                  expensesList = stats.overdueList
                } else if (detailModal === 'totalPeriod') {
                  expensesList = stats.periodList
                } else if (detailModal === 'recurring') {
                  expensesList = stats.recurringList
                } else if (detailModal === 'monthlyAvg') {
                  // Para média mensal, mostrar todas as despesas pagas
                  expensesList = stats.paidList
                }

                if (expensesList.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt size={40} className="mx-auto mb-3 text-gray-300" />
                      <p>Nenhuma despesa encontrada</p>
                    </div>
                  )
                }

                return expensesList.map((expense) => {
                  const category = categories.find(c => c.id === expense.categoryId)
                  return (
                    <Link
                      key={expense.id}
                      to={`/app/despesas/editar/${expense.id}`}
                      className="block bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-red-300 hover:bg-red-50/30 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {category && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <Tag size={14} style={{ color: category.color }} />
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-900">{expense.description}</span>
                            <span className="text-xs text-gray-500 block">{expense.categoryName}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          expense.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : expense.paymentStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {expense.paymentStatus === 'paid' ? 'Pago' : expense.paymentStatus === 'pending' ? 'Pendente' : 'Vencido'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-500">
                          <Calendar size={14} className="inline mr-1" />
                          {expense.paidAt
                            ? `Pago em ${formatDateBR(expense.paidAt.split('T')[0])}`
                            : expense.dueDate
                            ? `Vence em ${formatDateBR(expense.dueDate.split('T')[0])}`
                            : 'Sem data'}
                        </div>
                        <span className="text-red-600 font-semibold">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                      {expense.isRecurring && (
                        <div className="mt-2">
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Recorrente</span>
                        </div>
                      )}
                    </Link>
                  )
                })
              })()}
            </div>
          </div>

          {/* Footer do Modal */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setDetailModal(null)}
              className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
