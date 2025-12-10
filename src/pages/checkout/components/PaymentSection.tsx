import { CreditCard, Lock } from 'lucide-react'

interface PaymentSectionProps {
  cardNumber: string
  setCardNumber: (value: string) => void
  formatCardNumber: (value: string) => string
  cardBrand: string
  cardExpiry: string
  setCardExpiry: (value: string) => void
  formatExpiry: (value: string) => string
  cardCvv: string
  setCardCvv: (value: string) => void
  cardName: string
  setCardName: (value: string) => void
  cardCpf: string
  setCardCpf: (value: string) => void
  formatCPF: (value: string) => string
  loading: boolean
  isFinalPriceTooLow: boolean
  finalPrice: number
  onSubmit: (e: React.FormEvent) => void
}

export default function PaymentSection({
  cardNumber,
  setCardNumber,
  formatCardNumber,
  cardBrand,
  cardExpiry,
  setCardExpiry,
  formatExpiry,
  cardCvv,
  setCardCvv,
  cardName,
  setCardName,
  cardCpf,
  setCardCpf,
  formatCPF,
  loading,
  isFinalPriceTooLow,
  finalPrice,
  onSubmit
}: PaymentSectionProps) {
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

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Número do Cartão</label>
          <div className="relative">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 pr-16 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
            {cardBrand && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-xs font-semibold px-2 py-1 bg-gray-200 text-gray-700 rounded uppercase">
                  {cardBrand === 'visa' && 'Visa'}
                  {cardBrand === 'mastercard' && 'Master'}
                  {cardBrand === 'elo' && 'Elo'}
                  {cardBrand === 'amex' && 'Amex'}
                  {cardBrand === 'hipercard' && 'Hiper'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Validade</label>
            <input
              type="text"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              placeholder="MM/AA"
              maxLength={5}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
            <input
              type="text"
              value={cardCvv}
              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
              placeholder="000"
              maxLength={4}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome no Cartão</label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
          />
        </div>
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

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">Pagamento 100% Seguro</p>
              <p className="text-xs text-gray-500">Processado pelo Stripe com criptografia SSL</p>
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
          Após o pagamento, você terá acesso imediato ao sistema
        </p>
      </form>
    </div>
  )
}
