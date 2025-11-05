import { ArrowRight } from 'lucide-react'

interface RegisterModalProps {
  isOpen: boolean
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  loading: boolean
  onFullNameChange: (name: string) => void
  onEmailChange: (email: string) => void
  onPhoneChange: (phone: string) => void
  onPasswordChange: (password: string) => void
  onConfirmPasswordChange: (password: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  onSwitchToLogin: () => void
}

export default function RegisterModal({
  isOpen,
  fullName,
  email,
  phone,
  password,
  confirmPassword,
  loading,
  onFullNameChange,
  onEmailChange,
  onPhoneChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onClose,
  onSwitchToLogin
}: RegisterModalProps) {
  if (!isOpen) return null

  const handlePhoneChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '')
    const limited = numbersOnly.slice(0, 11)
    let formatted = limited
    if (limited.length > 0) {
      formatted = '(' + limited.slice(0, 2)
      if (limited.length >= 3) {
        formatted += ') ' + limited.slice(2, 7)
      }
      if (limited.length >= 8) {
        formatted += '-' + limited.slice(7, 11)
      }
    }
    onPhoneChange(formatted)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="register-title">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-6 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center mb-6">
            <h2 id="register-title" className="text-2xl font-bold text-white mb-1">
              Comece sua transformação
            </h2>
            <p className="text-gray-400 text-sm">Preencha seus dados para continuar</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Nome Completo - Largura Total */}
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-gray-300 mb-1.5">Nome Completo *</label>
              <input
                id="register-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => onFullNameChange(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Digite seu nome completo"
              />
            </div>

            {/* Email e Telefone - 2 Colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-300 mb-1.5">E-mail *</label>
                <input
                  id="register-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  disabled={loading}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="register-phone" className="block text-sm font-medium text-gray-300 mb-1.5">Telefone *</label>
                <input
                  id="register-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={loading}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {/* Senha e Confirmar Senha - 2 Colunas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-300 mb-1.5">Senha *</label>
                <input
                  id="register-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  disabled={loading}
                  className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-300 mb-1.5">Confirme a Senha *</label>
                <input
                  id="register-confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  disabled={loading}
                  className={`w-full bg-gray-700/50 border ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-500'
                      : 'border-gray-600'
                  } text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  placeholder="Digite novamente"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">As senhas não coincidem</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-400 text-sm">Já tem uma conta? </span>
            <button
              onClick={onSwitchToLogin}
              className="text-orange-500 hover:text-orange-400 font-medium transition-colors text-sm"
            >
              Faça login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
