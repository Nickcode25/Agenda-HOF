import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, Clock, XCircle, AlertTriangle, Search, Filter,
  Phone, Activity, X, Users, DollarSign, Gift, Package
} from 'lucide-react'
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/auth'
import CouponManager from '@/components/admin/CouponManager'
import PlansManager from '@/components/admin/PlansManager'
import ActiveSubscriptions from '@/components/admin/ActiveSubscriptions'
import PaymentsManager from '@/components/admin/PaymentsManager'
import CourtesyManager from '@/components/admin/CourtesyManager'
import AdminSidebar from './components/AdminSidebar'
import AdminStatsGrid from './components/AdminStatsGrid'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'
import { formatInSaoPaulo } from '@/utils/timezone'
import PageLoading from '@/components/ui/PageLoading'

interface Stats {
  totalClinics: number
  totalUsers: number
  totalRevenue: number
  activeSubscriptions: number
  totalAppointments: number
  totalSales: number
  clinicsInTrial: number
  clinicsExpired: number
  clinicsWithoutPlan: number
  totalCourtesies: number
}

interface Clinic {
  id: string
  owner_email: string
  owner_name: string
  owner_phone: string | null
  created_at: string
  users_count: number
  patients_count: number
  appointments_count: number
  sales_count: number
  total_revenue: number
  subscription_status: 'active' | 'trial' | 'expired' | 'none'
  trial_end_date: string | null
  trial_days_remaining: number
  has_active_subscription: boolean
  last_login: string | null
}

