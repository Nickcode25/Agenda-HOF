import { useState, useEffect } from 'react'
import { Search, Filter, Eye, XCircle, Mail, Users, DollarSign, TrendingDown, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'
import { useConfirm } from '@/hooks/useConfirm'

interface Subscription {
  id: string
  user_id: string
  user_email: string
  user_name: string
  plan_name: string
  status: 'active' | 'paused' | 'expired'
  started_at: string
  next_billing_date: string | null
  plan_amount: number
  discount_percentage: number
  stripe_subscription_id: string | null
}

interface Stats {
  totalSubscribers: number
  totalMRR: number
  churnRate: number
  renewalsNext7Days: number
}

export default function ActiveSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { confirm, ConfirmDialog } = useConfirm()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'expired'>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [stats, setStats] = useState<Stats>({
    totalSubscribers: 0,
    totalMRR: 0,
    churnRate: 0,
    renewalsNext7Days: 0
  })

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers_view')
        .select('*')
        .order('subscription_created_at', { ascending: false })

      if (error) throw error

      const mapped: Subscription[] = (data || []).map(sub => ({
        id: sub.subscription_id,
        user_id: sub.user_id,
        user_email: sub.email,
        user_name: sub.full_name || 'Nome não disponível',
        plan_name: 'Premium', // Você pode adicionar plan_name na view
        status: sub.subscription_status,
        started_at: sub.subscription_created_at,
        next_billing_date: sub.next_billing_date,
        plan_amount: parseFloat(sub.plan_amount) || 0,
        discount_percentage: sub.discount_percentage || 0,
        stripe_subscription_id: sub.stripe_subscription_id
      }))

      setSubscriptions(mapped)
      calculateStats(mapped)
    } catch (err) {
      console.error('Erro ao carregar assinaturas:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (subs: Subscription[]) => {
    const activeSubs = subs.filter(s => s.status === 'active')
    const totalSubscribers = activeSubs.length

    const totalMRR = activeSubs.reduce((sum, sub) => {
      const realAmount = sub.plan_amount * (1 - sub.discount_percentage / 100)
      return sum + realAmount
    }, 0)

    const expiredSubs = subs.filter(s => s.status === 'expired').length
    const churnRate = subs.length > 0 ? (expiredSubs / subs.length) * 100 : 0

    const now = new Date()
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const renewalsNext7Days = activeSubs.filter(sub => {
      if (!sub.next_billing_date) return false
      const billingDate = new Date(sub.next_billing_date)
      return billingDate >= now && billingDate <= next7Days
    }).length

    setStats({
      totalSubscribers,
      totalMRR,
      churnRate,
      renewalsNext7Days
    })
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch =
      containsIgnoringAccents(sub.user_name, searchQuery) ||
      containsIgnoringAccents(sub.user_email, searchQuery)

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleCancelSubscription = async (subscription: Subscription) => {
    const confirmed = await confirm({
      title: 'Cancelar Assinatura',
      message: `Tem certeza que deseja cancelar a assinatura de ${subscription.user_name}?`,
      confirmText: 'Cancelar Assinatura',
      cancelText: 'Voltar'
    })
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', subscription.id)

      if (error) throw error

      alert('Assinatura cancelada com sucesso!')
      await loadSubscriptions()
    } catch (err) {
      console.error('Erro ao cancelar assinatura:', err)
      alert('Erro ao cancelar assinatura')
    }
  }

  const sendRenewalReminder = async (subscription: Subscription) => {
    // Aqui você implementaria o envio de email
    alert(`Lembrete de renovação enviado para ${subscription.user_email}`)
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
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalSubscribers}</div>
          <h3 className="text-gray-600 text-sm">Total Assinantes</h3>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">R$ {stats.totalMRR.toFixed(2)}</div>
          <h3 className="text-gray-600 text-sm">MRR Total</h3>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.churnRate.toFixed(1)}%</div>
          <h3 className="text-gray-600 text-sm">Churn Rate</h3>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats.renewalsNext7Days}</div>
          <h3 className="text-gray-600 text-sm">Renovações (7 dias)</h3>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
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
            <option value="active">Ativas</option>
            <option value="paused">Pausadas</option>
            <option value="expired">Vencidas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 text-gray-600 font-semibold">Cliente</th>
                <th className="text-left py-4 px-6 text-gray-600 font-semibold">Plano</th>
                <th className="text-center py-4 px-6 text-gray-600 font-semibold">Data Início</th>
                <th className="text-center py-4 px-6 text-gray-600 font-semibold">Próxima Renovação</th>
                <th className="text-center py-4 px-6 text-gray-600 font-semibold">Status</th>
                <th className="text-right py-4 px-6 text-gray-600 font-semibold">Valor MRR</th>
                <th className="text-center py-4 px-6 text-gray-600 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => {
                const realAmount = sub.plan_amount * (1 - sub.discount_percentage / 100)
                return (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-gray-900 font-medium">{sub.user_name}</div>
                        <div className="text-gray-500 text-sm">{sub.user_email}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{sub.plan_name}</td>
                    <td className="py-4 px-6 text-center text-gray-600 text-sm">
                      {formatDateTimeBRSafe(sub.started_at)}
                    </td>
                    <td className="py-4 px-6 text-center text-gray-600 text-sm">
                      {sub.next_billing_date
                        ? formatDateTimeBRSafe(sub.next_billing_date)
                        : '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {sub.status === 'active' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm border border-green-200">
                          Ativa
                        </span>
                      )}
                      {sub.status === 'paused' && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm border border-orange-200">
                          Pausada
                        </span>
                      )}
                      {sub.status === 'expired' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm border border-red-200">
                          Vencida
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-green-600 font-bold">R$ {realAmount.toFixed(2)}</span>
                      {sub.discount_percentage > 0 && (
                        <div className="text-xs text-gray-500">
                          {sub.discount_percentage}% desconto
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => alert(`Detalhes da assinatura ${sub.id}`)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all border border-blue-200"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendRenewalReminder(sub)}
                          className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-all border border-purple-200"
                          title="Enviar lembrete"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelSubscription(sub)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all border border-red-200"
                          title="Cancelar assinatura"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma assinatura encontrada.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </div>
  )
}
