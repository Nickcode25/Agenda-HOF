import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Sparkles, Crown, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
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

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentProfile } = useUserProfile()
  const { isInTrial } = useSubscription()

  useEffect(() => {
    loadPlans()
    console.log('🔍 PlansPage - isInTrial:', isInTrial)
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
    console.log('🎯 Plano selecionado:', {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      duration_months: plan.duration_months
    })

    // Navegar para checkout com dados do usuário e plano selecionado
    navigate('/checkout', {
      state: {
        name: currentProfile?.displayName || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        phone: '',
        password: '', // Não precisa de senha pois usuário já existe
        existingUser: true, // Flag indicando que usuário já está logado
        selectedPlan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          duration_months: plan.duration_months
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
          <p className="text-white text-lg">Carregando planos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/app/agenda')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Voltar para Agenda</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Selecione o plano ideal para o seu negócio e comece a transformar sua gestão
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isBasic = plan.price < 60
            const isPremium = plan.price >= 60

            return (
              <div
                key={plan.id}
                className={`relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border ${
                  isPremium
                    ? 'border-orange-500/50 shadow-2xl shadow-orange-500/20'
                    : 'border-white/20'
                } hover:scale-105 transition-all duration-300`}
              >
                {/* Premium Badge */}
                {isPremium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-yellow-500 px-4 py-1.5 rounded-full">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white">Mais Popular</span>
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-4">
                    {isPremium ? (
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center">
                        <Crown className="w-8 h-8 text-white" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6 pb-6 border-b border-white/20">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-gray-400">R$</span>
                    <span className="text-5xl font-bold text-white">
                      {Math.floor(plan.price)}
                    </span>
                    <span className="text-gray-400">,{String(Math.round((plan.price % 1) * 100)).padStart(2, '0')}</span>
                  </div>
                  <p className="text-gray-400 mt-2">
                    por {plan.duration_months === 1 ? 'mês' : `${plan.duration_months} meses`}
                  </p>
                  {/* Só mostrar trial se o plano tem trial E o usuário NÃO está em trial */}
                  {plan.has_trial && !isInTrial && (
                    <p className="text-blue-400 text-sm mt-2 font-medium">
                      {plan.trial_days} dias de teste grátis
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full ${
                        isPremium ? 'bg-orange-500/20' : 'bg-gray-500/20'
                      } flex items-center justify-center mt-0.5`}>
                        <Check className={`w-3 h-3 ${
                          isPremium ? 'text-orange-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isPremium
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <span>Assinar {plan.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>

        {/* No plans message */}
        {plans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum plano disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
