import { useState, useEffect } from 'react'
import { Search, Check, X, UserCheck, UserX, Clock, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  created_at: string
  user_metadata: {
    name?: string
  }
}

interface Subscription {
  id: string
  user_id: string
  plan_name: string
  status: string
  start_date: string
  next_billing_date: string
}

interface UserWithSubscription extends User {
  subscription?: Subscription
}

export default function AccessManager() {
  const [users, setUsers] = useState<UserWithSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)

      // Buscar todos os usuários
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Buscar todas as subscriptions
      const { data: subscriptionsData, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*')

      if (subsError) throw subsError

      // Combinar dados
      const usersWithSubs: UserWithSubscription[] = (usersData || []).map(user => {
        const subscription = subscriptionsData?.find(sub => sub.user_id === user.id)
        return {
          ...user,
          subscription
        }
      })

      setUsers(usersWithSubs)
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error)
      setErrorMessage('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const grantAccess = async (userId: string, userEmail: string) => {
    try {
      setActionLoading(userId)
      setErrorMessage('')
      setSuccessMessage('')

      // Criar ou atualizar subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          plan_name: 'Plano Profissional - Liberado pelo Admin',
          plan_price: 0.00,
          status: 'active',
          start_date: new Date().toISOString(),
          next_billing_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // +1 ano
          pagbank_subscription_id: `ADMIN_GRANTED_${Date.now()}`
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setSuccessMessage(`Acesso liberado para ${userEmail}!`)
      await loadUsers()
    } catch (error: any) {
      console.error('Erro ao liberar acesso:', error)
      setErrorMessage(error.message || 'Erro ao liberar acesso')
    } finally {
      setActionLoading(null)
    }
  }

  const revokeAccess = async (userId: string, userEmail: string) => {
    try {
      setActionLoading(userId)
      setErrorMessage('')
      setSuccessMessage('')

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) throw error

      setSuccessMessage(`Acesso revogado para ${userEmail}!`)
      await loadUsers()
    } catch (error: any) {
      console.error('Erro ao revogar acesso:', error)
      setErrorMessage(error.message || 'Erro ao revogar acesso')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    user.user_metadata?.name?.toLowerCase().includes(searchEmail.toLowerCase())
  )

  const getStatusBadge = (subscription?: Subscription) => {
    if (!subscription) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
          <X className="w-3 h-3" />
          Sem Acesso
        </span>
      )
    }

    if (subscription.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
          <Check className="w-3 h-3" />
          Ativo
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
        <X className="w-3 h-3" />
        {subscription.status}
      </span>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Acessos</h1>
        <p className="text-gray-400">
          Libere ou revogue acessos de usuários ao sistema
        </p>
      </div>

      {/* Mensagens */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-green-400 text-sm">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          placeholder="Buscar por email ou nome..."
          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Lista de Usuários */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Válido até
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {user.user_metadata?.name || 'Sem nome'}
                          </div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(user.subscription)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          {user.subscription?.plan_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.subscription?.next_billing_date ? (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(user.subscription.next_billing_date).toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!user.subscription || user.subscription.status !== 'active' ? (
                            <button
                              onClick={() => grantAccess(user.id, user.email)}
                              disabled={actionLoading === user.id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              {actionLoading === user.id ? (
                                <>
                                  <Clock className="w-4 h-4 animate-spin" />
                                  Liberando...
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4" />
                                  Liberar Acesso
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => revokeAccess(user.id, user.email)}
                              disabled={actionLoading === user.id}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              {actionLoading === user.id ? (
                                <>
                                  <Clock className="w-4 h-4 animate-spin" />
                                  Revogando...
                                </>
                              ) : (
                                <>
                                  <UserX className="w-4 h-4" />
                                  Revogar Acesso
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {users.filter(u => u.subscription?.status === 'active').length}
              </div>
              <div className="text-sm text-gray-400">Usuários Ativos</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
              <UserX className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {users.filter(u => !u.subscription || u.subscription.status !== 'active').length}
              </div>
              <div className="text-sm text-gray-400">Sem Acesso</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {users.length}
              </div>
              <div className="text-sm text-gray-400">Total de Usuários</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
