import { Procedure } from '@/store/procedures'
import { formatCurrency } from '@/utils/currency'

interface AddProcedureInlineFormProps {
  selectedProcedure: string
  procedureNotes: string
  procedureQuantity: number
  paymentType: 'cash' | 'installment'
  procedures: Procedure[]
  onProcedureChange: (value: string) => void
  onNotesChange: (value: string) => void
  onQuantityChange: (value: number) => void
  onPaymentTypeChange: (type: 'cash' | 'installment') => void
  onSubmit: () => void
  onCancel: () => void
}

export default function AddProcedureInlineForm({
  selectedProcedure,
  procedureNotes,
  procedureQuantity,
  paymentType,
  procedures,
  onProcedureChange,
  onNotesChange,
  onQuantityChange,
  onPaymentTypeChange,
  onSubmit,
  onCancel
}: AddProcedureInlineFormProps) {
  return (
    <div className="px-6 pb-4">
      <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento</label>
            <select
              value={selectedProcedure}
              onChange={(e) => onProcedureChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="">Selecione um procedimento</option>
              {procedures.filter(proc => proc.isActive).map(proc => (
                <option key={proc.id} value={proc.name}>
                  {proc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
            <input
              type="number"
              min="1"
              value={procedureQuantity}
              onChange={(e) => onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
            <select
              value={paymentType}
              onChange={(e) => onPaymentTypeChange(e.target.value as 'cash' | 'installment')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="cash">Valor à Vista</option>
              <option value="installment">Parcelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Valor Total</label>
            <div className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-green-400 text-sm font-medium">
              {(() => {
                const selectedProc = procedures.find(p => p.name === selectedProcedure)
                const unitValue = selectedProc?.price || 0
                return formatCurrency(procedureQuantity * unitValue)
              })()}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
          <input
            type="text"
            value={procedureNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Ex: região frontal, aplicação suave..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={!selectedProcedure}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Adicionar
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
