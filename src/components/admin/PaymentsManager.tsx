import { useState, useEffect } from 'react'
import { Search, Filter, Download, RefreshCw, DollarSign, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatDateTimeBRSafe, parseLocalDate } from '@/utils/dateHelpers'
import { useConfirm } from '@/hooks/useConfirm'
import DateInput from '@/components/DateInput'

interface Payment {
  id: string
  user_id: string
  user_email: string
  user_name: string
  amount: number
  status: 'approved' | 'rejected' | 'pending' | 'refunded'
  payment_method: string
  stripe_payment_id: string | null
  created_at: string
  updated_at: string
}

interface PaymentStats {
  totalRevenue: number
  successfulPayments: number
  failedPayments: number
  successRate: number
}

export default function PaymentsManager() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { confirm, ConfirmDialog } = useConfirm()
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected' | 'pending' | 'refunded'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    successfulPayments: 0,
    failedPayments: 0,
    successRate: 0
  })

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      // Buscar pagamentos da tabela user_subscriptions
      const { data, error } = await supabase
        .from('subscribers_view')
        .select('*')
        .order('subscription_created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const mapped: Payment[] = (data || []).map(item => ({
        id: item.subscription_id,
        user_id: item.user_id,
        user_email: item.email,
        user_name: item.full_name || 'Nome não disponível',
        amount: parseFloat(item.plan_amount) || 0,
        status: item.subscription_status === 'active' ? 'approved' :
                item.subscription_status === 'expired' ? 'rejected' : 'pending',
        payment_method: 'Stripe',
        stripe_payment_id: item.stripe_subscription_id,
        created_at: item.subscription_created_at,
        updated_at: item.subscription_created_at
      }))

      setPayments(mapped)
      calculateStats(mapped)
    } catch (err) {
      console.error('Erro ao carregar pagamentos:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (paymentsList: Payment[]) => {
    const approved = paymentsList.filter(p => p.status === 'approved')
    const rejected = paymentsList.filter(p => p.status === 'rejected')

    const totalRevenue = approved.reduce((sum, p) => sum + p.amount, 0)
    const successfulPayments = approved.length
    const failedPayments = rejected.length
    const successRate = paymentsList.length > 0
      ? (successfulPayments / paymentsList.length) * 100
      : 0

    setStats({
      totalRevenue,
      successfulPayments,
      failedPayments,
      successRate
    })
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      containsIgnoringAccents(payment.user_name, searchQuery) ||
      containsIgnoringAccents(payment.user_email, searchQuery)

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter

    let matchesDateRange = true
    if (startDate && endDate) {
      const paymentDateStr = payment.created_at.split('T')[0]
      matchesDateRange = paymentDateStr >= startDate && paymentDateStr <= endDate
    }

    return matchesSearch && matchesStatus && matchesDateRange
  })

  const handleViewReceipt = (payment: Payment) => {
    if (payment.stripe_payment_id) {
      alert(`Ver recibo do pagamento ${payment.stripe_payment_id}`)
    } else {
      alert('Recibo não disponível')
    }
  }

  const handleReprocessPayment = async (payment: Payment) => {
    const confirmed = await confirm({
      title: 'Reprocessar Pagamento',
      message: `Deseja reprocessar o pagamento de ${payment.user_name}?`,
      confirmText: 'Reprocessar',
      cancelText: 'Cancelar',
      confirmButtonClass: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/30'
    })
    if (!confirmed) return
    alert('Funcionalidade de reprocessamento será implementada com a API do Stripe')
  }

  const handleRefund = async (payment: Payment) => {
    const confirmed = await confirm({
      title: 'Estornar Pagamento',
      message: `Tem certeza que deseja estornar o pagamento de R$ ${payment.amount.toFixed(2)} de ${payment.user_name}?`,
      confirmText: 'Estornar',
      cancelText: 'Cancelar'
    })
    if (!confirmed) return
    alert('Funcionalidade de estorno será implementada com a API do Stripe')
  }

  const exportToCSV = () => {
    const headers = ['Data', 'Cliente', 'Email', 'Valor', 'Status', 'Método', 'ID Stripe']
    const rows = filteredPayments.map(p => [
      formatDateTimeBRSafe(p.created_at),
      p.user_name,
      p.user_email,
      `R$ ${p.amount.toFixed(2)}`,
      p.status,
      p.payment_method,
      p.stripe_payment_id || '-'
    ])

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `pagamentos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return <div className="text-gray-600 text-center py-8">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">R$ {stats.totalRevenue.toFixed(2)}</div>
          <h3 className="text-gray-600 text-sm">Receita Total</h3>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.successfulPayments}</div>
          <h3 className="text-gray-600 text-sm">Pagamentos Aprovados</h3>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.failedPayments}</div>
          <h3 className="text-gray-600 text-sm">Pagamentos Rejeitados</h3>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.successRate.toFixed(1)}%</div>
          <h3 className="text-gray-600 text-sm">Taxa de Sucesso</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none"
          >
            <option value="all">Todos os status</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
            <option value="pending">Pendentes</option>
            <option value="refunded">Estornados</option>
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Data inicial"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Data final"
          />
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all shadow-sm"
        >
          <Download className="w-5 h-5" />
          <span>Exportar</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 text-gray-600 font-semibold">Data</th>
                <th className="text-left py-4 px-6 text-gray-600 font-semibold">Cliente</th>
                <th className="text-right py-4 px-6 text-gray-600 font-semibold">Valor</th>
                <th className="text-center py-4 px-6 text-gray-600 font-semibold">Status</th>
                <th className="text-left py-4 px-6 text-gray-600 font-semibold">Método</th>
                <th className="text-center py-4 px-6 text-gray-600 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {formatDateTimeBRSafe(payment.created_at)}
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="text-gray-900 font-medium">{payment.user_name}</div>
                      <div className="text-gray-500 text-sm">{payment.user_email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-green-600 font-bold">R$ {payment.amount.toFixed(2)}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {payment.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm border border-green-200">
                        <CheckCircle className="w-3 h-3" />
                        Aprovado
                      </span>
                    )}
                    {payment.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm border border-red-200">
                        <XCircle className="w-3 h-3" />
                        Rejeitado
                      </span>
                    )}
                    {payment.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm border border-yellow-200">
                        <Clock className="w-3 h-3" />
                        Pendente
                      </span>
                    )}
                    {payment.status === 'refunded' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm border border-gray-200">
                        <RefreshCw className="w-3 h-3" />
                        Estornado
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {payment.payment_method}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewReceipt(payment)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all border border-blue-200"
                        title="Ver recibo"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {payment.status === 'rejected' && (
                        <button
                          onClick={() => handleReprocessPayment(payment)}
                          className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-all border border-purple-200"
                          title="Reprocessar pagamento"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      {payment.status === 'approved' && (
                        <button
                          onClick={() => handleRefund(payment)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all border border-red-200"
                          title="Estornar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum pagamento encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </div>
  )
}
