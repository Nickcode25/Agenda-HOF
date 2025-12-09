import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Crown,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign,
  Clock,
  Gift,
  Sparkles,
  TrendingUp,
  Award,
  ArrowRight,
  CalendarDays,
  Zap,
  User,
  Mail,
  Shield,
  Receipt,
  ChevronRight,
  Star,
  Check,
  X,
  FileText,
  ExternalLink
} from 'lucide-react'
import { useSubscription } from '../../components/SubscriptionProtectedRoute'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/auth'
import { useUserProfile } from '../../store/userProfile'
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
  plan_name?: string
  amount: number
  next_billing_date: string
  last_payment_date: string | null
  created_at: string
}

interface AvailablePlan {
  id: string
  name: string
  slug: string
  price: number
  features: string[]
}

// Features por plano para exibição
const PLAN_DISPLAY_FEATURES: Record<string, string[]> = {
  basic: [
    'Agenda de agendamentos',
    'Até 25 pacientes',
    'Até 25 agendamentos/mês',
    'Suporte por email'
  ],
  pro: [
    'Agenda ilimitada',
    'Pacientes ilimitados',
    'Gestão de profissionais',
    'Procedimentos personalizados',
    'Relatórios básicos',
    'Suporte prioritário'
  ],
  premium: [
    'Tudo do Pro +',
    'Integração WhatsApp',
    'Gestão de alunos e cursos',
    'Relatórios financeiros',
    'Controle de estoque',
    'Gestão de despesas e vendas',
    'Suporte premium 24/7'
  ],
  courtesy: [
    'Acesso completo Premium',
    'Todas as funcionalidades',
    'Sem cobrança mensal',
    'Suporte dedicado'
  ],
  trial: [
    'Acesso completo por 7 dias',
    'Todas as funcionalidades',
    'Sem compromisso',
    'Teste grátis'
  ]
}

// Planos estáticos para fallback quando não há planos no banco
const STATIC_PLANS: AvailablePlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    slug: 'basic',
    price: 49.90,
    features: PLAN_DISPLAY_FEATURES.basic
  },
  {
    id: 'pro',
    name: 'Profissional',
    slug: 'pro',
    price: 99.90,
    features: PLAN_DISPLAY_FEATURES.pro
  },
  {
    id: 'premium',
    name: 'Premium',
    slug: 'premium',
    price: 149.90,
    features: PLAN_DISPLAY_FEATURES.premium
  }
]

