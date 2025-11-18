import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUserProfile } from '@/store/userProfile'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, Mail, Shield, CheckCircle, XCircle, Eye, EyeOff, Info } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header com breadcrumb */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link to="/app" className="hover:text-orange-600 transition-colors">Início</Link>
              <span>›</span>
              <span className="text-gray-900">Funcionários</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-200">
                <Users size={24} className="text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
                <p className="text-sm text-gray-500">Gerencie os acessos da equipe</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <UserPlus size={18} />
            Novo Funcionário
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Info size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-700 mb-1">Como funciona?</h3>
              <p className="text-sm text-orange-600">
                Crie contas de login para seus funcionários. Eles poderão acessar a <strong>página inicial do site</strong>, fazer login com o email e senha que você definir, e terão acesso a todas as funcionalidades operacionais (agenda, pacientes, procedimentos, estoque) - <strong>exceto o Dashboard</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Adicionar Novo Funcionário</h2>
            <p className="text-sm text-gray-500 mb-6">
              Crie uma conta de acesso para seu funcionário. Ele poderá fazer login usando o email e senha que você definir abaixo.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Ex: João Silva"
                  className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="funcionario@clinica.com"
                  className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg px-4 py-2.5 pr-12 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Escolha uma senha segura. O funcionário usará esse email e senha para fazer login na página inicial do site.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
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
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Staff List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Funcionários Cadastrados</h2>
            <p className="text-sm text-gray-500 mt-1">
              {staffMembers.length} {staffMembers.length === 1 ? 'funcionário' : 'funcionários'}
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando funcionários...</p>
            </div>
          ) : loadError ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                <XCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar</h3>
              <p className="text-gray-500 mb-6">
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
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200">
                <Users size={40} className="text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum funcionário cadastrado</h3>
              <p className="text-gray-500 mb-6">
                Crie contas para seus funcionários acessarem o sistema
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {staffMembers.map((staff) => (
                <div key={staff.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center border border-orange-200">
                        <Shield size={24} className="text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {staff.displayName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Mail size={14} />
                            <span>{staff.email || 'Email não disponível'}</span>
                          </div>
                          {staff.isActive ? (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full border border-green-200">
                              <CheckCircle size={12} />
                              Ativo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full border border-red-200">
                              <XCircle size={12} />
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Criado em {new Date(staff.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleStaffActive(staff.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        staff.isActive
                          ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                          : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-700 mb-1">Sobre as Contas de Funcionários</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Funcionários têm acesso a todas as funcionalidades operacionais</li>
                <li>• Não podem acessar o Dashboard nem dados financeiros</li>
                <li>• Todos os dados são compartilhados com a conta principal</li>
                <li>• Você pode ativar/desativar funcionários a qualquer momento</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
