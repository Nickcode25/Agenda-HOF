import { Check, Tag, X, AlertCircle } from 'lucide-react'
import { PLAN_PRICE } from '@/lib/stripe'

interface PlanSummaryProps {
  userData: {
    name: string
    email: string
    phone: string
    password: string
    existingUser?: boolean
    selectedPlan?: {
      id: string
      name: string
      price: number
      duration_months: number
    }
  }
  couponCode: string
  setCouponCode: (value: string) => void
  couponLoading: boolean
  couponError: string
  setCouponError: (value: string) => void
  couponSuccess: boolean
  couponDiscount: number
  validateCoupon: () => void
  removeCoupon: () => void
  finalPrice: number
  isFinalPriceTooLow: boolean
  minimumSubscriptionValue: number
}

export default function PlanSummary({
  userData,
  couponCode,
  setCouponCode,
  couponLoading,
  couponError,
  setCouponError,
  couponSuccess,
  couponDiscount,
  validateCoupon,
  removeCoupon,
  finalPrice,
  isFinalPriceTooLow,
  minimumSubscriptionValue
}: PlanSummaryProps) {
  // Usar preço do plano selecionado ou preço padrão
  const planPrice = userData.selectedPlan?.price || PLAN_PRICE
  const planName = userData.selectedPlan?.name || 'Plano Premium'

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Resumo do Pedido</h2>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{planName}</h3>
            <p className="text-sm text-gray-500">Acesso completo ao sistema</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-orange-500">
              R${Math.floor(planPrice)}
              <span className="text-xl">,{(planPrice % 1).toFixed(2).substring(2)}</span>
            </div>
            <div className="text-sm text-gray-500">por mês</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-green-500" />
            Sistema completo para Harmonização Orofacial
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-green-500" />
            Gestão de pacientes e profissionais
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="w-4 h-4 text-green-500" />
            Dashboard com analytics em tempo real
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 mb-3">Seus Dados</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Nome:</span>
            <span className="text-gray-900 font-medium">{userData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email:</span>
            <span className="text-gray-900 font-medium">{userData.email}</span>
          </div>
        </div>
      </div>

      {/* Campo de Cupom de Desconto */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-5 h-5 text-green-600" />
          <h3 className="text-sm font-semibold text-green-700">Cupom de Desconto</h3>
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
              placeholder="DIGITE SEU CUPOM"
              className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-gray-400 uppercase"
              disabled={couponLoading}
            />
            <button
              onClick={validateCoupon}
              disabled={!couponCode || couponLoading}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
            >
              {couponLoading ? 'Validando...' : 'Aplicar'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-green-100 border border-green-300 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">{couponCode} aplicado!</span>
            </div>
            <button
              onClick={removeCoupon}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {couponError && (
          <p className="text-red-500 text-sm mt-2">{couponError}</p>
        )}
        {couponSuccess && (
          <p className="text-green-600 text-sm mt-2">
            Desconto de {couponDiscount}% aplicado!
          </p>
        )}
      </div>

      {/* Cálculo do Total */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        {couponDiscount > 0 && (
          <>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Subtotal:</span>
              <span className="text-gray-700">R$ {planPrice.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-600">Desconto ({couponDiscount}%):</span>
              <span className="text-green-600">- R$ {((planPrice * couponDiscount) / 100).toFixed(2).replace('.', ',')}</span>
            </div>
          </>
        )}
        <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total:</span>
          <span className={isFinalPriceTooLow ? "text-red-500" : "text-orange-500"}>
            R$ {finalPrice.toFixed(2).replace('.', ',')}/mês
          </span>
        </div>

        {/* Aviso de valor muito baixo */}
        {isFinalPriceTooLow && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-600">Valor muito baixo</p>
                <p className="text-red-500 mt-1">
                  O Stripe pode recusar pagamentos inferiores a R$ {minimumSubscriptionValue.toFixed(2)}.
                  O cupom aplicado resulta em um valor muito baixo (R$ {finalPrice.toFixed(2)}).
                </p>
                <p className="text-red-500 mt-1">
                  Por favor, use um cupom com desconto menor ou remova o cupom.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
