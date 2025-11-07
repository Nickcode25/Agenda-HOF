import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/store/auth'
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator'
import { validatePasswordStrength } from '@/utils/validation'

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

  // Verificar se há um hash de recuperação na URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    // Se não houver token de acesso ou tipo não for recovery, redirecionar
    if (!accessToken || type !== 'recovery') {
      setError('Link de recuperação inválido ou expirado.')
    }
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card de Sucesso */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl blur-2xl opacity-25 group-hover:opacity-40 transition duration-1000" />

            {/* Card */}
            <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Botão Voltar */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para login</span>
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
                <Lock className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Redefinir Senha
              </h1>
              <p className="text-gray-400">
                Digite sua nova senha
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
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
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                    className={`w-full bg-gray-700/50 border rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      !formData.confirmPassword
                        ? 'border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
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
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/30"
              >
                {loading ? 'Redefinindo senha...' : 'Redefinir Senha'}
              </button>

              {/* Link para Login */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Lembrou sua senha?{' '}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Fazer login
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
