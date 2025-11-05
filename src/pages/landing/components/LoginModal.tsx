interface LoginModalProps {
  isOpen: boolean
  email: string
  password: string
  rememberMe: boolean
  loading: boolean
  error: string
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onRememberMeChange: (checked: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  onForgotPassword: () => void
  onSwitchToRegister: () => void
}

export default function LoginModal({
  isOpen,
  email,
  password,
  rememberMe,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onSubmit,
  onClose,
  onForgotPassword,
  onSwitchToRegister
}: LoginModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="login-title">
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
            <h2 id="login-title" className="text-3xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
            <p className="text-gray-400">Entre para acessar sua conta</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm" role="alert">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => onRememberMeChange(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700/50 text-orange-500 focus:ring-2 focus:ring-orange-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-400">Lembrar de mim</span>
              </label>

              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-400">Não tem uma conta? </span>
            <button
              onClick={onSwitchToRegister}
              className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
            >
              Cadastre-se
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
