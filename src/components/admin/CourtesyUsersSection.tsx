import { useState } from 'react'
import { UserPlus, Users, Key, Calendar, Trash2, Power, X, Copy, Check } from 'lucide-react'
import { useAdmin } from '@/store/admin'
import { useAuth } from '@/store/auth'
import { useConfirm } from '@/hooks/useConfirm'

export default function CourtesyUsersSection() {
  const { courtesyUsers, createCourtesyUser, toggleCourtesyUserStatus, deleteCourtesyUser, loading } = useAdmin()
  const { adminUser } = useAuth()

  const [showModal, setShowModal] = useState(false)
  const [showCredentials, setShowCredentials] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    notes: '',
    expiresAt: ''
  })
  const { confirm, ConfirmDialog } = useConfirm()

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await createCourtesyUser(formData)

    if (result.success && result.credentials) {
      setShowCredentials(result.credentials)
      setFormData({ name: '', email: '', phone: '', password: '', notes: '', expiresAt: '' })
      setShowModal(false)
    }
  }

  const copyCredentials = () => {
    if (showCredentials) {
      const text = `Email: ${showCredentials.email}\nSenha: ${showCredentials.password}`
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <>
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Users className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Usuários Cortesia</h2>
            <p className="text-sm text-gray-400">Acesso gratuito ao sistema</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Criar Acesso Cortesia
        </button>
      </div>

      {/* Lista de Usuários Cortesia */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Nome</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Email</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Telefone</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Expira em</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Status</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {courtesyUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum usuário cortesia criado ainda</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 text-green-400 hover:text-green-300 text-sm font-medium"
                  >
                    Criar primeiro acesso cortesia
                  </button>
                </td>
              </tr>
            ) : (
              courtesyUsers.map((user) => (
                <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-white">{user.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{user.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-300">{user.phone || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {user.expiresAt ? formatDate(user.expiresAt) : 'Sem expiração'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.isCurrentlyActive
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {user.isCurrentlyActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleCourtesyUserStatus(user.id, !user.isActive)}
                        className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors"
                        title={user.isActive ? 'Desativar' : 'Ativar'}
                      >
                        <Power className={`w-4 h-4 ${user.isActive ? 'text-yellow-400' : 'text-green-400'}`} />
                      </button>
                      <button
                        onClick={async () => {
                          if (await confirm({ title: 'Confirmação', message: 'Tem certeza que deseja deletar este usuário cortesia?' })) {
                            deleteCourtesyUser(user.id)
                          }
                        }}
                        className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800">
              <h3 className="text-xl font-bold text-white">Criar Acesso Cortesia</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="joao@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="(11) 98888-8888"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="Senha de acesso"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    title="Gerar senha aleatória"
                  >
                    <Key className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Clique no ícone de chave para gerar uma senha forte
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Expiração (Opcional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Deixe em branco para acesso sem expiração
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
                  placeholder="Motivo da cortesia, observações..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando...' : 'Criar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Credenciais */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-bold text-green-400">✅ Acesso Criado!</h3>
              <button
                onClick={() => setShowCredentials(null)}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                Credenciais de acesso criadas com sucesso! Anote ou copie as informações abaixo:
              </p>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Email:</p>
                  <p className="text-white font-mono">{showCredentials.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Senha:</p>
                  <p className="text-white font-mono">{showCredentials.password}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyCredentials}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copiado!' : 'Copiar Credenciais'}
                </button>
                <button
                  onClick={() => setShowCredentials(null)}
                  className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>

              <p className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                ⚠️ Importante: Guarde essas credenciais em local seguro. Esta é a única vez que a senha será exibida!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
