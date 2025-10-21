import { useState, useMemo, useEffect } from 'react'
import { usePatients } from '@/store/patients'
import { useSales } from '@/store/sales'
import { useSubscriptionStore } from '@/store/subscriptions'
import { useExpenses } from '@/store/expenses'
import { formatCurrency, parseCurrency } from '@/utils/currency'
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ShoppingCart,
  Activity,
  CreditCard,
  Filter,
  Edit,
  X,
  Save,
  TrendingDown,
  Receipt
} from 'lucide-react'
import { PlannedProcedure } from '@/types/patient'

type PeriodFilter = 'day' | 'week' | 'month' | 'year'

export default function FinancialReport() {
  const { patients, updatePatient } = usePatients()
  const { sales, fetchSales } = useSales()
  const { subscriptions } = useSubscriptionStore()
  const { expenses, fetchExpenses, getTotalExpenses } = useExpenses()
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [editingProcedure, setEditingProcedure] = useState<{ patientId: string; procedure: PlannedProcedure } | null>(null)
  const [editForm, setEditForm] = useState({ quantity: 1, unitValue: '', totalValue: '' })

  useEffect(() => {
    fetchSales()
    fetchExpenses()
  }, [])

  // Função para filtrar por período
  const filterByPeriod = (date: Date, itemDate: Date): boolean => {
    const selected = new Date(date)
    const item = new Date(itemDate)

    switch (periodFilter) {
      case 'day':
        return selected.toDateString() === item.toDateString()

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

  // Abrir modal de edição
  const handleEditProcedure = (patientId: string, procedure: PlannedProcedure) => {
    setEditingProcedure({ patientId, procedure })
    setEditForm({
      quantity: procedure.quantity,
      unitValue: formatCurrency(procedure.unitValue),
      totalValue: formatCurrency(procedure.totalValue)
    })
  }

  // Atualizar valores do formulário
  const handleEditFormChange = (field: 'quantity' | 'unitValue' | 'totalValue', value: string | number) => {
    if (field === 'quantity') {
      const qty = Number(value)
      const unitVal = parseCurrency(editForm.unitValue)
      setEditForm({
        quantity: qty,
        unitValue: editForm.unitValue,
        totalValue: formatCurrency(qty * unitVal)
      })
    } else if (field === 'unitValue') {
      const formatted = formatCurrency(value as string)
      const unitVal = parseCurrency(formatted)
      const total = editForm.quantity * unitVal
      setEditForm({
        ...editForm,
        unitValue: formatted,
        totalValue: formatCurrency(total)
      })
    } else if (field === 'totalValue') {
      const formatted = formatCurrency(value as string)
      setEditForm({
        ...editForm,
        totalValue: formatted
      })
    }
  }

  // Salvar alterações
  const handleSaveProcedure = async () => {
    if (!editingProcedure) return

    const patient = patients.find(p => p.id === editingProcedure.patientId)
    if (!patient) return

    const updatedProcedures = patient.plannedProcedures?.map(proc => {
      if (proc.id === editingProcedure.procedure.id) {
        return {
          ...proc,
          quantity: editForm.quantity,
          unitValue: parseCurrency(editForm.unitValue),
          totalValue: parseCurrency(editForm.totalValue)
        }
      }
      return proc
    })

    await updatePatient(patient.id, {
      plannedProcedures: updatedProcedures
    })

    setEditingProcedure(null)
    alert('Procedimento atualizado com sucesso!')
  }

  // Receitas de procedimentos
  const procedureRevenue = useMemo(() => {
    const completedProcedures = patients.flatMap(patient =>
      patient.plannedProcedures?.filter(proc => {
        if (proc.status !== 'completed' || !proc.completedAt) return false
        return filterByPeriod(new Date(selectedDate), new Date(proc.completedAt))
      }) || []
    )

    const total = completedProcedures.reduce((sum, proc) => sum + (proc.totalValue || 0), 0)
    const count = completedProcedures.length

    return { total, count, items: completedProcedures }
  }, [patients, periodFilter, selectedDate])

  // Receitas de vendas
  const salesRevenue = useMemo(() => {
    const filteredSales = sales.filter(sale =>
      sale.paymentStatus === 'paid' && filterByPeriod(new Date(selectedDate), new Date(sale.createdAt))
    )

    const total = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const profit = filteredSales.reduce((sum, sale) => sum + sale.totalProfit, 0)
    const count = filteredSales.length

    return { total, profit, count, items: filteredSales }
  }, [sales, periodFilter, selectedDate])

  // Receitas de mensalidades
  const subscriptionRevenue = useMemo(() => {
    const paidPayments = subscriptions.flatMap(sub =>
      sub.payments?.filter(payment =>
        payment.status === 'paid' &&
        payment.paidAt &&
        filterByPeriod(new Date(selectedDate), new Date(payment.paidAt))
      ) || []
    )

    const total = paidPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const count = paidPayments.length

    return { total, count, items: paidPayments }
  }, [subscriptions, periodFilter, selectedDate])

  const totalRevenue = procedureRevenue.total + salesRevenue.total + subscriptionRevenue.total
  const totalTransactions = procedureRevenue.count + salesRevenue.count + subscriptionRevenue.count

  // Despesas do período
  const expensesTotal = useMemo(() => {
    const filteredExpenses = expenses.filter(expense => {
      if (expense.paymentStatus !== 'paid' || !expense.paidAt) return false
      return filterByPeriod(new Date(selectedDate), new Date(expense.paidAt))
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp size={24} className="text-green-400" />
            </div>
            <h3 className="font-medium text-gray-300">Receita Total</h3>
          </div>
          <p className="text-3xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">{totalTransactions} transações</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity size={24} className="text-blue-400" />
            </div>
            <h3 className="font-medium text-gray-300">Procedimentos</h3>
          </div>
          <p className="text-3xl font-bold text-blue-400">{formatCurrency(procedureRevenue.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{procedureRevenue.count} realizados</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <ShoppingCart size={24} className="text-orange-400" />
            </div>
            <h3 className="font-medium text-gray-300">Vendas de Produtos</h3>
          </div>
          <p className="text-3xl font-bold text-orange-400">{formatCurrency(salesRevenue.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{salesRevenue.count} vendas • Lucro: {formatCurrency(salesRevenue.profit)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <CreditCard size={24} className="text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-300">Mensalidades</h3>
          </div>
          <p className="text-3xl font-bold text-purple-400">{formatCurrency(subscriptionRevenue.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{subscriptionRevenue.count} pagamentos</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingDown size={24} className="text-red-400" />
            </div>
            <h3 className="font-medium text-gray-300">Despesas</h3>
          </div>
          <p className="text-3xl font-bold text-red-400">{formatCurrency(expensesTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Custos operacionais</p>
        </div>

        <div className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/30' : 'from-red-500/10 to-red-600/5 border-red-500/30'} border rounded-xl p-6`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 ${netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-lg`}>
              <DollarSign size={24} className={netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            </div>
            <h3 className="font-medium text-gray-300">Lucro Líquido</h3>
          </div>
          <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(netProfit)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {netProfit >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
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
                .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
                .slice(0, 5)
                .map((proc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-white font-medium">{proc.procedureName}</span>
                    </div>
                    <span className="text-blue-400 font-bold">{formatCurrency(proc.totalValue || 0)}</span>
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
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .slice(0, 5)
                .map((sale, index) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-white font-medium block">{sale.professionalName}</span>
                        <span className="text-xs text-gray-400">{sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-orange-400 font-bold block">{formatCurrency(sale.totalAmount)}</span>
                      <span className="text-xs text-green-400">+{formatCurrency(sale.totalProfit)}</span>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma venda no período</p>
            )}
          </div>
        </div>
      </div>

      {/* Lista Completa de Procedimentos Realizados */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity size={24} className="text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Todos os Procedimentos Realizados</h3>
        </div>

        {procedureRevenue.items.length > 0 ? (
          <div className="space-y-3">
            {procedureRevenue.items.map((proc) => {
              const patient = patients.find(p => p.plannedProcedures?.some(pp => pp.id === proc.id))

              return (
                <div key={proc.id} className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-medium">{proc.procedureName}</h4>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          Concluído
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {patient && <span>Paciente: {patient.name}</span>}
                        <span>Quantidade: {proc.quantity}</span>
                        <span>Valor unitário: {formatCurrency(proc.unitValue)}</span>
                        {proc.completedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(proc.completedAt).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Total</p>
                        <p className="text-xl font-bold text-blue-400">{formatCurrency(proc.totalValue)}</p>
                      </div>
                      {patient && (
                        <button
                          onClick={() => handleEditProcedure(patient.id, proc)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all border border-transparent hover:border-blue-500/30"
                          title="Editar procedimento"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  {proc.notes && (
                    <p className="mt-2 text-sm text-gray-400 italic">Obs: {proc.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">Nenhum procedimento realizado no período</p>
        )}
      </div>

      {/* Modal de Edição */}
      {editingProcedure && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Editar Procedimento</h3>
              <button
                onClick={() => setEditingProcedure(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento</label>
                <p className="text-white font-medium">{editingProcedure.procedure.procedureName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={editForm.quantity}
                  onChange={(e) => handleEditFormChange('quantity', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Valor Unitário</label>
                <input
                  type="text"
                  value={editForm.unitValue}
                  onChange={(e) => handleEditFormChange('unitValue', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Valor Total</label>
                <input
                  type="text"
                  value={editForm.totalValue}
                  onChange={(e) => handleEditFormChange('totalValue', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="R$ 0,00"
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Você pode editar o valor total diretamente para aplicar descontos ou ajustes
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveProcedure}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-all"
              >
                <Save size={18} />
                Salvar Alterações
              </button>
              <button
                onClick={() => setEditingProcedure(null)}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
