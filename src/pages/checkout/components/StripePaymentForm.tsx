import { useState } from 'react'
import { CreditCard, Lock } from 'lucide-react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js'

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

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
      iconColor: '#6b7280',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
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
  const [cardComplete, setCardComplete] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  const handleCardChange = (event: StripeCardElementChangeEvent) => {
    setCardComplete(event.complete)
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

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      console.error('CardElement não encontrado')
      return
    }

    setProcessingPayment(true)
    setCardError(null)

    try {
      // Criar PaymentMethod no cliente
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
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
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <CreditCard className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pagamento Seguro</h2>
          <p className="text-sm text-gray-500">Pagamento seguro e criptografado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome no Cartão */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome no Cartão</label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Nome como está no cartão"
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          />
        </div>

        {/* Stripe Card Element */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dados do Cartão</label>
          <div className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-4 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={handleCardChange}
            />
          </div>
          {cardError && (
            <p className="text-red-500 text-sm mt-2">{cardError}</p>
          )}
        </div>

        {/* CPF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CPF do Titular</label>
          <input
            type="text"
            value={cardCpf}
            onChange={(e) => setCardCpf(formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          />
        </div>

        {/* Segurança */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">Pagamento 100% Seguro</p>
              <p className="text-xs text-gray-500">Processado pelo Stripe com criptografia SSL</p>
            </div>
          </div>
        </div>

        {/* Botão de Submit */}
        <button
          type="submit"
          disabled={isLoading || isFinalPriceTooLow || !cardComplete || !stripe}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          title={isFinalPriceTooLow ? 'Valor muito baixo - Remova ou use outro cupom' : ''}
        >
          {isLoading
            ? 'Processando...'
            : isFinalPriceTooLow
              ? 'Valor muito baixo para processar'
              : `Assinar por R$ ${finalPrice.toFixed(2).replace('.', ',')}/mês`
          }
        </button>

        <p className="text-xs text-center text-gray-500 italic">
          Após o pagamento, você terá acesso imediato ao sistema
        </p>
      </form>
    </div>
  )
}
