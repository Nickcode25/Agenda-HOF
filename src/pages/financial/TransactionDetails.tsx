import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useExpenses } from '@/store/expenses'
import { useCash } from '@/store/cash'
import { formatCurrency } from '@/utils/currency'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  ShoppingCart,
  CreditCard,
  Receipt,
  Calendar,
  DollarSign,
  Package
} from 'lucide-react'
import { CashMovement } from '@/types/cash'

type CategoryType = 'total' | 'procedures' | 'sales' | 'subscriptions' | 'other' | 'expenses' | 'profit'

interface TransactionDetailsParams {
  category: CategoryType
  startDate: string
  endDate: string
}

export default function TransactionDetails() {
  const { category, startDate, endDate } = useParams<{ category: string; startDate: string; endDate: string }>()
  const navigate = useNavigate()
  const { sessions, movements, fetchSessions, fetchMovements } = useCash()
  const { expenses, fetchExpenses } = useExpenses()

  useEffect(() => {
    fetchExpenses()
    fetchSessions()
    fetchMovements()
  }, [])

  // Função para filtrar por período
  const filterByPeriod = (itemDate: Date): boolean => {
    if (!startDate || !endDate) return true

    const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0)
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59)
    const item = new Date(itemDate)

    return item >= start && item <= end
  }

  // Sessões fechadas no período
  const closedSessions = useMemo(() => {
    return sessions.filter(s =>
      s.status === 'closed' &&
      s.closedAt &&
      filterByPeriod(new Date(s.closedAt))
    )
  }, [sessions, startDate, endDate])

  // Transações por categoria
  const transactions = useMemo(() => {
    switch (category) {
      case 'procedures':
        return movements.filter(m =>
          m.category === 'procedure' &&
          m.type === 'income' &&
          closedSessions.some(s => s.id === m.cashSessionId)
        )

      case 'sales':
        return movements.filter(m =>
          m.category === 'sale' &&
          m.type === 'income' &&
          closedSessions.some(s => s.id === m.cashSessionId)
        )

      case 'subscriptions':
        return movements.filter(m =>
          m.category === 'subscription' &&
          m.type === 'income' &&
          closedSessions.some(s => s.id === m.cashSessionId)
        )

      case 'other':
        return movements.filter(m =>
          m.category === 'other' &&
          m.type === 'income' &&
          closedSessions.some(s => s.id === m.cashSessionId)
        )

      case 'expenses':
        return expenses
          .filter(expense => {
            if (expense.paymentStatus !== 'paid') return false
            const dateToCheck = expense.paidAt || expense.dueDate
            return dateToCheck && filterByPeriod(new Date(dateToCheck))
          })
          .map(expense => ({
            id: expense.id,
            amount: expense.amount,
            description: expense.description,
            category: 'expense' as const,
            createdAt: (expense.paidAt || expense.dueDate)!,
            paymentMethod: expense.paymentMethod,
            type: 'expense' as const
          }))

      case 'total':
        // Todas as receitas
        const allRevenues = movements.filter(m =>
          m.type === 'income' &&
          closedSessions.some(s => s.id === m.cashSessionId)
        )
        return allRevenues

      default:
        return []
    }
  }, [category, movements, expenses, closedSessions, startDate, endDate])

  // Total
  const total = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  // Configuração de título e ícone por categoria
  const getCategoryConfig = () => {
    switch (category) {
      case 'total':
        return {
          title: 'Receita Total',
          icon: TrendingUp,
          color: 'green',
          bgGradient: 'from-green-500/10 to-green-600/5',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400'
        }
      case 'procedures':
        return {
          title: 'Procedimentos',
          icon: Activity,
          color: 'blue',
          bgGradient: 'from-blue-500/10 to-blue-600/5',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-400'
        }
      case 'sales':
        return {
          title: 'Vendas',
          icon: ShoppingCart,
          color: 'orange',
          bgGradient: 'from-orange-500/10 to-orange-600/5',
          borderColor: 'border-orange-500/30',
          textColor: 'text-orange-400'
        }
      case 'subscriptions':
        return {
          title: 'Mensalidades',
          icon: CreditCard,
          color: 'purple',
          bgGradient: 'from-purple-500/10 to-purple-600/5',
          borderColor: 'border-purple-500/30',
          textColor: 'text-purple-400'
        }
      case 'other':
        return {
          title: 'Outras Receitas',
          icon: Receipt,
          color: 'cyan',
          bgGradient: 'from-cyan-500/10 to-cyan-600/5',
          borderColor: 'border-cyan-500/30',
          textColor: 'text-cyan-400'
        }
      case 'expenses':
        return {
          title: 'Despesas',
          icon: TrendingDown,
          color: 'red',
          bgGradient: 'from-red-500/10 to-red-600/5',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400'
        }
      default:
        return {
          title: 'Transações',
          icon: Receipt,
          color: 'gray',
          bgGradient: 'from-gray-500/10 to-gray-600/5',
          borderColor: 'border-gray-500/30',
          textColor: 'text-gray-400'
        }
    }
  }

  const config = getCategoryConfig()
  const Icon = config.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Dinheiro',
      card: 'Cartão',
      pix: 'PIX',
      transfer: 'Transferência',
      check: 'Cheque'
    }
    return methods[method] || method
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className={`absolute top-0 left-1/4 w-96 h-96 bg-${config.color}-500/10 rounded-full blur-3xl`}></div>
        </div>
        <div className="relative z-10">
          <Link
            to="/app/financeiro"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar para Relatório Financeiro
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 bg-${config.color}-500/20 rounded-xl`}>
                <Icon size={32} className={config.textColor} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{config.title}</h1>
                <div className="flex items-center gap-2 mt-1 text-gray-400">
                  <Calendar size={16} />
                  <span>
                    {startDate && new Date(startDate).toLocaleDateString('pt-BR')} -
                    {endDate && new Date(endDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <div className={`bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} rounded-2xl p-6`}>
              <div className="text-sm text-gray-400 mb-1">Total</div>
              <div className={`text-3xl font-bold ${config.textColor}`}>
                {formatCurrency(total)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {transactions.length} {transactions.length === 1 ? 'transação' : 'transações'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Transações</h2>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Receipt size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhuma transação encontrada neste período</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id || index}
                className={`flex items-center justify-between p-4 bg-gradient-to-br ${config.bgGradient} border ${config.borderColor} rounded-xl hover:scale-[1.02] transition-all`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-2 bg-${config.color}-500/20 rounded-lg`}>
                    <Icon size={20} className={config.textColor} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">
                      {transaction.description}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(transaction.createdAt)}
                      </span>
                      <span>•</span>
                      <span>{getPaymentMethodLabel(transaction.paymentMethod)}</span>
                    </div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${config.textColor}`}>
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
