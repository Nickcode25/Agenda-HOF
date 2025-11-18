import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useExpenses } from '@/store/expenses'
import { useCash } from '@/store/cash'
import { useSales } from '@/store/sales'
import { formatCurrency } from '@/utils/currency'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ShoppingCart,
  Activity,
  CreditCard,
  Filter,
  TrendingDown,
  Receipt,
  Edit,
  Package,
  ArrowRight,
  X
} from 'lucide-react'
import { CashMovement, PaymentMethod } from '@/types/cash'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import EditTransactionModal from './components/EditTransactionModal'

type DetailModalType = 'procedures' | 'sales' | 'subscriptions' | 'other' | 'expenses' | 'total' | null

type PeriodFilter = 'day' | 'week' | 'month' | 'year'

type TransactionItem = CashMovement | {
  id: string
  amount: number
  description: string
  category: 'expense'
  createdAt: string
  referenceId: null
  professionalId: null
  isExpense: true
  expenseCategory?: string
  paymentMethod: PaymentMethod
}

export default function FinancialReport() {
  const { sessions, movements, fetchSessions, fetchMovements, updateMovement, deleteMovement } = useCash()
  const { expenses, fetchExpenses } = useExpenses()
  const { sales, fetchSales } = useSales()
  const { hasActiveSubscription } = useSubscription()
  const { confirm, ConfirmDialog } = useConfirm()
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day')
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [editingMovement, setEditingMovement] = useState<CashMovement | null>(null)
  const [editForm, setEditForm] = useState({
    description: '',
    amount: 0,
    paymentMethod: 'pix' as PaymentMethod
  })
  const [detailModal, setDetailModal] = useState<DetailModalType>(null)

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

  useEffect(() => {
    fetchExpenses()
    fetchSessions()
    fetchMovements()
    fetchSales()
  }, [])

  // Função para filtrar por período (sempre usa startDate e endDate)
  const filterByPeriod = (_dateString: string, itemDate: Date | string): boolean => {
    let itemDateStr: string

    // Se for string, extrair apenas a parte da data
    if (typeof itemDate === 'string') {
      itemDateStr = itemDate.split('T')[0]
    } else {
      // Se for Date, usar data local
      const item = new Date(itemDate)
      const year = item.getFullYear()
      const month = String(item.getMonth() + 1).padStart(2, '0')
      const day = String(item.getDate()).padStart(2, '0')
      itemDateStr = `${year}-${month}-${day}`
    }

    // Comparar strings de data diretamente (formato YYYY-MM-DD)
    return itemDateStr >= startDate && itemDateStr <= endDate
  }

  // Receitas de procedimentos (do caixa fechado)
  const procedureRevenue = useMemo(() => {
    console.log('[FINANCIAL] Total de sessões:', sessions.length)
    console.log('[FINANCIAL] Sessões fechadas:', sessions.filter(s => s.status === 'closed').length)
    console.log('[FINANCIAL] Data inicial:', startDate, 'Data final:', endDate)
    console.log('[FINANCIAL] Período:', periodFilter)

    const closedSessions = sessions.filter(s => {
      const isClosed = s.status === 'closed'
      const hasClosedAt = !!s.closedAt
      const matchesPeriod = s.closedAt && filterByPeriod('', new Date(s.closedAt))

      console.log('[FINANCIAL] Sessão:', s.id, 'Status:', s.status, 'ClosedAt:', s.closedAt, 'Matches:', isClosed && hasClosedAt && matchesPeriod)

      return isClosed && hasClosedAt && matchesPeriod
    })

    console.log('[FINANCIAL] Sessões fechadas no período:', closedSessions.length)

    const procedureMovements = movements.filter(m =>
      m.category === 'procedure' &&
      m.type === 'income' &&
      closedSessions.some(s => s.id === m.cashSessionId)
    )

    console.log('[FINANCIAL] Movimentos de procedimentos:', procedureMovements.length)

    const total = procedureMovements.reduce((sum, m) => sum + m.amount, 0)
    const count = procedureMovements.length

    return { total, count, items: procedureMovements }
  }, [sessions, movements, startDate, endDate])

  // Receitas de vendas (do caixa fechado)
  const salesRevenue = useMemo(() => {
    const closedSessions = sessions.filter(s =>
      s.status === 'closed' &&
      s.closedAt &&
      filterByPeriod('', new Date(s.closedAt))
    )

    const saleMovements = movements.filter(m =>
      m.category === 'sale' &&
      m.type === 'income' &&
      closedSessions.some(s => s.id === m.cashSessionId)
    )

    const total = saleMovements.reduce((sum, m) => sum + m.amount, 0)
    const count = saleMovements.length

    return { total, profit: 0, count, items: saleMovements }
  }, [sessions, movements, startDate, endDate])

  // Receitas de mensalidades (do caixa fechado)
  const subscriptionRevenue = useMemo(() => {
    const closedSessions = sessions.filter(s =>
      s.status === 'closed' &&
      s.closedAt &&
      filterByPeriod('', new Date(s.closedAt))
    )

    const subscriptionMovements = movements.filter(m =>
      m.category === 'subscription' &&
      m.type === 'income' &&
      closedSessions.some(s => s.id === m.cashSessionId)
    )

    const total = subscriptionMovements.reduce((sum, m) => sum + m.amount, 0)
    const count = subscriptionMovements.length

    return { total, count, items: subscriptionMovements }
  }, [sessions, movements, startDate, endDate])

  // Outras receitas (do caixa fechado) - parcelas, consultas, etc
  const otherRevenue = useMemo(() => {
    const closedSessions = sessions.filter(s =>
      s.status === 'closed' &&
      s.closedAt &&
      filterByPeriod('', new Date(s.closedAt))
    )

    const otherMovements = movements.filter(m =>
      m.category === 'other' &&
      m.type === 'income' &&
      closedSessions.some(s => s.id === m.cashSessionId)
    )

    const total = otherMovements.reduce((sum, m) => sum + m.amount, 0)
    const count = otherMovements.length

    return { total, count, items: otherMovements }
  }, [sessions, movements, startDate, endDate])

  const totalRevenue = procedureRevenue.total + salesRevenue.total + subscriptionRevenue.total + otherRevenue.total
  const totalTransactions = procedureRevenue.count + salesRevenue.count + subscriptionRevenue.count + otherRevenue.count

  // Despesas do período
  const expenseItems = useMemo(() => {
    return expenses.filter(expense => {
      if (expense.paymentStatus !== 'paid') return false

      // Usar paidAt se existir, senão usar dueDate
      const dateToCheck = expense.paidAt || expense.dueDate
      if (!dateToCheck) return false

      return filterByPeriod('', dateToCheck)
    }).map(expense => ({
      id: expense.id,
      amount: -expense.amount, // Negativo para despesas
      description: expense.description,
      category: 'expense' as const,
      createdAt: (expense.paidAt || expense.dueDate)!,
      referenceId: null,
      professionalId: null,
      isExpense: true as const,
      expenseCategory: expense.categoryId,
      paymentMethod: expense.paymentMethod
    }))
  }, [expenses, startDate, endDate])

  const expensesTotal = useMemo(() => {
    return expenseItems.reduce((sum, expense) => sum + Math.abs(expense.amount), 0)
  }, [expenseItems])

  // Lucro líquido
  const netProfit = totalRevenue - expensesTotal

  // Calcular percentuais
  const procedurePercentage = totalRevenue > 0 ? (procedureRevenue.total / totalRevenue) * 100 : 0
  const salesPercentage = totalRevenue > 0 ? (salesRevenue.total / totalRevenue) * 100 : 0
  const subscriptionPercentage = totalRevenue > 0 ? (subscriptionRevenue.total / totalRevenue) * 100 : 0
  const otherPercentage = totalRevenue > 0 ? (otherRevenue.total / totalRevenue) * 100 : 0

  const getPeriodLabel = () => {
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
    const start = new Date(startYear, startMonth - 1, startDay)
    const end = new Date(endYear, endMonth - 1, endDay)
    return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }

  // Função para obter detalhes da venda
  const getSaleDetails = (referenceId?: string) => {
    if (!referenceId) return null
    return sales.find(sale => sale.id === referenceId)
  }

  const handleEditClick = (movement: CashMovement) => {
    setEditingMovement(movement)
    setEditForm({
      description: movement.description,
      amount: movement.amount,
      paymentMethod: movement.paymentMethod
    })
  }

  const handleCancelEdit = () => {
    setEditingMovement(null)
    setEditForm({
      description: '',
      amount: 0,
      paymentMethod: 'pix'
    })
  }

  const handleSaveEdit = async () => {
    if (!editingMovement) return

    try {
      await updateMovement(editingMovement.id, {
        description: editForm.description,
        amount: editForm.amount,
        paymentMethod: editForm.paymentMethod
      })

      // Recarregar dados
      await fetchMovements()
      await fetchSessions()

      handleCancelEdit()
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
      alert('Erro ao atualizar transação')
    }
  }

  const handleDeleteMovement = async () => {
    if (!editingMovement) return

    const confirmed = await confirm({
      title: 'Excluir Transação',
      message: 'Tem certeza que deseja excluir esta transação?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      confirmButtonClass: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30'
    })

    if (!confirmed) return

    try {
      await deleteMovement(editingMovement.id)

      // Recarregar dados
      await fetchMovements()
      await fetchSessions()

      handleCancelEdit()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      alert('Erro ao excluir transação')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8 relative">
      {!hasActiveSubscription && <UpgradeOverlay message="Relatório Financeiro bloqueado" feature="relatórios financeiros completos e detalhados" />}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header com breadcrumb */}
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/app" className="hover:text-green-600 transition-colors">Início</Link>
            <span>›</span>
            <span className="text-gray-900">Relatório Financeiro</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-50 rounded-xl border border-green-200">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Relatório Financeiro</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar size={16} className="text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">{getPeriodLabel()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setPeriodFilter('day')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'day'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Dia
                </button>
                <button
                  onClick={() => setPeriodFilter('week')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'week'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setPeriodFilter('month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'month'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Mês
                </button>
                <button
                  onClick={() => setPeriodFilter('year')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    periodFilter === 'year'
                      ? 'bg-orange-500 text-white shadow-sm'
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
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {/* Receita Total */}
          <button
            onClick={() => setDetailModal('total')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-green-500 hover:shadow-md hover:border-green-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-600">Receita Total</span>
              <TrendingUp size={18} className="text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm text-gray-500">{totalTransactions} lançamentos</div>
          </button>

          {/* Procedimentos */}
          <button
            onClick={() => setDetailModal('procedures')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-blue-500 hover:shadow-md hover:border-blue-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-600">Procedimentos</span>
              <Activity size={18} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(procedureRevenue.total)}</div>
            <div className="text-sm text-gray-500">{procedureRevenue.count} realizados</div>
          </button>

          {/* Vendas */}
          <button
            onClick={() => setDetailModal('sales')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-amber-500 hover:shadow-md hover:border-amber-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-amber-600">Vendas</span>
              <ShoppingCart size={18} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(salesRevenue.total)}</div>
            <div className="text-sm text-gray-500">{salesRevenue.count} realizadas</div>
          </button>

          {/* Mensalidades */}
          <button
            onClick={() => setDetailModal('subscriptions')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-purple-500 hover:shadow-md hover:border-purple-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-purple-600">Mensalidades</span>
              <CreditCard size={18} className="text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(subscriptionRevenue.total)}</div>
            <div className="text-sm text-gray-500">{subscriptionRevenue.count} pagamentos</div>
          </button>

          {/* Outras Receitas */}
          <button
            onClick={() => setDetailModal('other')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-cyan-500 hover:shadow-md hover:border-cyan-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-cyan-600">Outras Receitas</span>
              <Receipt size={18} className="text-cyan-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(otherRevenue.total)}</div>
            <div className="text-sm text-gray-500">{otherRevenue.count} lançamentos</div>
          </button>

          {/* Despesas */}
          <button
            onClick={() => setDetailModal('expenses')}
            className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-red-500 hover:shadow-md hover:border-red-300 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-red-600">Despesas</span>
              <TrendingDown size={18} className="text-red-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(expensesTotal)}</div>
            <div className="text-sm text-gray-500">Gastos</div>
          </button>
        </div>

        {/* Lucro Líquido (Card especial) */}
        <div className={`bg-white rounded-xl border border-gray-200 p-5 border-l-4 ${netProfit >= 0 ? 'border-l-green-500' : 'border-l-red-500'} hover:shadow-md transition-all`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-medium ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Lucro Líquido</span>
            <DollarSign size={18} className={netProfit >= 0 ? 'text-green-500' : 'text-red-500'} />
          </div>
          <div className={`text-2xl font-bold mb-1 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netProfit)}
          </div>
          <div className={`text-sm ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netProfit >= 0 ? '✓ Positivo' : '✗ Negativo'}
          </div>
        </div>

        {/* Distribuição de Receitas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp size={20} className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Distribuição de Receitas</h3>
          </div>
          <div className="space-y-4">
            {/* Procedimentos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-blue-600" />
                  <span className="text-gray-900 font-medium">Procedimentos</span>
                </div>
                <div className="text-right">
                  <span className="text-blue-600 font-bold">{formatCurrency(procedureRevenue.total)}</span>
                  <span className="text-gray-500 text-sm ml-2">({procedurePercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${procedurePercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Vendas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-amber-600" />
                  <span className="text-gray-900 font-medium">Vendas de Produtos</span>
                </div>
                <div className="text-right">
                  <span className="text-amber-600 font-bold">{formatCurrency(salesRevenue.total)}</span>
                  <span className="text-gray-500 text-sm ml-2">({salesPercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-amber-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${salesPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Mensalidades */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-purple-600" />
                  <span className="text-gray-900 font-medium">Mensalidades</span>
                </div>
                <div className="text-right">
                  <span className="text-purple-600 font-bold">{formatCurrency(subscriptionRevenue.total)}</span>
                  <span className="text-gray-500 text-sm ml-2">({subscriptionPercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${subscriptionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Outras Receitas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-cyan-600" />
                  <span className="text-gray-900 font-medium">Outras Receitas</span>
                </div>
                <div className="text-right">
                  <span className="text-cyan-600 font-bold">{formatCurrency(otherRevenue.total)}</span>
                  <span className="text-gray-500 text-sm ml-2">({otherPercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-cyan-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${otherPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Procedimentos */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Procedimentos Realizados</h3>
            </div>
            <div className="space-y-2">
              {procedureRevenue.items.length > 0 ? (
                procedureRevenue.items
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 5)
                  .map((movement, index) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-gray-900 font-medium">{movement.description}</span>
                      </div>
                      <span className="text-blue-600 font-bold">{formatCurrency(movement.amount)}</span>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum procedimento no período</p>
              )}
            </div>
          </div>

          {/* Top Vendas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingCart size={20} className="text-amber-600" />
              <h3 className="text-lg font-semibold text-gray-900">Maiores Vendas</h3>
            </div>
            <div className="space-y-2">
              {salesRevenue.items.length > 0 ? (
                salesRevenue.items
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 5)
                  .map((movement, index) => {
                    const saleDetails = getSaleDetails(movement.referenceId)
                    return (
                      <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-gray-900 font-medium block">{movement.description}</span>
                            {saleDetails && saleDetails.items.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                <Package size={12} className="text-amber-600 shrink-0" />
                                <span className="text-xs text-gray-600">
                                  {saleDetails.items.map((item, idx) => (
                                    <span key={item.id}>
                                      {item.quantity}x {item.stockItemName}
                                      {idx < saleDetails.items.length - 1 && ', '}
                                    </span>
                                  ))}
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gray-500 mt-1 inline-block">
                              {movement.paymentMethod === 'card' ? 'Cartão' :
                               movement.paymentMethod === 'pix' ? 'PIX' :
                               movement.paymentMethod === 'cash' ? 'Dinheiro' :
                               movement.paymentMethod}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-amber-600 font-bold block">{formatCurrency(movement.amount)}</span>
                        </div>
                      </div>
                    )
                  })
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhuma venda no período</p>
              )}
            </div>
          </div>
        </div>

        {/* Lista Completa de Movimentações */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Receipt size={24} className="text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Todas as Transações do Período</h3>
          </div>

          {totalTransactions > 0 || expenseItems.length > 0 ? (
            <div className="space-y-3">
              {[...procedureRevenue.items, ...salesRevenue.items, ...subscriptionRevenue.items, ...otherRevenue.items, ...expenseItems]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((movement) => {
                  const categoryColors = {
                    procedure: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
                    sale: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
                    subscription: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
                    expense: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                    other: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' }
                  }
                  const colorScheme = categoryColors[movement.category as keyof typeof categoryColors] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }

                  const categoryLabels = {
                    procedure: 'Procedimento',
                    sale: 'Venda',
                    subscription: 'Mensalidade',
                    expense: 'Despesa',
                    other: 'Outra Receita'
                  }

                  const saleDetails = movement.category === 'sale' ? getSaleDetails(movement.referenceId) : null

                  return (
                    <div key={movement.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50/30 transition-all">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="text-gray-900 font-medium">{movement.description}</h4>
                            <span className={`px-2 py-1 ${colorScheme.bg} ${colorScheme.text} text-xs rounded-full border ${colorScheme.border} font-medium`}>
                              {categoryLabels[movement.category as keyof typeof categoryLabels] || movement.category}
                            </span>
                          </div>

                          {/* Mostrar produtos da venda */}
                          {saleDetails && saleDetails.items.length > 0 && (
                            <div className="mb-2 p-2 bg-white rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Package size={14} className="text-amber-600" />
                                <span className="text-xs font-semibold text-amber-600">Produtos:</span>
                              </div>
                              <div className="grid grid-cols-1 gap-1">
                                {saleDetails.items.map((item) => (
                                  <div key={item.id} className="flex items-center justify-between text-xs text-gray-700">
                                    <span>• {item.quantity}x {item.stockItemName}</span>
                                    <span className="text-gray-600 font-medium">{formatCurrency(item.totalPrice)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="font-medium">Pagamento: {
                              movement.paymentMethod === 'card' ? 'Cartão' :
                              movement.paymentMethod === 'pix' ? 'PIX' :
                              movement.paymentMethod === 'cash' ? 'Dinheiro' :
                              movement.paymentMethod
                            }</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Valor</p>
                          <p className={`text-xl font-bold ${colorScheme.text}`}>{formatCurrency(movement.amount)}</p>
                        </div>
                        {'isExpense' in movement ? (
                          <div className="w-[44px]"></div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(movement as CashMovement)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors border border-blue-200"
                            title="Editar transação"
                          >
                            <Edit size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhuma transação no período</p>
          )}
        </div>

        {/* Modal de Detalhes */}
        {detailModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetailModal(null)}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {detailModal === 'total' && <TrendingUp size={24} className="text-green-600" />}
                  {detailModal === 'procedures' && <Activity size={24} className="text-blue-600" />}
                  {detailModal === 'sales' && <ShoppingCart size={24} className="text-amber-600" />}
                  {detailModal === 'subscriptions' && <CreditCard size={24} className="text-purple-600" />}
                  {detailModal === 'other' && <Receipt size={24} className="text-cyan-600" />}
                  {detailModal === 'expenses' && <TrendingDown size={24} className="text-red-600" />}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {detailModal === 'total' && 'Receita Total'}
                      {detailModal === 'procedures' && 'Procedimentos'}
                      {detailModal === 'sales' && 'Vendas'}
                      {detailModal === 'subscriptions' && 'Mensalidades'}
                      {detailModal === 'other' && 'Outras Receitas'}
                      {detailModal === 'expenses' && 'Despesas'}
                    </h2>
                    <p className="text-sm text-gray-500">{getPeriodLabel()}</p>
                  </div>
                </div>
                <button onClick={() => setDetailModal(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {(() => {
                  let items: any[] = []
                  let colorScheme = { text: 'text-gray-600', bg: 'bg-gray-50' }

                  if (detailModal === 'total') {
                    items = [...procedureRevenue.items, ...salesRevenue.items, ...subscriptionRevenue.items, ...otherRevenue.items]
                    colorScheme = { text: 'text-green-600', bg: 'bg-green-50' }
                  } else if (detailModal === 'procedures') {
                    items = procedureRevenue.items
                    colorScheme = { text: 'text-blue-600', bg: 'bg-blue-50' }
                  } else if (detailModal === 'sales') {
                    items = salesRevenue.items
                    colorScheme = { text: 'text-amber-600', bg: 'bg-amber-50' }
                  } else if (detailModal === 'subscriptions') {
                    items = subscriptionRevenue.items
                    colorScheme = { text: 'text-purple-600', bg: 'bg-purple-50' }
                  } else if (detailModal === 'other') {
                    items = otherRevenue.items
                    colorScheme = { text: 'text-cyan-600', bg: 'bg-cyan-50' }
                  } else if (detailModal === 'expenses') {
                    items = expenseItems
                    colorScheme = { text: 'text-red-600', bg: 'bg-red-50' }
                  }

                  const total = items.reduce((sum, item) => sum + Math.abs(item.amount), 0)

                  if (items.length === 0) {
                    return (
                      <p className="text-gray-500 text-center py-8">Nenhuma movimentação no período</p>
                    )
                  }

                  return (
                    <>
                      <div className={`${colorScheme.bg} rounded-lg p-4 mb-4`}>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">Total do período:</span>
                          <span className={`text-2xl font-bold ${colorScheme.text}`}>{formatCurrency(total)}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{items.length} {items.length === 1 ? 'lançamento' : 'lançamentos'}</div>
                      </div>
                      <div className="space-y-3">
                        {items
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((item) => {
                            const saleDetails = item.category === 'sale' ? getSaleDetails(item.referenceId) : null
                            return (
                              <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="text-gray-900 font-medium mb-1">{item.description}</h4>
                                    {saleDetails && saleDetails.items.length > 0 && (
                                      <div className="mb-2">
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                          <Package size={12} className="text-amber-600" />
                                          {saleDetails.items.map((saleItem: any, idx: number) => (
                                            <span key={saleItem.id}>
                                              {saleItem.quantity}x {saleItem.stockItemName}
                                              {idx < saleDetails.items.length - 1 && ', '}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <span>
                                        {item.paymentMethod === 'card' ? 'Cartão' :
                                         item.paymentMethod === 'pix' ? 'PIX' :
                                         item.paymentMethod === 'cash' ? 'Dinheiro' :
                                         item.paymentMethod === 'transfer' ? 'Transferência' :
                                         item.paymentMethod === 'check' ? 'Cheque' :
                                         item.paymentMethod}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-xl font-bold ${colorScheme.text}`}>
                                      {formatCurrency(Math.abs(item.amount))}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setDetailModal(null)}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {editingMovement && (
          <EditTransactionModal
            editForm={editForm}
            onDescriptionChange={(value) => setEditForm({ ...editForm, description: value })}
            onAmountChange={(value) => setEditForm({ ...editForm, amount: value })}
            onPaymentMethodChange={(value) => setEditForm({ ...editForm, paymentMethod: value })}
            onCancel={handleCancelEdit}
            onSave={handleSaveEdit}
            onDelete={handleDeleteMovement}
          />
        )}

        {/* Modal de Confirmação */}
        <ConfirmDialog />
      </div>
    </div>
  )
}
