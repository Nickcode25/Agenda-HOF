interface ForgotPasswordModalProps {
  isOpen: boolean
  email: string
  loading: boolean
  error: string
  successMessage: string
  onEmailChange: (email: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  onBackToLogin: () => void
}

export default function ForgotPasswordModal({
  isOpen,
  email,
  loading,
  error,
  successMessage,
  onEmailChange,
  onSubmit,
  onClose,
  onBackToLogin
}: ForgotPasswordModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title">
      <div className="w-full max-w-md">
        <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-8">
            <h2 id="forgot-password-title" className="text-3xl font-bold text-white mb-2">Recuperar senha</h2>
            <p className="text-gray-400">Digite seu e-mail para receber instruções de recuperação</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm" role="alert">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl text-sm" role="alert">
                {successMessage}
              </div>
            )}

            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="seu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar instruções'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBackToLogin}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
