import { useEffect, useState, createContext, useContext, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { supabase, getCachedUser } from '@/lib/supabase'
import { Lock } from 'lucide-react'
import UpgradeOverlay from './UpgradeOverlay'

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode
}

interface Subscription {
  id: string
  user_id: string
  plan_id: string
  plan_type?: string
  plan_name?: string
  status: string
  plan_amount: number
  next_billing_date: string | null
  created_at: string
  discount_percentage?: number
}

// Tipos de plano disponíveis
export type PlanType = 'basic' | 'pro' | 'premium' | 'trial' | 'courtesy'

// Funcionalidades do sistema
export type Feature =
  | 'agenda'
  | 'agenda_unlimited'
  | 'patients'
  | 'patients_unlimited'
  | 'professionals'
  | 'procedures'
  | 'whatsapp'
  | 'students'
  | 'courses'
  | 'analytics'
  | 'financial'
  | 'stock'
  | 'expenses'
  | 'sales'

// Limites por plano
export const PLAN_LIMITS: Record<PlanType, { appointments_per_month: number, patients: number }> = {
  basic: { appointments_per_month: 25, patients: 25 },
  pro: { appointments_per_month: -1, patients: -1 }, // -1 = ilimitado
  premium: { appointments_per_month: -1, patients: -1 },
  trial: { appointments_per_month: -1, patients: -1 },
  courtesy: { appointments_per_month: -1, patients: -1 } // Cortesia herda do plano vinculado
}

// Mapeamento de funcionalidades por plano
export const PLAN_FEATURES: Record<PlanType, Feature[]> = {
  basic: ['agenda', 'patients'], // Básico: apenas agenda e pacientes (com limites)
  pro: ['agenda', 'agenda_unlimited', 'patients', 'patients_unlimited', 'professionals', 'procedures'], // Pro: gestão completa de atendimento (sem educação e WhatsApp)
  premium: ['agenda', 'agenda_unlimited', 'patients', 'patients_unlimited', 'professionals', 'procedures', 'whatsapp', 'students', 'courses', 'analytics', 'financial', 'stock', 'expenses', 'sales'], // Premium: tudo
  trial: ['agenda', 'agenda_unlimited', 'patients', 'patients_unlimited', 'professionals', 'procedures', 'whatsapp', 'students', 'courses', 'analytics', 'financial', 'stock', 'expenses', 'sales'], // Trial tem acesso total
  courtesy: ['agenda', 'agenda_unlimited', 'patients', 'patients_unlimited', 'professionals', 'procedures', 'whatsapp', 'students', 'courses', 'analytics', 'financial', 'stock', 'expenses', 'sales'] // Cortesia tem acesso total
}

// Nome do plano mínimo necessário para cada funcionalidade
export const FEATURE_REQUIRED_PLAN: Record<Feature, { planName: string, planType: PlanType }> = {
  agenda: { planName: 'Plano Básico', planType: 'basic' },
  agenda_unlimited: { planName: 'Plano Pro', planType: 'pro' },
  patients: { planName: 'Plano Básico', planType: 'basic' },
  patients_unlimited: { planName: 'Plano Pro', planType: 'pro' },
  professionals: { planName: 'Plano Pro', planType: 'pro' },
  procedures: { planName: 'Plano Pro', planType: 'pro' },
  whatsapp: { planName: 'Plano Premium', planType: 'premium' },
  students: { planName: 'Plano Premium', planType: 'premium' },
  courses: { planName: 'Plano Premium', planType: 'premium' },
  analytics: { planName: 'Plano Premium', planType: 'premium' },
  financial: { planName: 'Plano Premium', planType: 'premium' },
  stock: { planName: 'Plano Premium', planType: 'premium' },
  expenses: { planName: 'Plano Premium', planType: 'premium' },
  sales: { planName: 'Plano Premium', planType: 'premium' }
}

