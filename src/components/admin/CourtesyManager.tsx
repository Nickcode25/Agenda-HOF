import { useState, useEffect } from 'react'
import { Gift, Search, Check, X, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'
import { useConfirm } from '@/hooks/useConfirm'

interface User {
  id: string
  email: string
  name: string
  created_at: string
}

interface Plan {
  id: string
  name: string
  price: number
  duration_months: number
}

interface Courtesy {
  id: string
  user_id: string
  plan_id: string
  granted_at: string
  expires_at: string | null
  granted_by: string
  user_email: string
  user_name: string
  plan_name: string
}

export default function CourtesyManager() {
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [courtesies, setCourtesies] = useState<Courtesy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { confirm, ConfirmDialog } = useConfirm()
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [expirationMonths, setExpirationMonths] = useState<number>(12)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const [granting, setGranting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadUsers(), loadPlans(), loadCourtesies()])
    setLoading(false)
  }

  const loadUsers = async () => {
    try {
      const { data: allUsers, error: usersError } = await supabase.rpc('get_all_users')

      if (usersError) {
        console.error('Erro ao buscar usuários:', usersError)
        return
      }

      const usersData = (allUsers || []).map((user: any) => ({
        id: user.user_id,
        email: user.owner_email || 'Email não disponível',
        name: user.owner_name || 'Nome não disponível',
        created_at: user.user_created_at || new Date().toISOString()
      }))

      setUsers(usersData)
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    }
  }

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_plans')

      if (error) {
        console.error('Erro ao buscar planos:', error)
        return
      }

      setPlans(data || [])
    } catch (err) {
      console.error('Erro ao carregar planos:', err)
    }
  }

  const loadCourtesies = async () => {
    try {
      const { data: subscriptions, error } = await supabase.rpc('get_all_subscriptions')

      if (error) {
        console.error('Erro ao buscar cortesias:', error)
        return
      }

      const courtesiesData: Courtesy[] = (subscriptions || [])
        .filter((sub: any) => sub.discount_percentage === 100 && sub.status === 'active')
        .map((sub: any) => ({
          id: sub.subscription_id,
          user_id: sub.user_id,
          plan_id: null,
          granted_at: sub.subscription_created_at,
          expires_at: sub.trial_end_date,
          granted_by: 'admin',
          user_email: sub.owner_email || 'Email não disponível',
          user_name: sub.owner_name || 'Nome não disponível',
          plan_name: sub.plan_name || 'Cortesia'
        }))

      setCourtesies(courtesiesData)
    } catch (err) {
      console.error('Erro ao carregar cortesias:', err)
    }
  }

  const handleGrantCourtesy = async () => {
    if (!selectedUser || !selectedPlan) {
      setError('Selecione um usuário e um plano')
      return
    }

    setGranting(true)
    setError('')

    try {
      const selectedPlanData = plans.find(p => p.id === selectedPlan)
      if (!selectedPlanData) {
        setError('Plano não encontrado')
        setGranting(false)
        return
      }

      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + expirationMonths)

      const { data, error: rpcError } = await supabase.rpc('admin_grant_courtesy', {
        p_user_id: selectedUser,
        p_plan_id: selectedPlan,
        p_plan_amount: selectedPlanData.price,
        p_trial_end_date: expiresAt.toISOString()
      })

      if (rpcError) {
        console.error('Erro RPC:', rpcError)
        setError(rpcError.message || 'Erro ao conceder cortesia')
        setGranting(false)
        return
      }

      if (data && data.error) {
        setError(data.error)
        setGranting(false)
        return
      }

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      setSelectedUser('')
      setSelectedPlan('')
      setExpirationMonths(12)

      await loadCourtesies()
    } catch (err: any) {
      console.error('Erro ao conceder cortesia:', err)
      setError(err.message || 'Erro ao conceder cortesia')
    } finally {
      setGranting(false)
    }
  }

  const handleRevokeCourtesy = async (courtesyId: string) => {
    const confirmed = await confirm({
      title: 'Revogar Cortesia',
      message: 'Tem certeza que deseja revogar esta cortesia?',
      confirmText: 'Revogar',
      cancelText: 'Cancelar'
    })
    if (!confirmed) return

    try {
      const { error } = await supabase.rpc('admin_revoke_courtesy', {
        p_subscription_id: courtesyId
      })

      if (error) {
        console.error('Erro ao revogar:', error)
        alert('Erro ao revogar cortesia: ' + error.message)
        return
      }

      await loadCourtesies()
    } catch (err: any) {
      console.error('Erro ao revogar cortesia:', err)
      alert('Erro ao revogar cortesia: ' + err.message)
    }
  }

  const filteredUsers = users.filter(user =>
    containsIgnoringAccents(user.email, searchQuery) ||
    containsIgnoringAccents(user.name, searchQuery)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-500 rounded-xl">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Cortesias</h2>
        </div>
        <p className="text-gray-600">
          Conceda acesso gratuito aos planos para usuários selecionados
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">
              Cortesia concedida com sucesso!
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Grant Courtesy Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Conceder Nova Cortesia</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Usuário
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">Selecione um usuário</option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Plano
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 mt-9"
            >
              <option value="">Selecione um plano</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - R$ {plan.price.toFixed(2)}/mês
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expiration */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duração da Cortesia (meses)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={expirationMonths}
            onChange={(e) => setExpirationMonths(Number(e.target.value))}
            className="w-full md:w-48 bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>

        {/* Grant Button */}
        <button
          onClick={handleGrantCourtesy}
          disabled={granting || !selectedUser || !selectedPlan}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
        >
          {granting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Concedendo...
            </>
          ) : (
            <>
              <Gift className="w-5 h-5" />
              Conceder Cortesia
            </>
          )}
        </button>
      </div>

      {/* Active Courtesies List */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Cortesias Ativas</h3>

        {courtesies.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma cortesia ativa</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Usuário
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Plano
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Concedido em
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                    Expira em
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {courtesies.map((courtesy) => (
                  <tr key={courtesy.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-gray-900 font-medium">{courtesy.user_name}</div>
                        <div className="text-sm text-gray-500">{courtesy.user_email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-orange-600 font-medium">
                        {courtesy.plan_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-700">
                        {formatDateTimeBRSafe(courtesy.granted_at)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-700">
                        {courtesy.expires_at
                          ? formatDateTimeBRSafe(courtesy.expires_at)
                          : 'Sem expiração'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRevokeCourtesy(courtesy.id)}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all border border-red-200 flex items-center gap-2 ml-auto"
                      >
                        <X className="w-4 h-4" />
                        Revogar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </div>
  )
}
