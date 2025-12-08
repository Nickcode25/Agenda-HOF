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
  DollarSign,
  Clock
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
    const statusMap: Record<string, { label: string, bgColor: string, textColor: string, icon: any }> = {
      approved: { label: 'Aprovado', bgColor: 'bg-green-100', textColor: 'text-green-700', icon: CheckCircle },
      active: { label: 'Ativo', bgColor: 'bg-green-100', textColor: 'text-green-700', icon: CheckCircle },
      pending: { label: 'Pendente', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', icon: AlertCircle },
      rejected: { label: 'Rejeitado', bgColor: 'bg-red-100', textColor: 'text-red-700', icon: XCircle },
      refunded: { label: 'Reembolsado', bgColor: 'bg-orange-100', textColor: 'text-orange-700', icon: RefreshCw },
      cancelled: { label: 'Cancelado', bgColor: 'bg-gray-100', textColor: 'text-gray-600', icon: XCircle }
    }

    const config = statusMap[status] || statusMap.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        <Icon className="w-3.5 h-3.5" />
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/app/agenda')}
            className="p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Crown className="w-6 h-6 text-orange-600" />
              </div>
              Gerenciar Assinatura
            </h1>
            <p className="text-gray-500 mt-1">
              Visualize e gerencie sua assinatura Premium
            </p>
          </div>
        </div>

        {/* Status da Assinatura */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          {hasPaidSubscription && subscription ? (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Plano Atual</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Crown className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-gray-700 font-medium">Plano Premium</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-gray-700">{formatCurrency(subscription.amount)}/mês</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-gray-700">
                      Próxima cobrança: {formatDate(subscription.next_billing_date)}
                    </span>
                  </div>
                  <div className="pt-2">
                    {getStatusBadge(subscription.status)}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-200"
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
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Período de Teste</h2>
              <p className="text-gray-600 mb-6">
                Você tem <span className="text-orange-500 font-bold">{trialDaysRemaining} dias</span> restantes no seu período de teste gratuito
              </p>
              <button
                onClick={() => navigate('/checkout')}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all font-semibold shadow-lg shadow-orange-500/30"
              >
                Assinar Agora
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sem Assinatura Ativa</h2>
              <p className="text-gray-600 mb-6">
                Assine agora para ter acesso a todos os recursos Premium
              </p>
              <button
                onClick={() => navigate('/checkout')}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all font-semibold shadow-lg shadow-orange-500/30"
              >
                Começar Assinatura
              </button>
            </div>
          )}
        </div>

        {/* Histórico de Pagamentos */}
        {paymentHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-500" />
              </div>
              Histórico de Pagamentos
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-sm font-medium text-gray-500 pb-3 px-2">Data</th>
                    <th className="text-left text-sm font-medium text-gray-500 pb-3 px-2">Valor</th>
                    <th className="text-left text-sm font-medium text-gray-500 pb-3 px-2">Método</th>
                    <th className="text-left text-sm font-medium text-gray-500 pb-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2 text-gray-700">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="py-4 px-2 text-gray-900 font-semibold">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-4 px-2 text-gray-600 uppercase text-sm">
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
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Cancelar Assinatura?</h3>
                <p className="text-gray-600">
                  Tem certeza que deseja cancelar sua assinatura? Você terá acesso aos recursos Premium até o final do período atual.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Confirmar
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
