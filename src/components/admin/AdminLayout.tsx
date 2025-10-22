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
  TrendingUp,
  Tag
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
      label: 'Cupons',
      icon: Tag,
      path: '/admin/coupons',
      description: 'Cupons de desconto'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 flex">
      {/* Sidebar Premium */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } backdrop-blur-2xl bg-gradient-to-b from-gray-900/95 to-gray-800/95 border-r border-white/10 transition-all duration-300 flex flex-col shadow-2xl`}
      >
        {/* Header Premium */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Admin Panel
                </h2>
                <p className="text-xs text-gray-400 mt-1 font-medium">Agenda+ HOF</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white hover:scale-110 backdrop-blur-sm border border-white/10"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu Items Premium */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/20 scale-105'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:scale-105 border border-transparent'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <div className={`p-2 rounded-xl transition-all ${
                  active
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50'
                    : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                </div>
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm">{item.label}</div>
                    <div className="text-xs opacity-70 font-medium">{item.description}</div>
                  </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Info & Logout Premium */}
        <div className="p-4 border-t border-white/10">
          {sidebarOpen ? (
            <>
              <div className="mb-4 p-4 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/10">
                <p className="text-sm font-bold text-white truncate mb-1">
                  {adminUser?.fullName || adminUser?.email}
                </p>
                <p className="text-xs font-medium">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {adminUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 rounded-2xl hover:from-red-500/30 hover:to-red-600/30 transition-all font-bold hover:scale-105 shadow-lg hover:shadow-red-500/20"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full p-3 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30 rounded-2xl hover:from-red-500/30 hover:to-red-600/30 transition-all hover:scale-110"
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
