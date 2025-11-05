import { Shield, Home, Users, Package, UserCheck, CreditCard, Tag, LogOut } from 'lucide-react'

type ActiveView = 'overview' | 'clinics' | 'plans' | 'subscriptions' | 'payments' | 'coupons'

interface AdminSidebarProps {
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  onLogout: () => void
}

export default function AdminSidebar({ activeView, onViewChange, onLogout }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-xs text-gray-400">Super Administrador</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => onViewChange('overview')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'overview'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Overview</span>
        </button>

        <button
          onClick={() => onViewChange('clinics')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'clinics'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Usuários</span>
        </button>

        <button
          onClick={() => onViewChange('plans')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'plans'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="font-medium">Planos</span>
        </button>

        <button
          onClick={() => onViewChange('subscriptions')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'subscriptions'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="font-medium">Assinaturas</span>
        </button>

        <button
          onClick={() => onViewChange('payments')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'payments'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="font-medium">Pagamentos</span>
        </button>

        <button
          onClick={() => onViewChange('coupons')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'coupons'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Tag className="w-5 h-5" />
          <span className="font-medium">Cupons</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all duration-200 border border-red-500/30"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
