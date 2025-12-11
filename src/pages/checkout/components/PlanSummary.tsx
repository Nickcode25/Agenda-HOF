import { Check, Tag, X, AlertCircle, User, Mail, Crown, Zap, BarChart3 } from 'lucide-react'
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
    <div className="space-y-4">
      {/* Card do Plano - Destaque Principal */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">{planName}</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-gray-500 text-sm">Valor mensal</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">R$ {planPrice.toFixed(2).replace('.', ',')}</span>
                <span className="text-gray-400 text-sm">/mês</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <Crown className="w-7 h-7 text-orange-600" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm text-gray-700">Sistema completo para Harmonização Orofacial</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm text-gray-700">Gestão de pacientes e profissionais</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-sm text-gray-700">Dashboard com analytics em tempo real</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dados do Usuário */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-gray-600" />
          </div>
          Dados da Conta
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <User className="w-4 h-4 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Nome</p>
              <p className="text-gray-900 font-medium truncate">{userData.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Mail className="w-4 h-4 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Email</p>
              <p className="text-gray-900 font-medium truncate">{userData.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cupom e Total */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-5 space-y-4">
        {/* Campo de Cupom */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Cupom de desconto</span>
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
                placeholder="Digite o código"
                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400 uppercase text-sm font-medium"
                disabled={couponLoading}
              />
              <button
                onClick={validateCoupon}
                disabled={!couponCode || couponLoading}
                className="px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm"
              >
                {couponLoading ? '...' : 'Aplicar'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-green-700 font-bold text-sm">{couponCode}</span>
                <span className="text-green-600 text-xs bg-green-100 px-2 py-0.5 rounded-full">-{couponDiscount}%</span>
              </div>
              <button
                onClick={removeCoupon}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {couponError && (
            <p className="text-red-500 text-xs mt-2">{couponError}</p>
          )}
        </div>

        {/* Divisor */}
        <div className="border-t border-gray-100"></div>

        {/* Total */}
        <div className="space-y-2">
          {couponDiscount > 0 && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="text-gray-500">R$ {planPrice.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600">Desconto:</span>
                <span className="text-green-600">- R$ {((planPrice * couponDiscount) / 100).toFixed(2).replace('.', ',')}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-900 font-bold">Total mensal:</span>
            <span className={`text-2xl font-bold ${isFinalPriceTooLow ? "text-red-500" : "text-orange-500"}`}>
              R$ {finalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Aviso de valor muito baixo */}
        {isFinalPriceTooLow && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">
                O valor mínimo é R$ {minimumSubscriptionValue.toFixed(2)}. Use outro cupom ou remova o atual.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
