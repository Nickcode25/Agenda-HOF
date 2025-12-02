import React from 'react'
import { Link } from 'react-router-dom'
import { X, Package, AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { Procedure } from '@/store/procedures'
import { StockItem } from '@/types/stock'
import { PaymentSplit } from '@/types/patient'
import { formatCurrency, parseCurrency } from '@/utils/currency'
import SearchableSelect from '@/components/SearchableSelect'
import DateInput from '@/components/DateInput'

interface AddProcedureModalProps {
  isOpen: boolean
  selectedProcedure: string
  procedureNotes: string
  procedureQuantity: number
  quantityInput: string
  paymentType: 'cash' | 'installment'
  paymentMethod: 'cash' | 'pix' | 'card' | 'credit_card_1x' | 'debit_card'
  installments: number
  customValue: string
  isEditingValue: boolean
  performedAt: string
  procedures: Procedure[]
  stockItems: StockItem[]
  onProcedureChange: (value: string) => void
  onNotesChange: (value: string) => void
  onQuantityChange: (value: string) => void
  onQuantityBlur: () => void
  onPaymentTypeChange: (type: 'cash' | 'installment') => void
  onPaymentMethodChange: (method: 'cash' | 'pix' | 'card' | 'credit_card_1x' | 'debit_card') => void
  onInstallmentsChange: (value: number) => void
  onCustomValueFocus: () => void
  onCustomValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPerformedAtChange: (value: string) => void
  onClose: () => void
  onAdd: (paymentSplits?: PaymentSplit[]) => void
  // Props para modo de edição
  isEditMode?: boolean
  editingProcedureId?: string
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
  performedAt,
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
  onPerformedAtChange,
  onClose,
  onAdd,
  isEditMode = false,
  editingProcedureId
}: AddProcedureModalProps) {
  const [useMultiplePayments, setUseMultiplePayments] = React.useState(false)
  const [paymentSplits, setPaymentSplits] = React.useState<PaymentSplit[]>([
    { method: 'pix', amount: 0 }
  ])
  const [splitValues, setSplitValues] = React.useState<string[]>([''])

  if (!isOpen) return null

  // Obter categoria e produtos disponíveis do procedimento selecionado
  const selectedProcedureData = procedures.find(p => p.name === selectedProcedure)
  const availableProducts = selectedProcedureData?.category
    ? stockItems.filter(item => item.category === selectedProcedureData.category)
    : []

  // Calcular valor total do procedimento
  const totalValue = isEditingValue
    ? parseCurrency(customValue)
    : procedureQuantity * (selectedProcedureData?.price || 0)

  // Calcular total dos pagamentos parciais
  const totalPaid = paymentSplits.reduce((sum, split) => sum + split.amount, 0)
  const remaining = totalValue - totalPaid

  const addPaymentSplit = () => {
    setPaymentSplits([...paymentSplits, { method: 'pix', amount: 0 }])
    setSplitValues([...splitValues, ''])
  }

  const removePaymentSplit = (index: number) => {
    if (paymentSplits.length > 1) {
      setPaymentSplits(paymentSplits.filter((_, i) => i !== index))
      setSplitValues(splitValues.filter((_, i) => i !== index))
    }
  }

  const updatePaymentSplit = (index: number, field: keyof PaymentSplit, value: any) => {
    const updated = [...paymentSplits]
    updated[index] = { ...updated[index], [field]: value }
    setPaymentSplits(updated)
  }

  const handleSplitValueChange = (index: number, value: string) => {
    // Remover tudo exceto dígitos
    const digits = value.replace(/\D/g, '')

    // Formatar como moeda
    const amount = Number(digits) / 100
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)

    // Atualizar o valor de exibição
    const newSplitValues = [...splitValues]
    newSplitValues[index] = formatted
    setSplitValues(newSplitValues)

    // Atualizar o valor numérico para os cálculos
    updatePaymentSplit(index, 'amount', amount)
  }

  const formatCurrencyInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    const amount = Number(numbers) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const handleAdd = () => {
    if (useMultiplePayments) {
      onAdd(paymentSplits)
    } else {
      onAdd()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar Procedimento' : 'Adicionar Procedimento'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Procedimento *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={quantityInput}
                  onChange={(e) => onQuantityChange(e.target.value)}
                  onBlur={onQuantityBlur}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Realização</label>
                <DateInput
                  value={performedAt}
                  onChange={onPerformedAtChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Informe a data em que o procedimento foi realizado para o relatório financeiro</p>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useMultiplePayments}
                    onChange={(e) => setUseMultiplePayments(e.target.checked)}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Usar múltiplas formas de pagamento
                  </span>
                </label>
              </div>

              {!useMultiplePayments && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
                      <SearchableSelect
                        options={[
                          { value: 'cash', label: 'Dinheiro' },
                          { value: 'pix', label: 'PIX' },
                          { value: 'credit_card_1x', label: 'Cartão de Crédito 1x (à vista)' },
                          { value: 'debit_card', label: 'Cartão de Débito (à vista)' }
                        ]}
                        value={paymentMethod}
                        onChange={(value) => onPaymentMethodChange(value as 'cash' | 'pix' | 'card' | 'credit_card_1x' | 'debit_card')}
                        placeholder="Selecione o método"
                      />
                    </div>
                  )}

                  {paymentType === 'installment' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Parcelas (Cartão de Crédito)</label>
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
                </>
              )}

              {useMultiplePayments && (
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Formas de Pagamento</label>
                    <button
                      type="button"
                      onClick={addPaymentSplit}
                      className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  </div>

                  {paymentSplits.map((split, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Método</label>
                          <SearchableSelect
                            options={[
                              { value: 'cash', label: 'Dinheiro' },
                              { value: 'pix', label: 'PIX' },
                              { value: 'card', label: 'Cartão' }
                            ]}
                            value={split.method}
                            onChange={(value) => updatePaymentSplit(index, 'method', value)}
                            placeholder="Selecione"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Valor</label>
                          <input
                            type="text"
                            value={splitValues[index] || ''}
                            onChange={(e) => handleSplitValueChange(index, e.target.value)}
                            placeholder="R$ 0,00"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                          />
                        </div>
                        {split.method === 'card' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Parcelas</label>
                            <SearchableSelect
                              options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => ({
                                value: num.toString(),
                                label: `${num}x`
                              }))}
                              value={(split.installments || 1).toString()}
                              onChange={(value) => updatePaymentSplit(index, 'installments', Number(value))}
                              placeholder="1x"
                            />
                          </div>
                        )}
                      </div>
                      {paymentSplits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentSplit(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-5"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Total pago:</p>
                      <p className="text-xs text-gray-500">Valor total: {formatCurrency(totalValue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(totalPaid)}</p>
                      {remaining !== 0 && (
                        <p className={`text-xs font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {remaining > 0 ? `Faltam ${formatCurrency(remaining)}` : `Excedeu ${formatCurrency(Math.abs(remaining))}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className={!useMultiplePayments && paymentType === 'cash' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor Total</label>
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
                  className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-600 font-bold text-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Edite para aplicar desconto ou ajuste manual</p>
              </div>
            </div>

            {/* Mostrar categoria e produtos disponíveis */}
            {selectedProcedureData && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Package size={18} className="text-orange-500" />
                  <h4 className="font-medium text-gray-900">
                    Categoria: {selectedProcedureData.category || 'Não definida'}
                  </h4>
                </div>

                {selectedProcedureData.category ? (
                  availableProducts.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        Produtos disponíveis nesta categoria:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableProducts.map(product => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500">
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
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle size={16} className="text-yellow-600" />
                      <p className="text-sm text-yellow-700">
                        Nenhum produto cadastrado na categoria "{selectedProcedureData.category}".{' '}
                        <Link to="/app/estoque/novo" className="underline hover:text-yellow-600">
                          Cadastrar produto
                        </Link>
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertTriangle size={16} className="text-blue-600" />
                    <p className="text-sm text-blue-700">
                      Este procedimento não possui categoria definida.{' '}
                      <Link
                        to={`/app/procedimentos/${selectedProcedureData.id}/editar`}
                        className="underline hover:text-blue-600"
                      >
                        Editar procedimento
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
              <textarea
                value={procedureNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Ex: região frontal, aplicação suave..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors border border-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedProcedure || (useMultiplePayments && remaining !== 0)}
            className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40"
          >
            {isEditMode ? 'Salvar Alterações' : 'Adicionar Procedimento'}
          </button>
        </div>
      </div>
    </div>
  )
}
