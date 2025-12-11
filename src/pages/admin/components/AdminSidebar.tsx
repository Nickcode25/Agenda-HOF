import { Shield, LayoutDashboard, Users, CreditCard, Tag, Gift, LogOut, Receipt, UserCheck } from 'lucide-react'

type ActiveView = 'overview' | 'clinics' | 'plans' | 'subscriptions' | 'payments' | 'coupons' | 'courtesy'

interface AdminSidebarProps {
  activeView: ActiveView
  onViewChange: (view: ActiveView) => void
  onLogout: () => void
}

interface NavItem {
  id: ActiveView
  label: string
  icon: React.ReactNode
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export default function AdminSidebar({ activeView, onViewChange, onLogout }: AdminSidebarProps) {
  const navGroups: NavGroup[] = [
    {
      title: 'Geral',
      items: [
        { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'clinics', label: 'Usuários', icon: <Users className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Financeiro',
      items: [
        { id: 'subscriptions', label: 'Assinaturas', icon: <UserCheck className="w-5 h-5" /> },
        { id: 'payments', label: 'Pagamentos', icon: <Receipt className="w-5 h-5" /> },
      ]
    },
    {
      title: 'Promoções',
      items: [
        { id: 'coupons', label: 'Cupons', icon: <Tag className="w-5 h-5" /> },
        { id: 'courtesy', label: 'Cortesias', icon: <Gift className="w-5 h-5" /> },
      ]
    }
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500">Super Administrador</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? 'mt-6' : ''}>
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    activeView === item.id
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Sair</span>
        </button>
      </div>
    </aside>
  )
}
