import { useEffect, useState, createContext, useContext, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { supabase, getCachedUser } from '@/lib/supabase'
import { Lock } from 'lucide-react'
import UpgradeOverlay from './UpgradeOverlay'
import PageLoading from './ui/PageLoading'

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
  linked_plan_type?: 'basic' | 'pro' | 'premium' // Para cortesias, qual plano real está vinculado
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
  pro: ['agenda', 'agenda_unlimited', 'patients', 'patients_unlimited', 'professionals', 'procedures'], // Pro: gestão completa de atendimento (sem financeiro, educação e WhatsApp)
  premium: ['agenda', 'agenda_unlimited', 'patients', 'patients_unlimited', 'professionals', 'procedures', 'whatsapp', 'students', 'courses', 'analytics', 'financial', 'stock', 'expenses', 'sales'], // Premium: tudo
  trial: ['agenda', 'agenda_unlimited', 'patients', 'patients_unlimited', 'professionals', 'procedures', 'whatsapp', 'students', 'courses', 'analytics', 'financial', 'stock', 'expenses', 'sales'], // Trial tem acesso total
  courtesy: [] // Cortesia herda do plano vinculado - será resolvido dinamicamente
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
const CACHE_INVALIDATION_KEY = 'subscription_cache_invalidated'
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

// Contador de invalidações para forçar re-render
let cacheInvalidationCounter = 0

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

// Função para invalidar o cache (útil após login ou após assinar)
export function invalidateSubscriptionCache() {
  subscriptionCache = null
  saveCacheToStorage(null)
  // Incrementar contador e salvar no localStorage para notificar componentes montados
  cacheInvalidationCounter++
  try {
    localStorage.setItem(CACHE_INVALIDATION_KEY, String(cacheInvalidationCounter))
    // Disparar evento de storage manualmente (não dispara na mesma aba automaticamente)
    window.dispatchEvent(new StorageEvent('storage', {
      key: CACHE_INVALIDATION_KEY,
      newValue: String(cacheInvalidationCounter)
    }))
  } catch {
    // Ignorar erros de storage
  }
}

// Função para determinar o tipo de plano baseado no nome, tipo salvo ou preço
// PRIORIDADE: plan_type/plan_name confiáveis > plan_amount > fallback premium
function determinePlanType(subscription: Subscription | null, planData?: any): PlanType {
  if (!subscription && !planData) return 'basic'

  // PRIORIDADE 1: Se tem plan_type explícito E NÃO é 'basic' com preço alto (bug antigo)
  if (subscription?.plan_type) {
    const type = subscription.plan_type.toLowerCase()

    // Se plan_type é 'basic' mas o preço indica outro plano, usar o preço
    // Isso corrige o bug onde assinaturas foram salvas com plan_type errado
    if (type === 'basic' && subscription.plan_amount) {
      if (subscription.plan_amount >= 99) {
        console.log('⚠️ Correção: plan_type=basic mas plan_amount>=99, retornando premium')
        return 'premium'
      }
      if (subscription.plan_amount >= 79) {
        console.log('⚠️ Correção: plan_type=basic mas plan_amount>=79, retornando pro')
        return 'pro'
      }
    }

    if (type === 'premium' || type.includes('premium')) return 'premium'
    if (type === 'pro' || type.includes('pro') || type === 'professional') return 'pro'
    if (type === 'basic' || type.includes('basic') || type.includes('básico')) return 'basic'
    if (type.includes('courtesy') || type.includes('cortesia')) return 'courtesy'
  }

  // PRIORIDADE 2: Se tem plan_name
  if (subscription?.plan_name) {
    const name = subscription.plan_name.toLowerCase()
    if (name.includes('premium') || name.includes('completo')) return 'premium'
    if (name.includes('pro') || name.includes('profissional')) return 'pro'
    if (name.includes('basic') || name.includes('básico')) return 'basic'
    if (name.includes('courtesy') || name.includes('cortesia')) return 'courtesy'
  }

  // PRIORIDADE 3: Se tem planData do banco de planos
  if (planData?.name) {
    const name = planData.name.toLowerCase()
    if (name.includes('premium') || name.includes('completo')) return 'premium'
    if (name.includes('pro') || name.includes('profissional')) return 'pro'
    if (name.includes('basic') || name.includes('básico')) return 'basic'
  }

  // PRIORIDADE 4: Usar plan_amount como última tentativa
  if (subscription?.plan_amount) {
    if (subscription.plan_amount >= 99) return 'premium'
    if (subscription.plan_amount >= 79) return 'pro'
    if (subscription.plan_amount > 0) return 'basic'
  }

  // Fallback para premium se tiver assinatura ativa (melhor dar acesso do que bloquear)
  if (subscription) return 'premium'

  return 'basic'
}

// Função para verificar se é uma cortesia (100% de desconto)
function isCourtesySubscription(subscription: any): boolean {
  return subscription?.discount_percentage === 100
}

// Função para determinar o tipo de plano vinculado a uma cortesia
function determineLinkedPlanType(planName?: string, planAmount?: number): 'basic' | 'pro' | 'premium' {
  // Primeiro tentar pelo nome
  if (planName) {
    const name = planName.toLowerCase()
    if (name.includes('premium')) return 'premium'
    if (name.includes('pro') || name.includes('profissional')) return 'pro'
    if (name.includes('basic') || name.includes('básico')) return 'basic'
  }

  // Depois tentar pelo preço
  if (planAmount) {
    if (planAmount >= 99) return 'premium'
    if (planAmount >= 79) return 'pro'
  }

  return 'basic'
}

export default function SubscriptionProtectedRoute({ children }: SubscriptionProtectedRouteProps) {
  const { user } = useAuth()

  // Cache é usado APENAS para exibição inicial (evitar flash de loading)
  // MAS sempre verificamos o banco para garantir dados atualizados
  const initialCacheState = useMemo(() => {
    const hasCachedData = subscriptionCache &&
      subscriptionCache.userId === user?.id &&
      (Date.now() - subscriptionCache.timestamp) < CACHE_TTL
    // NUNCA confiar em cache de trial - usuário pode ter assinado
    if (hasCachedData && subscriptionCache?.isInTrial) {
      return null
    }
    return hasCachedData ? subscriptionCache : null
  }, [user?.id])

  const [loading, setLoading] = useState(!initialCacheState)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(initialCacheState?.hasActiveSubscription ?? false)
  const [hasPaidSubscription, setHasPaidSubscription] = useState(initialCacheState?.hasPaidSubscription ?? false)
  const [isInTrial, setIsInTrial] = useState(initialCacheState?.isInTrial ?? false)
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(initialCacheState?.trialDaysRemaining ?? 0)
  const [subscription, setSubscription] = useState<Subscription | null>(initialCacheState?.subscription ?? null)
  const [planType, setPlanType] = useState<PlanType | null>(initialCacheState?.planType ?? null)
  const [dataLoaded, setDataLoaded] = useState(false) // SEMPRE false inicialmente para forçar verificação

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        setLoading(false)
        subscriptionCache = null
        return
      }

      // Se já verificamos o banco nesta sessão, não verificar novamente
      if (dataLoaded) {
        setLoading(false)
        return
      }

      try {
        // Buscar todas as informações em paralelo (mais rápido)
        // Aceitar status 'active' ou 'pending_cancellation' (usuário cancelou mas ainda tem acesso até fim do período)
        // IMPORTANTE: Ordenar por created_at desc e pegar apenas 1 para evitar erro 406 quando há múltiplas assinaturas
        const [subscriptionResultArray, cachedUser, courtesyResult] = await Promise.all([
          supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['active', 'pending_cancellation'])
            .order('created_at', { ascending: false })
            .limit(1),
          getCachedUser(),
          supabase
            .from('courtesy_users')
            .select('*')
            .eq('auth_user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()
        ])

        // Pegar primeiro item do array (mais recente)
        const subscriptionData = subscriptionResultArray.data?.[0] || null
        const courtesyUser = courtesyResult.data

        // 1. Verificar se usuário tem assinatura ativa
        if (subscriptionData) {
          // Verificar se é cortesia (100% de desconto) - cortesias não verificam next_billing_date
          const isCourtesy = isCourtesySubscription(subscriptionData)

          // Para assinaturas normais (não cortesia), verificar se a cobrança está atrasada ou se o período acabou
          if (!isCourtesy && subscriptionData.next_billing_date) {
            const nextBilling = new Date(subscriptionData.next_billing_date)
            const now = new Date()

            // Se status é 'pending_cancellation', o usuário cancelou mas ainda deve ter acesso
            // até a next_billing_date (quando a próxima cobrança seria feita)
            if (subscriptionData.status === 'pending_cancellation') {
              if (now > nextBilling) {
                // Período pago acabou - usuário não tem mais acesso
                // Atualizar status para 'cancelled' no banco
                await supabase
                  .from('user_subscriptions')
                  .update({ status: 'cancelled' })
                  .eq('id', subscriptionData.id)

                setHasActiveSubscription(false)
                setHasPaidSubscription(false)
                setSubscription(null)
                setPlanType(null)
                setLoading(false)
                return
              }
              // Ainda está no período pago, continuar com acesso normal
            } else {
              // Assinatura ativa normal - verificar se cobrança está atrasada
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

          // Para cortesias, definir planType como 'courtesy' para exibição correta na UI
          // O plano vinculado (basic, pro, premium) é armazenado em subscription.linked_plan_type
          let detectedPlanType: PlanType
          if (isCourtesy) {
            // Cortesia sempre usa planType 'courtesy' para exibição na UI
            detectedPlanType = 'courtesy'
            // Determinar qual plano real está vinculado à cortesia
            const linkedType = determineLinkedPlanType(planData?.name || subscriptionData.plan_name, subscriptionData.plan_amount)
            subscriptionData.linked_plan_type = linkedType
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

        // 2. Verificar se o usuário teve cortesia revogada
        // Se tiver, não deve ter acesso via trial (evita que trial_end_date da cortesia seja usado)
        const { data: revokedCourtesy } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'cancelled')
          .eq('discount_percentage', 100)
          .limit(1)
          .maybeSingle()

        // Se teve cortesia revogada, não considerar trial
        if (revokedCourtesy) {
          setHasActiveSubscription(false)
          setHasPaidSubscription(false)
          setIsInTrial(false)
          setTrialDaysRemaining(0)
          setPlanType(null)
          setLoading(false)

          // Atualizar cache para refletir que não tem acesso
          subscriptionCache = {
            userId: user.id,
            hasActiveSubscription: false,
            hasPaidSubscription: false,
            isInTrial: false,
            trialDaysRemaining: 0,
            subscription: null,
            planType: null,
            timestamp: Date.now()
          }
          saveCacheToStorage(subscriptionCache)
          setDataLoaded(true)
          return
        }

        // 3. Se não tem subscription e não teve cortesia revogada, verificar período de trial (7 dias grátis)
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

        // 4. Verificar se é usuário cortesia ativo (tabela courtesy_users)
        if (courtesyUser) {
          // Verificar se tem data de expiração
          let courtesyActive = false
          if (courtesyUser.expires_at) {
            const expirationDate = new Date(courtesyUser.expires_at)
            const now = new Date()
            courtesyActive = now <= expirationDate
          } else {
            // Cortesia sem expiração = sempre ativa
            courtesyActive = true
          }

          if (courtesyActive) {
            // Cortesia ativa
            setHasActiveSubscription(true)
            setHasPaidSubscription(false) // Cortesia não é assinatura paga
            setIsInTrial(false) // Cortesia NÃO é trial
            setTrialDaysRemaining(0)
            setPlanType('courtesy')
            setLoading(false)

            // Atualizar cache para cortesia
            subscriptionCache = {
              userId: user.id,
              hasActiveSubscription: true,
              hasPaidSubscription: false,
              isInTrial: false,
              trialDaysRemaining: 0,
              subscription: null,
              planType: 'courtesy',
              timestamp: Date.now()
            }
            saveCacheToStorage(subscriptionCache)
            return
          } else {
            // Cortesia expirada
            setHasActiveSubscription(false)
            setPlanType(null)
          }
        } else {
          setHasActiveSubscription(false)
          setPlanType(null)
        }
      } catch {
        setHasActiveSubscription(false)
        setHasPaidSubscription(false)
        setPlanType(null)
      } finally {
        setLoading(false)
        setDataLoaded(true)
      }
    }

    checkSubscription()
  }, [user, dataLoaded])

  // Atualizar cache apenas quando terminar de carregar dados novos (evita loop)
  useEffect(() => {
    if (dataLoaded && !loading && user) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded, loading, user?.id])

  // Escutar mudanças no localStorage de outras abas e invalidações de cache
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
      // Escutar invalidação de cache (ex: após assinar um plano)
      if (e.key === CACHE_INVALIDATION_KEY) {
        // Forçar recarregamento dos dados de assinatura
        setDataLoaded(false)
        setLoading(true)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user?.id])

  // Função para verificar se tem acesso a uma funcionalidade
  const hasFeature = useMemo(() => {
    return (feature: Feature): boolean => {
      if (!hasActiveSubscription || !planType) return false

      // Se for cortesia, usar as features do plano vinculado
      if (planType === 'courtesy' && subscription?.linked_plan_type) {
        const linkedFeatures = PLAN_FEATURES[subscription.linked_plan_type] || []
        return linkedFeatures.includes(feature)
      }

      const allowedFeatures = PLAN_FEATURES[planType] || []
      return allowedFeatures.includes(feature)
    }
  }, [hasActiveSubscription, planType, subscription])

  // Função para obter o plano necessário para uma funcionalidade
  const getRequiredPlan = useMemo(() => {
    return (feature: Feature) => FEATURE_REQUIRED_PLAN[feature]
  }, [])

  // Função para obter os limites do plano atual
  const getPlanLimits = useMemo(() => {
    return () => {
      if (!planType) return PLAN_LIMITS.basic

      // Se for cortesia, usar os limites do plano vinculado
      if (planType === 'courtesy' && subscription?.linked_plan_type) {
        return PLAN_LIMITS[subscription.linked_plan_type]
      }

      return PLAN_LIMITS[planType]
    }
  }, [planType, subscription])

  // Função para verificar se o plano é ilimitado
  const isUnlimited = useMemo(() => {
    return () => {
      if (!planType) return false

      // Se for cortesia, verificar os limites do plano vinculado
      let limits: { appointments_per_month: number, patients: number }
      if (planType === 'courtesy' && subscription?.linked_plan_type) {
        limits = PLAN_LIMITS[subscription.linked_plan_type]
      } else {
        limits = PLAN_LIMITS[planType]
      }

      return limits.appointments_per_month === -1 && limits.patients === -1
    }
  }, [planType, subscription])

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

  // Enquanto carrega, mostrar loading (fullScreen para cobrir toda a tela)
  if (loading) {
    return <PageLoading message="Verificando assinatura..." fullScreen />
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
