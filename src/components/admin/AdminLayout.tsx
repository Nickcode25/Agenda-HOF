import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Activity,
  Bell,
  UserPlus,
  LogOut,
  Menu,
  X,
  TrendingUp
} from 'lucide-react'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { adminUser, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
      description: 'Visão geral e métricas'
    },
    {
      label: 'Métricas SaaS',
      icon: TrendingUp,
      path: '/admin/metrics',
      description: 'MRR, Churn, LTV'
    },
    {
      label: 'Clientes',
      icon: Users,
      path: '/admin/customers',
      description: 'Gerenciar clientes'
    },
    {
      label: 'Compras',
      icon: ShoppingCart,
      path: '/admin/purchases',
      description: 'Gerenciar compras'
    },
    {
      label: 'Atividades',
      icon: Activity,
      path: '/admin/activities',
      description: 'Logs de atividades'
    },
    {
      label: 'Alertas',
      icon: Bell,
      path: '/admin/alerts',
      description: 'Notificações e alertas'
    },
    {
      label: 'Usuários Cortesia',
      icon: UserPlus,
      path: '/admin/courtesy-users',
      description: 'Acessos gratuitos'
    },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                <p className="text-xs text-gray-400 mt-1">Agenda+ HOF</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-70">{item.description}</div>
                  </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-700">
          {sidebarOpen ? (
            <>
              <div className="mb-3 p-3 bg-gray-700/50 rounded-lg">
                <p className="text-sm font-medium text-white truncate">
                  {adminUser?.fullName || adminUser?.email}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {adminUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sair</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5 mx-auto" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
