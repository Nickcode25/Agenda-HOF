import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, Lock, ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { PLAN_PRICE } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { supabaseAnon } from '@/lib/supabaseAnon'
import { createSubscription } from '@/services/stripeService'
import PaymentSection from './checkout/components/PaymentSection'
import PlanSummary from './checkout/components/PlanSummary'
import SuccessModal from './checkout/components/SuccessModal'

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
  const planName = userData?.selectedPlan?.name || 'Plano Premium'

  // Debug: Log do plano recebido
  useEffect(() => {
    if (userData?.selectedPlan) {
      console.log('💰 Checkout - Plano recebido:', userData.selectedPlan)
      console.log('💰 Checkout - Preço do plano:', planPrice)
    }
  }, [userData, planPrice])

  // Validar valor mínimo (Stripe pode recusar valores muito baixos)
  const MINIMUM_SUBSCRIPTION_VALUE = 10.00

  // Calcular preço final com desconto (arredondado para 2 casas decimais)
  // Primeiro calcula o desconto, depois arredonda uma única vez
  const discountMultiplier = 1 - couponDiscount / 100
  const discountedPrice = planPrice * discountMultiplier
  // Garantir que nunca seja menor que o mínimo ou negativo
  const finalPrice = Math.max(MINIMUM_SUBSCRIPTION_VALUE, Math.round(discountedPrice * 100) / 100)

  const isFinalPriceTooLow = discountedPrice < MINIMUM_SUBSCRIPTION_VALUE

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

      // Validar desconto não pode ser >= 100%
      if (coupon.discount_percentage >= 100) {
        setCouponError('Desconto inválido')
        return
      }

      // Validar se o preço final não fica abaixo do mínimo
      const priceAfterDiscount = planPrice * (1 - coupon.discount_percentage / 100)
      if (priceAfterDiscount < MINIMUM_SUBSCRIPTION_VALUE) {
        setCouponError(`Desconto deixa o valor abaixo do mínimo (R$ ${MINIMUM_SUBSCRIPTION_VALUE.toFixed(2)})`)
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

      // Extrair mês e ano do cartão
      const [month, year] = cardExpiry.split('/')
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        throw new Error('Data de validade inválida')
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

      console.log('💳 Processando pagamento com Stripe...')
      console.log('💰 Valor final com desconto:', finalPrice)
      if (couponDiscount > 0) {
        console.log('🎟️ Cupom aplicado:', couponCode, '- Desconto:', couponDiscount + '%')
      }

      // Criar assinatura recorrente com Stripe
      // O backend processa os dados do cartão de forma segura
      const subscriptionResponse = await createSubscription({
        customerEmail: userData!.email,
        customerName: userData!.name,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardExpMonth: parseInt(month),
        cardExpYear: parseInt(`20${year}`),
        cardCvc: cardCvv,
        amount: finalPrice,
        planName: planName,
        planId: userData?.selectedPlan?.id,
        couponId: validatedCouponId || undefined,
        discountPercentage: couponDiscount > 0 ? couponDiscount : undefined,
      })

      console.log('📊 Resposta do Stripe:', subscriptionResponse)

      if (!subscriptionResponse.success) {
        console.error('❌ Pagamento não aprovado!', subscriptionResponse.error)
        throw new Error(subscriptionResponse.error || 'Pagamento não foi aprovado. Verifique os dados do cartão e tente novamente.')
      }

      console.log('✅ Assinatura criada com sucesso!')
      console.log('Subscription ID:', subscriptionResponse.subscriptionId)

      // Registrar uso de cupom se houver
      if (validatedCouponId) {
        await registerCouponUsage(validatedCouponId, finalPrice)
      }

      // Salvar assinatura no banco de dados
      const { data: userData2 } = await supabase.auth.getUser()
      if (userData2.user) {
        console.log('💾 Salvando assinatura no banco de dados...')
        console.log('User ID:', userData2.user.id)
        console.log('Subscription ID:', subscriptionResponse.subscriptionId)

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
          stripe_subscription_id: subscriptionResponse.subscriptionId,
          stripe_customer_id: subscriptionResponse.customerId,
          status: 'active',
          plan_amount: planPrice,
          billing_cycle: 'MONTHLY',
          next_billing_date: subscriptionResponse.nextBillingDate,
          payment_method: 'CREDIT_CARD',
          card_last_digits: subscriptionResponse.cardLastDigits,
          card_brand: subscriptionResponse.cardBrand,
          coupon_id: validatedCouponId,
          discount_percentage: couponDiscount,
        })

        if (insertError) {
          console.error('❌ Erro ao salvar assinatura:', insertError)
          console.error('❌ Erro completo:', JSON.stringify(insertError, null, 2))
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Compacto */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/planos')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <div className="p-2 group-hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">Pagamento Seguro</span>
          </div>
        </div>

        {/* Banner informativo para usuário já logado */}
        {userData?.existingUser && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-green-700 font-semibold mb-1">Ativação da Assinatura</h3>
                <p className="text-sm text-gray-600">
                  Você está prestes a ativar sua assinatura {planName}. Após o pagamento, seu acesso será liberado imediatamente!
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-700 font-semibold mb-1">Erro no Pagamento</h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <PlanSummary
            userData={userData}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            couponLoading={couponLoading}
            couponError={couponError}
            setCouponError={setCouponError}
            couponSuccess={couponSuccess}
            couponDiscount={couponDiscount}
            validateCoupon={validateCoupon}
            removeCoupon={removeCoupon}
            finalPrice={finalPrice}
            isFinalPriceTooLow={isFinalPriceTooLow}
            minimumSubscriptionValue={MINIMUM_SUBSCRIPTION_VALUE}
          />

          <PaymentSection
            cardNumber={cardNumber}
            setCardNumber={setCardNumber}
            formatCardNumber={formatCardNumber}
            cardBrand={cardBrand}
            cardExpiry={cardExpiry}
            setCardExpiry={setCardExpiry}
            formatExpiry={formatExpiry}
            cardCvv={cardCvv}
            setCardCvv={setCardCvv}
            cardName={cardName}
            setCardName={setCardName}
            cardCpf={cardCpf}
            setCardCpf={setCardCpf}
            formatCPF={formatCPF}
            loading={loading}
            isFinalPriceTooLow={isFinalPriceTooLow}
            finalPrice={finalPrice}
            onSubmit={handleCardPayment}
          />
        </div>
      </div>

      <SuccessModal
        show={showSuccessModal}
        subscriptionData={subscriptionData}
        onNavigate={() => navigate('/app/agenda')}
      />
    </div>
  )
}
