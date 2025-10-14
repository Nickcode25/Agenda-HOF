import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useUserProfile } from '@/store/userProfile'

type RoleGuardProps = {
  children: React.ReactNode
  requiredRole?: 'owner' | 'staff'
  requireOwner?: boolean
}

export default function RoleGuard({ children, requiredRole, requireOwner = false }: RoleGuardProps) {
  const { currentProfile, loading } = useUserProfile()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      setIsChecking(false)
    }
  }, [loading])

  // Ainda está carregando o perfil
  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  // Não tem perfil carregado
  if (!currentProfile) {
    return <Navigate to="/" replace />
  }

  // Requer owner mas não é owner
  if (requireOwner && currentProfile.role !== 'owner') {
    return <Navigate to="/app/agenda" replace />
  }

  // Requer role específica mas não tem a role
  if (requiredRole && currentProfile.role !== requiredRole) {
    return <Navigate to="/app/agenda" replace />
  }

  return <>{children}</>
}
