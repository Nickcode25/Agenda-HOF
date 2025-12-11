import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useUserProfile } from '@/store/userProfile'
import PageLoading from '@/components/ui/PageLoading'

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
    return <PageLoading />
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
