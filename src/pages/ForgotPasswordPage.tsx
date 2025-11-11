import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send, CheckCircle, X } from 'lucide-react'
import { useAuth } from '@/store/auth'
import NewLandingPage from './landing/NewLandingPage'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Digite seu email')
      return
    }

    setLoading(true)

    try {
      const result = await resetPassword(email)

      if (result) {
        setSuccess(true)
      } else {
        setError('Erro ao enviar email de recuperação. Tente novamente.')
      }
    } catch (err: any) {
      console.error('Erro ao enviar email:', err)
      setError(err.message || 'Erro ao enviar email de recuperação. Tente novamente.')
    } finally {
      setLoading(false)
    }
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
                  Email Enviado!
                </h1>
                <p className="text-gray-400 mb-6">
                  Enviamos um link de recuperação para <strong className="text-white">{email}</strong>
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-400">
                    Verifique sua caixa de entrada e spam. O link expira em 1 hora.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para login
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
          <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl">
            {/* Botão Fechar */}
            <Link
              to="/login"
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </Link>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-orange-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Esqueceu a senha?
              </h1>
              <p className="text-gray-400">
                Digite seu email para receber um link de recuperação
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              {/* Link para Login */}
              <div className="text-center">
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
