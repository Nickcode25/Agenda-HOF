import React, { useState, useEffect } from 'react'
import { X, CreditCard } from 'lucide-react'
import SearchableSelect from '@/components/SearchableSelect'
import DateInput from '@/components/DateInput'
import { usePatients } from '@/store/patients'
import { PlannedProcedure } from '@/types/patient'

interface InstallmentPaymentModalProps {
  isOpen: boolean
  patientId: string
  patientName: string
  onClose: () => void
  onSuccess: () => void
}

export default function InstallmentPaymentModal({
  isOpen,
  patientId,
  patientName,
  onClose,
  onSuccess
}: InstallmentPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'card'>('pix')
  const [customValue, setCustomValue] = useState('')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const update = usePatients(s => s.update)
  const patient = usePatients(s => s.patients.find(p => p.id === patientId))

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && !e.shiftKey && customValue) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          handleAdd()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, customValue])

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('pix')
      setCustomValue('')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setDescription('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numbers = value.replace(/\D/g, '')

    if (!numbers) {
      setCustomValue('R$ 0,00')
      return
    }

    const cents = Number(numbers) / 100
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents)

    setCustomValue(formatted)
  }

  const parseCurrencyValue = (value: string): number => {
    const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.')
    return parseFloat(cleanValue) || 0
  }

  const handleAdd = async () => {
    const amount = parseCurrencyValue(customValue)
    if (amount <= 0 || !patient) return

    // Registrar como procedimento "Pagamento de parcela" já concluído
    const performedAtISO = paymentDate ? new Date(paymentDate + 'T12:00:00').toISOString() : new Date().toISOString()

    const newProcedure: PlannedProcedure = {
      id: crypto.randomUUID(),
      procedureName: description || 'Pagamento de parcela',
      quantity: 1,
      unitValue: amount,
      totalValue: amount,
      paymentType: 'cash',
      paymentMethod: paymentMethod === 'card' ? 'credit_card_1x' : paymentMethod,
      installments: 1,
      status: 'completed',
      notes: '',
      createdAt: new Date().toISOString(),
      performedAt: performedAtISO,
      completedAt: performedAtISO
    }

    const currentPlanned = patient.plannedProcedures || []
    await update(patientId, {
      plannedProcedures: [...currentPlanned, newProcedure]
    })

    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CreditCard size={24} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Adicionar pagamento de parcela
            </h2>
          </div>
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
            {/* Data de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data do Pagamento</label>
              <DateInput
                value={paymentDate}
                onChange={setPaymentDate}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              />
            </div>

            {/* Método de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
              <SearchableSelect
                options={[
                  { value: 'cash', label: 'Dinheiro' },
                  { value: 'pix', label: 'PIX' },
                  { value: 'card', label: 'Cartão' }
                ]}
                value={paymentMethod}
                onChange={(value) => setPaymentMethod(value as 'cash' | 'pix' | 'card')}
                placeholder="Selecione o método"
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor da Parcela</label>
              <input
                type="text"
                value={customValue}
                onChange={handleValueChange}
                placeholder="R$ 0,00"
                className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-600 font-bold text-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição (opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Pagamento de parcela - ${patientName}`}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                rows={2}
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
            disabled={parseCurrencyValue(customValue) <= 0}
            className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/40"
          >
            Adicionar Pagamento
          </button>
        </div>
      </div>
    </div>
  )
}
