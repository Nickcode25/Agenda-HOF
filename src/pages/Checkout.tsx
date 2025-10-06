import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, CreditCard, Lock, ArrowLeft } from 'lucide-react'
import { createAsaasCustomer, createCreditCardPayment, createAsaasPayment, type AsaasCustomer, type AsaasPayment, type AsaasCreditCard } from '@/lib/asaas'
import { useAuth } from '@/store/auth'

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('CREDIT_CARD')

  // Dados do formulário de pagamento
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardCpf, setCardCpf] = useState('')
  const [cardPhone, setCardPhone] = useState('')
  const [cardCep, setCardCep] = useState('')
  const [cardAddressNumber, setCardAddressNumber] = useState('')

  // Dados do usuário vindos do formulário de cadastro
  const userData = location.state as {
    name: string
    email: string
    password: string
    clinicName?: string
  } | null

  useEffect(() => {
    // Se não houver dados do usuário, redirecionar para home
    if (!userData) {
      navigate('/')
    }
  }, [userData, navigate])

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Aqui você vai integrar com o gateway de pagamento
    // Por exemplo: Mercado Pago, Stripe, etc.

    // Simulação de pagamento (remover depois)
    setTimeout(() => {
      alert('Integração com gateway de pagamento será implementada aqui!')
      setLoading(false)
    }, 2000)
  }

  if (!userData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Finalizar Assinatura</h1>
            <p className="text-gray-400">Complete seu pagamento para acessar o sistema</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Resumo do Pedido */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Resumo do Pedido</h2>

            {/* Plano */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Plano Profissional</h3>
                  <p className="text-sm text-gray-400">Acesso completo ao sistema</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-400">R$109<span className="text-xl">,90</span></div>
                  <div className="text-sm text-gray-400">por mês</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Agenda inteligente
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Controle de estoque
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Gestão de pacientes
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Relatórios avançados
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400" />
                  Suporte prioritário
                </div>
              </div>
            </div>

            {/* Dados do Usuário */}
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
                {userData.clinicName && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Clínica:</span>
                    <span className="text-white font-medium">{userData.clinicName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Subtotal:</span>
                <span className="text-white">R$ 109,90</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-white">Total:</span>
                <span className="text-orange-400">R$ 109,90/mês</span>
              </div>
            </div>
          </div>

          {/* Formulário de Pagamento */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Dados de Pagamento</h2>
                <p className="text-sm text-gray-400">Pagamento seguro e criptografado</p>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              {/* Método de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Método de Pagamento
                </label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors">
                  <option>Cartão de Crédito</option>
                  <option>PIX</option>
                  <option>Boleto</option>
                </select>
              </div>

              {/* Número do Cartão */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número do Cartão
                </label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Validade */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* CVV */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="000"
                    maxLength={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Nome no Cartão */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome no Cartão
                </label>
                <input
                  type="text"
                  placeholder="Nome como está no cartão"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CPF do Titular
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              {/* Segurança */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Pagamento 100% Seguro</p>
                    <p className="text-xs text-gray-400">Seus dados são criptografados e protegidos</p>
                  </div>
                </div>
              </div>

              {/* Botão de Pagamento */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : 'Confirmar Pagamento - R$ 109,90'}
              </button>

              <p className="text-xs text-center text-gray-400">
                Ao confirmar o pagamento, você concorda com nossos{' '}
                <span className="text-orange-400 hover:text-orange-300 cursor-pointer">termos de uso</span>
                {' '}e{' '}
                <span className="text-orange-400 hover:text-orange-300 cursor-pointer">política de privacidade</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
