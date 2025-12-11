import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, Phone, ArrowLeft, CheckCircle, Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { invalidateSubscriptionCache } from '@/components/SubscriptionProtectedRoute'
import { invalidateUserCache } from '@/lib/supabase'
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator'
import { validateEmail, validatePhone, validatePasswordStrength } from '@/utils/validation'
import NewLandingPage from './landing/NewLandingPage'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    confirmEmail: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Validações em tempo real
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message: string } | null>(null)
  const [phoneValidation, setPhoneValidation] = useState<{ isValid: boolean; message: string } | null>(null)
  const [passwordTouched, setPasswordTouched] = useState(false)

  // Validação de email em tempo real
  useEffect(() => {
    if (formData.email) {
      const validation = validateEmail(formData.email)
      setEmailValidation(validation)
    } else {
      setEmailValidation(null)
    }
  }, [formData.email])

  // Validação de telefone em tempo real
  useEffect(() => {
    if (formData.phone.replace(/\D/g, '').length >= 10) {
      const validation = validatePhone(formData.phone)
      setPhoneValidation(validation)
    } else {
      setPhoneValidation(null)
    }
  }, [formData.phone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Preencha todos os campos')
      return
    }

    // Validar email
    const emailCheck = validateEmail(formData.email)
    if (!emailCheck.isValid) {
      setError(emailCheck.message)
      return
    }

    // Validar confirmação de email
    if (formData.email.trim().toLowerCase() !== formData.confirmEmail.trim().toLowerCase()) {
      setError('Os emails não coincidem')
      return
    }

    // Validar telefone
    const phoneCheck = validatePhone(formData.phone)
    if (!phoneCheck.isValid) {
      setError(phoneCheck.message)
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
      // Normalizar email (remover espaços e converter para minúsculas)
      const normalizedEmail = formData.email.trim().toLowerCase()

      // Criar conta diretamente (sem verificação de email)
      const success = await signUp(
        normalizedEmail,
        formData.password,
        formData.name,
        formData.phone
      )

      if (success) {
        // Invalidar caches para garantir verificação fresh do trial
        invalidateUserCache()
        invalidateSubscriptionCache()
        // Redirecionar para dentro do app - usuário tem 7 dias de trial gratuito
        navigate('/app/agenda')
      } else {
        // Verificar se é erro de email já cadastrado ou de confirmação de email necessária
        setError('Erro ao criar conta. Verifique se o email já está cadastrado ou tente novamente.')
      }
    } catch (err: any) {
      console.error('Erro no cadastro:', err)
      // Mostrar erro específico do Supabase se disponível
      const errorMessage = err.message || 'Erro ao criar conta. Tente novamente.'
      setError(errorMessage)
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
        {/* Card de Cadastro */}
        <div className="w-full max-w-2xl pointer-events-auto">
          <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl">
            {/* Botão Fechar */}
            <Link
              to="/"
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </Link>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Comece sua transformação
              </h1>
              <p className="text-gray-400">
                Preencha seus dados para continuar
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 col-span-2">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Grid de 2 colunas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full bg-gray-700/50 border rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all ${
                          emailValidation === null
                            ? 'border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                            : emailValidation.isValid
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                            : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        }`}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    {emailValidation && !emailValidation.isValid && (
                      <p className="text-xs text-red-400 mt-1">{emailValidation.message}</p>
                    )}
                    {emailValidation && emailValidation.isValid && (
                      <p className="text-xs text-green-400 mt-1">Email válido</p>
                    )}
                  </div>

                  {/* Confirmar Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirmar Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.confirmEmail}
                        onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                        className={`w-full bg-gray-700/50 border rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all ${
                          !formData.confirmEmail
                            ? 'border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                            : formData.email.trim().toLowerCase() === formData.confirmEmail.trim().toLowerCase()
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                            : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        }`}
                        placeholder="Confirme seu email"
                        required
                      />
                    </div>
                    {formData.confirmEmail && formData.email.trim().toLowerCase() !== formData.confirmEmail.trim().toLowerCase() && (
                      <p className="text-xs text-red-400 mt-1">Os emails não coincidem</p>
                    )}
                    {formData.confirmEmail && formData.email.trim().toLowerCase() === formData.confirmEmail.trim().toLowerCase() && (
                      <p className="text-xs text-green-400 mt-1">Emails coincidem</p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                        className={`w-full bg-gray-700/50 border rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all ${
                          phoneValidation === null
                            ? 'border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                            : phoneValidation.isValid
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                            : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        }`}
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                    {phoneValidation && !phoneValidation.isValid && (
                      <p className="text-xs text-red-400 mt-1">{phoneValidation.message}</p>
                    )}
                    {phoneValidation && phoneValidation.isValid && (
                      <p className="text-xs text-green-400 mt-1">Telefone válido</p>
                    )}
                  </div>
                </div>

                {/* Coluna Direita */}
                <div className="space-y-4">
                  {/* Senha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Senha *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        onFocus={() => setPasswordTouched(true)}
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
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

                  {/* Confirmar Senha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirmar Senha *
                    </label>
                    <div className="relative">
                      <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={`w-full bg-gray-700/50 border rounded-xl pl-12 pr-12 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all ${
                          !formData.confirmPassword
                            ? 'border-gray-600 focus:border-orange-500 focus:ring-orange-500/20'
                            : formData.password === formData.confirmPassword
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                            : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        }`}
                        placeholder="Confirme sua senha"
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
                      <p className="text-xs text-green-400 mt-1">Senhas coincidem</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </button>

              {/* Link para Login */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-orange-500 hover:text-orange-400 font-medium transition-colors">
                    Fazer login
                  </Link>
                </p>
              </div>
            </form>

            {/* Informação sobre trial */}
            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <p className="text-xs text-center text-gray-500">
                Após criar sua conta, você terá 7 dias de acesso gratuito completo!
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Fim do container scrollável */}
      </div>
    </div>
  )
}
