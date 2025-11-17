import { X, Save, Trash2 } from 'lucide-react'
import { PaymentMethod } from '@/types/cash'

interface EditTransactionModalProps {
  editForm: {
    description: string
    amount: number
    paymentMethod: PaymentMethod
  }
  onDescriptionChange: (value: string) => void
  onAmountChange: (value: number) => void
  onPaymentMethodChange: (value: PaymentMethod) => void
  onCancel: () => void
  onSave: () => void
  onDelete: () => void
}

export default function EditTransactionModal({
  editForm,
  onDescriptionChange,
  onAmountChange,
  onPaymentMethodChange,
  onCancel,
  onSave,
  onDelete
}: EditTransactionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Editar Transação</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <input
              type="text"
              value={editForm.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={editForm.amount}
              onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            />
          </div>

          {/* Método de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
            <select
              value={editForm.paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            >
              <option value="pix">PIX</option>
              <option value="cash">Dinheiro</option>
              <option value="card">Cartão</option>
              <option value="transfer">Transferência</option>
              <option value="check">Cheque</option>
            </select>
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col gap-3 mt-6">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
            >
              <Save size={18} />
              Salvar
            </button>
          </div>
          <button
            onClick={onDelete}
            className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Trash2 size={18} />
            Excluir Transação
          </button>
        </div>
      </div>
    </div>
  )
}
