import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Phone, Activity } from 'lucide-react'

// Ícone do WhatsApp
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../store/auth'
import AdminSidebar from './components/AdminSidebar'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'
import PageLoading from '@/components/ui/PageLoading'

// Função para formatar telefone para WhatsApp (apenas números com código do país)
const formatPhoneForWhatsApp = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '')
  // Se já tem código do país (55), usar direto. Senão, adicionar
  if (cleanPhone.startsWith('55')) {
    return cleanPhone
  }
  return `55${cleanPhone}`
}

// Função para formatar telefone para exibição
const formatPhoneDisplay = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '')
  // Remover código do país se existir
  const phoneWithoutCountry = cleanPhone.startsWith('55') ? cleanPhone.slice(2) : cleanPhone

  if (phoneWithoutCountry.length === 11) {
    return phoneWithoutCountry.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (phoneWithoutCountry.length === 10) {
    return phoneWithoutCountry.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
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
      console.log('Chamando get_all_users...')
      const { data: allUsers, error: usersError } = await supabase.rpc('get_all_users')

      console.log('Resultado get_all_users:', { allUsers, usersError })

      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError)
        console.error('Detalhes do erro:', JSON.stringify(usersError, null, 2))
        return
      }

      console.log(`Total de usuários retornados: ${allUsers?.length || 0}`)

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

        // Verificar se está em período de trial
        // Trial é calculado como 7 dias após a criação da conta
        const createdAt = new Date(user.user_created_at)
        const trialEndDate = subscription?.trial_end_date
          ? new Date(subscription.trial_end_date)
          : new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
        const now = new Date()
        const isInTrial = !hasActiveSubscription && trialEndDate > now
        const trialDaysRemaining = isInTrial
          ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0

        // Determinar status: active > trial > expired > none
        let subscriptionStatus: 'active' | 'trial' | 'expired' | 'none' = 'none'
        if (hasActiveSubscription) {
          subscriptionStatus = 'active'
        } else if (isInTrial) {
          subscriptionStatus = 'trial'
        } else if (subscription && subscription.status === 'expired') {
          subscriptionStatus = 'expired'
        }

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
          subscription_status: subscriptionStatus,
          trial_end_date: trialEndDate.toISOString(),
          trial_days_remaining: trialDaysRemaining,
          has_active_subscription: hasActiveSubscription || isInTrial,
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
    return <PageLoading fullScreen message="Carregando usuários..." />
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600 w-[180px]">Nome</th>
                    <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600 w-[220px]">Email</th>
                    <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600 w-[180px]">Telefone</th>
                    <th className="text-center px-4 py-4 text-sm font-semibold text-gray-600 w-[100px]">Status</th>
                    <th className="text-center px-4 py-4 text-sm font-semibold text-gray-600 w-[100px]">Último Login</th>
                    <th className="text-right px-4 py-4 text-sm font-semibold text-gray-600 w-[80px]">Receita</th>
                    <th className="text-right px-4 py-4 text-sm font-semibold text-gray-600 w-[100px]">Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClinics.map((clinic) => (
                    <tr key={clinic.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 truncate max-w-[180px]" title={clinic.owner_name}>
                          {clinic.owner_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 text-sm truncate max-w-[220px]" title={clinic.owner_email}>
                          {clinic.owner_email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {clinic.owner_phone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 text-sm whitespace-nowrap">
                              {formatPhoneDisplay(clinic.owner_phone)}
                            </span>
                            <a
                              href={`https://wa.me/${formatPhoneForWhatsApp(clinic.owner_phone)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <WhatsAppIcon className="w-4 h-4" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          clinic.subscription_status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : clinic.subscription_status === 'trial'
                            ? 'bg-blue-100 text-blue-700'
                            : clinic.subscription_status === 'expired'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {clinic.subscription_status === 'active' && 'Ativo'}
                          {clinic.subscription_status === 'trial' && `Trial (${clinic.trial_days_remaining}d)`}
                          {clinic.subscription_status === 'expired' && 'Expirado'}
                          {clinic.subscription_status === 'none' && 'Sem plano'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 text-sm whitespace-nowrap">
                        {clinic.last_login
                          ? new Date(clinic.last_login).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium text-sm whitespace-nowrap">
                        R$ {clinic.total_revenue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 text-sm whitespace-nowrap">
                        {new Date(clinic.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