export default function SubscriptionManagement() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentProfile } = useUserProfile()
  const { hasActiveSubscription, hasPaidSubscription, isInTrial, trialDaysRemaining, planType, subscription: contextSubscription } = useSubscription()

  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Calcular tempo de assinatura
  const subscriptionDuration = useMemo(() => {
    if (!subscription?.created_at) return null

    const startDate = new Date(subscription.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - startDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const months = Math.floor(diffDays / 30)
    const days = diffDays % 30

    if (months === 0) {
      return { text: `${days} dia${days !== 1 ? 's' : ''}`, months: 0, days }
    } else if (days === 0) {
      return { text: `${months} ${months === 1 ? 'mês' : 'meses'}`, months, days: 0 }
    } else {
      return { text: `${months} ${months === 1 ? 'mês' : 'meses'} e ${days} dia${days !== 1 ? 's' : ''}`, months, days }
    }
  }, [subscription?.created_at])

  // Calcular total gasto
  const totalSpent = useMemo(() => {
    return paymentHistory
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0)
  }, [paymentHistory])

  useEffect(() => {
    loadSubscriptionData()
    loadAvailablePlans()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!subError && subData) {
        setSubscription(subData)
      }

      const { data: historyData, error: historyError } = await supabase
        .from('payment_history')
        .select('*')
        .eq('payer_email', user.email)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!historyError && historyData) {
        setPaymentHistory(historyData)
      }

    } catch {
      // Erro silencioso - dados não carregados
    } finally {
      setLoading(false)
    }
  }

  const loadAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error

      setAvailablePlans(data?.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        features: p.features || []
      })) || [])
    } catch {
      // Erro silencioso - usa planos estáticos como fallback
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return

    try {
      setCancelling(true)

      await axios.post(`${BACKEND_URL}/api/mercadopago/cancel-subscription/${subscription.subscription_id}`)

      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('subscription_id', subscription.subscription_id)

      alert('Assinatura cancelada com sucesso!')
      setShowCancelModal(false)
      loadSubscriptionData()

    } catch {
      alert('Erro ao cancelar assinatura. Tente novamente.')
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

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Obter nome do plano para exibição
  const getDisplayPlanName = () => {
    if (planType === 'courtesy') return 'Cortesia Premium'
    if (planType === 'trial') return 'Período de Teste'
    if (subscription?.plan_name) return subscription.plan_name
    if (planType === 'basic') return 'Plano Básico'
    if (planType === 'pro') return 'Plano Pro'
    if (planType === 'premium') return 'Plano Premium'
    return 'Sem Plano'
  }

  // Obter features do plano atual
  const getCurrentPlanFeatures = () => {
    return PLAN_DISPLAY_FEATURES[planType || 'basic'] || PLAN_DISPLAY_FEATURES.basic
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando informações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl">
            <Crown className="w-6 h-6 text-orange-600" />
          </div>
          Minha Assinatura
        </h1>
        <p className="text-gray-500 mt-1 ml-14">
          Gerencie seu plano, pagamentos e informações da conta
        </p>
      </div>

      {/* Layout Grid - 3 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna 1: Status e Recursos */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card: Status do Plano */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header do Card com Gradiente */}
            <div className={`p-6 ${
              planType === 'courtesy' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
              planType === 'trial' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
              planType === 'premium' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
              planType === 'pro' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
              'bg-gradient-to-br from-gray-500 to-gray-600'
            } text-white`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  {planType === 'courtesy' ? <Gift className="w-6 h-6" /> :
                   planType === 'trial' ? <Clock className="w-6 h-6" /> :
                   <Crown className="w-6 h-6" />}
                </div>
                {hasActiveSubscription && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                    Ativo
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold mb-1">{getDisplayPlanName()}</h2>
              {hasPaidSubscription && subscription && (
                <p className="text-white/80 text-sm">
                  {formatCurrency(subscription.amount)}/mês
                </p>
              )}
              {isInTrial && (
                <p className="text-white/80 text-sm">
                  {trialDaysRemaining} dias restantes
                </p>
              )}
            </div>

            {/* Recursos do Plano */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Recursos Incluídos
              </h3>
              <ul className="space-y-3">
                {getCurrentPlanFeatures().map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Datas importantes */}
              {(hasPaidSubscription && subscription) && (
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Assinante desde</span>
                    <span className="text-gray-900 font-medium">{formatDateShort(subscription.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Próxima cobrança</span>
                    <span className="text-gray-900 font-medium">{formatDateShort(subscription.next_billing_date)}</span>
                  </div>
                </div>
              )}

              {planType === 'courtesy' && contextSubscription?.next_billing_date && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Válido até</span>
                    <span className="text-gray-900 font-medium">{formatDateShort(contextSubscription.next_billing_date)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card: Informações da Conta */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              Responsável pela Conta
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {currentProfile?.socialName || currentProfile?.displayName || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/perfil')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Shield className="w-4 h-4" />
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Coluna 2: Faturamento e Pagamento */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card: Gestão de Pagamentos */}
          {hasPaidSubscription && subscription ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                Gestão de Pagamentos
              </h3>

              {/* Próximo Pagamento */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Próximo Pagamento</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(subscription.amount)}</span>
                  <span className="text-sm text-gray-500">{formatDateShort(subscription.next_billing_date)}</span>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cartão de Crédito</p>
                    <p className="text-xs text-gray-500">Gerenciado pelo Mercado Pago</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between py-4">
                <span className="text-sm text-gray-500">Status</span>
                {getStatusBadge(subscription.status)}
              </div>

              {/* Histórico de Pagamentos */}
              <button
                onClick={() => setShowHistoryModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors mt-4"
              >
                <Receipt className="w-4 h-4" />
                Ver Histórico de Faturas
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Card para quem não tem assinatura paga */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                Pagamentos
              </h3>
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mb-2">
                  {planType === 'courtesy' ? 'Você possui acesso cortesia' : 'Nenhum pagamento registrado'}
                </p>
                {planType === 'trial' && (
                  <p className="text-xs text-gray-400">
                    Assine um plano para ter acesso completo
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Card: Estatísticas (apenas para pagantes) */}
          {hasPaidSubscription && subscription && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                Resumo
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <CalendarDays className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                  <p className="text-lg font-bold text-gray-900">{subscriptionDuration?.text || '-'}</p>
                  <p className="text-xs text-gray-500">Assinante</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-2" />
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
                  <p className="text-xs text-gray-500">Total Investido</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna 3: Ações e Upgrade */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card: CTAs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Ações
            </h3>

            <div className="space-y-3">
              {/* CTA Principal baseado no tipo de plano */}
              {planType === 'courtesy' ? (
                /* Usuário cortesia - já tem acesso Premium */
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Você já possui acesso completo ao sistema.
                  </p>
                  <button
                    onClick={() => navigate('/planos')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Planos Disponíveis
                  </button>
                </div>
              ) : planType === 'trial' || !hasPaidSubscription ? (
                /* Usuário trial ou sem assinatura */
                <button
                  onClick={() => navigate('/planos')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium shadow-lg shadow-orange-500/25 transition-all"
                >
                  <Crown className="w-5 h-5" />
                  {planType === 'trial' ? 'Assinar Agora' : 'Escolher um Plano'}
                </button>
              ) : (
                /* Usuário pagante */
                <button
                  onClick={() => navigate('/planos')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl font-medium border border-orange-200 transition-colors"
                >
                  <Zap className="w-5 h-5" />
                  Mudar de Plano
                </button>
              )}

              {/* Cancelar Assinatura */}
              {hasPaidSubscription && subscription && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar Assinatura
                </button>
              )}
            </div>

            {/* Aviso */}
            {hasPaidSubscription && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Você terá acesso até o fim do período atual em caso de cancelamento
              </p>
            )}
          </div>

          {/* Card: Comparação de Planos Mini */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Compare os Planos
            </h3>

            {/* Se for cortesia, mostrar apenas o link para ver planos */}
            {planType === 'courtesy' ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-4">
                  Você já possui acesso Premium através de cortesia.
                </p>
                <button
                  onClick={() => navigate('/planos')}
                  className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Ver todos os planos
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {/* Usar planos do banco ou fallback para estáticos */}
                  {(availablePlans.length > 0 ? availablePlans.filter(p => p.slug) : STATIC_PLANS).slice(0, 3).map((plan) => {
                    const planSlug = plan.slug?.toLowerCase() || ''
                    const isCurrentPlan = (
                      planType === planSlug ||
                      subscription?.plan_type?.toLowerCase() === planSlug
                    )

                    return (
                      <div
                        key={plan.id}
                        onClick={() => !isCurrentPlan && navigate(`/checkout/${plan.slug}`)}
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrentPlan
                            ? 'border-orange-300 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{plan.name}</p>
                            <p className="text-sm text-gray-500">{formatCurrency(plan.price)}/mês</p>
                          </div>
                          {isCurrentPlan ? (
                            <span className="px-2 py-1 bg-orange-200 text-orange-700 text-xs font-medium rounded-full">
                              Atual
                            </span>
                          ) : (
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={() => navigate('/planos')}
                  className="w-full flex items-center justify-center gap-2 mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Ver todos os planos
                  <ExternalLink className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Card: Precisa de Ajuda */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Precisa de ajuda?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Entre em contato conosco para tirar dúvidas sobre sua assinatura.
            </p>
            <a
              href="mailto:suporte@agendahof.com.br"
              className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <Mail className="w-4 h-4" />
              suporte@agendahof.com.br
            </a>
          </div>
        </div>
      </div>

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
                Tem certeza que deseja cancelar? Você terá acesso até o final do período atual.
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

      {/* Modal de Histórico de Pagamentos */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <Receipt className="w-6 h-6 text-orange-500" />
                Histórico de Pagamentos
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentHistory.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum pagamento encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        payment.status === 'approved' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          payment.status === 'approved' ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-500">{formatDate(payment.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(payment.status)}
                      <p className="text-xs text-gray-400 mt-1 uppercase">{payment.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full mt-6 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
