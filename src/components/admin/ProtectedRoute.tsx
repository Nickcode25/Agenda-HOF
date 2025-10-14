import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, adminUser, loading, checkSession } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Verificar se é admin (opcional - apenas avisa)
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md bg-gray-800 border border-gray-700 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-gray-400 mb-6">
            Você está logado como <span className="text-orange-500">{user.email}</span>, mas não tem permissões de administrador.
          </p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-400 text-left">
              <strong>Para criar um admin:</strong><br/>
              1. Vá no SQL Editor do Supabase<br/>
              2. Execute: <code className="text-orange-400">INSERT INTO admin_users (id, email, full_name, role) SELECT id, email, 'Admin', 'super_admin' FROM auth.users WHERE email = '{user.email}'</code>
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/login')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
