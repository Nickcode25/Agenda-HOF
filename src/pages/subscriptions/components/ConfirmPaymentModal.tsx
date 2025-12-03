import { X, CheckCircle, CreditCard, Banknote, Smartphone, Building2, FileText } from 'lucide-react'

interface ConfirmPaymentModalProps {
  isOpen: boolean
  confirmPaymentMethod: string
  onConfirmPaymentMethodChange: (method: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

const paymentMethods = [
  { value: 'PIX', label: 'PIX', icon: Smartphone },
  { value: 'Cartão de Crédito', label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'Cartão de Débito', label: 'Cartão de Débito', icon: CreditCard },
  { value: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'Transferência', label: 'Transferência', icon: Building2 },
  { value: 'Cheque', label: 'Cheque', icon: FileText },
]

export default function ConfirmPaymentModal({
  isOpen,
  confirmPaymentMethod,
  onConfirmPaymentMethodChange,
  onSubmit,
  onClose
}: ConfirmPaymentModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Confirmar Pagamento</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const isSelected = confirmPaymentMethod === method.value
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => onConfirmPaymentMethodChange(method.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-medium ${
                      isSelected
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} className={isSelected ? 'text-green-600' : 'text-gray-400'} />
                    <span>{method.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-emerald-600" size={18} />
              </div>
              <div className="text-sm">
                <p className="font-medium text-emerald-800 mb-0.5">Confirmar recebimento</p>
                <p className="text-emerald-600">
                  O pagamento será marcado como recebido e a próxima cobrança será agendada automaticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              Confirmar Pagamento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
