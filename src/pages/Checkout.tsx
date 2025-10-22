import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, CreditCard, Lock, ArrowLeft, AlertCircle, QrCode, Download, X, Tag } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { PLAN_PRICE } from '@/lib/pagbank'
import { supabase } from '@/lib/supabase'
import {
  createPixOrder,
  createCardOrder,
  createBoletoOrder,
  createSubscription,
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

  // Cupom de desconto
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState(false)
  const [validatedCouponId, setValidatedCouponId] = useState<string | null>(null)

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

  // Calcular preço final com desconto
  const finalPrice = PLAN_PRICE * (1 - couponDiscount / 100)

  // Validar cupom
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom')
      return
    }

    try {
      setCouponLoading(true)
      setCouponError('')
      setCouponSuccess(false)

      // Criar um cliente temporário sem autenticação para buscar cupons públicos
      const { createClient } = await import('@supabase/supabase-js')
      const anonClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      )

      // Buscar cupom no banco usando cliente anônimo
      const { data: coupon, error } = await anonClient
        .from('discount_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        console.error('Erro ao buscar cupom:', error)
        setCouponError('Cupom inválido')
        return
      }

      // Validar se está ativo
      if (!coupon.is_active) {
        setCouponError('Este cupom não está mais ativo')
        return
      }

      // Validar data de validade
      if (coupon.valid_until) {
        const expiryDate = new Date(coupon.valid_until)
        if (expiryDate < new Date()) {
          setCouponError('Este cupom expirou')
          return
        }
      }

      // Validar número de usos
      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        setCouponError('Este cupom atingiu o limite de usos')
        return
      }

      // Cupom válido!
      setCouponDiscount(coupon.discount_percentage)
      setCouponSuccess(true)
      setValidatedCouponId(coupon.id)
      setCouponError('')
    } catch (error: any) {
      console.error('Erro ao validar cupom:', error)
      setCouponError('Erro ao validar cupom. Tente novamente.')
    } finally {
      setCouponLoading(false)
    }
  }

  // Remover cupom
  const removeCoupon = () => {
    setCouponCode('')
    setCouponDiscount(0)
    setCouponSuccess(false)
    setValidatedCouponId(null)
    setCouponError('')
  }

  // Registrar uso do cupom
  const registerCouponUsage = async (couponId: string, orderAmount: number) => {
    try {
      // Incrementar contador de usos
      await supabase.rpc('increment_coupon_usage', { coupon_id: couponId })

      // Registrar uso na tabela coupon_usage
      await supabase.from('coupon_usage').insert({
        coupon_id: couponId,
        user_email: userData!.email,
        order_amount: orderAmount,
        discount_amount: orderAmount * (couponDiscount / 100)
      })
    } catch (error) {
      console.error('Erro ao registrar uso do cupom:', error)
    }
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

      // 🔄 CRIAR ASSINATURA RECORRENTE (Cobrança automática mensal)
      const subscriptionResponse = await createSubscription({
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

      // Registrar uso de cupom se houver
      if (validatedCouponId) {
        await registerCouponUsage(validatedCouponId, finalPrice)
      }

      // Salvar assinatura no banco de dados
      const { data: userData2 } = await supabase.auth.getUser()
      if (userData2.user) {
        await supabase.from('user_subscriptions').insert({
          user_id: userData2.user.id,
          pagbank_subscription_id: subscriptionResponse.id,
          status: 'active',
          plan_amount: finalPrice,
          billing_cycle: 'MONTHLY',
          next_billing_date: subscriptionResponse.nextBillingDate,
          payment_method: 'CREDIT_CARD',
          card_last_digits: subscriptionResponse.cardLastDigits,
          card_brand: subscriptionResponse.cardBrand,
          coupon_id: validatedCouponId,
          discount_percentage: couponDiscount,
        })
      }

      // Sucesso!
      alert(`
🎉 Assinatura criada com sucesso!

💳 Cartão: **** **** **** ${subscriptionResponse.cardLastDigits}
💰 Valor mensal: R$ ${finalPrice.toFixed(2)}
📅 Próxima cobrança: ${new Date(subscriptionResponse.nextBillingDate).toLocaleDateString('pt-BR')}

✅ Sua conta foi criada e o acesso está liberado!
🔄 Você será cobrado automaticamente todo mês no mesmo cartão.
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
    console.log('handlePayment called - Payment Method:', paymentMethod)
    console.log('Final Price with discount:', finalPrice)

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
    <div className="min-h-screen bg-gray-900 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Compacto */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <div className="p-2 group-hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Pagamento Seguro</span>
          </div>
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

        <div className="grid lg:grid-cols-2 gap-6">
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

            {/* Campo de Cupom de Desconto */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-semibold text-green-400">Cupom de Desconto</h3>
              </div>

              {!couponSuccess ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase())
                      setCouponError('')
                    }}
                    placeholder="Digite seu cupom"
                    className="flex-1 bg-gray-700/50 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-gray-500 uppercase"
                    disabled={couponLoading}
                  />
                  <button
                    onClick={validateCoupon}
                    disabled={!couponCode || couponLoading}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
                  >
                    {couponLoading ? 'Validando...' : 'Aplicar'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">{couponCode} aplicado!</span>
                  </div>
                  <button
                    onClick={() => {
                      setCouponCode('')
                      setCouponDiscount(0)
                      setCouponSuccess(false)
                      setValidatedCouponId(null)
                    }}
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-red-400 text-sm mt-2">{couponError}</p>
              )}
              {couponSuccess && (
                <p className="text-green-400 text-sm mt-2">
                  Desconto de {couponDiscount}% aplicado!
                </p>
              )}
            </div>

            {/* Cálculo do Total */}
            <div className="border-t border-gray-700 pt-4 space-y-2">
              {couponDiscount > 0 && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-gray-300">R$ {PLAN_PRICE.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-400">Desconto ({couponDiscount}%):</span>
                    <span className="text-green-400">- R$ {((PLAN_PRICE * couponDiscount) / 100).toFixed(2).replace('.', ',')}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-700/50">
                <span className="text-white">Total:</span>
                <span className="text-orange-400">
                  R$ {(PLAN_PRICE - (PLAN_PRICE * couponDiscount / 100)).toFixed(2).replace('.', ',')}/mês
                </span>
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
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processando...' : `Pagar R$ ${finalPrice.toFixed(2).replace('.', ',')}`}
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
