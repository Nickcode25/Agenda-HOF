import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { AlertTriangle } from 'lucide-react'

type ProtectedRouteProps = {
  children: ReactNode
  requiredRoles?: ('admin' | 'super_admin' | 'employee')[]
  fallback?: ReactNode
}

export default function ProtectedRoute({ children, requiredRoles, fallback }: ProtectedRouteProps) {
  const { adminUser, user } = useAuth()

  // Se não tiver roles específicos requeridos, permite acesso
  if (!requiredRoles || requiredRoles.length === 0) {
    return <>{children}</>
  }

  // Se não estiver logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se for um usuário comum (não admin), bloqueia
  if (!adminUser) {
    return fallback || <AccessDenied />
  }

  // Verifica se o role do usuário está na lista de roles permitidos
  if (!requiredRoles.includes(adminUser.role)) {
    return fallback || <AccessDenied />
  }

  return <>{children}</>
}

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle size={48} className="text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Acesso Negado</h1>
          <p className="text-gray-500 mb-6">
            Você não tem permissão para acessar esta página. Entre em contato com o administrador se acredita que isso é um erro.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
