import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Calendar, Users, PlusCircle, Menu, X, Stethoscope, Scissors, Package, ShoppingCart, BarChart3, ChevronDown, CreditCard, LogOut, UserCog, TrendingUp, MessageSquare, Receipt, Wallet } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useProfessionals } from '@/store/professionals'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import { useAuth } from '@/store/auth'
import { useUserProfile } from '@/store/userProfile'
import NotificationBell from '@/components/NotificationBell'
import { startNotificationPolling } from '@/services/notificationService'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile sidebar
  const [sidebarHovered, setSidebarHovered] = useState(false) // Desktop hover
  const [entityNames, setEntityNames] = useState<Record<string, string>>({})
  const { professionals } = useProfessionals()
  const { selectedProfessional, setSelectedProfessional } = useProfessionalContext()
  const { signOut, user } = useAuth()
  const { currentProfile, fetchCurrentProfile } = useUserProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const { message, type, isVisible, hide } = useToast()

  useEffect(() => {
    if (user) {
      fetchCurrentProfile()
    }
  }, [user])

  // Iniciar polling de notificações
  useEffect(() => {
    if (user) {
      const stopPolling = startNotificationPolling()
      return () => stopPolling()
    }
  }, [user])

  // Buscar nomes de entidades (pacientes, procedimentos, profissionais, etc) para breadcrumbs
  useEffect(() => {
    const fetchEntityNames = async () => {
      const paths = location.pathname.split('/').filter(Boolean)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const newEntityNames: Record<string, string> = {}

      // Identificar contexto e UUIDs
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i]
        const nextPath = paths[i + 1]

        if (!nextPath || !uuidRegex.test(nextPath)) continue

        const id = nextPath

        try {
          let data = null

          // Pacientes
          if (path === 'pacientes') {
            const result = await supabase
              .from('patients')
              .select('name')
              .eq('id', id)
              .single()
            data = result.data
            if (data) newEntityNames[id] = data.name
          }

          // Procedimentos
          else if (path === 'procedimentos') {
            const result = await supabase
              .from('procedures')
              .select('name')
              .eq('id', id)
              .single()
            data = result.data
            if (data) newEntityNames[id] = data.name
          }

          // Profissionais
          else if (path === 'profissionais') {
            const result = await supabase
              .from('professionals')
              .select('name')
              .eq('id', id)
              .single()
            data = result.data
            if (data) newEntityNames[id] = data.name
          }

          // Sessões de caixa
          else if (path === 'sessao') {
            const result = await supabase
              .from('cash_sessions')
              .select('id, created_at')
              .eq('id', id)
              .single()
            if (result.data) {
              const date = new Date(result.data.created_at).toLocaleDateString('pt-BR')
              newEntityNames[id] = `Sessão ${date}`
            }
          }

          // Planos de mensalidade
          else if (path === 'planos') {
            const result = await supabase
              .from('subscription_plans')
              .select('name')
              .eq('id', id)
              .single()
            data = result.data
            if (data) newEntityNames[id] = data.name
          }
        } catch (err) {
          console.error(`Erro ao buscar nome para ${path}/${id}:`, err)
        }
      }

      setEntityNames(newEntityNames)
    }

    fetchEntityNames()
  }, [location.pathname])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  // Breadcrumb helper
  const getBreadcrumb = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    if (paths.length <= 1) return null

    const breadcrumbMap: Record<string, string> = {
      'app': 'Início',
      'agenda': 'Agenda',
      'pacientes': 'Pacientes',
      'profissionais': 'Profissionais',
      'procedimentos': 'Procedimentos',
      'estoque': 'Estoque',
      'vendas': 'Vendas',
      'despesas': 'Despesas',
      'caixa': 'Controle de Caixa',
      'sessao': 'Sessão de Caixa',
      'financeiro': 'Relatório Financeiro',
      'mensalidades': 'Mensalidades',
      'funcionarios': 'Funcionários',
      'notificacoes': 'Notificações',
      'configuracoes': 'Configurações',
      'whatsapp': 'WhatsApp',
      'prontuario': 'Prontuário',
      'anamnese': 'Anamnese',
      'evolucao': 'Evolução',
      'fotos': 'Fotos',
      'upload': 'Upload',
      'nova': 'Novo',
      'novo': 'Novo',
      'editar': 'Editar',
      'consentimento': 'Consentimento',
      'historico': 'Histórico',
      'planos': 'Planos',
      'assinantes': 'Assinantes',
      'relatorios': 'Relatórios',
      'profissionais-lista': 'Profissionais',
    }

    return paths.map((path, index) => {
      // Verificar se é um UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      let displayName = breadcrumbMap[path] || path

      // Se for um UUID e tivermos o nome da entidade, usar o nome
      if (uuidRegex.test(path) && entityNames[path]) {
        displayName = entityNames[path]
      }

      return {
        name: displayName,
        path: '/' + paths.slice(0, index + 1).join('/'),
        isLast: index === paths.length - 1
      }
    })
  }

  const breadcrumbs = getBreadcrumb()

  // Determinar se o sidebar está expandido (mobile OU desktop hover)
  const isExpanded = sidebarOpen || sidebarHovered

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`fixed lg:sticky top-0 left-0 h-screen bg-gray-800 border-r border-gray-700 transition-all duration-500 ease-in-out z-50 ${sidebarOpen ? 'w-64' : 'w-0'} lg:w-20 ${sidebarHovered ? 'lg:w-64 lg:shadow-2xl' : ''} overflow-y-auto overflow-x-hidden sidebar-scroll`}
      >
        <div className="flex flex-col min-h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
            <NavLink to="/app" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <h1 className={`font-bold text-white text-lg whitespace-nowrap transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Agenda+ HOF</h1>
            </NavLink>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-400 hover:text-white flex-shrink-0">
              <X size={20} />
            </button>
          </div>

          {/* Professional Selector */}
          {isExpanded && (
            <div className="p-4 border-b border-gray-700">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Profissional Ativo
                </label>
                <div className="relative">
                  <select
                    value={selectedProfessional}
                    onChange={(e) => setSelectedProfessional(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none"
                  >
                    <option value="">Todos os Profissionais</option>
                    {professionals.map(prof => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name} - {prof.specialty}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {selectedProfessional && (
                  <div className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/30">
                    Agenda filtrada por profissional
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1">
            {/* Seção de Agendamento */}
            {isExpanded && <div className="pt-4 pb-2 px-4 transition-all duration-300"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agendamento</p></div>}
            <NavLink to="/app/agenda" end className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Agenda">
              <Calendar size={22} className="flex-shrink-0"/>
              <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Agenda</span>
            </NavLink>
            <NavLink to="/app/agenda/nova" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Novo Agendamento">
              <PlusCircle size={22} className="flex-shrink-0"/>
              <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Novo Agendamento</span>
            </NavLink>

            {/* Seção de Cadastros */}
            {isExpanded && <div className="pt-4 pb-2 px-4 transition-all duration-300"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cadastros</p></div>}
            <NavLink to="/app/pacientes" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Pacientes">
              <Users size={22} className="flex-shrink-0"/>
              <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Pacientes</span>
            </NavLink>
            <NavLink to="/app/profissionais" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Profissionais">
              <Stethoscope size={22} className="flex-shrink-0"/>
              <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Profissionais</span>
            </NavLink>
            <NavLink to="/app/procedimentos" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Procedimentos">
              <Scissors size={22} className="flex-shrink-0"/>
              <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Procedimentos</span>
            </NavLink>

            {/* Seção de Estoque e Vendas */}
            {isExpanded && <div className="pt-4 pb-2 px-4 transition-all duration-300"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estoque & Vendas</p></div>}
            <NavLink to="/app/estoque" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Estoque">
              <Package size={22} className="flex-shrink-0"/>
              <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Estoque</span>
            </NavLink>
            <NavLink to="/app/vendas" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Venda de Produtos">
              <ShoppingCart size={22} className="flex-shrink-0"/>
              <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Venda de Produtos</span>
            </NavLink>
            <NavLink to="/app/despesas" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Despesas">
              <Receipt size={22} className="flex-shrink-0"/>
              <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Despesas</span>
            </NavLink>
            <NavLink to="/app/caixa" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Controle de Caixa">
              <Wallet size={22} className="flex-shrink-0"/>
              <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Controle de Caixa</span>
            </NavLink>

            {/* Seção Financeiro e Gestão - só para owner */}
            {currentProfile?.role === 'owner' && (
              <>
                {isExpanded && <div className="pt-4 pb-2 px-4 transition-all duration-300"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financeiro & Gestão</p></div>}
                <NavLink to="/app/financeiro" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Relatório Financeiro">
                  <TrendingUp size={22} className="flex-shrink-0"/>
                  <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Relatório Financeiro</span>
                </NavLink>
                <NavLink to="/app/mensalidades" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Mensalidades">
                  <CreditCard size={22} className="flex-shrink-0"/>
                  <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Mensalidades</span>
                </NavLink>
                <NavLink to="/app/funcionarios" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Funcionários">
                  <UserCog size={22} className="flex-shrink-0"/>
                  <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Funcionários</span>
                </NavLink>
                <NavLink to="/app/configuracoes/whatsapp" className={({isActive})=>`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30':'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="WhatsApp">
                  <MessageSquare size={22} className="flex-shrink-0"/>
                  <span className={`font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>WhatsApp</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            {isExpanded && (
              <p className="text-xs text-gray-500 text-center">© 2025 Agenda+ HOF</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
              <h1 className="font-bold text-white">Agenda+ HOF</h1>
            </div>
          </div>
          <NotificationBell />
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-gray-800 border-b border-gray-700 px-6 items-center justify-between sticky top-0 z-30">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1">
            {breadcrumbs && (
              <nav className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-gray-600">/</span>}
                    {crumb.isLast ? (
                      <span className="text-white font-medium">{crumb.name}</span>
                    ) : (
                      <button
                        onClick={() => navigate(crumb.path)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {crumb.name}
                      </button>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
              <div className="text-right">
                <p className="text-sm text-white font-medium">{currentProfile?.displayName || user?.email}</p>
                <p className="text-xs text-gray-400">
                  {currentProfile?.role === 'owner' ? 'Administrador' : 'Funcionário'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Toast Notification */}
      {isVisible && (
        <Toast message={message} type={type} onClose={hide} />
      )}
    </div>
  )
}
