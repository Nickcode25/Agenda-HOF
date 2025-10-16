import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, CreditCard, Lock, ArrowLeft, AlertCircle, QrCode } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { PAGBANK_TOKEN, PLAN_PRICE } from '@/lib/pagbank'

type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO'

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')

  // Dados do cartão
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardCpf, setCardCpf] = useState('')

  // Dados do usuário vindos do formulário de cadastro
  const userData = location.state as {
    name: string
    email: string
    password: string
    clinicName?: string
  } | null

  useEffect(() => {
    if (!userData) {
      navigate('/')
    }
  }, [userData, navigate])

  useEffect(() => {
    if (!PAGBANK_TOKEN || PAGBANK_TOKEN === 'seu_token_aqui') {
      setError('PagBank não está configurado. Configure seu token no arquivo .env')
    }
  }, [])

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{4})/g, '$1 ').trim()
  }

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4)
    }
    return numbers
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await signUp(userData!.email, userData!.password, userData!.name)

      if (!success) {
        throw new Error('Erro ao criar conta. Tente novamente.')
      }

      alert(`
🎉 Conta criada com sucesso!

💰 Pagamento via ${paymentMethod}
📊 Valor: R$ ${PLAN_PRICE.toFixed(2)}

✅ Acesso liberado!

⚠️ Ambiente de TESTE - Configure o PagBank no .env para produção
      `)

      setTimeout(() => {
        navigate('/app/dashboard')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento')
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!userData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-semibold mb-1">Erro de Configuração</h3>
                <p className="text-sm text-gray-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Resumo do Pedido</h2>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Plano Profissional</h3>
                  <p className="text-sm text-gray-400">Acesso completo ao sistema</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-400">
                    R${Math.floor(PLAN_PRICE)}
                    <span className="text-xl">,{(PLAN_PRICE % 1).toFixed(2).substring(2)}</span>
                  </div>
                  <div className="text-sm text-gray-400">por mês</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Sistema completo para Harmonização Orofacial
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Gestão de pacientes e profissionais
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Dashboard com analytics em tempo real
                </div>
              </div>
            </div>

            <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Seus Dados</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Nome:</span>
                  <span className="text-white font-medium">{userData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white font-medium">{userData.email}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-white">Total:</span>
                <span className="text-orange-400">R$ {PLAN_PRICE.toFixed(2).replace('.', ',')}/mês</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Pagamento via PagBank</h2>
                <p className="text-sm text-gray-400">Pagamento seguro e criptografado</p>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Método de Pagamento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      paymentMethod === 'PIX'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500'
                    }`}
                  >
                    PIX
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      paymentMethod === 'CREDIT_CARD'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500'
                    }`}
                  >
                    Cartão
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BOLETO')}
                    className={`px-4 py-3 rounded-lg border transition-all ${
                      paymentMethod === 'BOLETO'
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500'
                    }`}
                  >
                    Boleto
                  </button>
                </div>
              </div>

              {paymentMethod === 'CREDIT_CARD' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Número do Cartão</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Validade</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/AA"
                        maxLength={5}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">CVV</label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="000"
                        maxLength={4}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nome no Cartão</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CPF do Titular</label>
                    <input
                      type="text"
                      value={cardCpf}
                      onChange={(e) => setCardCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      required
                    />
                  </div>
                </>
              )}

              {paymentMethod === 'PIX' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="w-5 h-5 text-blue-400" />
                    <h3 className="text-blue-400 font-semibold">Pagamento PIX</h3>
                  </div>
                  <p className="text-sm text-gray-300">
                    Após confirmar, você receberá um QR Code para pagar instantaneamente pelo PIX.
                  </p>
                </div>
              )}

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Pagamento 100% Seguro</p>
                    <p className="text-xs text-gray-400">Processado pelo PagBank com criptografia SSL</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
              >
                {loading ? 'Processando...' : `Pagar R$ ${PLAN_PRICE.toFixed(2).replace('.', ',')}`}
              </button>

              <p className="text-xs text-center text-gray-500 italic">
                💡 Após o pagamento, você terá acesso imediato ao sistema
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