interface SubscriptionContextType {
  hasActiveSubscription: boolean
  hasPaidSubscription: boolean
  isInTrial: boolean
  trialDaysRemaining: number
  subscription: Subscription | null
  planType: PlanType | null
  hasFeature: (feature: Feature) => boolean
  getRequiredPlan: (feature: Feature) => { planName: string, planType: PlanType }
  getPlanLimits: () => { appointments_per_month: number, patients: number }
  isUnlimited: () => boolean
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  hasActiveSubscription: false,
  hasPaidSubscription: false,
  isInTrial: false,
  trialDaysRemaining: 0,
  subscription: null,
  planType: null,
  hasFeature: () => false,
  getRequiredPlan: (feature) => FEATURE_REQUIRED_PLAN[feature],
  getPlanLimits: () => PLAN_LIMITS.basic,
  isUnlimited: () => false
})

export const useSubscription = () => useContext(SubscriptionContext)

// Chave para localStorage para sincronizar cache entre abas
const CACHE_STORAGE_KEY = 'subscription_cache'
const CACHE_TTL = 2 * 60 * 1000 // 2 minutos (cache mais curto para ser mais responsivo)

// Cache global para evitar verificações repetidas durante navegação
let subscriptionCache: {
  userId: string | null
  hasActiveSubscription: boolean
  hasPaidSubscription: boolean
  isInTrial: boolean
  trialDaysRemaining: number
  subscription: Subscription | null
  planType: PlanType | null
  timestamp: number
} | null = null

// Carregar cache do localStorage ao iniciar
function loadCacheFromStorage(): typeof subscriptionCache {
  try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Verificar se cache ainda é válido
      if (parsed && (Date.now() - parsed.timestamp) < CACHE_TTL) {
        return parsed
      }
    }
  } catch {
    // Ignorar erros de parsing
  }
  return null
}

// Salvar cache no localStorage para sincronizar entre abas
function saveCacheToStorage(cache: typeof subscriptionCache) {
  try {
    if (cache) {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache))
    } else {
      localStorage.removeItem(CACHE_STORAGE_KEY)
    }
  } catch {
    // Ignorar erros de storage
  }
}

// Inicializar cache do localStorage
subscriptionCache = loadCacheFromStorage()

// Função para invalidar o cache (útil após login)
export function invalidateSubscriptionCache() {
  subscriptionCache = null
  saveCacheToStorage(null)
}

// Função para determinar o tipo de plano baseado no nome ou preço
function determinePlanType(subscription: Subscription | null, planData?: any): PlanType {
  if (!subscription && !planData) return 'basic'

  // Se tem plan_type explícito
  if (subscription?.plan_type) {
    const type = subscription.plan_type.toLowerCase()
    if (type.includes('premium')) return 'premium'
    if (type.includes('pro')) return 'pro'
    if (type.includes('basic') || type.includes('básico')) return 'basic'
    if (type.includes('courtesy') || type.includes('cortesia')) return 'courtesy'
  }

  // Se tem plan_name
  if (subscription?.plan_name) {
    const name = subscription.plan_name.toLowerCase()
    if (name.includes('premium')) return 'premium'
    if (name.includes('pro')) return 'pro'
    if (name.includes('basic') || name.includes('básico')) return 'basic'
    if (name.includes('courtesy') || name.includes('cortesia')) return 'courtesy'
  }

  // Verificar pelo preço
  const amount = subscription?.plan_amount || planData?.price || 0
  if (amount >= 99) return 'premium'
  if (amount >= 79) return 'pro'
  if (amount >= 49) return 'basic'

  // Fallback para premium se tiver assinatura ativa
  if (subscription) return 'premium'

  return 'basic'
}

