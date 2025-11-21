import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, X } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { invalidateSubscriptionCache } from '@/components/SubscriptionProtectedRoute'
import NewLandingPage from './landing/NewLandingPage'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Carregar email salvo ao montar componente
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail')
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true'

    if (savedRememberMe && savedEmail) {
      setFormData({ ...formData, email: savedEmail })
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Preencha todos os campos')
      return
    }

    setLoading(true)

    try {
      const success = await signIn(formData.email, formData.password)

      if (success) {
        // Invalidar cache de assinatura para forçar nova verificação
        invalidateSubscriptionCache()

        // Salvar apenas email se "Lembrar de mim" estiver marcado
        if (rememberMe) {
          localStorage.setItem('savedEmail', formData.email)
          localStorage.setItem('rememberMe', 'true')
        } else {
          // Remover email salvo se não marcar "Lembrar de mim"
          localStorage.removeItem('savedEmail')
          localStorage.removeItem('rememberMe')
        }

        // Redirecionar para o app
        navigate('/app')
      } else {
        setError('Email ou senha incorretos')
      }
    } catch (err: any) {
      console.error('Erro no login:', err)
      setError(err.message || 'Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Landing page de fundo */}
      <div className="absolute inset-0 overflow-auto -z-10">
        <NewLandingPage />
      </div>

      {/* Overlay escuro com blur - fixo sobre toda a tela */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none z-0" />

      {/* Container scrollável para o conteúdo */}
      <div className="relative h-full overflow-auto z-10">

      {/* Botão Voltar - Fixo no canto superior esquerdo */}
      <Link
        to="/"
        className="fixed top-8 left-8 z-20 inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Voltar</span>
      </Link>

      {/* Container do modal - fixo sobre tudo */}
      <div className="fixed inset-0 z-10 flex items-center justify-center p-4 pointer-events-none">
        {/* Card de Login */}
        <div className="w-full max-w-md pointer-events-auto">
          <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl">
          {/* Botão Fechar */}
          <Link
            to="/"
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </Link>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
            <p className="text-gray-400">Faça login para acessar sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm" role="alert">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Lembrar de mim e Esqueci a senha */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700/50 text-orange-500 focus:ring-2 focus:ring-orange-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-400">Lembrar de mim</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link para Cadastro */}
          <div className="mt-6 text-center">
            <span className="text-gray-400">Não tem uma conta? </span>
            <Link
              to="/signup"
              className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
            >
              Cadastre-se
            </Link>
          </div>
          </div>
        </div>
      </div>
      {/* Fim do container scrollável */}
      </div>
    </div>
  )
}
