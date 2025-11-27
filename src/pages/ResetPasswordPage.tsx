import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff, AlertCircle, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator'
import { validatePasswordStrength } from '@/utils/validation'
import NewLandingPage from './landing/NewLandingPage'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [isValidating, setIsValidating] = useState(true) // Novo estado para validação inicial
  const [sessionReady, setSessionReady] = useState(false) // Sessão pronta para reset

  // Verificar se há um hash de recuperação na URL e processar o token
  useEffect(() => {
    const processRecoveryToken = async () => {
      setIsValidating(true)

      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')
      const errorCode = hashParams.get('error_code')
      const errorDescription = hashParams.get('error_description')

      // Verificar se há erro na URL
      if (errorCode === 'otp_expired') {
        setError('Link de recuperação expirado. Por favor, solicite um novo email de recuperação.')
        setIsValidating(false)
        return
      } else if (errorCode) {
        setError(`Erro: ${errorDescription || 'Link inválido'}`)
        setIsValidating(false)
        return
      }

      // Se não há token na URL, verificar se já existe uma sessão de recovery
      if (!accessToken || type !== 'recovery') {
        // Verificar se há uma sessão existente
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Já existe uma sessão válida, pode prosseguir
          setSessionReady(true)
          setIsValidating(false)
          return
        }

        setError('Link de recuperação inválido ou expirado.')
        setIsValidating(false)
        return
      }

      // Processar o token de recuperação - estabelecer sessão com Supabase
      try {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })

        if (sessionError) {
          console.error('Erro ao estabelecer sessão:', sessionError)
          if (sessionError.message.includes('expired') || sessionError.message.includes('invalid')) {
            setError('Link de recuperação expirado. Por favor, solicite um novo email de recuperação.')
          } else {
            setError('Erro ao validar o link. Por favor, solicite um novo email de recuperação.')
          }
          setIsValidating(false)
          return
        }

        if (data.session) {
          console.log('✅ Sessão de recuperação estabelecida com sucesso')
          setSessionReady(true)
          // Limpar o hash da URL para segurança
          window.history.replaceState(null, '', window.location.pathname)
        } else {
          setError('Não foi possível validar o link. Por favor, solicite um novo email de recuperação.')
        }
      } catch (err) {
        console.error('Erro ao processar token:', err)
        setError('Erro ao processar o link. Por favor, solicite um novo email de recuperação.')
      }

      setIsValidating(false)
    }

    processRecoveryToken()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (!formData.password || !formData.confirmPassword) {
      setError('Preencha todos os campos')
      return
    }

    // Validar força da senha
    const passwordCheck = validatePasswordStrength(formData.password)
    if (!passwordCheck.isValid) {
      setError(passwordCheck.message)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const result = await updatePassword(formData.password)

      if (result) {
        setSuccess(true)
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError('Erro ao redefinir senha. O link pode ter expirado.')
      }
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err)
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Tela de loading enquanto valida o token
  if (isValidating) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Landing page de fundo */}
        <div className="absolute inset-0 overflow-auto -z-10">
          <NewLandingPage />
        </div>

        {/* Overlay escuro com blur - fixo sobre toda a tela */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none z-0" />

        {/* Container do modal - fixo sobre tudo */}
        <div className="fixed inset-0 z-10 flex items-center justify-center p-4 pointer-events-none">
          <div className="w-full max-w-md pointer-events-auto">
            <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl shadow-orange-500/20">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Validando Link
                </h1>
                <p className="text-gray-400">
                  Aguarde enquanto verificamos seu link de recuperação...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
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

        {/* Container do modal - fixo sobre tudo */}
        <div className="fixed inset-0 z-10 flex items-center justify-center p-4 pointer-events-none">
          <div className="w-full max-w-md pointer-events-auto">
            {/* Card de Sucesso */}
            <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-green-500 p-8 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Senha Redefinida!
                </h1>
                <p className="text-gray-400 mb-6">
                  Sua senha foi alterada com sucesso.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-400">
                    Você será redirecionado para a página de login em instantes...
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Ir para login agora
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
        to="/login"
        className="fixed top-8 left-8 z-20 inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Voltar para login</span>
      </Link>

      {/* Container do modal - fixo sobre tudo */}
      <div className="fixed inset-0 z-10 flex items-center justify-center p-4 pointer-events-none">
        {/* Card Principal */}
        <div className="w-full max-w-md pointer-events-auto">
          <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl shadow-orange-500/20">
            {/* Botão Fechar */}
            <Link
              to="/login"
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </Link>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Redefinir Senha
              </h1>
              <p className="text-gray-400 text-sm">
                Digite sua nova senha
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-400 text-sm mb-2">{error}</p>
                      {error.includes('expirado') && (
                        <Link
                          to="/forgot-password"
                          className="inline-block text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors"
                        >
                          Solicitar novo link →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Nova Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setPasswordTouched(true)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="Crie uma senha forte"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordTouched && (
                  <div className="mt-3">
                    <PasswordStrengthIndicator password={formData.password} />
                  </div>
                )}
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full bg-gray-800/50 border rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      !formData.confirmPassword
                        ? 'border-gray-700 focus:border-orange-500 focus:ring-orange-500/20'
                        : formData.password === formData.confirmPassword
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                        : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    }`}
                    placeholder="Confirme sua nova senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">As senhas não coincidem</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-xs text-green-400 mt-1">✓ Senhas coincidem</p>
                )}
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? 'Redefinindo senha...' : 'Redefinir Senha'}
              </button>

              {/* Link para Login */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-400">
                  Lembrou sua senha?{' '}
                  <Link to="/login" className="text-orange-500 hover:text-orange-400 font-medium transition-colors">
                    Fazer login
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Fim do container scrollável */}
      </div>
    </div>
  )
}
