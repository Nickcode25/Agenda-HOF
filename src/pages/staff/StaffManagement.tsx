import { useState, useEffect } from 'react'
import { useUserProfile } from '@/store/userProfile'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, Mail, Shield, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import type { UserProfile } from '@/types/user'

export default function StaffManagement() {
  const { createStaff, toggleStaffActive } = useUserProfile()

  const [staffMembers, setStaffMembers] = useState<UserProfile[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadStaffMembers = async () => {
    try {
      setLoading(true)
      setLoadError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setStaffMembers([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('parent_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const staff: UserProfile[] = (data || []).map(s => ({
        id: s.id,
        role: s.role,
        clinicId: s.clinic_id,
        parentUserId: s.parent_user_id,
        displayName: s.display_name,
        isActive: s.is_active,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }))

      setStaffMembers(staff)
      setLoading(false)
    } catch (err: any) {
      console.error('Erro ao carregar funcionários:', err)
      setLoadError(err.message || 'Erro ao carregar funcionários')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaffMembers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const result = await createStaff({
      email,
      password,
      displayName,
    })

    if (result.success) {
      alert(
        `✅ Funcionário criado com sucesso!\n\n` +
        `📧 Email: ${email}\n` +
        `🔑 Senha: ${password}\n\n` +
        `O funcionário já pode fazer login na página inicial do site usando essas credenciais.`
      )
      setEmail('')
      setPassword('')
      setDisplayName('')
      setShowAddForm(false)
      // Recarregar lista
      await loadStaffMembers()
    } else {
      alert(`❌ Erro ao criar funcionário: ${result.error}`)
    }

    setSubmitting(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-4">
        <div className="flex gap-3">
          <Shield size={24} className="text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-400 mb-1">Como funciona?</h3>
            <p className="text-sm text-gray-300">
              Crie contas de login para seus funcionários. Eles poderão acessar a <strong>página inicial do site</strong>, fazer login com o email e senha que você definir, e terão acesso a todas as funcionalidades operacionais (agenda, pacientes, procedimentos, estoque) - <strong>exceto o Dashboard</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
        >
          <UserPlus size={20} />
          Novo Funcionário
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Adicionar Novo Funcionário</h2>
          <p className="text-sm text-gray-400 mb-6">
            Crie uma conta de acesso para seu funcionário. Ele poderá fazer login usando o email e senha que você definir abaixo.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Ex: João Silva"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="funcionario@clinica.com"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Escolha uma senha segura. O funcionário usará esse email e senha para fazer login na página inicial do site.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {submitting ? 'Criando...' : 'Criar Funcionário'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEmail('')
                  setPassword('')
                  setDisplayName('')
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Funcionários Cadastrados</h2>
          <p className="text-sm text-gray-400 mt-1">
            {staffMembers.length} {staffMembers.length === 1 ? 'funcionário' : 'funcionários'}
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando funcionários...</p>
          </div>
        ) : loadError ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Erro ao carregar</h3>
            <p className="text-gray-400 mb-6">
              {loadError || 'Não foi possível carregar os funcionários'}
            </p>
            <button
              onClick={() => loadStaffMembers()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : staffMembers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={40} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum funcionário cadastrado</h3>
            <p className="text-gray-400 mb-6">
              Crie contas para seus funcionários acessarem o sistema
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {staffMembers.map((staff) => (
              <div key={staff.id} className="p-6 hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                      <Shield size={24} className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {staff.displayName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Mail size={14} />
                          <span>{staff.email || 'Email não disponível'}</span>
                        </div>
                        {staff.isActive ? (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                            <CheckCircle size={12} />
                            Ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                            <XCircle size={12} />
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Criado em {new Date(staff.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStaffActive(staff.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      staff.isActive
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}
                  >
                    {staff.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex gap-3">
          <Shield size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400 mb-1">Sobre as Contas de Funcionários</h4>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• Funcionários têm acesso a todas as funcionalidades operacionais</li>
              <li>• Não podem acessar o Dashboard nem dados financeiros</li>
              <li>• Todos os dados são compartilhados com a conta principal</li>
              <li>• Você pode ativar/desativar funcionários a qualquer momento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
