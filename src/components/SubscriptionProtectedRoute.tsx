import { useEffect, useState, createContext, useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { Lock } from 'lucide-react'
import UpgradeOverlay from './UpgradeOverlay'

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode
}

interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: string
  plan_amount: number
  next_billing_date: string | null
  created_at: string
}

interface SubscriptionContextType {
  hasActiveSubscription: boolean
  hasPaidSubscription: boolean  // Nova: true apenas se tem assinatura PAGA
  isInTrial: boolean
  trialDaysRemaining: number
  subscription: Subscription | null
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  hasActiveSubscription: false,
  hasPaidSubscription: false,
  isInTrial: false,
  trialDaysRemaining: 0,
  subscription: null
})

export const useSubscription = () => useContext(SubscriptionContext)

// Cache global para evitar verificações repetidas durante navegação
let subscriptionCache: {
  userId: string | null
  hasActiveSubscription: boolean
  hasPaidSubscription: boolean
  isInTrial: boolean
  trialDaysRemaining: number
  subscription: Subscription | null
  timestamp: number
} | null = null

const CACHE_TTL = 2 * 60 * 1000 // 2 minutos (cache mais curto para ser mais responsivo)

// Função para invalidar o cache (útil após login)
export function invalidateSubscriptionCache() {
  subscriptionCache = null
}

export default function SubscriptionProtectedRoute({ children }: SubscriptionProtectedRouteProps) {
  const { user } = useAuth()

  // Verificar se temos cache válido para evitar loading desnecessário
  const hasCachedData = subscriptionCache &&
    subscriptionCache.userId === user?.id &&
    (Date.now() - subscriptionCache.timestamp) < CACHE_TTL

  const [loading, setLoading] = useState(!hasCachedData)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(hasCachedData ? subscriptionCache!.hasActiveSubscription : false)
  const [hasPaidSubscription, setHasPaidSubscription] = useState(hasCachedData ? subscriptionCache!.hasPaidSubscription : false)
  const [isInTrial, setIsInTrial] = useState(hasCachedData ? subscriptionCache!.isInTrial : false)
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(hasCachedData ? subscriptionCache!.trialDaysRemaining : 0)
  const [subscription, setSubscription] = useState<Subscription | null>(hasCachedData ? subscriptionCache!.subscription : null)

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        setLoading(false)
        subscriptionCache = null
        return
      }

      // Se temos cache válido, usar os dados em cache e não fazer requisição
      if (hasCachedData) {
        setLoading(false)
        return
      }

      try {
        // Buscar todas as informações em paralelo (mais rápido)
        const [subscriptionResult, userDataResult, courtesyResult] = await Promise.all([
          supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle(),
          supabase.auth.getUser(),
          supabase
            .from('courtesy_users')
            .select('*')
            .eq('auth_user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()
        ])

        const subscription = subscriptionResult.data
        const userData = userDataResult.data
        const courtesyUser = courtesyResult.data

        // 1. Verificar se usuário tem assinatura ativa
        if (subscription) {
          // Verificar se a assinatura realmente está válida
          if (subscription.next_billing_date) {
            const nextBilling = new Date(subscription.next_billing_date)
            const now = new Date()

            // Se passou mais de 5 dias da data de cobrança, considerar suspensa
            const daysDiff = Math.floor((now.getTime() - nextBilling.getTime()) / (1000 * 60 * 60 * 24))

            if (daysDiff > 5) {
              console.warn('⚠️ Assinatura com cobrança atrasada:', {
                next_billing_date: subscription.next_billing_date,
                days_late: daysDiff
              })
              // Não considerar como ativa se está muito atrasada
              setHasActiveSubscription(false)
              setHasPaidSubscription(false)
              setSubscription(null)
              setLoading(false)
              return
            }
          }

          setHasActiveSubscription(true)
          setHasPaidSubscription(true)  // Tem assinatura PAGA
          setSubscription(subscription)
          setLoading(false)
          return
        }

        // 2. Se não tem subscription, verificar período de trial (7 dias grátis)
        let trialEndDate = userData.user?.user_metadata?.trial_end_date

        // Se não tem trial_end_date definido, calcular com base na data de criação da conta
        // Isso permite que usuários cadastrados manualmente também tenham trial
        if (!trialEndDate && userData.user?.created_at) {
          const createdAt = new Date(userData.user.created_at)
          const calculatedTrialEnd = new Date(createdAt)
          calculatedTrialEnd.setDate(calculatedTrialEnd.getDate() + 7) // 7 dias de trial
          trialEndDate = calculatedTrialEnd.toISOString()
          console.log('📅 Trial calculado com base na data de criação:', {
            created_at: userData.user.created_at,
            trial_end: trialEndDate
          })
        }

        if (trialEndDate) {
          const trialEnd = new Date(trialEndDate)
          const now = new Date()

          if (now <= trialEnd) {
            // Ainda está no período de trial
            const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            setIsInTrial(true)
            setTrialDaysRemaining(daysRemaining)
            setHasActiveSubscription(true) // Durante trial, tem acesso completo
            setHasPaidSubscription(false)  // Mas NÃO é assinatura paga
            setLoading(false)

            // Atualizar cache
            subscriptionCache = {
              userId: user.id,
              hasActiveSubscription: true,
              hasPaidSubscription: false,
              isInTrial: true,
              trialDaysRemaining: daysRemaining,
              subscription: null,
              timestamp: Date.now()
            }
            return
          } else {
            // Trial expirou
            setIsInTrial(false)
            setTrialDaysRemaining(0)
            setHasActiveSubscription(false)
            setHasPaidSubscription(false)
            // Continuar verificando cortesia
          }
        }

        // 3. Verificar se é usuário cortesia ativo
        if (courtesyUser) {
          // Verificar se tem data de expiração
          if (courtesyUser.expires_at) {
            const expirationDate = new Date(courtesyUser.expires_at)
            const now = new Date()

            if (now <= expirationDate) {
              // Cortesia ativa e não expirada
              setHasActiveSubscription(true)
            } else {
              // Cortesia expirada
              setHasActiveSubscription(false)
            }
          } else {
            // Cortesia sem expiração
            setHasActiveSubscription(true)
          }
        } else {
          setHasActiveSubscription(false)
        }
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error)
        setHasActiveSubscription(false)
        setHasPaidSubscription(false)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user, hasCachedData])

  // Atualizar cache sempre que os valores mudarem
  useEffect(() => {
    if (!loading && user) {
      subscriptionCache = {
        userId: user.id,
        hasActiveSubscription,
        hasPaidSubscription,
        isInTrial,
        trialDaysRemaining,
        subscription,
        timestamp: Date.now()
      }
    }
  }, [loading, user, hasActiveSubscription, hasPaidSubscription, isInTrial, trialDaysRemaining, subscription])

  // Enquanto carrega, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando assinatura...</p>
        </div>
      </div>
    )
  }

  // Se não está logado, redirecionar para home
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Se não tem assinatura ativa, mostrar overlay de bloqueio
  if (!hasActiveSubscription) {
    return (
      <SubscriptionContext.Provider value={{ hasActiveSubscription, hasPaidSubscription, isInTrial, trialDaysRemaining, subscription }}>
        <UpgradeOverlay
          message="Seu período de teste expirou"
          feature="todas as funcionalidades premium"
        />
      </SubscriptionContext.Provider>
    )
  }

  // Usuário com assinatura ativa - permitir acesso completo
  return (
    <SubscriptionContext.Provider value={{ hasActiveSubscription, hasPaidSubscription, isInTrial, trialDaysRemaining, subscription }}>
      {children}
    </SubscriptionContext.Provider>
  )
}
