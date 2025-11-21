import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Crown, ArrowRight, Loader2, ArrowLeft, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/store/auth'
import { useUserProfile } from '@/store/userProfile'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  duration_months: number
  is_active: boolean
  has_trial: boolean
  trial_days: number
}

// Features definidas manualmente para cada plano
const PLAN_FEATURES = {
  basic: [
    { text: 'Agendamentos limitados', included: true },
    { text: 'Agenda inteligente', included: true },
    { text: 'Gestão de Pacientes', included: false },
    { text: 'Gestão de Profissionais', included: false },
    { text: 'Analytics Avançado', included: false },
    { text: 'Gestão Financeira', included: false },
    { text: 'Controle de Estoque', included: false },
  ],
  pro: [
    { text: 'Agendamentos ilimitados', included: true },
    { text: 'Agenda inteligente', included: true },
    { text: 'Gestão de Pacientes', included: true },
    { text: 'Gestão de Profissionais', included: true },
    { text: 'Analytics Avançado', included: false },
    { text: 'Gestão Financeira', included: false },
    { text: 'Controle de Estoque', included: false },
  ],
  premium: [
    { text: 'Agendamentos ilimitados', included: true },
    { text: 'Agenda inteligente', included: true },
    { text: 'Analytics Avançado', included: true },
    { text: 'Gestão Financeira', included: true },
    { text: 'Gestão de Pacientes', included: true },
    { text: 'Gestão de Profissionais', included: true },
    { text: 'Controle de Estoque', included: true },
  ]
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentProfile } = useUserProfile()
  const { isInTrial } = useSubscription()

  useEffect(() => {
    loadPlans()
  }, [isInTrial])

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (err) {
      console.error('Erro ao carregar planos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan: Plan) => {
    navigate('/checkout', {
      state: {
        name: currentProfile?.displayName || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        phone: '',
        password: '',
        existingUser: true,
        selectedPlan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          duration_months: plan.duration_months
        }
      }
    })
  }

  const getPlanFeatures = (plan: Plan) => {
    const planName = plan.name.toLowerCase()
    if (planName.includes('premium')) return PLAN_FEATURES.premium
    if (planName.includes('pro')) return PLAN_FEATURES.pro
    return PLAN_FEATURES.basic
  }

  const getPlanIcon = (plan: Plan) => {
    const planName = plan.name.toLowerCase()
    if (planName.includes('premium')) return <Crown className="w-8 h-8 text-white" />
    if (planName.includes('pro')) return <Crown className="w-8 h-8 text-white" />
    return <Sparkles className="w-8 h-8 text-white" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          <p className="text-gray-600 text-lg">Carregando planos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 py-6 px-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/app/agenda')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Voltar para Agenda</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
            Escolha seu Plano
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Selecione o plano ideal para a sua clínica e comece a automatizar a sua gestão
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const planName = plan.name.toLowerCase()
            const isPremium = planName.includes('premium')
            const isPro = planName.includes('pro')
            const features = getPlanFeatures(plan)

            return (
              <div
                key={plan.id}
                className={`relative bg-white backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 hover:scale-105 shadow-lg ${
                  isPremium
                    ? 'border-orange-500/50 shadow-xl shadow-orange-500/10'
                    : 'border-gray-200'
                }`}
              >
                {/* Popular Badge - APENAS para Premium */}
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-1.5 rounded-full shadow-lg">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white">Mais Popular</span>
                    </div>
                  </div>
                )}

                {/* Plan Icon */}
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    isPremium
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                      : isPro
                      ? 'bg-gradient-to-br from-orange-400 to-orange-500'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Plan Name & Description */}
                <div className="text-center mb-5">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-5 pb-5 border-b border-gray-200">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-gray-500 text-base">R$</span>
                    <span className="text-5xl font-bold text-gray-900">
                      {Math.floor(plan.price)}
                    </span>
                    <span className="text-gray-500 text-base">
                      ,{String(Math.round((plan.price % 1) * 100)).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">por mês</p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 mt-0.5 ${
                        feature.included ? 'text-green-500' : 'text-gray-300'
                      }`}>
                        {feature.included ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-sm leading-relaxed ${
                        feature.included ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isPremium
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                  }`}
                >
                  <span>Assinar {plan.name}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )
          })}
        </div>

        {/* No plans message */}
        {plans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum plano disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
