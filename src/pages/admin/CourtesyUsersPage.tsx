import { useEffect } from 'react'
import { useAdmin } from '@/store/admin'
import CourtesyUsersSection from '@/components/admin/CourtesyUsersSection'

export default function CourtesyUsersPage() {
  const { fetchCourtesyUsers } = useAdmin()

  useEffect(() => {
    fetchCourtesyUsers()
  }, [])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Usuários Cortesia</h1>
        <p className="text-gray-400">Gerenciar acessos gratuitos ao sistema</p>
      </div>

      {/* Courtesy Users */}
      <CourtesyUsersSection />
    </div>
  )
}
