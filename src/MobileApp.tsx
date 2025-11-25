import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Calendar, Users, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/store/auth'
import { useUserProfile } from '@/store/userProfile'

export default function MobileApp() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { signOut, user } = useAuth()
  const { currentProfile } = useUserProfile()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">Agenda HOF</h1>
              <p className="text-xs text-gray-500">{currentProfile?.displayName || user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="p-4 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 shadow-lg sticky bottom-0">
        <div className="flex items-center justify-around px-4 py-3">
          <NavLink
            to="/app"
            end
            className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              isActive
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar size={24} />
            <span className="text-xs font-medium">Agenda</span>
          </NavLink>

          <NavLink
            to="/app/pacientes"
            className={({ isActive }) => `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              isActive
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users size={24} />
            <span className="text-xs font-medium">Pacientes</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
