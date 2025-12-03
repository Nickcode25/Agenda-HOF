import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Phone, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/auth'
import AdminSidebar from './components/AdminSidebar'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'

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

export default function UsersPage() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'expired' | 'none'>('all')
  const navigate = useNavigate()
  const { signOut } = useAuth()

  useEffect(() => {
    loadClinics()
  }, [])

  const loadClinics = async () => {
    try {
      // Usar get_all_users para obter todos os usuários
      const { data: allUsers, error: usersError } = await supabase.rpc('get_all_users')

      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError)
        return
      }

      // Buscar assinaturas para saber status
      const { data: subscriptions, error: subsError } = await supabase.rpc('get_all_subscriptions')

      if (subsError) {
        console.error('Erro ao buscar assinaturas:', subsError)
      }

      // Criar mapa de assinaturas por user_id
      const subscriptionMap = new Map<string, any>()
      subscriptions?.forEach((sub: any) => {
        if (!subscriptionMap.has(sub.user_id) || sub.status === 'active') {
          subscriptionMap.set(sub.user_id, sub)
        }
      })

      const clinicsData: Clinic[] = (allUsers || []).map((user: any) => {
        const subscription = subscriptionMap.get(user.user_id)
        const hasActiveSubscription = subscription?.status === 'active'
        const isCourtesy = subscription?.discount_percentage === 100

        return {
          id: user.user_id,
          owner_email: user.owner_email || 'Email não disponível',
          owner_name: user.owner_name || 'Nome não disponível',
          owner_phone: user.owner_phone || null,
          created_at: user.user_created_at,
          users_count: 0,
          patients_count: 0,
          appointments_count: 0,
          sales_count: 0,
          total_revenue: subscription ? parseFloat(subscription.plan_amount || 0) * (1 - (subscription.discount_percentage || 0) / 100) : 0,
          subscription_status: hasActiveSubscription ? 'active' : 'none',
          trial_end_date: subscription?.trial_end_date || null,
          trial_days_remaining: 0,
          has_active_subscription: hasActiveSubscription,
          last_login: user.last_login,
          isCourtesy
        }
      })

      setClinics(clinicsData)
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch =
      containsIgnoringAccents(clinic.owner_name, searchQuery) ||
      containsIgnoringAccents(clinic.owner_email, searchQuery)

    const matchesStatus =
      statusFilter === 'all' || clinic.subscription_status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        activeView="clinics"
        onViewChange={(view) => navigate(`/admin/${view === 'overview' ? 'dashboard' : view === 'clinics' ? 'users' : view}`)}
        onLogout={handleLogout}
      />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Usuários</h1>
            <p className="text-gray-500">{filteredClinics.length} usuários registrados</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="trial">Em Trial</option>
              <option value="expired">Expirados</option>
              <option value="none">Sem plano</option>
            </select>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Owner</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Telefone</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Último Login</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Receita</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{clinic.owner_name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{clinic.owner_email}</td>
                    <td className="px-6 py-4">
                      {clinic.owner_phone ? (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4" />
                          {clinic.owner_phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        clinic.has_active_subscription
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        <Activity className="w-3 h-3" />
                        {clinic.has_active_subscription ? 'Ativo' : 'Sem plano'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {clinic.last_login
                        ? formatDateTimeBRSafe(clinic.last_login)
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      R$ {clinic.total_revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 text-sm">
                      {formatDateTimeBRSafe(clinic.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredClinics.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
