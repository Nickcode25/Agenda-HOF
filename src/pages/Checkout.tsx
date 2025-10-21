import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, CreditCard, Lock, ArrowLeft, AlertCircle, QrCode, Download, X } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { PLAN_PRICE } from '@/lib/pagbank'
import {
  createPixOrder,
  createCardOrder,
  createBoletoOrder,
  type PixResponse
} from '@/services/pagbankService'

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

  // Dados PIX
  const [pixData, setPixData] = useState<PixResponse | null>(null)
  const [showPixModal, setShowPixModal] = useState(false)

  // Dados Boleto
  const [boletoUrl, setBoletoUrl] = useState('')
  const [showBoletoModal, setShowBoletoModal] = useState(false)

  // Dados do usuário vindos do formulário de cadastro
  const userData = location.state as {
    name: string
    email: string
    phone: string
    password: string
  } | null

  useEffect(() => {
    if (!userData) {
      navigate('/')
    }
  }, [userData, navigate])

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

  const handlePixPayment = async () => {
    try {
      setLoading(true)
      setError('')

      // Criar pedido PIX
      const pixResponse = await createPixOrder({
        customerEmail: userData!.email,
        customerName: userData!.name,
        customerPhone: userData!.phone,
      })

      setPixData(pixResponse)
      setShowPixModal(true)

      // Criar conta do usuário
      const success = await signUp(userData!.email, userData!.password, userData!.name)
      if (!success) {
        throw new Error('Erro ao criar conta')
      }

      // TODO: Polling para verificar se o pagamento foi confirmado
      // Por enquanto, aguardar confirmação manual

    } catch (err: any) {
      setError(err.message || 'Erro ao gerar PIX')
      console.error('Erro PIX:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCardPayment = async () => {
    try {
      setLoading(true)
      setError('')

      // Validar campos do cartão
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv || !cardCpf) {
        throw new Error('Preencha todos os campos do cartão')
      }

      // Extrair mês e ano
      const [month, year] = cardExpiry.split('/')
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        throw new Error('Data de validade inválida')
      }

      // Processar pagamento com cartão
      const cardResponse = await createCardOrder({
        customerEmail: userData!.email,
        customerName: userData!.name,
        customerPhone: userData!.phone,
        cardNumber: cardNumber,
        cardHolderName: cardName,
        cardExpiryMonth: month,
        cardExpiryYear: `20${year}`,
        cardCvv: cardCvv,
        cardHolderCpf: cardCpf,
      })

      // Criar conta do usuário
      const success = await signUp(userData!.email, userData!.password, userData!.name)
      if (!success) {
        throw new Error('Erro ao criar conta')
      }

      // Sucesso!
      alert(`
🎉 Pagamento aprovado!

💳 ID da transação: ${cardResponse.id}
💰 Valor: R$ ${cardResponse.amount.toFixed(2)}

✅ Sua conta foi criada e o acesso está liberado!
      `)

      setTimeout(() => {
        navigate('/app/agenda')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Erro ao processar cartão')
      console.error('Erro Cartão:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBoletoPayment = async () => {
    try {
      setLoading(true)
      setError('')

      // Validar CPF
      if (!cardCpf) {
        throw new Error('Informe seu CPF')
      }

      // Gerar boleto
      const boletoResponse = await createBoletoOrder({
        customerEmail: userData!.email,
        customerName: userData!.name,
        customerPhone: userData!.phone,
        customerCpf: cardCpf,
      })

      setBoletoUrl(boletoResponse.boletoUrl)
      setShowBoletoModal(true)

      // Criar conta do usuário
      const success = await signUp(userData!.email, userData!.password, userData!.name)
      if (!success) {
        throw new Error('Erro ao criar conta')
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao gerar boleto')
      console.error('Erro Boleto:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    switch (paymentMethod) {
      case 'PIX':
        await handlePixPayment()
        break
      case 'CREDIT_CARD':
        await handleCardPayment()
        break
      case 'BOLETO':
        await handleBoletoPayment()
        break
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
                <h3 className="text-red-400 font-semibold mb-1">Erro no Pagamento</h3>
                <p className="text-sm text-gray-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Resumo do Pedido */}
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

          {/* Formulário de Pagamento */}
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

              {paymentMethod === 'BOLETO' && (
                <>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-yellow-400 font-semibold">Pagamento via Boleto</h3>
                    </div>
                    <p className="text-sm text-gray-300">
                      O boleto será gerado e você poderá fazer o download ou pagar pela internet.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">CPF</label>
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

      {/* Modal PIX */}
      {showPixModal && pixData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-blue-500 rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Pagar com PIX</h3>
              <button
                onClick={() => {
                  setShowPixModal(false)
                  navigate('/app/agenda')
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl mb-4">
              {pixData.qrCodeImage ? (
                <img src={pixData.qrCodeImage} alt="QR Code PIX" className="w-full" />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <QrCode size={64} />
                </div>
              )}
            </div>

            <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-400 mb-1">Código PIX Copia e Cola:</p>
              <p className="text-xs text-white font-mono break-all">{pixData.qrCodeText}</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-300 mb-2">
                Escaneie o QR Code ou copie o código acima
              </p>
              <p className="text-xs text-gray-500">
                Após o pagamento, o acesso será liberado automaticamente
              </p>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(pixData.qrCodeText)
                alert('Código PIX copiado!')
              }}
              className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Copiar Código PIX
            </button>
          </div>
        </div>
      )}

      {/* Modal Boleto */}
      {showBoletoModal && boletoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 border-2 border-yellow-500 rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Boleto Gerado</h3>
              <button
                onClick={() => {
                  setShowBoletoModal(false)
                  navigate('/app/agenda')
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mb-4">
                <Download className="w-8 h-8 text-yellow-400" />
              </div>
              <p className="text-gray-300 mb-2">Seu boleto foi gerado com sucesso!</p>
              <p className="text-sm text-gray-500">Faça o download ou pague pela internet</p>
            </div>

            <a
              href={boletoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 rounded-xl transition-colors text-center mb-3"
            >
              Abrir Boleto
            </a>

            <button
              onClick={() => {
                setShowBoletoModal(false)
                navigate('/app/agenda')
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Fechar
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              Após o pagamento, seu acesso será liberado em até 2 dias úteis
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
