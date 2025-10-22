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

  // Se não tem assinatura ativa, mostrar tela de bloqueio
  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-400" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">Assinatura Necessária</h2>

          <p className="text-gray-300 mb-2">
            Você precisa ter uma assinatura ativa para acessar o sistema.
          </p>

          <p className="text-sm text-gray-400 mb-8">
            Sua conta foi criada, mas o pagamento ainda não foi confirmado.
          </p>

          <div className="space-y-3">
            <a
              href="/"
              className="block w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-6 py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30"
            >
              Assinar Agora
            </a>

            <button
              onClick={() => {
                // Fazer logout
                useAuth.getState().signOut()
                window.location.href = '/'
              }}
              className="block w-full bg-gray-700 text-gray-300 font-medium px-6 py-3 rounded-xl hover:bg-gray-600 transition-all"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Usuário autenticado com assinatura ativa - permitir acesso
  return <>{children}</>
}
