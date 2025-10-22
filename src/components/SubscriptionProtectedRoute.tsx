import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { Lock } from 'lucide-react'

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode
}

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
        // Verificar se usuário tem assinatura ativa
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        setHasActiveSubscription(!!subscription)
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

  // Se não tem assinatura ativa, redirecionar para página de vendas
  if (!hasActiveSubscription) {
    return <Navigate to="/pricing" replace />
  }

  // Usuário autenticado com assinatura ativa - permitir acesso
  return <>{children}</>
}
