import { Link } from 'react-router-dom'
import { X, Package, AlertTriangle } from 'lucide-react'
import { Procedure } from '@/store/procedures'
import { StockItem } from '@/types/stock'
import { formatCurrency } from '@/utils/currency'
import SearchableSelect from '@/components/SearchableSelect'

interface AddProcedureModalProps {
  isOpen: boolean
  selectedProcedure: string
  procedureNotes: string
  procedureQuantity: number
  quantityInput: string
  paymentType: 'cash' | 'installment'
  paymentMethod: 'cash' | 'pix' | 'card'
  installments: number
  customValue: string
  isEditingValue: boolean
  procedures: Procedure[]
  stockItems: StockItem[]
  onProcedureChange: (value: string) => void
  onNotesChange: (value: string) => void
  onQuantityChange: (value: string) => void
  onQuantityBlur: () => void
  onPaymentTypeChange: (type: 'cash' | 'installment') => void
  onPaymentMethodChange: (method: 'cash' | 'pix' | 'card') => void
  onInstallmentsChange: (value: number) => void
  onCustomValueFocus: () => void
  onCustomValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClose: () => void
  onAdd: () => void
}

export default function AddProcedureModal({
  isOpen,
  selectedProcedure,
  procedureNotes,
  procedureQuantity,
  quantityInput,
  paymentType,
  paymentMethod,
  installments,
  customValue,
  isEditingValue,
  procedures,
  stockItems,
  onProcedureChange,
  onNotesChange,
  onQuantityChange,
  onQuantityBlur,
  onPaymentTypeChange,
  onPaymentMethodChange,
  onInstallmentsChange,
  onCustomValueFocus,
  onCustomValueChange,
  onClose,
  onAdd
}: AddProcedureModalProps) {
  if (!isOpen) return null

  // Obter categoria e produtos disponíveis do procedimento selecionado
  const selectedProcedureData = procedures.find(p => p.name === selectedProcedure)
  const availableProducts = selectedProcedureData?.category
    ? stockItems.filter(item => item.category === selectedProcedureData.category)
    : []

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Adicionar Procedimento</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento *</label>
                <SearchableSelect
                  options={procedures.filter(p => p.isActive).map(proc => ({
                    value: proc.name,
                    label: proc.name
                  }))}
                  value={selectedProcedure}
                  onChange={onProcedureChange}
                  placeholder="Selecione um procedimento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantityInput}
                  onChange={(e) => onQuantityChange(e.target.value)}
                  onBlur={onQuantityBlur}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
                <SearchableSelect
                  options={[
                    { value: 'cash', label: 'Valor à Vista' },
                    { value: 'installment', label: 'Parcelado' }
                  ]}
                  value={paymentType}
                  onChange={(value) => onPaymentTypeChange(value as 'cash' | 'installment')}
                  placeholder="Selecione a forma"
                />
              </div>

              {paymentType === 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento</label>
                  <SearchableSelect
                    options={[
                      { value: 'cash', label: 'Dinheiro' },
                      { value: 'pix', label: 'PIX' }
                    ]}
                    value={paymentMethod}
                    onChange={(value) => onPaymentMethodChange(value as 'cash' | 'pix' | 'card')}
                    placeholder="Selecione o método"
                  />
                </div>
              )}

              {paymentType === 'installment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Parcelas (Cartão de Crédito)</label>
                  <SearchableSelect
                    options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => ({
                      value: num.toString(),
                      label: `${num}x ${num === 1 ? '(à vista)' : ''}`
                    }))}
                    value={installments.toString()}
                    onChange={(value) => onInstallmentsChange(Number(value))}
                    placeholder="Selecione as parcelas"
                  />
                </div>
              )}

              <div className={paymentType === 'cash' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-300 mb-2">Valor Total</label>
                <input
                  type="text"
                  value={isEditingValue ? customValue : (() => {
                    const selectedProc = procedures.find(p => p.name === selectedProcedure)
                    let unitValue = selectedProc?.price || 0

                    return formatCurrency(procedureQuantity * unitValue)
                  })()}
                  onFocus={onCustomValueFocus}
                  onChange={onCustomValueChange}
                  placeholder="R$ 0,00"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-green-400 font-bold text-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">Edite para aplicar desconto ou ajuste manual</p>
              </div>
            </div>

            {/* Mostrar categoria e produtos disponíveis */}
            {selectedProcedureData && (
              <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <Package size={18} className="text-orange-500" />
                  <h4 className="font-medium text-white">
                    Categoria: {selectedProcedureData.category || 'Não definida'}
                  </h4>
                </div>

                {selectedProcedureData.category ? (
                  availableProducts.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-400 mb-3">
                        Produtos disponíveis nesta categoria:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableProducts.map(product => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-3 bg-gray-600/50 rounded-lg border border-gray-500"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                Estoque: {product.quantity} {product.unit}
                              </p>
                            </div>
                            <div
                              className={`ml-2 w-2 h-2 rounded-full ${
                                product.quantity > product.minQuantity
                                  ? 'bg-green-500'
                                  : product.quantity > 0
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              title={
                                product.quantity > product.minQuantity
                                  ? 'Em estoque'
                                  : product.quantity > 0
                                  ? 'Estoque baixo'
                                  : 'Sem estoque'
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        💡 O produto específico será escolhido automaticamente no momento da realização do procedimento
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <AlertTriangle size={16} className="text-yellow-500" />
                      <p className="text-sm text-yellow-500">
                        Nenhum produto cadastrado na categoria "{selectedProcedureData.category}".{' '}
                        <Link to="/app/estoque/novo" className="underline hover:text-yellow-400">
                          Cadastrar produto
                        </Link>
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <AlertTriangle size={16} className="text-blue-400" />
                    <p className="text-sm text-blue-400">
                      Este procedimento não possui categoria definida.{' '}
                      <Link
                        to={`/app/procedimentos/${selectedProcedureData.id}/editar`}
                        className="underline hover:text-blue-300"
                      >
                        Editar procedimento
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Observações (opcional)</label>
              <textarea
                value={procedureNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Ex: região frontal, aplicação suave..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onAdd}
            disabled={!selectedProcedure}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40"
          >
            Adicionar Procedimento
          </button>
        </div>
      </div>
    </div>
  )
}
