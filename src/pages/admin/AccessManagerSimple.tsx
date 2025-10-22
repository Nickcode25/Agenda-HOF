import { useState } from 'react'
import { Search, UserCheck, UserX, Clock, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AccessManagerSimple() {
  const [searchEmail, setSearchEmail] = useState('')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const searchUser = async () => {
    if (!searchEmail || !searchEmail.includes('@')) {
      setErrorMessage('Digite um email válido')
      return
    }

    try {
      setLoading(true)
      setErrorMessage('')
      setSuccessMessage('')
      setUserInfo(null)

      // Buscar usuário pelo email
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

      if (usersError) throw usersError

      const user = users?.find(u => u.email?.toLowerCase() === searchEmail.toLowerCase())

      if (!user) {
        setErrorMessage('Usuário não encontrado')
        return
      }

      // Buscar subscription do usuário
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (subError) console.error('Erro ao buscar subscription:', subError)

      setUserInfo({
        ...user,
        subscription
      })
    } catch (error: any) {
      console.error('Erro ao buscar usuário:', error)
      setErrorMessage(error.message || 'Erro ao buscar usuário')
    } finally {
      setLoading(false)
    }
  }

  const grantAccess = async () => {
    if (!userInfo) return

    try {
      setActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userInfo.id,
          plan_name: 'Plano Profissional - Liberado pelo Admin',
          plan_price: 0.00,
          status: 'active',
          start_date: new Date().toISOString(),
          next_billing_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          pagbank_subscription_id: `ADMIN_GRANTED_${Date.now()}`
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setSuccessMessage(`Acesso liberado para ${userInfo.email}! O usuário já pode acessar o sistema.`)

      // Recarregar dados do usuário
      await searchUser()
    } catch (error: any) {
      console.error('Erro ao liberar acesso:', error)
      setErrorMessage(error.message || 'Erro ao liberar acesso')
    } finally {
      setActionLoading(false)
    }
  }

  const revokeAccess = async () => {
    if (!userInfo || !userInfo.subscription) return

    try {
      setActionLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userInfo.id)

      if (error) throw error

      setSuccessMessage(`Acesso revogado para ${userInfo.email}!`)

      // Recarregar dados do usuário
      await searchUser()
    } catch (error: any) {
      console.error('Erro ao revogar acesso:', error)
      setErrorMessage(error.message || 'Erro ao revogar acesso')
    } finally {
      setActionLoading(false)
    }
  }

  const hasActiveSubscription = userInfo?.subscription?.status === 'active'

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Acessos</h1>
        <p className="text-gray-400">
          Busque um usuário por email para liberar ou revogar acesso ao sistema
        </p>
      </div>

      {/* Mensagens */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-green-400 text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Busca */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Buscar Usuário por Email
        </label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
              placeholder="exemplo@email.com"
              className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={searchUser}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Buscar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Informações do Usuário */}
      {userInfo && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Informações do Usuário</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Dados do Usuário */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Email</label>
                <p className="text-white font-medium mt-1">{userInfo.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">ID do Usuário</label>
                <p className="text-gray-300 text-sm font-mono mt-1">{userInfo.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Cadastrado em</label>
                <p className="text-gray-300 mt-1">
                  {new Date(userInfo.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Status</label>
                <div className="mt-1">
                  {hasActiveSubscription ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Acesso Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      Sem Acesso
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Informações da Subscription */}
            {userInfo.subscription && (
              <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Detalhes da Assinatura</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Plano:</span>
                    <p className="text-white font-medium">{userInfo.subscription.plan_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Preço:</span>
                    <p className="text-white font-medium">
                      R$ {userInfo.subscription.plan_price?.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Início:</span>
                    <p className="text-white">
                      {new Date(userInfo.subscription.start_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Próxima cobrança:</span>
                    <p className="text-white">
                      {new Date(userInfo.subscription.next_billing_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-4">
              {!hasActiveSubscription ? (
                <button
                  onClick={grantAccess}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/30"
                >
                  {actionLoading ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      Liberando acesso...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      Liberar Acesso (Válido por 1 ano)
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={revokeAccess}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/30"
                >
                  {actionLoading ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      Revogando acesso...
                    </>
                  ) : (
                    <>
                      <UserX className="w-5 h-5" />
                      Revogar Acesso
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instruções */}
      {!userInfo && !loading && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Como usar</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Digite o email do usuário no campo acima e clique em "Buscar".
            Você poderá ver o status da assinatura e liberar ou revogar o acesso ao sistema.
          </p>
        </div>
      )}
    </div>
  )
}
