import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, CreditCard, Lock, ArrowLeft, AlertCircle, X, Tag } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { PLAN_PRICE, MERCADOPAGO_PUBLIC_KEY } from '@/lib/mercadopago'
import { supabase } from '@/lib/supabase'
import { supabaseAnon } from '@/lib/supabaseAnon'
import { createSubscription, type SubscriptionResponse } from '@/services/mercadopagoService'

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState<any>(null)

  // Dados do cartão
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardCpf, setCardCpf] = useState('')
  const [cardBrand, setCardBrand] = useState<string>('')

  // Cupom de desconto
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState(false)
  const [validatedCouponId, setValidatedCouponId] = useState<string | null>(null)

  // Dados do usuário vindos do formulário de cadastro ou pricing page
  const userData = location.state as {
    name: string
    email: string
    phone: string
    password: string
    existingUser?: boolean // Flag para indicar que usuário já existe
    selectedPlan?: {
      id: string
      name: string
      price: number
      duration_months: number
    }
  } | null

  useEffect(() => {
    if (!userData) {
      navigate('/')
    }
  }, [userData, navigate])

  // Detectar bandeira do cartão
  const detectCardBrand = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '')

    if (/^4/.test(cleanNumber)) return 'visa'
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard'
    if (/^3[47]/.test(cleanNumber)) return 'amex'
    if (/^6(?:011|5)/.test(cleanNumber)) return 'discover'
    if (/^35/.test(cleanNumber)) return 'jcb'
    if (/^36|38/.test(cleanNumber)) return 'diners'
    if (/^50|^60|^63|^67/.test(cleanNumber)) return 'elo'
    if (/^62/.test(cleanNumber)) return 'unionpay'
    if (/^60|^65/.test(cleanNumber)) return 'hipercard'

    return ''
  }

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const brand = detectCardBrand(numbers)
    setCardBrand(brand)
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

  // Usar preço do plano selecionado ou preço padrão
  const planPrice = userData?.selectedPlan?.price || PLAN_PRICE

  // Debug: Log do plano recebido
  useEffect(() => {
    if (userData?.selectedPlan) {
      console.log('💰 Checkout - Plano recebido:', userData.selectedPlan)
      console.log('💰 Checkout - Preço do plano:', planPrice)
    }
  }, [userData, planPrice])

  // Calcular preço final com desconto (arredondado para 2 casas decimais)
  const finalPrice = Math.round(planPrice * (1 - couponDiscount / 100) * 100) / 100

  // Validar valor mínimo (Mercado Pago pode recusar valores muito baixos)
  const MINIMUM_SUBSCRIPTION_VALUE = 10.00
  const isFinalPriceTooLow = finalPrice < MINIMUM_SUBSCRIPTION_VALUE

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

      console.log('🔍 Validando cupom:', couponCode.toUpperCase())

      // Usar cliente anônimo dedicado para buscar cupons (usuário ainda não tem conta)
      const { data: coupon, error } = await supabaseAnon
        .from('discount_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        console.error('❌ Cupom não encontrado:', error)
        setCouponError('Cupom inválido')
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

  // Criar token de cartão usando SDK do Mercado Pago
  const createCardToken = async (): Promise<string> => {
    try {
      // Extrair mês e ano
      const [month, year] = cardExpiry.split('/')
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        throw new Error('Data de validade inválida')
      }

      // Garantir que o SDK está disponível
      if (!(window as any).MercadoPago) {
        throw new Error('SDK do Mercado Pago não carregado. Recarregue a página.')
      }

      // Inicializar Mercado Pago com a Public Key
      const mp = new (window as any).MercadoPago(MERCADOPAGO_PUBLIC_KEY, {
        locale: 'pt-BR'
      })

      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardName,
        cardExpirationMonth: month,
        cardExpirationYear: `20${year}`,
        securityCode: cardCvv,
        identificationType: 'CPF',
        identificationNumber: cardCpf.replace(/\D/g, '')
      }

      console.log('📝 Dados do cartão (sem números sensíveis):', {
        cardholderName: cardData.cardholderName,
        cardExpirationMonth: cardData.cardExpirationMonth,
        cardExpirationYear: cardData.cardExpirationYear,
        identificationType: cardData.identificationType,
        identificationNumber: cardData.identificationNumber.substring(0, 3) + '...'
      })

      const response = await mp.createCardToken(cardData)

      if (response.error) {
        console.error('❌ Erro do Mercado Pago:', response.error)
        throw new Error(response.error.message || 'Erro ao criar token do cartão')
      }

      console.log('✅ Token criado com sucesso!')
      return response.id
    } catch (error: any) {
      console.error('❌ Erro ao criar token:', error)
      throw new Error(error.message || 'Erro ao processar dados do cartão')
    }
  }

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError('')

      // Validar campos do cartão
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv || !cardCpf) {
        throw new Error('Preencha todos os campos do cartão')
      }

      // Validar CPF (11 dígitos)
      const cpfNumbers = cardCpf.replace(/\D/g, '')
      if (cpfNumbers.length !== 11) {
        throw new Error('CPF inválido')
      }

      // Criar conta do usuário ANTES de fazer o pagamento (apenas se não existir)
      if (!userData!.existingUser) {
        console.log('👤 Criando conta do usuário...')

        // Criar conta diretamente com Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: userData!.email,
          password: userData!.password,
          options: {
            data: {
              full_name: userData!.name
            }
          }
        })

        if (signUpError || !signUpData.user) {
          throw new Error(signUpError?.message || 'Erro ao criar conta. Tente novamente.')
        }

        console.log('✅ Conta criada com sucesso! User ID:', signUpData.user.id)

        // Aguardar um momento para garantir que a sessão foi persistida
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log('💳 Criando token do cartão...')

      // Criar token do cartão
      const cardToken = await createCardToken()

      console.log('✅ Token criado:', cardToken)
      console.log('🔄 Criando assinatura recorrente...')
      console.log('💰 Valor final com desconto:', finalPrice)
      if (couponDiscount > 0) {
        console.log('🎟️ Cupom aplicado:', couponCode, '- Desconto:', couponDiscount + '%')
      }

      // Criar assinatura recorrente com valor final (incluindo desconto)
      const subscriptionResponse = await createSubscription({
        customerEmail: userData!.email,
        customerName: userData!.name,
        customerPhone: userData!.phone,
        customerCpf: cardCpf.replace(/\D/g, ''),
        cardToken: cardToken,
        amount: finalPrice, // 🎟️ Envia valor com desconto aplicado
      })

      console.log('✅ Assinatura criada:', subscriptionResponse)
      console.log('📊 Status da assinatura:', subscriptionResponse.status)

      // Validar se o pagamento foi aprovado antes de ativar
      const isApproved = subscriptionResponse.status === 'authorized' || subscriptionResponse.status === 'approved'

      if (!isApproved) {
        console.error('❌ Pagamento não aprovado! Status:', subscriptionResponse.status)
        throw new Error('Pagamento não foi aprovado. Verifique os dados do cartão e tente novamente.')
      }

      // Registrar uso de cupom se houver
      if (validatedCouponId) {
        await registerCouponUsage(validatedCouponId, finalPrice)
      }

      // Salvar assinatura no banco de dados SOMENTE se aprovada
      const { data: userData2 } = await supabase.auth.getUser()
      if (userData2.user) {
        console.log('💾 Salvando assinatura no banco de dados...')
        console.log('User ID:', userData2.user.id)
        console.log('Subscription ID:', subscriptionResponse.id)
        console.log('✅ Status aprovado:', subscriptionResponse.status)

        // Atualizar metadados do usuário com CPF e telefone
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            cpf: cardCpf.replace(/\D/g, ''),
            phone: userData!.phone
          }
        })

        if (updateError) {
          console.error('⚠️ Erro ao atualizar metadados do usuário:', updateError)
        } else {
          console.log('✅ CPF e telefone salvos nos metadados do usuário')
        }

        const { data: insertData, error: insertError } = await supabase.from('user_subscriptions').insert({
          user_id: userData2.user.id,
          mercadopago_subscription_id: subscriptionResponse.id,
          status: 'active', // Só chega aqui se isApproved === true
          plan_amount: PLAN_PRICE, // ✅ SEMPRE salvar valor cheio do plano (99.90), não o valor com desconto
          billing_cycle: 'MONTHLY',
          next_billing_date: subscriptionResponse.nextBillingDate,
          payment_method: 'CREDIT_CARD',
          card_last_digits: subscriptionResponse.cardLastDigits,
          card_brand: subscriptionResponse.cardBrand,
          coupon_id: validatedCouponId,
          discount_percentage: couponDiscount, // Desconto é salvo aqui, não no plan_amount
        })

        if (insertError) {
          console.error('❌ Erro ao salvar assinatura:', insertError)
          console.error('❌ Erro completo:', JSON.stringify(insertError, null, 2))
          console.error('❌ Mensagem:', insertError.message)
          console.error('❌ Código:', insertError.code)
          console.error('❌ Detalhes:', insertError.details)
        } else {
          console.log('✅ Assinatura salva com sucesso!', insertData)
        }
      } else {
        console.error('❌ Usuário não encontrado após criar conta!')
      }

      // Sucesso! Mostrar modal bonito
      setSubscriptionData({
        cardLastDigits: subscriptionResponse.cardLastDigits,
        amount: finalPrice,
        nextBillingDate: subscriptionResponse.nextBillingDate
      })
      setShowSuccessModal(true)

      // Redirecionar automaticamente após 3 segundos
      setTimeout(() => {
        navigate('/app/agenda')
      }, 3000)

    } catch (err: any) {
      setError(err.message || 'Erro ao processar cartão')
      console.error('Erro Cartão:', err)
    } finally {
      setLoading(false)
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

        {/* Banner informativo para usuário já logado */}
        {userData?.existingUser && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-blue-400 font-semibold mb-1">Ativação da Assinatura</h3>
                <p className="text-sm text-gray-300">
                  Você está prestes a ativar sua assinatura Premium. Após o pagamento, seu acesso será liberado imediatamente!
                </p>
              </div>
            </div>
          </div>
        )}

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
                    onClick={removeCoupon}
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
                <span className={isFinalPriceTooLow ? "text-red-400" : "text-orange-400"}>
                  R$ {finalPrice.toFixed(2).replace('.', ',')}/mês
                </span>
              </div>

              {/* Aviso de valor muito baixo */}
              {isFinalPriceTooLow && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-red-400">Valor muito baixo</p>
                      <p className="text-red-300 mt-1">
                        O Mercado Pago pode recusar pagamentos inferiores a R$ {MINIMUM_SUBSCRIPTION_VALUE.toFixed(2)}.
                        O cupom aplicado resulta em um valor muito baixo (R$ {finalPrice.toFixed(2)}).
                      </p>
                      <p className="text-red-300 mt-1">
                        Por favor, use um cupom com desconto menor ou remova o cupom.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Formulário de Pagamento */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Pagamento via Mercado Pago</h2>
                <p className="text-sm text-gray-400">Pagamento seguro e criptografado</p>
              </div>
            </div>

            <form onSubmit={handleCardPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Número do Cartão</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pr-16 text-white"
                    required
                  />
                  {cardBrand && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-600 text-white rounded uppercase">
                        {cardBrand === 'visa' && '💳 Visa'}
                        {cardBrand === 'mastercard' && '💳 Master'}
                        {cardBrand === 'elo' && '💳 Elo'}
                        {cardBrand === 'amex' && '💳 Amex'}
                        {cardBrand === 'hipercard' && '💳 Hiper'}
                      </span>
                    </div>
                  )}
                </div>
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

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Pagamento 100% Seguro</p>
                    <p className="text-xs text-gray-400">Processado pelo Mercado Pago com criptografia SSL</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || isFinalPriceTooLow}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isFinalPriceTooLow ? 'Valor muito baixo - Remova ou use outro cupom' : ''}
              >
                {loading ? 'Processando...' : isFinalPriceTooLow ? 'Valor muito baixo para processar' : `Assinar por R$ ${finalPrice.toFixed(2).replace('.', ',')}/mês`}
              </button>

              <p className="text-xs text-center text-gray-500 italic">
                💡 Após o pagamento, você terá acesso imediato ao sistema
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de Sucesso */}
      {showSuccessModal && subscriptionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-green-500/50 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-green-500/20 animate-scaleIn">
            {/* Ícone de Sucesso */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6">
                  <Check className="w-16 h-16 text-white" strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Título */}
            <h2 className="text-3xl font-bold text-center text-white mb-2">
              Assinatura Criada!
            </h2>
            <p className="text-center text-gray-400 mb-6">
              Bem-vindo ao Agenda+ HOF
            </p>

            {/* Informações da Assinatura */}
            <div className="bg-gray-700/50 rounded-2xl p-6 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Cartão</p>
                    <p className="text-white font-medium">**** **** **** {subscriptionData.cardLastDigits}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-600 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Valor mensal:</span>
                  <span className="text-2xl font-bold text-green-400">
                    R$ {subscriptionData.amount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Próxima cobrança:</span>
                  <span className="text-white font-medium">
                    {new Date(subscriptionData.nextBillingDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Mensagens de Sucesso */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Sua conta foi criada e o acesso está liberado!</p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300">Você será cobrado automaticamente todo mês</p>
              </div>
            </div>

            {/* Botão de Ação */}
            <button
              onClick={() => navigate('/app/agenda')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/30"
            >
              Acessar o Sistema
            </button>

            <p className="text-center text-xs text-gray-500 mt-4">
              Redirecionando automaticamente em 3 segundos...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
