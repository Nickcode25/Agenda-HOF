import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { CalendarDays, Users, Menu, X, Sparkles, Boxes, ShoppingBag, ChevronDown, Wallet, LogOut, UsersRound, BarChart3, CircleDollarSign, GraduationCap, BookMarked, BadgeCheck, UserCircle, CreditCard, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useProfessionals } from '@/store/professionals'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import { useCalendarContext } from '@/contexts/CalendarContext'
import { useAuth } from '@/store/auth'
import { useUserProfile } from '@/store/userProfile'
import Toast from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import TrialBanner from '@/components/TrialBanner'
import { useSubscription, Feature } from '@/components/SubscriptionProtectedRoute'
import { CalendarControls } from '@/components/NewCalendar'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile sidebar
  const [sidebarHovered, setSidebarHovered] = useState(false) // Desktop hover
  const [sidebarPinned, setSidebarPinned] = useState(false) // Desktop pinned (clicado)
  const [entityNames, setEntityNames] = useState<Record<string, string>>({})
  const entityNamesCache = useRef<Record<string, string>>({}) // Cache persistente
  const sidebarRef = useRef<HTMLElement>(null) // Ref para o sidebar
  const { professionals } = useProfessionals()
  const { selectedProfessional, setSelectedProfessional } = useProfessionalContext()
  const { signOut, user } = useAuth()
  const { currentProfile, fetchCurrentProfile } = useUserProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const { message, type, isVisible, hide } = useToast()
  const { hasActiveSubscription, hasPaidSubscription, hasFeature } = useSubscription()
  const {
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    goToToday,
    appointmentsToday,
    isCalendarPage
  } = useCalendarContext()


  useEffect(() => {
    if (user) {
      fetchCurrentProfile()
    }
  }, [user, fetchCurrentProfile])

  // Listener global de mousemove para garantir que o hover do sidebar seja resetado
  // Isso resolve o problema quando eventos de drag no calendário "travam" o estado do hover
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current || sidebarPinned) return

      const sidebarRect = sidebarRef.current.getBoundingClientRect()
      const isOverSidebar = e.clientX >= sidebarRect.left &&
                            e.clientX <= sidebarRect.right &&
                            e.clientY >= sidebarRect.top &&
                            e.clientY <= sidebarRect.bottom

      // Se o hover está ativo mas o mouse não está sobre o sidebar, resetar
      if (sidebarHovered && !isOverSidebar) {
        setSidebarHovered(false)
      }
    }

    // Adicionar listener com throttle para performance
    let throttleTimer: ReturnType<typeof setTimeout> | null = null
    const throttledHandler = (e: MouseEvent) => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          handleGlobalMouseMove(e)
          throttleTimer = null
        }, 100)
      }
    }

    document.addEventListener('mousemove', throttledHandler)
    return () => {
      document.removeEventListener('mousemove', throttledHandler)
      if (throttleTimer) clearTimeout(throttleTimer)
    }
  }, [sidebarHovered, sidebarPinned])

  // Função para extrair primeiro e último nome
  const getFirstAndLastName = (fullName: string): string => {
    const names = fullName.trim().split(/\s+/)
    if (names.length === 1) return names[0]
    return `${names[0]} ${names[names.length - 1]}`
  }

  // Nome de exibição no header: username > primeiro+último nome > displayName > email
  const displayNameForHeader = useMemo(() => {
    if (currentProfile?.username) return currentProfile.username
    if (currentProfile?.socialName) return getFirstAndLastName(currentProfile.socialName)
    if (currentProfile?.displayName) return currentProfile.displayName
    return user?.email || ''
  }, [currentProfile, user])

  // Buscar nomes de entidades (pacientes, procedimentos, profissionais, etc) para breadcrumbs
  useEffect(() => {
    const fetchEntityNames = async () => {
      const paths = location.pathname.split('/').filter(Boolean)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const newEntityNames: Record<string, string> = {}
      const idsToFetch: Array<{ id: string; path: string; table: string; column: string }> = []

      // Identificar contexto e UUIDs - verificar cache primeiro
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i]
        const nextPath = paths[i + 1]

        if (!nextPath || !uuidRegex.test(nextPath)) continue

        const id = nextPath

        // Se já está no cache, usar o cache
        if (entityNamesCache.current[id]) {
          newEntityNames[id] = entityNamesCache.current[id]
          continue
        }

        // Definir qual tabela buscar
        if (path === 'pacientes') {
          idsToFetch.push({ id, path, table: 'patients', column: 'name' })
        } else if (path === 'alunos') {
          idsToFetch.push({ id, path, table: 'students', column: 'name' })
        } else if (path === 'procedimentos') {
          idsToFetch.push({ id, path, table: 'procedures', column: 'name' })
        } else if (path === 'profissionais' && !paths.includes('vendas')) {
          idsToFetch.push({ id, path, table: 'professionals', column: 'name' })
        } else if (path === 'editar' && paths.includes('vendas') && paths.includes('profissionais')) {
          idsToFetch.push({ id, path, table: 'sales_professionals', column: 'name' })
        } else if (path === 'planos') {
          idsToFetch.push({ id, path, table: 'user_monthly_plans', column: 'name' })
        } else if (path === 'cursos') {
          idsToFetch.push({ id, path, table: 'courses', column: 'name' })
        }
      }

      // Buscar apenas os que não estão em cache (em paralelo)
      if (idsToFetch.length > 0) {
        const results = await Promise.allSettled(
          idsToFetch.map(async ({ id, table, column }) => {
            const { data } = await supabase
              .from(table)
              .select(column)
              .eq('id', id)
              .single()
            return { id, name: (data as Record<string, string> | null)?.[column] }
          })
        )

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.name) {
            newEntityNames[result.value.id] = result.value.name
            entityNamesCache.current[result.value.id] = result.value.name // Atualizar cache
          }
        })
      }

      setEntityNames(prev => ({ ...prev, ...newEntityNames }))
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
      'alunos': 'Alunos',
      'cursos': 'Cursos',
      'profissionais': 'Profissionais',
      'procedimentos': 'Procedimentos',
      'categorias': 'Categorias',
      'estoque': 'Estoque',
      'vendas': 'Vendas',
      'despesas': 'Despesas',
      'financeiro': 'Relatório Financeiro',
      'mensalidades': 'Planos',
      'funcionarios': 'Funcionários',
      'notificacoes': 'Notificações',
      'configuracoes': 'Configurações',
      'whatsapp': 'WhatsApp',
      'evolucao': 'Evolução',
      'fotos': 'Fotos',
      'upload': 'Upload',
      'nova': 'Novo',
      'novo': 'Novo',
      'editar': 'Editar',
      'historico': 'Histórico',
      'planos': 'Planos',
      'assinantes': 'Assinantes',
      'relatorios': 'Relatórios',
      'profissionais-lista': 'Profissionais',
      'perfil': 'Meu Perfil',
      'meu-plano': 'Minha Assinatura',
    }

    // Filtrar paths para evitar duplicação no breadcrumb (ex: mensalidades/planos -> apenas Planos)
    const filteredPaths = paths.filter((path, index) => {
      // Se for 'mensalidades' e o próximo for 'planos', omitir 'mensalidades'
      if (path === 'mensalidades' && paths[index + 1] === 'planos') {
        return false
      }
      return true
    })

    return filteredPaths.map((path, index) => {
      // Verificar se é um UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      let displayName = breadcrumbMap[path] || path

      // Se for um UUID e tivermos o nome da entidade, usar o nome
      if (uuidRegex.test(path) && entityNames[path]) {
        displayName = entityNames[path]
      }

      // Reconstruir o path original para navegação
      const originalIndex = paths.indexOf(path)
      return {
        name: displayName,
        path: '/' + paths.slice(0, originalIndex + 1).join('/'),
        isLast: index === filteredPaths.length - 1
      }
    })
  }

  const breadcrumbs = getBreadcrumb()

  // Determinar se o sidebar está expandido (mobile OU desktop hover OU pinned)
  const isExpanded = sidebarOpen || sidebarHovered || sidebarPinned

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-white to-gray-50/80 border-r border-gray-100 transition-all duration-300 ease-in-out z-50 ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-20'} ${sidebarPinned ? 'lg:!w-64 shadow-xl shadow-gray-200/50' : ''} ${sidebarHovered && !sidebarPinned ? 'lg:!w-64 shadow-2xl shadow-gray-300/50' : ''} overflow-y-auto overflow-x-hidden`}
      >
        <div className="flex flex-col min-h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
            {isExpanded ? (
              // Quando expandido: mostra logo + nome + botão de pin
              <>
                <NavLink to="/app" className="flex items-center gap-3 hover:opacity-90 transition-all duration-300">
                  <img src="/logo-agenda-hof.png" alt="Agenda HOF" className="w-9 h-9 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                  <h1 className="font-semibold text-lg whitespace-nowrap"><span className="text-gray-800">Agenda</span> <span className="text-orange-500">HOF</span></h1>
                </NavLink>
                {/* Mobile close button */}
                <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors">
                  <X size={20} />
                </button>
                {/* Desktop pin/unpin button */}
                <button
                  type="button"
                  onClick={() => setSidebarPinned(!sidebarPinned)}
                  className="hidden lg:flex text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                  title={sidebarPinned ? 'Recolher menu' : 'Fixar menu'}
                >
                  {sidebarPinned ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                </button>
              </>
            ) : (
              // Quando recolhido: mostra botão para expandir centralizado
              <button
                type="button"
                onClick={() => setSidebarPinned(true)}
                className="hidden lg:flex w-full justify-center text-gray-500 hover:text-orange-500 transition-colors p-2 rounded-lg hover:bg-orange-50"
                title="Expandir menu"
              >
                <Menu size={22} />
              </button>
            )}
          </div>

          {/* Professional Selector - apenas para Pro e Premium */}
          {isExpanded && hasFeature('professionals') && (
            <div className="p-4 border-b border-gray-100">
              <div className="space-y-2">
                <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  Profissional Ativo
                </label>
                <div className="relative">
                  <select
                    value={selectedProfessional}
                    onChange={(e) => setSelectedProfessional(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 focus:bg-white transition-all appearance-none"
                  >
                    <option value="">Todos os Profissionais</option>
                    {professionals.map(prof => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name} - {prof.specialty}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {selectedProfessional && (
                  <div className="text-[10px] text-orange-500 bg-orange-50/80 px-2.5 py-1.5 rounded-lg border border-orange-100">
                    Agenda filtrada por profissional
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2.5 space-y-1">
            {/* Seção 1: Gestão de Atendimento */}
            {isExpanded && (
              <div className="pt-2 pb-2 px-3">
                <p className="text-[10px] font-medium text-gray-400/80 uppercase tracking-widest">Atendimento</p>
              </div>
            )}
            <NavLink to="/app/agenda" end className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Agenda">
              {({isActive}) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                  <CalendarDays size={20} className="flex-shrink-0"/>
                  <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Agenda</span>
                </>
              )}
            </NavLink>
            {hasFeature('patients') && (
              <NavLink to="/app/pacientes" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Pacientes">
                {({isActive}) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                    <Users size={20} className="flex-shrink-0"/>
                    <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Pacientes</span>
                  </>
                )}
              </NavLink>
            )}
            {hasFeature('professionals') && (
              <NavLink to="/app/profissionais" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Profissionais">
                {({isActive}) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                    <BadgeCheck size={20} className="flex-shrink-0"/>
                    <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Profissionais</span>
                  </>
                )}
              </NavLink>
            )}
            {hasFeature('procedures') && (
              <NavLink to="/app/procedimentos" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Procedimentos">
                {({isActive}) => (
                  <>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                    <Sparkles size={20} className="flex-shrink-0"/>
                    <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Procedimentos</span>
                  </>
                )}
              </NavLink>
            )}

            {/* Seção 2: Financeiro - só para owner e planos que tem acesso */}
            {currentProfile?.role === 'owner' && (hasFeature('sales') || hasFeature('expenses') || hasFeature('financial')) && (
              <>
                {isExpanded && (
                  <div className="pt-6 pb-2 px-3">
                    <p className="text-[10px] font-medium text-gray-400/80 uppercase tracking-widest">Financeiro</p>
                  </div>
                )}
                {hasFeature('sales') && (
                  <NavLink to="/app/vendas" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Vendas">
                    {({isActive}) => (
                      <>
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                        <ShoppingBag size={20} className="flex-shrink-0"/>
                        <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Vendas</span>
                      </>
                    )}
                  </NavLink>
                )}
                {hasFeature('expenses') && (
                  <NavLink to="/app/despesas" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Despesas">
                    {({isActive}) => (
                      <>
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                        <CircleDollarSign size={20} className="flex-shrink-0"/>
                        <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Despesas</span>
                      </>
                    )}
                  </NavLink>
                )}
                {hasFeature('financial') && (
                  <NavLink to="/app/financeiro" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Relatórios">
                    {({isActive}) => (
                      <>
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                        <BarChart3 size={20} className="flex-shrink-0"/>
                        <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Relatórios</span>
                      </>
                    )}
                  </NavLink>
                )}
                <NavLink to="/app/mensalidades/planos" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Planos">
                  {({isActive}) => (
                    <>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                      <Wallet size={20} className="flex-shrink-0"/>
                      <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Planos</span>
                    </>
                  )}
                </NavLink>
              </>
            )}

            {/* Seção 3: Administração Interna - só para owner e planos que tem acesso */}
            {currentProfile?.role === 'owner' && hasFeature('stock') && (
              <>
                {isExpanded && (
                  <div className="pt-6 pb-2 px-3">
                    <p className="text-[10px] font-medium text-gray-400/80 uppercase tracking-widest">Administração</p>
                  </div>
                )}
                <NavLink to="/app/estoque" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Estoque">
                  {({isActive}) => (
                    <>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                      <Boxes size={20} className="flex-shrink-0"/>
                      <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Estoque</span>
                    </>
                  )}
                </NavLink>
                <NavLink to="/app/funcionarios" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Funcionários">
                  {({isActive}) => (
                    <>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                      <UsersRound size={20} className="flex-shrink-0"/>
                      <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Funcionários</span>
                    </>
                  )}
                </NavLink>
              </>
            )}

            {/* Seção 4: Educação & Treinamentos - apenas para Premium (última seção) */}
            {(hasFeature('students') || hasFeature('courses')) && (
              <>
                {isExpanded && (
                  <div className="pt-6 pb-2 px-3">
                    <p className="text-[10px] font-medium text-gray-400/80 uppercase tracking-widest">Educação</p>
                  </div>
                )}
                {hasFeature('students') && (
                  <NavLink to="/app/alunos" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Alunos">
                    {({isActive}) => (
                      <>
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                        <GraduationCap size={20} className="flex-shrink-0"/>
                        <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Alunos</span>
                      </>
                    )}
                  </NavLink>
                )}
                {hasFeature('courses') && (
                  <NavLink to="/app/cursos" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Cursos">
                    {({isActive}) => (
                      <>
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                        <BookMarked size={20} className="flex-shrink-0"/>
                        <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Cursos</span>
                      </>
                    )}
                  </NavLink>
                )}
              </>
            )}

            {/* Seção 5: Configuração */}
            {isExpanded && (
              <div className="pt-6 pb-2 px-3">
                <p className="text-[10px] font-medium text-gray-400/80 uppercase tracking-widest">Configuração</p>
              </div>
            )}
            <NavLink to="/app/perfil" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Meu Perfil">
              {({isActive}) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                  <UserCircle size={20} className="flex-shrink-0"/>
                  <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Meu Perfil</span>
                </>
              )}
            </NavLink>
            <NavLink to="/app/meu-plano" className={({isActive})=>`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 relative ${isActive ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`} title="Minha Assinatura">
              {({isActive}) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-600 rounded-r-full" />}
                  <CreditCard size={20} className="flex-shrink-0"/>
                  <span className={`text-sm font-medium whitespace-nowrap transition-all duration-500 overflow-hidden ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}`}>Minha Assinatura</span>
                </>
              )}
            </NavLink>
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100">
            {isExpanded && (
              <p className="text-[10px] text-gray-400 text-center">© 2025 Agenda HOF</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-20">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-900">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="font-bold"><span className="text-gray-900">Agenda</span> <span className="text-orange-500">HOF</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 px-6 items-center justify-between sticky top-0 z-30 shadow-sm">
          {/* Left side: Calendar Controls ou Breadcrumbs */}
          <div className="flex items-center gap-4 flex-1">
            {isCalendarPage ? (
              // Controles do calendário quando na página da agenda
              <CalendarControls
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onToday={goToToday}
                appointmentsToday={appointmentsToday}
                compact={true}
              />
            ) : (
              // Breadcrumbs nas outras páginas
              breadcrumbs && (
                <nav className="flex items-center gap-2 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {index > 0 && <span className="text-gray-400">/</span>}
                      {crumb.isLast ? (
                        <span className="text-gray-900 font-medium">{crumb.name}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(crumb.path)}
                          className="text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          {crumb.name}
                        </button>
                      )}
                    </div>
                  ))}
                </nav>
              )
            )}
          </div>

          {/* Right side: User Menu (sempre visível) */}
          <div className="flex items-center gap-4 ml-6 pl-6 border-l border-gray-200">
            <div>
              <p className="text-sm text-gray-900 font-medium">{displayNameForHeader}</p>
              <p className="text-xs text-gray-500">
                {currentProfile?.role === 'owner' ? 'Administrador' : 'Funcionário'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <TrialBanner />
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Overlay for desktop sidebar hover (subtle) */}
      {(sidebarHovered || sidebarPinned) && !sidebarOpen && (
        <div
          className="hidden lg:block fixed inset-0 bg-black/5 z-40 transition-opacity duration-300"
          onClick={() => {
            setSidebarHovered(false)
            setSidebarPinned(false)
          }}
        />
      )}

      {/* Toast Notification */}
      {isVisible && (
        <Toast message={message} type={type} onClose={hide} />
      )}
    </div>
  )
}
