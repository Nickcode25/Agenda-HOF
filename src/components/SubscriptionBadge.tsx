import { Crown, Sparkles, Clock } from 'lucide-react'
import { useSubscription } from './SubscriptionProtectedRoute'
import { useNavigate } from 'react-router-dom'

export default function SubscriptionBadge() {
  const { hasActiveSubscription, hasPaidSubscription, isInTrial, subscription } = useSubscription()
  const navigate = useNavigate()

  // Não mostrar nada se não tem assinatura ativa
  if (!hasActiveSubscription) return null

  // Usuário em trial
  if (isInTrial) {
    return (
      <button
        onClick={() => navigate('/planos')}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-3 py-1.5 rounded-full hover:from-blue-100 hover:to-purple-100 transition-all"
        title="Período de Teste - Clique para assinar"
      >
        <Sparkles className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-semibold text-blue-600">Trial Premium</span>
      </button>
    )
  }

  // Usuário com assinatura paga
  if (hasPaidSubscription && subscription) {
    // Verificar qual plano (assumindo que planos básicos custam menos que R$ 60)
    const isBasicPlan = subscription.plan_amount && subscription.plan_amount < 60

    if (isBasicPlan) {
      return (
        <button
          onClick={() => navigate('/app/assinatura')}
          className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 px-3 py-1.5 rounded-full hover:from-gray-100 hover:to-gray-200 transition-all"
          title="Plano Básico - Gerenciar Assinatura"
        >
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-600">Básico</span>
        </button>
      )
    }

    // Plano Premium
    return (
      <button
        onClick={() => navigate('/app/assinatura')}
        className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 px-3 py-1.5 rounded-full hover:from-orange-100 hover:to-yellow-100 transition-all"
        title="Plano Premium - Gerenciar Assinatura"
      >
        <Crown className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-semibold text-orange-600">Premium</span>
      </button>
    )
  }

  return null
}
