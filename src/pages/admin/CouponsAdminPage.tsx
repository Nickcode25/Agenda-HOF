import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import AdminSidebar from './components/AdminSidebar'
import CouponManager from '@/components/admin/CouponManager'

export default function CouponsAdminPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <AdminSidebar
        activeView="coupons"
        onViewChange={(view) => navigate(`/admin/${view === 'overview' ? 'dashboard' : view === 'clinics' ? 'users' : view}`)}
        onLogout={handleLogout}
      />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <CouponManager />
        </div>
      </div>
    </div>
  )
}
