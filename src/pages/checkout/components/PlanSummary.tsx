import { Check, Tag, X, AlertCircle } from 'lucide-react'
import { PLAN_PRICE } from '@/lib/mercadopago'

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
  return (
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
                  O Mercado Pago pode recusar pagamentos inferiores a R$ {minimumSubscriptionValue.toFixed(2)}.
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
  )
}
