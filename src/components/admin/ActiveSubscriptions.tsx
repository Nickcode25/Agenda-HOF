import { useState, useEffect } from 'react'
import { Search, Filter, Users, DollarSign, TrendingDown, AlertTriangle, Edit3, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'
import { useConfirm } from '@/hooks/useConfirm'
import PageLoading from '@/components/ui/PageLoading'
import { createISOFromDateTimeBR, getTodayInSaoPaulo, getCurrentTimeInSaoPaulo } from '@/utils/timezone'

interface Subscription {
  id: string
  user_id: string
  user_email: string
  user_name: string
  plan_name: string
  plan_type: 'basic' | 'pro' | 'premium'
  status: 'active' | 'paused' | 'expired' | 'cancelled'
  started_at: string
  next_billing_date: string | null
  plan_amount: number
  discount_percentage: number
  stripe_subscription_id: string | null
}

// Configuração dos planos
const PLANS = {
  basic: { name: 'Plano Básico', price: 49.90, color: 'gray' },
  pro: { name: 'Plano Pro', price: 79.90, color: 'blue' },
  premium: { name: 'Plano Premium', price: 99.90, color: 'orange' }
}

// URL do backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

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

  // Estado para modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'premium'>('premium')
  const [isUpdating, setIsUpdating] = useState(false)

  // Função auxiliar para determinar tipo de plano pelo valor
  const determinePlanType = (amount: number): 'basic' | 'pro' | 'premium' => {
    if (amount >= 99) return 'premium'
    if (amount >= 79) return 'pro'
    return 'basic'
  }

  // Abrir modal de edição
  const openEditModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setSelectedPlan(subscription.plan_type || 'premium')
    setEditModalOpen(true)
  }

  // Fechar modal de edição
  const closeEditModal = () => {
    setEditModalOpen(false)
    setSelectedSubscription(null)
    setSelectedPlan('premium')
  }

  // Alterar plano
  const handleUpdatePlan = async () => {
    if (!selectedSubscription || !selectedSubscription.stripe_subscription_id) {
      alert('Esta assinatura não possui ID do Stripe. Não é possível alterar o plano.')
      return
    }

    if (selectedPlan === selectedSubscription.plan_type) {
      alert('Selecione um plano diferente do atual.')
      return
    }

    const planInfo = PLANS[selectedPlan]
    const confirmed = await confirm({
      title: 'Alterar Plano',
      message: `Tem certeza que deseja alterar o plano de ${selectedSubscription.user_name} para ${planInfo.name} (R$ ${planInfo.price.toFixed(2)}/mês)?`,
      confirmText: 'Alterar Plano',
      cancelText: 'Cancelar'
    })

    if (!confirmed) return

    setIsUpdating(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/stripe/update-subscription-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: selectedSubscription.stripe_subscription_id,
          newPlanType: selectedPlan,
          userId: selectedSubscription.user_id
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao alterar plano')
      }

      alert(`Plano alterado com sucesso para ${planInfo.name}!`)
      closeEditModal()
      await loadSubscriptions()
    } catch (err: any) {
      console.error('Erro ao alterar plano:', err)
      alert(`Erro ao alterar plano: ${err.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  // Cancelar assinatura (com integração ao Stripe)
  const handleCancelSubscriptionWithStripe = async (subscription: Subscription, immediately: boolean = false) => {
    const confirmed = await confirm({
      title: immediately ? 'Cancelar Assinatura Imediatamente' : 'Cancelar Assinatura',
      message: immediately
        ? `Tem certeza que deseja CANCELAR IMEDIATAMENTE a assinatura de ${subscription.user_name}? O acesso será removido agora.`
        : `Tem certeza que deseja cancelar a assinatura de ${subscription.user_name}? O acesso continuará até ${subscription.next_billing_date ? formatDateTimeBRSafe(subscription.next_billing_date) : 'o fim do período atual'}.`,
      confirmText: immediately ? 'Cancelar Imediatamente' : 'Cancelar no Fim do Período',
      cancelText: 'Voltar'
    })

    if (!confirmed) return

    try {
      if (subscription.stripe_subscription_id) {
        // Cancelar no Stripe
        const response = await fetch(`${BACKEND_URL}/api/stripe/cancel-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId: subscription.stripe_subscription_id,
            userId: subscription.user_id,
            immediately
          })
        })

        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao cancelar no Stripe')
        }
      }

      // Atualizar no Supabase
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: immediately ? 'cancelled' : 'pending_cancellation',
          cancelled_at: immediately ? createISOFromDateTimeBR(getTodayInSaoPaulo(), getCurrentTimeInSaoPaulo()) : null,
          cancel_at_period_end: !immediately
        })
        .eq('id', subscription.id)

      if (error) throw error

      alert(immediately ? 'Assinatura cancelada imediatamente!' : 'Assinatura será cancelada no fim do período.')
      await loadSubscriptions()
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura:', err)
      alert(`Erro ao cancelar assinatura: ${err.message}`)
    }
  }

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    try {
      // Usar RPC para buscar assinaturas com nomes corretos
      const { data, error } = await supabase.rpc('get_all_subscriptions')

      if (error) {
        console.error('Erro RPC get_all_subscriptions:', error)
        // Fallback para view se RPC falhar
        const { data: viewData, error: viewError } = await supabase
          .from('subscribers_view')
          .select('*')
          .order('subscription_created_at', { ascending: false })

        if (viewError) throw viewError

        const mapped: Subscription[] = (viewData || []).map(sub => ({
          id: sub.subscription_id,
          user_id: sub.user_id,
          user_email: sub.email,
          user_name: sub.full_name || 'Nome não disponível',
          plan_name: sub.plan_name || 'Premium',
          plan_type: sub.plan_type || determinePlanType(sub.plan_amount),
          status: sub.subscription_status,
          started_at: sub.subscription_created_at,
          next_billing_date: sub.next_billing_date,
          plan_amount: parseFloat(sub.plan_amount) || 0,
          discount_percentage: sub.discount_percentage || 0,
          stripe_subscription_id: sub.stripe_subscription_id
        }))

        setSubscriptions(mapped)
        calculateStats(mapped)
        return
      }

      const mapped: Subscription[] = (data || []).map((sub: any) => ({
        id: sub.subscription_id,
        user_id: sub.user_id,
        user_email: sub.user_email,
        user_name: sub.user_name || 'Nome não disponível',
        plan_name: sub.plan_name || 'Premium',
        plan_type: sub.plan_type || determinePlanType(sub.plan_amount),
        status: sub.status,
        started_at: sub.created_at,
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

  if (loading) {
    return <PageLoading message="Carregando assinaturas..." />
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
                <th className="text-center py-4 px-6 text-gray-600 font-semibold">Plano</th>
                <th className="text-center py-4 px-6 text-gray-600 font-semibold">Período</th>
                <th className="text-center py-4 px-6 text-gray-600 font-semibold">Status</th>
                <th className="text-center py-4 px-6 text-gray-600 font-semibold">Valor</th>
                <th className="text-center py-4 px-6 text-gray-600 font-semibold w-20">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.map((sub) => {
                const realAmount = sub.plan_amount * (1 - sub.discount_percentage / 100)
                return (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{sub.user_name}</div>
                      <div className="text-sm text-gray-500">{sub.user_email}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                        sub.plan_type === 'premium'
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : sub.plan_type === 'pro'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {sub.plan_name || 'Premium'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="text-sm text-gray-600">
                        <div>Início: {formatDateTimeBRSafe(sub.started_at)}</div>
                        <div className="text-gray-400">
                          Renova: {sub.next_billing_date ? formatDateTimeBRSafe(sub.next_billing_date) : '-'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        sub.status === 'active'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : sub.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          : sub.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-600 border border-gray-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {sub.status === 'active' ? 'Ativa'
                          : sub.status === 'paused' ? 'Pausada'
                          : sub.status === 'cancelled' ? 'Cancelada'
                          : 'Vencida'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="font-bold text-green-600">R$ {realAmount.toFixed(2)}</div>
                      {sub.discount_percentage > 0 && (
                        <div className="text-xs text-gray-400">{sub.discount_percentage}% desc.</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => openEditModal(sub)}
                        className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40"
                        title="Editar assinatura"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
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

      {/* Modal de Edição de Plano */}
      {editModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Editar Assinatura</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedSubscription.user_name}</p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              {/* Info do cliente */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="text-sm text-gray-500">Cliente</div>
                <div className="font-semibold text-gray-900">{selectedSubscription.user_name}</div>
                <div className="text-sm text-gray-600">{selectedSubscription.user_email}</div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Plano atual: </span>
                  <span className="font-medium text-orange-600">{selectedSubscription.plan_name || 'Premium'}</span>
                  <span className="text-gray-500"> (R$ {selectedSubscription.plan_amount.toFixed(2)}/mês)</span>
                </div>
              </div>

              {/* Seleção de Plano */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecione o novo plano:
                </label>
                <div className="space-y-3">
                  {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((planKey) => {
                    const plan = PLANS[planKey]
                    const isCurrentPlan = planKey === selectedSubscription.plan_type
                    const isSelected = planKey === selectedPlan

                    return (
                      <label
                        key={planKey}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isCurrentPlan ? 'ring-2 ring-green-500 ring-offset-1' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="plan"
                            value={planKey}
                            checked={isSelected}
                            onChange={() => setSelectedPlan(planKey)}
                            className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">
                              {plan.name}
                              {isCurrentPlan && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                  Atual
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">R$ {plan.price.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">por mês</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Aviso sobre alteração */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Importante:</strong> A alteração será aplicada imediatamente no Stripe.
                    O valor da próxima cobrança será ajustado proporcionalmente.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => handleCancelSubscriptionWithStripe(selectedSubscription, true)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
              >
                Cancelar Assinatura
              </button>
              <div className="flex gap-3">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleUpdatePlan}
                  disabled={isUpdating || selectedPlan === selectedSubscription.plan_type}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/30"
                >
                  {isUpdating ? 'Alterando...' : 'Confirmar Alteração'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
