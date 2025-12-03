import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import AdminSidebar from './components/AdminSidebar'
import PlansManager from '@/components/admin/PlansManager'

export default function PlansAdminPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        activeView="plans"
        onViewChange={(view) => navigate(`/admin/${view === 'overview' ? 'dashboard' : view === 'clinics' ? 'users' : view}`)}
        onLogout={handleLogout}
      />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <PlansManager />
        </div>
      </div>
    </div>
  )
}
