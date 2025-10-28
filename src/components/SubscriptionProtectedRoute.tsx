import { useEffect, useState, createContext, useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { Lock } from 'lucide-react'
import UpgradeOverlay from './UpgradeOverlay'

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode
}

interface SubscriptionContextType {
  hasActiveSubscription: boolean
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  hasActiveSubscription: false
})

export const useSubscription = () => useContext(SubscriptionContext)

export default function SubscriptionProtectedRoute({ children }: SubscriptionProtectedRouteProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // 1. Verificar se usuário tem assinatura ativa
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (subscription) {
          setHasActiveSubscription(true)
          setLoading(false)
          return
        }

        // 2. Se não tem subscription, verificar se é usuário cortesia ativo
        const { data: courtesyUser } = await supabase
          .from('courtesy_users')
          .select('*')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

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
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user])

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

  // Usuário autenticado - permitir acesso (com ou sem assinatura)
  // Se não tem assinatura, o conteúdo mostrará overlay de bloqueio
  return (
    <SubscriptionContext.Provider value={{ hasActiveSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  )
}
