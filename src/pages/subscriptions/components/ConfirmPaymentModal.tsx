import { X, CheckCircle } from 'lucide-react'

interface ConfirmPaymentModalProps {
  isOpen: boolean
  confirmPaymentMethod: string
  onConfirmPaymentMethodChange: (method: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

export default function ConfirmPaymentModal({
  isOpen,
  confirmPaymentMethod,
  onConfirmPaymentMethodChange,
  onSubmit,
  onClose
}: ConfirmPaymentModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Confirmar Pagamento</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento *</label>
            <select
              required
              value={confirmPaymentMethod}
              onChange={(e) => onConfirmPaymentMethodChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
            >
              <option value="PIX">PIX</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Transferência">Transferência</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <CheckCircle className="text-blue-400 flex-shrink-0" size={20} />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">Confirmar recebimento</p>
                <p>O pagamento será marcado como recebido e a próxima cobrança será agendada automaticamente.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Confirmar Pagamento
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
