import { X } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import SearchableSelect from '@/components/SearchableSelect'

interface MentorshipModalProps {
  show: boolean
  mentorshipType: 'enrollment' | 'mentorship'
  paymentType: 'cash' | 'installment'
  setPaymentType: (value: 'cash' | 'installment') => void
  paymentMethod: 'cash' | 'pix' | 'card'
  setPaymentMethod: (value: 'cash' | 'pix' | 'card') => void
  installments: number
  setInstallments: (value: number) => void
  mentorshipQuantity: number
  customValue: string
  isEditingValue: boolean
  setIsEditingValue: (value: boolean) => void
  setCustomValue: (value: string) => void
  handleCustomValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  mentorshipNotes: string
  setMentorshipNotes: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

export default function MentorshipModal({
  show,
  mentorshipType,
  paymentType,
  setPaymentType,
  paymentMethod,
  setPaymentMethod,
  installments,
  setInstallments,
  mentorshipQuantity,
  customValue,
  isEditingValue,
  setIsEditingValue,
  setCustomValue,
  handleCustomValueChange,
  mentorshipNotes,
  setMentorshipNotes,
  onClose,
  onSubmit
}: MentorshipModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mentorshipType === 'enrollment' ? 'Inscrição Mentoria' : 'Adicionar Mentoria'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                <SearchableSelect
                  options={[
                    { value: 'cash', label: 'Valor à Vista' },
                    { value: 'installment', label: 'Parcelado' }
                  ]}
                  value={paymentType}
                  onChange={(value) => {
                    const newType = value as 'cash' | 'installment'
                    setPaymentType(newType)
                    if (newType === 'cash') {
                      setPaymentMethod('cash')
                      setInstallments(1)
                    } else {
                      setPaymentMethod('card')
                    }
                  }}
                  placeholder="Selecione a forma"
                />
              </div>
            </div>

            {paymentType === 'cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
                <SearchableSelect
                  options={[
                    { value: 'cash', label: 'Dinheiro' },
                    { value: 'pix', label: 'PIX' }
                  ]}
                  value={paymentMethod}
                  onChange={(value) => setPaymentMethod(value as 'cash' | 'pix' | 'card')}
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
                  onChange={(value) => setInstallments(Number(value))}
                  placeholder="Selecione as parcelas"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor Total</label>
              <input
                type="text"
                value={customValue || formatCurrency(0)}
                onFocus={() => {
                  if (!customValue) {
                    setCustomValue(formatCurrency(0))
                  }
                  setIsEditingValue(true)
                }}
                onChange={handleCustomValueChange}
                placeholder="R$ 0,00"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-green-600 font-bold text-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Digite o valor da mentoria</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observações (opcional)</label>
              <textarea
                value={mentorshipNotes}
                onChange={(e) => setMentorshipNotes(e.target.value)}
                placeholder="Ex: modalidade, cronograma..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40"
          >
            {mentorshipType === 'enrollment' ? 'Adicionar Inscrição' : 'Adicionar Mentoria'}
          </button>
        </div>
      </div>
    </div>
  )
}
