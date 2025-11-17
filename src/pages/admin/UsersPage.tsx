import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Phone, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/auth'
import AdminSidebar from './components/AdminSidebar'
import { containsIgnoringAccents } from '@/utils/textSearch'

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
      const { data: subscriptions, error: viewError } = await supabase
        .from('subscribers_view')
        .select('*')
        .order('subscription_created_at', { ascending: false })

      if (viewError) {
        console.error('❌ Erro ao buscar subscribers_view:', viewError)
        return
      }

      if (!subscriptions) return

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

          return {
            id: userId,
            owner_email: ownerEmail,
            owner_name: ownerName,
            owner_phone: ownerPhone,
            created_at: userCreatedAt,
            users_count: 0,
            patients_count: 0,
            appointments_count: 0,
            sales_count: 0,
            total_revenue: 0,
            subscription_status: subscription.subscription_status === 'active' ? 'active' : 'none',
            trial_end_date: subscription.trial_end_date,
            trial_days_remaining: 0,
            has_active_subscription: subscription.subscription_status === 'active',
            last_login: lastLogin
          }
        })
      )

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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <AdminSidebar
        activeView="clinics"
        onViewChange={(view) => navigate(`/admin/${view === 'overview' ? 'dashboard' : view === 'clinics' ? 'users' : view}`)}
        onLogout={handleLogout}
      />

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Usuários</h1>
            <p className="text-gray-400">{filteredClinics.length} usuários registrados</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="trial">Em Trial</option>
              <option value="expired">Expirados</option>
              <option value="none">Sem plano</option>
            </select>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/80">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Owner</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Email</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Telefone</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Trial</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Último Login</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Receita</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredClinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{clinic.owner_name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{clinic.owner_email}</td>
                    <td className="px-6 py-4">
                      {clinic.owner_phone ? (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="w-4 h-4" />
                          {clinic.owner_phone}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        clinic.has_active_subscription
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        <Activity className="w-3 h-3" />
                        {clinic.has_active_subscription ? 'Ativo' : 'Sem plano'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {clinic.trial_end_date
                        ? new Date(clinic.trial_end_date).toLocaleDateString('pt-BR')
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {clinic.last_login
                        ? new Date(clinic.last_login).toLocaleDateString('pt-BR')
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-right text-green-400 font-medium">
                      R$ {clinic.total_revenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400 text-sm">
                      {new Date(clinic.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredClinics.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
