import { Shield, Home, Users, Package, UserCheck, CreditCard, Tag, Gift, LogOut } from 'lucide-react'

type ActiveView = 'overview' | 'clinics' | 'plans' | 'subscriptions' | 'payments' | 'coupons' | 'courtesy'

interface AdminSidebarProps {
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  onLogout: () => void
}

export default function AdminSidebar({ activeView, onViewChange, onLogout }: AdminSidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500">Super Administrador</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => onViewChange('overview')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'overview'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="font-medium">Overview</span>
        </button>

        <button
          onClick={() => onViewChange('clinics')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'clinics'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="font-medium">Usuários</span>
        </button>

        <button
          onClick={() => onViewChange('plans')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'plans'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="font-medium">Planos</span>
        </button>

        <button
          onClick={() => onViewChange('subscriptions')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'subscriptions'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="font-medium">Assinaturas</span>
        </button>

        <button
          onClick={() => onViewChange('payments')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'payments'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="font-medium">Pagamentos</span>
        </button>

        <button
          onClick={() => onViewChange('coupons')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'coupons'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Tag className="w-5 h-5" />
          <span className="font-medium">Cupons</span>
        </button>

        <button
          onClick={() => onViewChange('courtesy')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeView === 'courtesy'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Gift className="w-5 h-5" />
          <span className="font-medium">Cortesia</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 border border-red-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
