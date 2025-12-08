import { useEffect } from 'react'
import { X } from 'lucide-react'
import { PlannedProcedure } from '@/types/patient'

interface EditValueModalProps {
  isOpen: boolean
  procedure: PlannedProcedure | null
  editedValue: string
  editedDescription: string
  onValueChange: (value: string) => void
  onDescriptionChange: (description: string) => void
  onSave: () => void
  onClose: () => void
}

export default function EditValueModal({
  isOpen,
  procedure,
  editedValue,
  editedDescription,
  onValueChange,
  onDescriptionChange,
  onSave,
  onClose
}: EditValueModalProps) {
  useEffect(() => {
    if (!isOpen || !procedure) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          onSave()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, procedure, onClose, onSave])

  if (!isOpen || !procedure) return null

  const handleValueInput = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '')
    const formatted = (parseInt(numbersOnly || '0') / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    onValueChange(formatted)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Editar Valor do Procedimento</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <p className="text-sm text-gray-400 mb-2">Procedimento</p>
            <p className="text-white font-medium">{procedure.procedureName}</p>
            <p className="text-sm text-gray-400 mt-1">Quantidade: {procedure.quantity}x</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Valor Total (R$) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={editedValue}
              onChange={(e) => handleValueInput(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="0,00"
            />
            <p className="text-xs text-gray-400 mt-1">
              💡 Digite apenas números. Ex: digite "10000" para R$ 100,00
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Observações do Procedimento (opcional)
            </label>
            <textarea
              value={editedDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              placeholder="Ex: Pagamento antecipado de R$ 100,00 para reserva da consulta"
            />
            <p className="text-xs text-gray-400 mt-1">
              💡 Esta observação é salva apenas no procedimento. A descrição no caixa não será alterada.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  )
}
