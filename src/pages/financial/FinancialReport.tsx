import { useState, useMemo, useEffect } from 'react'
import { useExpenses } from '@/store/expenses'
import { useCash } from '@/store/cash'
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
  X,
  Save
} from 'lucide-react'
import { CashMovement, PaymentMethod } from '@/types/cash'

type PeriodFilter = 'day' | 'week' | 'month' | 'year'

export default function FinancialReport() {
  const { sessions, movements, fetchSessions, fetchMovements, updateMovement } = useCash()
  const { expenses, fetchExpenses } = useExpenses()
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [editingMovement, setEditingMovement] = useState<CashMovement | null>(null)
  const [editForm, setEditForm] = useState({
    description: '',
    amount: 0,
    paymentMethod: 'pix' as PaymentMethod
  })

  useEffect(() => {
    fetchExpenses()
    fetchSessions()
    fetchMovements()
  }, [])

  // Função para filtrar por período
  const filterByPeriod = (dateString: string, itemDate: Date): boolean => {
    // Criar data local a partir da string (sem conversão de timezone)
    const [year, month, day] = dateString.split('-').map(Number)
    const selected = new Date(year, month - 1, day)

    const item = new Date(itemDate)

    switch (periodFilter) {
      case 'day':
        const selectedDay = selected.toDateString()
        const itemDay = item.toDateString()
        console.log('[FINANCIAL] Comparando datas - Selecionada:', selectedDay, 'Item:', itemDay, 'Match:', selectedDay === itemDay)
        return selectedDay === itemDay

      case 'week':
        const weekStart = new Date(selected)
        weekStart.setDate(selected.getDate() - selected.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return item >= weekStart && item <= weekEnd

      case 'month':
        return selected.getMonth() === item.getMonth() && selected.getFullYear() === item.getFullYear()

      case 'year':
        return selected.getFullYear() === item.getFullYear()

      default:
        return true
    }
  }

  // Receitas de procedimentos (do caixa fechado)
  const procedureRevenue = useMemo(() => {
    console.log('[FINANCIAL] Total de sessões:', sessions.length)
    console.log('[FINANCIAL] Sessões fechadas:', sessions.filter(s => s.status === 'closed').length)
    console.log('[FINANCIAL] Data selecionada:', selectedDate)
    console.log('[FINANCIAL] Período:', periodFilter)

    const closedSessions = sessions.filter(s => {
      const isClosed = s.status === 'closed'
      const hasClosedAt = !!s.closedAt
      const matchesPeriod = s.closedAt && filterByPeriod(selectedDate, new Date(s.closedAt))

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
  }, [sessions, movements, periodFilter, selectedDate])

  // Receitas de vendas (do caixa fechado)
  const salesRevenue = useMemo(() => {
    const closedSessions = sessions.filter(s =>
      s.status === 'closed' &&
      s.closedAt &&
      filterByPeriod(selectedDate, new Date(s.closedAt))
    )

    const saleMovements = movements.filter(m =>
      m.category === 'sale' &&
      m.type === 'income' &&
      closedSessions.some(s => s.id === m.cashSessionId)
    )

    const total = saleMovements.reduce((sum, m) => sum + m.amount, 0)
    const count = saleMovements.length

    return { total, profit: 0, count, items: saleMovements }
  }, [sessions, movements, periodFilter, selectedDate])

  // Receitas de mensalidades (do caixa fechado)
  const subscriptionRevenue = useMemo(() => {
    const closedSessions = sessions.filter(s =>
      s.status === 'closed' &&
      s.closedAt &&
      filterByPeriod(selectedDate, new Date(s.closedAt))
    )

    const subscriptionMovements = movements.filter(m =>
      m.category === 'subscription' &&
      m.type === 'income' &&
      closedSessions.some(s => s.id === m.cashSessionId)
    )

    const total = subscriptionMovements.reduce((sum, m) => sum + m.amount, 0)
    const count = subscriptionMovements.length

    return { total, count, items: subscriptionMovements }
  }, [sessions, movements, periodFilter, selectedDate])

  const totalRevenue = procedureRevenue.total + salesRevenue.total + subscriptionRevenue.total
  const totalTransactions = procedureRevenue.count + salesRevenue.count + subscriptionRevenue.count

  // Despesas do período
  const expensesTotal = useMemo(() => {
    const filteredExpenses = expenses.filter(expense => {
      if (expense.paymentStatus !== 'paid' || !expense.paidAt) return false
      return filterByPeriod(selectedDate, new Date(expense.paidAt))
    })
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }, [expenses, periodFilter, selectedDate])

  // Lucro líquido
  const netProfit = totalRevenue - expensesTotal

  // Calcular percentuais
  const procedurePercentage = totalRevenue > 0 ? (procedureRevenue.total / totalRevenue) * 100 : 0
  const salesPercentage = totalRevenue > 0 ? (salesRevenue.total / totalRevenue) * 100 : 0
  const subscriptionPercentage = totalRevenue > 0 ? (subscriptionRevenue.total / totalRevenue) * 100 : 0

  const getPeriodLabel = () => {
    const date = new Date(selectedDate)
    switch (periodFilter) {
      case 'day':
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
      case 'month':
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      case 'year':
        return date.getFullYear().toString()
    }
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

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <TrendingUp size={32} className="text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Relatório Financeiro</h1>
              <p className="text-gray-400">{getPeriodLabel()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Filtros</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Período</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setPeriodFilter('day')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  periodFilter === 'day'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Dia
              </button>
              <button
                onClick={() => setPeriodFilter('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  periodFilter === 'week'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriodFilter('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  periodFilter === 'month'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => setPeriodFilter('year')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  periodFilter === 'year'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Ano
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data de Referência</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Resumo Total */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-300">Receita Total</h3>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">{totalTransactions} transações</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity size={20} className="text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-300">Procedimentos</h3>
          </div>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(procedureRevenue.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{procedureRevenue.count} realizados</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <ShoppingCart size={20} className="text-orange-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-300">Vendas</h3>
          </div>
          <p className="text-2xl font-bold text-orange-400">{formatCurrency(salesRevenue.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{salesRevenue.count} vendas</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <CreditCard size={20} className="text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-300">Mensalidades</h3>
          </div>
          <p className="text-2xl font-bold text-purple-400">{formatCurrency(subscriptionRevenue.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{subscriptionRevenue.count} pagamentos</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingDown size={20} className="text-red-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-300">Despesas</h3>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(expensesTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Custos</p>
        </div>

        <div className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/30' : 'from-red-500/10 to-red-600/5 border-red-500/30'} border rounded-xl p-6`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 ${netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-lg`}>
              <DollarSign size={20} className={netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            </div>
            <h3 className="text-sm font-medium text-gray-300">Lucro Líquido</h3>
          </div>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(netProfit)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {netProfit >= 0 ? 'Positivo' : 'Negativo'}
          </p>
        </div>
      </div>

      {/* Distribuição de Receitas */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp size={20} className="text-green-400" />
          <h3 className="text-lg font-semibold text-white">Distribuição de Receitas</h3>
        </div>
        <div className="space-y-4">
          {/* Procedimentos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-blue-400" />
                <span className="text-white font-medium">Procedimentos</span>
              </div>
              <div className="text-right">
                <span className="text-blue-400 font-bold">{formatCurrency(procedureRevenue.total)}</span>
                <span className="text-gray-400 text-sm ml-2">({procedurePercentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${procedurePercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Vendas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-orange-400" />
                <span className="text-white font-medium">Vendas de Produtos</span>
              </div>
              <div className="text-right">
                <span className="text-orange-400 font-bold">{formatCurrency(salesRevenue.total)}</span>
                <span className="text-gray-400 text-sm ml-2">({salesPercentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${salesPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Mensalidades */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-purple-400" />
                <span className="text-white font-medium">Mensalidades</span>
              </div>
              <div className="text-right">
                <span className="text-purple-400 font-bold">{formatCurrency(subscriptionRevenue.total)}</span>
                <span className="text-gray-400 text-sm ml-2">({subscriptionPercentage.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${subscriptionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Procedimentos */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={20} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Procedimentos Realizados</h3>
          </div>
          <div className="space-y-2">
            {procedureRevenue.items.length > 0 ? (
              procedureRevenue.items
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((movement, index) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-white font-medium">{movement.description}</span>
                    </div>
                    <span className="text-blue-400 font-bold">{formatCurrency(movement.amount)}</span>
                  </div>
                ))
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhum procedimento no período</p>
            )}
          </div>
        </div>

        {/* Top Vendas */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart size={20} className="text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Maiores Vendas</h3>
          </div>
          <div className="space-y-2">
            {salesRevenue.items.length > 0 ? (
              salesRevenue.items
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((movement, index) => (
                  <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-white font-medium block">{movement.description}</span>
                        <span className="text-xs text-gray-400">
                          {movement.paymentMethod === 'card' ? 'cartão' :
                           movement.paymentMethod === 'pix' ? 'pix' :
                           movement.paymentMethod === 'cash' ? 'dinheiro' :
                           movement.paymentMethod}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-orange-400 font-bold block">{formatCurrency(movement.amount)}</span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma venda no período</p>
            )}
          </div>
        </div>
      </div>

      {/* Lista Completa de Movimentações */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Receipt size={24} className="text-green-400" />
          <h3 className="text-xl font-semibold text-white">Todas as Transações do Período</h3>
        </div>

        {totalTransactions > 0 ? (
          <div className="space-y-3">
            {[...procedureRevenue.items, ...salesRevenue.items, ...subscriptionRevenue.items]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((movement) => {
                const categoryColors = {
                  procedure: 'blue',
                  sale: 'orange',
                  subscription: 'purple',
                  expense: 'red',
                  other: 'gray'
                }
                const color = categoryColors[movement.category as keyof typeof categoryColors] || 'gray'

                const categoryLabels = {
                  procedure: 'procedimento',
                  sale: 'venda',
                  subscription: 'mensalidade',
                  expense: 'despesa',
                  other: 'outro'
                }

                return (
                  <div key={movement.id} className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-medium">{movement.description}</h4>
                          <span className={`px-2 py-1 bg-${color}-500/20 text-${color}-400 text-xs rounded-full border border-${color}-500/30`}>
                            {categoryLabels[movement.category as keyof typeof categoryLabels] || movement.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Pagamento: {
                            movement.paymentMethod === 'card' ? 'cartão' :
                            movement.paymentMethod === 'pix' ? 'pix' :
                            movement.paymentMethod === 'cash' ? 'dinheiro' :
                            movement.paymentMethod
                          }</span>
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Valor</p>
                        <p className={`text-xl font-bold text-${color}-400`}>{formatCurrency(movement.amount)}</p>
                      </div>
                      <button
                        onClick={() => handleEditClick(movement)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        title="Editar transação"
                      >
                        <Edit size={20} />
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Nenhuma transação no período</p>
        )}
      </div>

      {/* Modal de Edição */}
      {editingMovement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Editar Transação</h3>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Método de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="pix">PIX</option>
                  <option value="cash">Dinheiro</option>
                  <option value="card">Cartão</option>
                  <option value="transfer">Transferência</option>
                  <option value="check">Cheque</option>
                </select>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
