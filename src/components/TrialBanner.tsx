import { useNavigate } from 'react-router-dom'
import { Clock, Sparkles, CreditCard } from 'lucide-react'
import { useSubscription } from './SubscriptionProtectedRoute'
import { useAuth } from '@/store/auth'
import { useUserProfile } from '@/store/userProfile'

export default function TrialBanner() {
  const { isInTrial, trialDaysRemaining } = useSubscription()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentProfile } = useUserProfile()

  // Não mostrar banner se não está em trial
  if (!isInTrial) return null

  // Determinar cor baseado nos dias restantes
  const getColorClass = () => {
    if (trialDaysRemaining <= 2) return 'from-red-500/20 to-orange-500/20 border-red-500/30'
    if (trialDaysRemaining <= 4) return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
    return 'from-blue-500/20 to-purple-500/20 border-blue-500/30'
  }

  const getIconColor = () => {
    if (trialDaysRemaining <= 2) return 'text-red-400'
    if (trialDaysRemaining <= 4) return 'text-yellow-400'
    return 'text-blue-400'
  }

  const getMessage = () => {
    if (trialDaysRemaining === 0) return 'Último dia do seu período de teste!'
    if (trialDaysRemaining === 1) return 'Resta 1 dia do seu período de teste'
    return `Restam ${trialDaysRemaining} dias do seu período de teste`
  }

  return (
    <div className={`mx-6 mt-4 mb-2 rounded-2xl border bg-gradient-to-r ${getColorClass()} backdrop-blur-sm p-4`}>
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            {trialDaysRemaining <= 2 ? (
              <Clock className={`w-6 h-6 ${getIconColor()}`} />
            ) : (
              <Sparkles className={`w-6 h-6 ${getIconColor()}`} />
            )}
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">
              {getMessage()}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              Aproveite o acesso completo a todas as funcionalidades
            </p>
          </div>
        </div>

        {/* Right side - CTA */}
        <button
          onClick={() => {
            // Navegar para checkout com dados do usuário atual
            navigate('/checkout', {
              state: {
                name: currentProfile?.displayName || user?.email?.split('@')[0] || '',
                email: user?.email || '',
                phone: '',
                password: '', // Não precisa de senha pois usuário já existe
                existingUser: true // Flag indicando que usuário já está logado
              }
            })
          }}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
        >
          <CreditCard size={16} />
          <span>Assinar Agora</span>
        </button>
      </div>
    </div>
  )
}
