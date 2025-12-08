import { useState, useEffect, useRef } from 'react'
import { Mail, X, AlertCircle, CheckCircle } from 'lucide-react'

interface VerificationCodeModalProps {
  show: boolean
  email: string
  onVerify: (code: string) => Promise<boolean>
  onResend: () => Promise<void>
  onClose: () => void
  loading?: boolean
}

export default function VerificationCodeModal({
  show,
  email,
  onVerify,
  onResend,
  onClose,
  loading = false
}: VerificationCodeModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (show && inputRefs.current[0]) {
      inputRefs.current[0]?.focus()
    }
  }, [show])

  useEffect(() => {
    if (!show) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !verifying && !loading) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [show, verifying, loading])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')

    // Auto-focus próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verificar quando completar
    if (index === 5 && value && newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]

    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }

    setCode(newCode)

    if (pastedData.length === 6) {
      handleVerify(pastedData)
    } else if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
    }
  }

  const handleVerify = async (codeToVerify?: string) => {
    const verificationCode = codeToVerify || code.join('')

    if (verificationCode.length !== 6) {
      setError('Digite o código completo')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const isValid = await onVerify(verificationCode)

      if (isValid) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError('Código inválido ou expirado')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      setError('Erro ao verificar código. Tente novamente.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    setCode(['', '', '', '', '', ''])

    try {
      await onResend()
      setResendCooldown(60)
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError('Erro ao reenviar código. Tente novamente.')
    } finally {
      setResending(false)
    }
  }

  const handleClose = () => {
    if (!verifying && !loading) {
      setCode(['', '', '', '', '', ''])
      setError('')
      setSuccess(false)
      onClose()
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl border-2 border-orange-500 p-8 shadow-2xl relative">
        {/* Botão Fechar */}
        {!loading && !verifying && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700/50 rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-500">
            {success ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <Mail className="w-8 h-8 text-orange-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {success ? 'Verificado com sucesso!' : 'Verifique seu email'}
          </h2>
          <p className="text-gray-400 text-sm">
            {success ? (
              'Redirecionando...'
            ) : (
              <>
                Enviamos um código de 6 dígitos para<br />
                <span className="text-orange-500 font-medium">{email}</span>
              </>
            )}
          </p>
        </div>

        {!success && (
          <>
            {/* Inputs do código */}
            <div className="flex gap-2 mb-6" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={verifying || loading}
                  className={`w-full aspect-square text-center text-2xl font-bold bg-gray-700/50 border-2 rounded-xl text-white focus:outline-none transition-all ${
                    error
                      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                  } ${verifying || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              ))}
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Botão Verificar */}
            <button
              onClick={() => handleVerify()}
              disabled={verifying || loading || code.some(digit => !digit)}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {verifying || loading ? 'Verificando...' : 'Verificar Código'}
            </button>

            {/* Reenviar código */}
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                Não recebeu o código?
              </p>
              <button
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="text-orange-500 hover:text-orange-400 font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending
                  ? 'Reenviando...'
                  : resendCooldown > 0
                  ? `Reenviar em ${resendCooldown}s`
                  : 'Reenviar código'}
              </button>
            </div>

            {/* Informação */}
            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <p className="text-xs text-center text-gray-500">
                O código é válido por 15 minutos
              </p>
            </div>
          </>
        )}

        {success && (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  )
}
