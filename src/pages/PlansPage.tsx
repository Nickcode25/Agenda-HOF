import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Lock, Crown, ArrowRight, ArrowLeft, Star, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/store/auth'
import { useUserProfile } from '@/store/userProfile'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import PageLoading from '@/components/ui/PageLoading'

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

// Interface para as features agrupadas
interface PlanFeature {
  text: string
  included: boolean
  highlight?: boolean
}

interface PlanFeatureGroup {
  title: string
  features: PlanFeature[]
}

interface PlanFeatures {
  agenda: PlanFeatureGroup
  atendimento: PlanFeatureGroup
  financeiro: PlanFeatureGroup
  equipe: PlanFeatureGroup
}

// Features agrupadas por blocos de valor
const PLAN_FEATURES_GROUPED: Record<'basic' | 'pro' | 'premium', PlanFeatures> = {
  basic: {
    agenda: {
      title: 'Gestão da Agenda',
      features: [
        { text: 'Até 25 agendamentos/mês', included: true },
        { text: 'Agenda inteligente', included: true },
        { text: 'Cadastro de até 25 pacientes', included: true },
      ]
    },
    atendimento: {
      title: 'Gestão de Atendimentos',
      features: [
        { text: 'Histórico de atendimentos', included: false },
        { text: 'Gestão de Profissionais', included: false },
        { text: 'Gestão de Procedimentos', included: false },
        { text: 'WhatsApp integrado', included: false },
      ]
    },
    financeiro: {
      title: 'Gestão Financeira',
      features: [
        { text: 'Registro de vendas', included: false },
        { text: 'Controle de despesas', included: false },
        { text: 'Relatórios financeiros', included: false },
        { text: 'Controle de Estoque', included: false },
      ]
    },
    equipe: {
      title: 'Gestão da Equipe',
      features: [
        { text: 'Gestão de Alunos', included: false },
        { text: 'Gestão de Cursos', included: false },
        { text: 'Gestão de Funcionários', included: false },
      ]
    }
  },
  pro: {
    agenda: {
      title: 'Gestão da Agenda',
      features: [
        { text: 'Agendamentos ilimitados', included: true, highlight: true },
        { text: 'Agenda inteligente', included: true },
        { text: 'Pacientes ilimitados', included: true, highlight: true },
      ]
    },
    atendimento: {
      title: 'Gestão de Atendimentos',
      features: [
        { text: 'Histórico de atendimentos', included: true, highlight: true },
        { text: 'Gestão de Profissionais', included: true, highlight: true },
        { text: 'Gestão de Procedimentos', included: true, highlight: true },
        { text: 'WhatsApp integrado', included: false },
      ]
    },
    financeiro: {
      title: 'Gestão Financeira',
      features: [
        { text: 'Registro de vendas', included: false },
        { text: 'Controle de despesas', included: false },
        { text: 'Relatórios financeiros', included: false },
        { text: 'Controle de Estoque', included: false },
      ]
    },
    equipe: {
      title: 'Gestão da Equipe',
      features: [
        { text: 'Gestão de Alunos', included: false },
        { text: 'Gestão de Cursos', included: false },
        { text: 'Gestão de Funcionários', included: false },
      ]
    }
  },
  premium: {
    agenda: {
      title: 'Gestão da Agenda',
      features: [
        { text: 'Agendamentos ilimitados', included: true },
        { text: 'Agenda inteligente', included: true },
        { text: 'Pacientes ilimitados', included: true },
      ]
    },
    atendimento: {
      title: 'Gestão de Atendimentos',
      features: [
        { text: 'Histórico de atendimentos', included: true },
        { text: 'Gestão de Profissionais', included: true },
        { text: 'Gestão de Procedimentos', included: true },
        { text: 'WhatsApp integrado', included: true, highlight: true },
      ]
    },
    financeiro: {
      title: 'Gestão Financeira',
      features: [
        { text: 'Registro de vendas', included: true, highlight: true },
        { text: 'Controle de despesas', included: true, highlight: true },
        { text: 'Relatórios financeiros', included: true, highlight: true },
        { text: 'Controle de Estoque', included: true, highlight: true },
      ]
    },
    equipe: {
      title: 'Gestão da Equipe',
      features: [
        { text: 'Gestão de Alunos', included: true, highlight: true },
        { text: 'Gestão de Cursos', included: true, highlight: true },
        { text: 'Gestão de Funcionários', included: true, highlight: true },
      ]
    }
  }
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
    if (planName.includes('premium')) return PLAN_FEATURES_GROUPED.premium
    if (planName.includes('pro')) return PLAN_FEATURES_GROUPED.pro
    return PLAN_FEATURES_GROUPED.basic
  }

  const getPlanType = (plan: Plan) => {
    const planName = plan.name.toLowerCase()
    if (planName.includes('premium')) return 'premium'
    if (planName.includes('pro')) return 'pro'
    return 'basic'
  }

  if (loading) {
    return <PageLoading message="Carregando planos..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-orange-50/30 py-4 px-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-orange-500/5 to-orange-600/5 rounded-full blur-3xl"></div>
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
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 tracking-tight">
            Escolha o plano ideal para você
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Comece a organizar sua clínica de harmonização orofacial com as ferramentas certas
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-start pt-6">
          {plans.map((plan) => {
            const planType = getPlanType(plan)
            const isPremium = planType === 'premium'
            const isPro = planType === 'pro'
            const isBasic = planType === 'basic'
            const features = getPlanFeatures(plan)

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl transition-all duration-300 ${
                  isPremium
                    ? 'bg-gradient-to-b from-orange-500 to-orange-600 p-[2px] shadow-2xl shadow-orange-500/25 scale-105 z-10'
                    : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                {/* Popular Badge - APENAS para Premium */}
                {isPremium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
                      <Crown className="w-5 h-5 text-white" />
                      <span className="text-sm font-bold text-white uppercase tracking-wide">Mais Popular</span>
                    </div>
                  </div>
                )}

                <div className={`${isPremium ? 'bg-white rounded-2xl' : ''} p-6 h-full flex flex-col`}>
                  {/* Plan Icon & Name */}
                  <div className="text-center mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                      isPremium
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30'
                        : isPro
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20'
                        : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {isPremium ? (
                        <Crown className="w-7 h-7 text-white" />
                      ) : isPro ? (
                        <Star className="w-7 h-7 text-white" />
                      ) : (
                        <Zap className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isPremium ? 'text-orange-600' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed min-h-[40px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className={`text-center pb-6 mb-6 border-b ${isPremium ? 'border-orange-100' : 'border-gray-100'}`}>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-gray-400 text-lg">R$</span>
                      <span className={`font-black ${isPremium ? 'text-6xl text-orange-600' : 'text-5xl text-gray-900'}`}>
                        {Math.floor(plan.price)}
                      </span>
                      <span className="text-gray-400 text-lg">
                        ,{String(Math.round((plan.price % 1) * 100)).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">por mês</p>
                    {isPremium && (
                      <p className="text-orange-600 text-xs font-medium mt-2">
                        Melhor custo-benefício
                      </p>
                    )}
                  </div>

                  {/* Features by Groups */}
                  <div className="space-y-5 flex-1">
                    {(Object.entries(features) as [string, PlanFeatureGroup][]).map(([key, group]) => (
                      <div key={key}>
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                          isPremium ? 'text-orange-500' : 'text-gray-400'
                        }`}>
                          {group.title}
                        </h4>
                        <div className="space-y-2">
                          {group.features.map((feature: PlanFeature, index: number) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                                feature.included
                                  ? isPremium
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}>
                                {feature.included ? (
                                  <Check className="w-3 h-3" strokeWidth={3} />
                                ) : (
                                  <Lock className="w-3 h-3" />
                                )}
                              </div>
                              <span className={`text-sm leading-relaxed ${
                                feature.included
                                  ? feature.highlight
                                    ? isPremium
                                      ? 'text-orange-700 font-semibold'
                                      : 'text-gray-900 font-semibold'
                                    : 'text-gray-700'
                                  : 'text-gray-400'
                              }`}>
                                {feature.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="mt-8">
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-base ${
                        isPremium
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5'
                          : isPro
                          ? 'bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
                          : 'bg-white border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <span>
                        {isPremium
                          ? 'Começar com Premium'
                          : `Assinar ${plan.name}`
                        }
                      </span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    {isPremium && (
                      <p className="text-center text-xs text-gray-500 mt-3">
                        Todas as funcionalidades incluídas
                      </p>
                    )}
                  </div>
                </div>
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

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm mb-4">Pagamento seguro via</p>
          <div className="flex items-center justify-center gap-6 opacity-60">
            <span className="text-gray-500 font-semibold">Stripe</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500 font-semibold">PIX</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500 font-semibold">Cartão de Crédito</span>
          </div>
        </div>
      </div>
    </div>
  )
}
