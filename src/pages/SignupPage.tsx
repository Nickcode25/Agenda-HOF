import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Phone, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '@/store/auth'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Preencha todos os campos')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)

    try {
      // Criar conta do usuário
      const success = await signUp(formData.email, formData.password, formData.name)

      if (success) {
        // Redirecionar para página de vendas (usuário precisa assinar)
        navigate('/pricing')
      } else {
        setError('Erro ao criar conta. Este email pode já estar cadastrado.')
      }
    } catch (err: any) {
      console.error('Erro no cadastro:', err)
      setError(err.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Botão Voltar */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>

        {/* Card Principal */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition duration-1000" />

          {/* Card */}
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Criar Conta
              </h1>
              <p className="text-gray-400">
                Crie sua conta para começar
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Confirme sua senha"
                    required
                  />
                </div>
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/30"
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>

              {/* Link para Login */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Fazer login
                  </Link>
                </p>
              </div>
            </form>

            {/* Informação sobre pagamento */}
            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <p className="text-xs text-center text-gray-500">
                💡 Após criar sua conta, você será direcionado para escolher seu plano
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