type Period = 'day' | 'week' | 'month' | 'year'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'clinics' | 'plans' | 'subscriptions' | 'payments' | 'coupons' | 'courtesy'>('overview')
  const [period, setPeriod] = useState<Period>('month')
  const [stats, setStats] = useState<Stats>({
    totalClinics: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalAppointments: 0,
    totalSales: 0,
    clinicsInTrial: 0,
    clinicsExpired: 0,
    clinicsWithoutPlan: 0,
    totalCourtesies: 0
  })
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'expired' | 'none'>('all')
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean
    type: string
    title: string
    data: any[]
  }>({ isOpen: false, type: '', title: '', data: [] })
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([])

  useEffect(() => {
    checkAdminAndLoadData()
  }, [])

  // Filtrar clínicas
  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch =
      containsIgnoringAccents(clinic.owner_name, searchQuery) ||
      containsIgnoringAccents(clinic.owner_email, searchQuery)

    const matchesStatus = statusFilter === 'all' || clinic.subscription_status === statusFilter

    return matchesSearch && matchesStatus
  })

  const checkAdminAndLoadData = async () => {
    try {
      const { data: isAdmin, error: checkError } = await supabase
        .rpc('is_super_admin')

      if (checkError || !isAdmin) {
        console.error('Não é super admin:', checkError)
        navigate('/admin/login')
        return
      }

      setIsSuperAdmin(true)
      await loadClinics()
      await loadStats()
    } catch (err) {
      console.error('Erro ao verificar admin:', err)
      navigate('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Buscar TODOS os usuários usando a função RPC
      const { data: allUsers, error: usersError } = await supabase.rpc('get_all_users')

      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError)
        return
      }

      console.log('📊 Total de usuários:', allUsers?.length || 0)
      const totalUsers = allUsers?.length || 0
      setAllUsers(allUsers || [])

      // Buscar todas as assinaturas
      const { data: subscriptionsData, error: subsError } = await supabase.rpc('get_all_subscriptions')

      if (subsError) {
        console.error('Erro ao buscar assinaturas:', subsError)
        return
      }

      console.log('📊 Assinaturas encontradas:', subscriptionsData)
      setAllSubscriptions(subscriptionsData || [])

      // Assinaturas ativas (não cortesias - discount_percentage < 100)
      const activeSubscriptions = subscriptionsData?.filter((sub: any) =>
        sub.status === 'active' && sub.discount_percentage < 100
      ) || []

      // Cortesias ativas (discount_percentage = 100)
      const activeCourtesies = subscriptionsData?.filter((sub: any) =>
        sub.status === 'active' && sub.discount_percentage === 100
      ) || []

      console.log('🎁 Cortesias ativas:', activeCourtesies.length)

      // Calcular receita de assinaturas ATIVAS (considerando descontos)
      console.log('💰 Calculando receita...')
      const subscriptionsRevenue = activeSubscriptions.reduce((sum: number, sub: any) => {
        const planAmount = parseFloat(sub.plan_amount) || 0
        const discountPercentage = sub.discount_percentage || 0
        const realAmount = planAmount * (1 - discountPercentage / 100)
        return sum + realAmount
      }, 0)

      console.log(`💰 Receita total: R$ ${subscriptionsRevenue.toFixed(2)}`)

      // Usuários sem plano (nunca assinaram)
      const usersWithSubscription = new Set(subscriptionsData?.map((sub: any) => sub.user_id) || [])
      const usersWithoutPlan = totalUsers - usersWithSubscription.size

      // Cancelados/Expirados
      const cancelledSubscriptions = subscriptionsData?.filter((sub: any) =>
        sub.status === 'cancelled' || sub.status === 'payment_failed'
      ) || []

      setStats(prev => ({
        ...prev,
        totalClinics: totalUsers,
        totalUsers: totalUsers,
        totalRevenue: subscriptionsRevenue,
        activeSubscriptions: activeSubscriptions.length,
        totalAppointments: 0,
        totalSales: 0,
        clinicsInTrial: 0,
        clinicsExpired: cancelledSubscriptions.length,
        clinicsWithoutPlan: usersWithoutPlan,
        totalCourtesies: activeCourtesies.length
      }))
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }

  const loadClinics = async () => {
    try {
      // Buscar assinaturas usando a view que já tem dados de usuários
      const { data: subscriptions, error: viewError } = await supabase
        .from('subscribers_view')
        .select('*')
        .order('subscription_created_at', { ascending: false })

      if (viewError) {
        console.error('❌ Erro ao buscar subscribers_view:', viewError)
        return
      }

      console.log('📋 Assinaturas na view:', subscriptions)

      if (!subscriptions) return

      // Agrupar por user_id para obter clínicas únicas
      const clinicsMap = new Map<string, typeof subscriptions[0]>()
      subscriptions.forEach(sub => {
        if (!clinicsMap.has(sub.user_id)) {
          clinicsMap.set(sub.user_id, sub)
        }
      })

      const clinicsData: Clinic[] = await Promise.all(
        Array.from(clinicsMap.values()).map(async (subscription) => {
          const userId = subscription.user_id
          const ownerEmail = subscription.email || 'Email não disponível'
          const ownerName = subscription.full_name || 'Nome não disponível'
          const ownerPhone = subscription.phone || null
          const lastLogin = subscription.last_login
          const userCreatedAt = subscription.user_created_at || subscription.subscription_created_at
          const trialEndDate = null

          let trialDaysRemaining = 0
          let isInTrial = false
          if (trialEndDate) {
            const trialEnd = new Date(trialEndDate)
            const now = new Date()
            if (now <= trialEnd) {
              trialDaysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              isInTrial = true
            }
          }

          // Determinar status baseado nos dados da assinatura
          const hasActiveSubscription = subscription.status === 'active'

          let subscriptionStatus: 'active' | 'trial' | 'expired' | 'none' = 'none'
          if (subscription.status === 'active') {
            subscriptionStatus = 'active'
          } else if (subscription.status === 'payment_failed') {
            subscriptionStatus = 'expired'
          } else if (isInTrial) {
            subscriptionStatus = 'trial'
          } else if (trialEndDate) {
            subscriptionStatus = 'expired'
          }

          // Dados de clínicas não acessíveis sem permissão RLS adequada
          const usersCount = 0
          const patientsCount = 0
          const appointmentsCount = 0
          // Calcular receita considerando desconto
          const planAmount = parseFloat(subscription.plan_amount) || 0
          const discountPercentage = subscription.discount_percentage || 0
          const totalRevenue = planAmount * (1 - discountPercentage / 100)
          const salesCount = 0

          return {
            id: userId,
            owner_email: ownerEmail,
            owner_name: ownerName,
            owner_phone: ownerPhone,
            created_at: userCreatedAt,
            users_count: usersCount || 0,
            patients_count: patientsCount || 0,
            appointments_count: appointmentsCount || 0,
            sales_count: salesCount,
            total_revenue: totalRevenue,
            subscription_status: subscriptionStatus,
            trial_end_date: trialEndDate,
            trial_days_remaining: trialDaysRemaining,
            has_active_subscription: hasActiveSubscription,
            last_login: lastLogin
          }
        })
      )

      setClinics(clinicsData)

      const clinicsInTrial = clinicsData.filter(c => c.subscription_status === 'trial').length
      const clinicsExpired = clinicsData.filter(c => c.subscription_status === 'expired').length
      const clinicsWithoutPlan = clinicsData.filter(c => c.subscription_status === 'none').length
      const activeSubscriptions = clinicsData.filter(c => c.subscription_status === 'active').length

      setStats(prev => ({
        ...prev,
        clinicsInTrial,
        clinicsExpired,
        clinicsWithoutPlan,
        activeSubscriptions
      }))
    } catch (err) {
      console.error('Erro ao carregar clínicas:', err)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const getStatusBadge = (status: 'active' | 'trial' | 'expired' | 'none') => {
    const badges = {
      active: {
        icon: CheckCircle,
        text: 'Ativo',
        class: 'bg-green-100 text-green-700 border-green-200'
      },
      trial: {
        icon: Clock,
        text: 'Trial',
        class: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      expired: {
        icon: XCircle,
        text: 'Expirado',
        class: 'bg-red-100 text-red-700 border-red-200'
      },
      none: {
        icon: AlertTriangle,
        text: 'Sem plano',
        class: 'bg-gray-100 text-gray-600 border-gray-200'
      }
    }

    const badge = badges[status]
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.class}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.text}
      </span>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca'
    return formatDateTimeBRSafe(dateStr)
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca'
    return formatInSaoPaulo(dateStr, 'dd/MM/yyyy HH:mm')
  }

  // Dados para gráficos baseados no período selecionado
  const getRegistrationData = () => {
    // Agrupar clínicas por data de criação
    const grouped: Record<string, number> = {}

    clinics.forEach(clinic => {
      const date = new Date(clinic.created_at)
      let key = ''

      if (period === 'day') {
        key = date.toLocaleDateString('pt-BR')
      } else if (period === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toLocaleDateString('pt-BR')
      } else if (period === 'month') {
        key = `${date.toLocaleDateString('pt-BR', { month: 'short' })}/${date.getFullYear()}`
      } else {
        key = date.getFullYear().toString()
      }

      grouped[key] = (grouped[key] || 0) + 1
    })

    return Object.entries(grouped).map(([name, value]) => ({ name, cadastros: value })).slice(-10)
  }

  const getStatusData = () => {
    return [
      { name: 'Ativos', value: stats.activeSubscriptions, color: '#10b981' },
      { name: 'Trial', value: stats.clinicsInTrial, color: '#3b82f6' },
      { name: 'Expirados', value: stats.clinicsExpired, color: '#ef4444' },
      { name: 'Sem Plano', value: stats.clinicsWithoutPlan, color: '#6b7280' }
    ]
  }

  const getRevenueData = () => {
    // Simular dados de receita por período
    const grouped: Record<string, number> = {}

    clinics.forEach(clinic => {
      const date = new Date(clinic.created_at)
      let key = ''

      if (period === 'day') {
        key = date.toLocaleDateString('pt-BR')
      } else if (period === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toLocaleDateString('pt-BR')
      } else if (period === 'month') {
        key = `${date.toLocaleDateString('pt-BR', { month: 'short' })}/${date.getFullYear()}`
      } else {
        key = date.getFullYear().toString()
      }

      grouped[key] = (grouped[key] || 0) + clinic.total_revenue
    })

    return Object.entries(grouped).map(([name, value]) => ({ name, receita: value })).slice(-10)
  }

  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case 'users':
        navigate('/admin/users')
        break
      case 'subscriptions':
        navigate('/admin/subscriptions')
        break
      case 'courtesy':
        navigate('/admin/courtesy')
        break
      case 'revenue': {
        // Assinaturas pagas (não cortesias)
        const paidSubscriptions = allSubscriptions.filter(
          (sub: any) => sub.status === 'active' && sub.discount_percentage < 100
        )
        setDetailModal({
          isOpen: true,
          type: 'revenue',
          title: 'Receita Mensal Recorrente (MRR)',
          data: paidSubscriptions
        })
        break
      }
      case 'cancelled': {
        const cancelled = allSubscriptions.filter(
          (sub: any) => sub.status === 'cancelled' || sub.status === 'payment_failed'
        )
        setDetailModal({
          isOpen: true,
          type: 'cancelled',
          title: 'Assinaturas Canceladas',
          data: cancelled
        })
        break
      }
      case 'without_plan': {
        // Usuários que nunca tiveram assinatura
        const usersWithSubscription = new Set(allSubscriptions.map((sub: any) => sub.user_id))
        const usersWithoutPlan = allUsers.filter(
          (user: any) => !usersWithSubscription.has(user.user_id)
        )
        setDetailModal({
          isOpen: true,
          type: 'without_plan',
          title: 'Usuários Sem Plano',
          data: usersWithoutPlan
        })
        break
      }
      default:
        break
    }
  }

  const closeModal = () => {
    setDetailModal({ isOpen: false, type: '', title: '', data: [] })
  }

  const renderModalContent = () => {
    if (!detailModal.isOpen) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {detailModal.type === 'revenue' && (
                <div className="p-2 bg-green-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              )}
              {detailModal.type === 'cancelled' && (
                <div className="p-2 bg-red-100 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              )}
              {detailModal.type === 'without_plan' && (
                <div className="p-2 bg-gray-100 rounded-xl">
                  <Package className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{detailModal.title}</h2>
                <p className="text-sm text-gray-500">{detailModal.data.length} registros</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {detailModal.data.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum registro encontrado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                    {(detailModal.type === 'revenue' || detailModal.type === 'cancelled') && (
                      <>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Valor</th>
                      </>
                    )}
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.data.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="text-gray-900 font-medium">
                          {item.owner_name || 'Nome não disponível'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">{item.owner_email || item.email || '-'}</span>
                      </td>
                      {(detailModal.type === 'revenue' || detailModal.type === 'cancelled') && (
                        <>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              item.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {item.status === 'active' ? 'Ativo' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-green-600 font-medium">
                              R$ {(parseFloat(item.plan_amount || 0) * (1 - (item.discount_percentage || 0) / 100)).toFixed(2)}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 text-right text-gray-500 text-sm">
                        {formatDateTimeBRSafe(item.subscription_created_at || item.user_created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <PageLoading fullScreen message="Carregando dashboard..." />
  }

  if (!isSuperAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        activeView={activeView}
        onViewChange={(view) => {
          if (view === 'overview') {
            setActiveView(view)
          } else if (view === 'clinics') {
            navigate('/admin/users')
          } else if (view === 'plans') {
            navigate('/admin/plans')
          } else if (view === 'subscriptions') {
            navigate('/admin/subscriptions')
          } else if (view === 'payments') {
            navigate('/admin/payments')
          } else if (view === 'coupons') {
            navigate('/admin/coupons')
          } else if (view === 'courtesy') {
            navigate('/admin/courtesy')
          }
        }}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-6">
            <h2 className="text-3xl font-bold text-gray-900">
              {activeView === 'overview' && 'Dashboard Overview'}
              {activeView === 'clinics' && 'Gerenciar Usuários'}
              {activeView === 'plans' && 'Gestão de Planos'}
              {activeView === 'subscriptions' && 'Assinaturas Ativas'}
              {activeView === 'payments' && 'Pagamentos e Faturamento'}
              {activeView === 'coupons' && 'Cupons de Desconto'}
              {activeView === 'courtesy' && 'Gestão de Cortesias'}
            </h2>
            <p className="text-gray-500 mt-1">
              {activeView === 'overview' && 'Visão geral da plataforma'}
              {activeView === 'clinics' && `${filteredClinics.length} usuários registrados`}
              {activeView === 'plans' && 'Crie e gerencie planos de assinatura'}
              {activeView === 'subscriptions' && 'Acompanhe todas as assinaturas ativas'}
              {activeView === 'payments' && 'Histórico de transações e pagamentos'}
              {activeView === 'coupons' && 'Gerencie cupons para o checkout'}
              {activeView === 'courtesy' && 'Conceda acesso gratuito aos planos para usuários'}
            </p>
          </div>
        </header>

        <div className="p-8">
          {/* Overview View */}
          {activeView === 'overview' && (
            <>
              {/* Stats Cards */}
              <AdminStatsGrid stats={stats} onCardClick={handleCardClick} />

              {/* Quick Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Distribuição de Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={getStatusData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Últimas Clínicas</h3>
                  <div className="space-y-3">
                    {clinics.slice(0, 5).map(clinic => (
                      <div key={clinic.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-gray-900 font-medium">{clinic.owner_name}</p>
                          <p className="text-gray-500 text-sm">{clinic.owner_email}</p>
                        </div>
                        {getStatusBadge(clinic.subscription_status)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Clinics View */}
          {activeView === 'clinics' && (
            <>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>

                <div className="relative min-w-[200px]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all appearance-none"
                  >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="trial">Em Trial</option>
                    <option value="expired">Expirados</option>
                    <option value="none">Sem plano</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-4 px-6 text-gray-600 font-semibold">Owner</th>
                        <th className="text-left py-4 px-6 text-gray-600 font-semibold">Email</th>
                        <th className="text-left py-4 px-6 text-gray-600 font-semibold">Telefone</th>
                        <th className="text-center py-4 px-6 text-gray-600 font-semibold">Status</th>
                        <th className="text-center py-4 px-6 text-gray-600 font-semibold">Trial</th>
                        <th className="text-center py-4 px-6 text-gray-600 font-semibold">Último Login</th>
                        <th className="text-center py-4 px-6 text-gray-600 font-semibold">Pacientes</th>
                        <th className="text-center py-4 px-6 text-gray-600 font-semibold">Agendamentos</th>
                        <th className="text-right py-4 px-6 text-gray-600 font-semibold">Receita</th>
                        <th className="text-center py-4 px-6 text-gray-600 font-semibold">Cadastro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClinics.map((clinic) => (
                        <tr key={clinic.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div className="text-gray-900 font-medium">{clinic.owner_name}</div>
                          </td>
                          <td className="py-4 px-6 text-gray-600 text-sm">{clinic.owner_email}</td>
                          <td className="py-4 px-6 text-gray-600 text-sm">
                            {clinic.owner_phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-blue-500" />
                                <span>{clinic.owner_phone}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {getStatusBadge(clinic.subscription_status)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {clinic.subscription_status === 'trial' ? (
                              <span className="text-blue-600 font-semibold">
                                {clinic.trial_days_remaining} dias
                              </span>
                            ) : clinic.subscription_status === 'expired' ? (
                              <span className="text-red-600 text-sm">Expirado</span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center text-gray-500 text-sm">
                            {formatDateTime(clinic.last_login)}
                          </td>
                          <td className="py-4 px-6 text-center text-gray-900">{clinic.patients_count}</td>
                          <td className="py-4 px-6 text-center text-gray-900">{clinic.appointments_count}</td>
                          <td className="py-4 px-6 text-right text-green-600 font-semibold">
                            R$ {clinic.total_revenue.toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-center text-gray-500 text-sm">
                            {formatDate(clinic.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredClinics.length === 0 && clinics.length > 0 && (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma clínica encontrada com os filtros aplicados</p>
                  </div>
                )}

                {clinics.length === 0 && (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma clínica registrada ainda</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Plans View */}
          {activeView === 'plans' && (
            <PlansManager />
          )}

          {/* Subscriptions View */}
          {activeView === 'subscriptions' && (
            <ActiveSubscriptions />
          )}

          {/* Payments View */}
          {activeView === 'payments' && (
            <PaymentsManager />
          )}

          {/* Coupons View */}
          {activeView === 'coupons' && (
            <CouponManager />
          )}

          {/* Courtesy View */}
          {activeView === 'courtesy' && (
            <CourtesyManager />
          )}
        </div>
      </main>

      {/* Modal de Detalhes */}
      {renderModalContent()}
    </div>
  )
}
