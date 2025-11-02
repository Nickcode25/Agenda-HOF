import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Crown,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  DollarSign
} from 'lucide-react'
import { useSubscription } from '../../components/SubscriptionProtectedRoute'
import { supabase } from '../../lib/supabase'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

interface PaymentHistory {
  id: string
  payment_id: string
  amount: number
  status: string
  status_detail: string
  payment_method: string
  created_at: string
}

interface SubscriptionDetails {
  subscription_id: string
  status: string
  plan_type: string
  amount: number
  next_billing_date: string
  last_payment_date: string | null
  created_at: string
}

export default function SubscriptionManagement() {
  const navigate = useNavigate()
  const { hasActiveSubscription, hasPaidSubscription, isInTrial, trialDaysRemaining } = useSubscription()

  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      setLoading(true)

      // Buscar assinatura ativa
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (subError) {
        console.error('Erro ao buscar assinatura:', subError)
      } else if (subData) {
        setSubscription(subData)
      }

      // Buscar histórico de pagamentos
      const { data: historyData, error: historyError } = await supabase
        .from('payment_history')
        .select('*')
        .eq('payer_email', user.email)
        .order('created_at', { ascending: false })
        .limit(10)

      if (historyError) {
        console.error('Erro ao buscar histórico:', historyError)
      } else if (historyData) {
        setPaymentHistory(historyData)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return

    try {
      setCancelling(true)

      // Chamar backend para cancelar no Mercado Pago
      await axios.post(`${BACKEND_URL}/api/mercadopago/cancel-subscription/${subscription.subscription_id}`)

      // Atualizar no banco local
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('subscription_id', subscription.subscription_id)

      alert('✅ Assinatura cancelada com sucesso!')
      setShowCancelModal(false)
      loadSubscriptionData()

    } catch (error) {
      console.error('Erro ao cancelar:', error)
      alert('❌ Erro ao cancelar assinatura. Tente novamente.')
    } finally {
      setCancelling(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, color: string, icon: any }> = {
      approved: { label: 'Aprovado', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      active: { label: 'Ativo', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
      rejected: { label: 'Rejeitado', color: 'bg-red-500/20 text-red-400', icon: XCircle },
      refunded: { label: 'Reembolsado', color: 'bg-orange-500/20 text-orange-400', icon: RefreshCw },
      cancelled: { label: 'Cancelado', color: 'bg-gray-500/20 text-gray-400', icon: XCircle }
    }

    const config = statusMap[status] || statusMap.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/app/agenda')}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Crown className="w-8 h-8 text-orange-400" />
              Gerenciar Assinatura
            </h1>
            <p className="text-gray-400 mt-1">
              Visualize e gerencie sua assinatura Premium
            </p>
          </div>
        </div>

        {/* Status da Assinatura */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 mb-6">
          {hasPaidSubscription && subscription ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Plano Atual</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-orange-400" />
                    <span className="text-gray-300">Plano Profissional</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">{formatCurrency(subscription.amount)}/mês</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">
                      Próxima cobrança: {formatDate(subscription.next_billing_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(subscription.status)}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Ações</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancelar Assinatura
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Você terá acesso até o fim do período atual
                  </p>
                </div>
              </div>
            </div>
          ) : isInTrial ? (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Período de Teste</h2>
              <p className="text-gray-300 mb-4">
                Você tem <span className="text-orange-400 font-bold">{trialDaysRemaining} dias</span> restantes no seu período de teste gratuito
              </p>
              <button
                onClick={() => navigate('/checkout')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl transition-all font-semibold"
              >
                Assinar Agora
              </button>
            </div>
          ) : (
            <div className="text-center">
              <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Sem Assinatura Ativa</h2>
              <p className="text-gray-300 mb-4">
                Assine agora para ter acesso a todos os recursos Premium
              </p>
              <button
                onClick={() => navigate('/checkout')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl transition-all font-semibold"
              >
                Começar Assinatura
              </button>
            </div>
          )}
        </div>

        {/* Histórico de Pagamentos */}
        {paymentHistory.length > 0 && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-orange-400" />
              Histórico de Pagamentos
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-400 font-medium pb-3 px-2">Data</th>
                    <th className="text-left text-gray-400 font-medium pb-3 px-2">Valor</th>
                    <th className="text-left text-gray-400 font-medium pb-3 px-2">Método</th>
                    <th className="text-left text-gray-400 font-medium pb-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-2 text-gray-300">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="py-4 px-2 text-gray-300 font-semibold">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-4 px-2 text-gray-300 uppercase">
                        {payment.payment_method}
                      </td>
                      <td className="py-4 px-2">
                        {getStatusBadge(payment.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Cancelamento */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-md w-full border border-white/10">
              <div className="text-center mb-6">
                <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Cancelar Assinatura?</h3>
                <p className="text-gray-400">
                  Tem certeza que deseja cancelar sua assinatura? Você terá acesso aos recursos Premium até o final do período atual.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Confirmar Cancelamento
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
