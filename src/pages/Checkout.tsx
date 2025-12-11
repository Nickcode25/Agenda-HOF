import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Check, Lock, ArrowLeft, AlertCircle } from 'lucide-react'
import { Elements } from '@stripe/react-stripe-js'
import { useAuth } from '@/store/auth'
import { PLAN_PRICE, getStripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { supabaseAnon } from '@/lib/supabaseAnon'
import { createSubscription } from '@/services/stripeService'
import { invalidateSubscriptionCache } from '@/components/SubscriptionProtectedRoute'
import StripePaymentForm from './checkout/components/StripePaymentForm'
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

  // Dados do cartão (apenas nome e CPF, o resto é gerenciado pelo Stripe)
  const [cardName, setCardName] = useState('')
  const [cardCpf, setCardCpf] = useState('')

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
  const discountMultiplier = 1 - couponDiscount / 100
  const discountedPrice = planPrice * discountMultiplier
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

      if (coupon.valid_until) {
        const expiryDate = new Date(coupon.valid_until)
        if (expiryDate < new Date()) {
          setCouponError('Este cupom expirou')
          return
        }
      }

      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        setCouponError('Este cupom atingiu o limite de usos')
        return
      }

      if (coupon.discount_percentage >= 100) {
        setCouponError('Desconto inválido')
        return
      }

      const priceAfterDiscount = planPrice * (1 - coupon.discount_percentage / 100)
      if (priceAfterDiscount < MINIMUM_SUBSCRIPTION_VALUE) {
        setCouponError(`Desconto deixa o valor abaixo do mínimo (R$ ${MINIMUM_SUBSCRIPTION_VALUE.toFixed(2)})`)
        return
      }

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

  const removeCoupon = () => {
    setCouponCode('')
    setCouponDiscount(0)
    setCouponSuccess(false)
    setValidatedCouponId(null)
    setCouponError('')
  }

  const registerCouponUsage = async (couponId: string, orderAmount: number) => {
    try {
      await supabase.rpc('increment_coupon_usage', { coupon_id: couponId })
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

  // Handler para o pagamento com Stripe
  const handleStripePayment = async (paymentMethodId: string) => {
    try {
      setLoading(true)
      setError('')

      // Validar CPF (11 dígitos)
      const cpfNumbers = cardCpf.replace(/\D/g, '')
      if (cpfNumbers.length !== 11) {
        throw new Error('CPF inválido')
      }

      // Criar conta do usuário ANTES de fazer o pagamento (apenas se não existir)
      if (!userData!.existingUser) {
        console.log('👤 Criando conta do usuário...')

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
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log('💳 Processando pagamento com Stripe...')
      console.log('💰 Valor final com desconto:', finalPrice)
      if (couponDiscount > 0) {
        console.log('🎟️ Cupom aplicado:', couponCode, '- Desconto:', couponDiscount + '%')
      }

      // Criar assinatura recorrente com Stripe
      const subscriptionResponse = await createSubscription({
        customerEmail: userData!.email,
        customerName: userData!.name,
        paymentMethodId: paymentMethodId,
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

        // Determinar o tipo do plano baseado no nome do plano selecionado
        // IMPORTANTE: Usar o nome do plano, NÃO o preço (que pode ter desconto)
        const determinePlanType = (name: string): string => {
          const nameLower = (name || '').toLowerCase()
          console.log('🔍 determinePlanType - nome recebido:', name, '-> lower:', nameLower)

          if (nameLower.includes('premium') || nameLower.includes('completo')) {
            console.log('✅ Plano identificado como PREMIUM')
            return 'premium'
          } else if (nameLower.includes('profissional') || nameLower.includes('pro')) {
            console.log('✅ Plano identificado como PRO')
            return 'pro'
          } else if (nameLower.includes('básico') || nameLower.includes('basico') || nameLower.includes('basic')) {
            console.log('✅ Plano identificado como BASIC')
            return 'basic'
          }

          // Fallback: usar o preço ORIGINAL (não o com desconto) para determinar
          console.log('⚠️ Nome não reconhecido, usando preço para fallback. Preço:', planPrice)
          if (planPrice >= 99) {
            console.log('✅ Fallback: PREMIUM (preço >= 99)')
            return 'premium'
          }
          if (planPrice >= 79) {
            console.log('✅ Fallback: PRO (preço >= 79)')
            return 'pro'
          }
          console.log('✅ Fallback: BASIC (preço < 79)')
          return 'basic'
        }

        // GARANTIR que temos um nome de plano válido
        const finalPlanName = planName || userData?.selectedPlan?.name || 'Plano Premium'
        const finalPlanType = determinePlanType(finalPlanName)

        console.log('💾 Dados a serem salvos:')
        console.log('  - plan_name:', finalPlanName)
        console.log('  - plan_type:', finalPlanType)
        console.log('  - plan_amount:', planPrice)

        const { data: insertData, error: insertError } = await supabase.from('user_subscriptions').insert({
          user_id: userData2.user.id,
          stripe_subscription_id: subscriptionResponse.subscriptionId,
          stripe_customer_id: subscriptionResponse.customerId,
          status: 'active',
          plan_name: finalPlanName,
          plan_type: finalPlanType,
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
        } else {
          console.log('✅ Assinatura salva com sucesso!', insertData)
        }
      } else {
        console.error('❌ Usuário não encontrado após criar conta!')
      }

      // IMPORTANTE: Invalidar o cache de assinatura para que a nova assinatura seja reconhecida
      invalidateSubscriptionCache()
      console.log('🔄 Cache de assinatura invalidado')

      // Sucesso! Mostrar modal bonito
      setSubscriptionData({
        cardLastDigits: subscriptionResponse.cardLastDigits,
        amount: finalPrice,
        nextBillingDate: subscriptionResponse.nextBillingDate
      })
      setShowSuccessModal(true)

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

  const stripePromise = getStripe()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/planos')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <div className="p-2.5 group-hover:bg-white group-hover:shadow-md rounded-xl transition-all border border-transparent group-hover:border-gray-200">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Voltar aos planos</span>
          </button>

          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
            <Lock className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Pagamento Seguro</span>
          </div>
        </div>

        {/* Título da página */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Finalizar Assinatura</h1>
          <p className="text-gray-500">Complete seu pagamento para ter acesso imediato</p>
        </div>

        {/* Banner informativo para usuário já logado */}
        {userData?.existingUser && (
          <div className="bg-white border border-green-200 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 font-semibold">Ativação da Assinatura</h3>
                <p className="text-sm text-gray-500">
                  Você está ativando o <span className="font-medium text-orange-600">{planName}</span>. Acesso liberado após o pagamento!
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-red-700 font-semibold mb-1">Erro no Pagamento</h3>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
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

          {stripePromise && (
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                cardName={cardName}
                setCardName={setCardName}
                cardCpf={cardCpf}
                setCardCpf={setCardCpf}
                formatCPF={formatCPF}
                loading={loading}
                isFinalPriceTooLow={isFinalPriceTooLow}
                finalPrice={finalPrice}
                onSubmit={handleStripePayment}
              />
            </Elements>
          )}
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
