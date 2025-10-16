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
      <CourtesyUsersSection />
    </div>
  )
}