// Função para verificar se é uma cortesia (100% de desconto)
function isCourtesySubscription(subscription: any): boolean {
  return subscription?.discount_percentage === 100
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
  const [planType, setPlanType] = useState<PlanType | null>(hasCachedData ? subscriptionCache!.planType : null)

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
        const [subscriptionResult, cachedUser, courtesyResult] = await Promise.all([
          supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle(),
          getCachedUser(),
          supabase
            .from('courtesy_users')
            .select('*')
            .eq('auth_user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()
        ])

        const subscriptionData = subscriptionResult.data
        const courtesyUser = courtesyResult.data

        // 1. Verificar se usuário tem assinatura ativa
        if (subscriptionData) {
          // Verificar se é cortesia (100% de desconto) - cortesias não verificam next_billing_date
          const isCourtesy = isCourtesySubscription(subscriptionData)

          // Para assinaturas normais (não cortesia), verificar se a cobrança está atrasada
          if (!isCourtesy && subscriptionData.next_billing_date) {
            const nextBilling = new Date(subscriptionData.next_billing_date)
            const now = new Date()

            // Se passou mais de 5 dias da data de cobrança, considerar suspensa
            const daysDiff = Math.floor((now.getTime() - nextBilling.getTime()) / (1000 * 60 * 60 * 24))

            if (daysDiff > 5) {
              // Assinatura com cobrança atrasada - não considerar como ativa
              setHasActiveSubscription(false)
              setHasPaidSubscription(false)
              setSubscription(null)
              setPlanType(null)
              setLoading(false)
              return
            }
          }

          // Buscar detalhes do plano se tiver plan_id
          let planData = null
          if (subscriptionData.plan_id) {
            const { data: plan } = await supabase
              .from('subscription_plans')
              .select('name, price')
              .eq('id', subscriptionData.plan_id)
              .single()
            planData = plan

            // Adicionar nome do plano à subscription
            if (plan) {
              subscriptionData.plan_name = plan.name
            }
          }

          // Para cortesias, usar o tipo do plano vinculado (basic, pro, premium)
          // Se não tiver plano vinculado, fallback para premium (comportamento antigo)
          let detectedPlanType: PlanType
          if (isCourtesy) {
            // Cortesia usa o tipo do plano vinculado
            detectedPlanType = determinePlanType(subscriptionData, planData)
            // Se não conseguiu determinar o plano, fallback para premium
            if (!detectedPlanType || detectedPlanType === 'basic') {
              // Se tem plan_name, tenta detectar pelo nome
              if (planData?.name) {
                const name = planData.name.toLowerCase()
                if (name.includes('premium')) detectedPlanType = 'premium'
                else if (name.includes('pro')) detectedPlanType = 'pro'
                else if (name.includes('básico') || name.includes('basico') || name.includes('basic')) detectedPlanType = 'basic'
              }
            }
          } else {
            detectedPlanType = determinePlanType(subscriptionData, planData)
          }

          setHasActiveSubscription(true)
          setHasPaidSubscription(!isCourtesy) // Cortesia não é assinatura paga
          setSubscription(subscriptionData)
          setPlanType(detectedPlanType)
          setLoading(false)

          // Atualizar cache
          subscriptionCache = {
            userId: user.id,
            hasActiveSubscription: true,
            hasPaidSubscription: !isCourtesy,
            isInTrial: false,
            trialDaysRemaining: 0,
            subscription: subscriptionData,
            planType: detectedPlanType,
            timestamp: Date.now()
          }
          saveCacheToStorage(subscriptionCache)
          return
        }

        // 2. Se não tem subscription, verificar período de trial (7 dias grátis)
        let trialEndDate = cachedUser?.user_metadata?.trial_end_date

        // Se não tem trial_end_date definido, calcular com base na data de criação da conta
        // Isso permite que usuários cadastrados manualmente também tenham trial
        if (!trialEndDate && cachedUser?.created_at) {
          const createdAt = new Date(cachedUser.created_at)
          const calculatedTrialEnd = new Date(createdAt)
          calculatedTrialEnd.setDate(calculatedTrialEnd.getDate() + 7) // 7 dias de trial
          trialEndDate = calculatedTrialEnd.toISOString()
        }

        if (trialEndDate) {
          const trialEnd = new Date(trialEndDate)
          const now = new Date()

          if (now <= trialEnd) {
            // Ainda está no período de trial
            const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            setIsInTrial(true)
            setTrialDaysRemaining(daysRemaining)
            setHasActiveSubscription(true)
            setHasPaidSubscription(false)
            setPlanType('trial') // Trial tem acesso completo
            setLoading(false)

            // Atualizar cache
            subscriptionCache = {
              userId: user.id,
              hasActiveSubscription: true,
              hasPaidSubscription: false,
              isInTrial: true,
              trialDaysRemaining: daysRemaining,
              subscription: null,
              planType: 'trial',
              timestamp: Date.now()
            }
            saveCacheToStorage(subscriptionCache)
            return
          } else {
            // Trial expirou
            setIsInTrial(false)
            setTrialDaysRemaining(0)
            setHasActiveSubscription(false)
            setHasPaidSubscription(false)
            setPlanType(null)
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
              setPlanType('courtesy')
            } else {
              // Cortesia expirada
              setHasActiveSubscription(false)
              setPlanType(null)
            }
          } else {
            // Cortesia sem expiração
            setHasActiveSubscription(true)
            setPlanType('courtesy')
          }
        } else {
          setHasActiveSubscription(false)
          setPlanType(null)
        }
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error)
        setHasActiveSubscription(false)
        setHasPaidSubscription(false)
        setPlanType(null)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user, hasCachedData])

  // Atualizar cache sempre que os valores mudarem
  useEffect(() => {
    if (!loading && user) {
      const newCache = {
        userId: user.id,
        hasActiveSubscription,
        hasPaidSubscription,
        isInTrial,
        trialDaysRemaining,
        subscription,
        planType,
        timestamp: Date.now()
      }
      subscriptionCache = newCache
      // Sincronizar com localStorage para outras abas
      saveCacheToStorage(newCache)
    }
  }, [loading, user, hasActiveSubscription, hasPaidSubscription, isInTrial, trialDaysRemaining, subscription, planType])

  // Escutar mudanças no localStorage de outras abas
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === CACHE_STORAGE_KEY) {
        const newCache = loadCacheFromStorage()
        if (newCache && newCache.userId === user?.id) {
          setHasActiveSubscription(newCache.hasActiveSubscription)
          setHasPaidSubscription(newCache.hasPaidSubscription)
          setIsInTrial(newCache.isInTrial)
          setTrialDaysRemaining(newCache.trialDaysRemaining)
          setSubscription(newCache.subscription)
          setPlanType(newCache.planType)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user?.id])

  // Função para verificar se tem acesso a uma funcionalidade
  const hasFeature = useMemo(() => {
    return (feature: Feature): boolean => {
      if (!hasActiveSubscription || !planType) return false
      const allowedFeatures = PLAN_FEATURES[planType] || []
      return allowedFeatures.includes(feature)
    }
  }, [hasActiveSubscription, planType])

  // Função para obter o plano necessário para uma funcionalidade
  const getRequiredPlan = useMemo(() => {
    return (feature: Feature) => FEATURE_REQUIRED_PLAN[feature]
  }, [])

  // Função para obter os limites do plano atual
  const getPlanLimits = useMemo(() => {
    return () => {
      if (!planType) return PLAN_LIMITS.basic
      return PLAN_LIMITS[planType]
    }
  }, [planType])

  // Função para verificar se o plano é ilimitado
  const isUnlimited = useMemo(() => {
    return () => {
      if (!planType) return false
      const limits = PLAN_LIMITS[planType]
      return limits.appointments_per_month === -1 && limits.patients === -1
    }
  }, [planType])

  // Memoizar o valor do contexto para evitar re-renders desnecessários nos filhos
  const contextValue = useMemo(() => ({
    hasActiveSubscription,
    hasPaidSubscription,
    isInTrial,
    trialDaysRemaining,
    subscription,
    planType,
    hasFeature,
    getRequiredPlan,
    getPlanLimits,
    isUnlimited
  }), [hasActiveSubscription, hasPaidSubscription, isInTrial, trialDaysRemaining, subscription, planType, hasFeature, getRequiredPlan, getPlanLimits, isUnlimited])

  // Enquanto carrega, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-600">Verificando assinatura...</p>
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
      <SubscriptionContext.Provider value={contextValue}>
        <UpgradeOverlay
          message="Seu período de teste expirou"
          feature="todas as funcionalidades premium"
        />
      </SubscriptionContext.Provider>
    )
  }

  // Usuário com assinatura ativa - permitir acesso completo
  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  )
}
