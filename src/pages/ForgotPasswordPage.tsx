import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import { useAuth } from '@/store/auth'

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
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para login
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
                <Send className="w-8 h-8 text-blue-400" />
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
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="seu@email.com"
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
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
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
