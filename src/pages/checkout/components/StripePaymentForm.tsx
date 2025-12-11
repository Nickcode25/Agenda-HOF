import { useState } from 'react'
import { CreditCard, Lock, Shield, User, Calendar, KeyRound } from 'lucide-react'
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { StripeCardNumberElementChangeEvent, StripeCardExpiryElementChangeEvent, StripeCardCvcElementChangeEvent } from '@stripe/stripe-js'

interface StripePaymentFormProps {
  cardName: string
  setCardName: (value: string) => void
  cardCpf: string
  setCardCpf: (value: string) => void
  formatCPF: (value: string) => string
  loading: boolean
  isFinalPriceTooLow: boolean
  finalPrice: number
  onSubmit: (paymentMethodId: string) => Promise<void>
}

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: '500',
      '::placeholder': {
        color: '#9ca3af',
      },
      iconColor: '#f97316',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
}

export default function StripePaymentForm({
  cardName,
  setCardName,
  cardCpf,
  setCardCpf,
  formatCPF,
  loading,
  isFinalPriceTooLow,
  finalPrice,
  onSubmit
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardError, setCardError] = useState<string | null>(null)
  const [cardNumberComplete, setCardNumberComplete] = useState(false)
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false)
  const [cardCvcComplete, setCardCvcComplete] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  const cardComplete = cardNumberComplete && cardExpiryComplete && cardCvcComplete

  const handleCardNumberChange = (event: StripeCardNumberElementChangeEvent) => {
    setCardNumberComplete(event.complete)
    if (event.error) {
      setCardError(event.error.message)
    } else {
      setCardError(null)
    }
  }

  const handleCardExpiryChange = (event: StripeCardExpiryElementChangeEvent) => {
    setCardExpiryComplete(event.complete)
    if (event.error) {
      setCardError(event.error.message)
    } else {
      setCardError(null)
    }
  }

  const handleCardCvcChange = (event: StripeCardCvcElementChangeEvent) => {
    setCardCvcComplete(event.complete)
    if (event.error) {
      setCardError(event.error.message)
    } else {
      setCardError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      console.error('Stripe não carregado')
      return
    }

    const cardNumberElement = elements.getElement(CardNumberElement)
    if (!cardNumberElement) {
      console.error('CardNumberElement não encontrado')
      return
    }

    setProcessingPayment(true)
    setCardError(null)

    try {
      // Criar PaymentMethod no cliente
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: cardName,
        },
      })

      if (error) {
        console.error('Erro ao criar PaymentMethod:', error)
        setCardError(error.message || 'Erro ao processar cartão')
        setProcessingPayment(false)
        return
      }

      if (!paymentMethod) {
        setCardError('Erro ao criar método de pagamento')
        setProcessingPayment(false)
        return
      }

      console.log('✅ PaymentMethod criado:', paymentMethod.id)

      // Chamar callback com o paymentMethodId
      await onSubmit(paymentMethod.id)
    } catch (err: any) {
      console.error('Erro no pagamento:', err)
      setCardError(err.message || 'Erro ao processar pagamento')
    } finally {
      setProcessingPayment(false)
    }
  }

  const isLoading = loading || processingPayment

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      {/* Header com gradiente laranja */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Pagamento Seguro</h2>
            <p className="text-sm text-orange-100">Seus dados estão protegidos</p>
          </div>
          <div className="ml-auto">
            <Shield className="w-8 h-8 text-white/80" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Nome no Cartão */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <User className="w-4 h-4 text-orange-500" />
            Nome no Cartão
          </label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Nome completo como está no cartão"
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            required
          />
        </div>

        {/* CPF */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Shield className="w-4 h-4 text-orange-500" />
            CPF do Titular
          </label>
          <input
            type="text"
            value={cardCpf}
            onChange={(e) => setCardCpf(formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            required
          />
        </div>

        {/* Número do Cartão */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <CreditCard className="w-4 h-4 text-orange-500" />
            Número do Cartão
          </label>
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
            <CardNumberElement
              options={ELEMENT_OPTIONS}
              onChange={handleCardNumberChange}
            />
          </div>
        </div>

        {/* Data de Validade e CVV lado a lado */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              Validade
            </label>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
              <CardExpiryElement
                options={ELEMENT_OPTIONS}
                onChange={handleCardExpiryChange}
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <KeyRound className="w-4 h-4 text-orange-500" />
              CVV
            </label>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
              <CardCvcElement
                options={ELEMENT_OPTIONS}
                onChange={handleCardCvcChange}
              />
            </div>
          </div>
        </div>

        {/* Erro do cartão */}
        {cardError && (
          <p className="text-red-500 text-sm flex items-center gap-1">
            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
            {cardError}
          </p>
        )}

        {/* Selo de Segurança */}
        <div className="flex items-center justify-center gap-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lock className="w-4 h-4 text-green-500" />
            <span>SSL Seguro</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Stripe</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CreditCard className="w-4 h-4 text-green-500" />
            <span>PCI DSS</span>
          </div>
        </div>

        {/* Botão de Submit */}
        <button
          type="submit"
          disabled={isLoading || isFinalPriceTooLow || !cardComplete || !stripe}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.01] active:scale-[0.99]"
          title={isFinalPriceTooLow ? 'Valor muito baixo - Remova ou use outro cupom' : ''}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processando pagamento...
            </span>
          ) : isFinalPriceTooLow ? (
            'Valor muito baixo para processar'
          ) : (
            `Assinar por R$ ${finalPrice.toFixed(2).replace('.', ',')}/mês`
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          Você terá acesso imediato após a confirmação do pagamento
        </p>
      </form>
    </div>
  )
}
