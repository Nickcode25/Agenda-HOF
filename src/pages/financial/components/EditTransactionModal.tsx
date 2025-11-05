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
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Editar Transação</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
            <input
              type="text"
              value={editForm.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={editForm.amount}
              onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Método de Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
            <select
              value={editForm.paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Salvar
            </button>
          </div>
          <button
            onClick={onDelete}
            className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Excluir Transação
          </button>
        </div>
      </div>
    </div>
  )
}
