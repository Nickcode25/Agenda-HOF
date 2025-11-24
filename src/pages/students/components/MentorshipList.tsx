import { Clock, Circle } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import { PlannedMentorship } from '@/types/student'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'

interface MentorshipListProps {
  mentorships: PlannedMentorship[]
  onUpdateStatus: (mentId: string, status: PlannedMentorship['status']) => void
  onRemove: (mentId: string) => void
}

export default function MentorshipList({ mentorships, onUpdateStatus, onRemove }: MentorshipListProps) {
  if (mentorships.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Nenhuma mentoria planejada ainda</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {mentorships.map(ment => (
        <div key={ment.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {ment.status === 'in_progress' ? (
                  <Clock size={18} className="text-amber-500" />
                ) : (
                  <Circle size={18} className="text-gray-400" />
                )}
                <h4 className="font-semibold text-gray-900">{ment.mentorshipName}</h4>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  {ment.quantity}x
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 ml-7 mb-2">
                <span className="text-sm text-gray-500">Unitário: {formatCurrency(ment.unitValue)}</span>
                <span className="text-sm font-semibold text-green-600">Total: {formatCurrency(ment.totalValue)}</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                  {ment.paymentType === 'cash'
                    ? ment.paymentMethod === 'cash' ? 'Dinheiro' : ment.paymentMethod === 'pix' ? 'PIX' : 'À Vista'
                    : ment.installments > 1 ? `Cartão ${ment.installments}x` : 'Cartão à Vista'}
                </span>
              </div>

              {ment.notes && <p className="text-sm text-gray-500 ml-7 mb-2">{ment.notes}</p>}

              <div className="text-xs text-gray-400 ml-7">
                Adicionado em {formatDateTimeBRSafe(ment.createdAt)}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <select
                value={ment.status}
                onChange={(e) => onUpdateStatus(ment.id, e.target.value as PlannedMentorship['status'])}
                className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
              >
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluído</option>
              </select>
              <button
                onClick={() => onRemove(ment.id)}
                className="px-3 py-1.5 text-sm bg-white hover:bg-red-50 text-red-600 rounded-lg border border-red-200 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total do Planejamento:</span>
          <span className="text-xl font-bold text-purple-600">
            {formatCurrency(mentorships.reduce((sum, m) => sum + m.totalValue, 0))}
          </span>
        </div>
      </div>
    </div>
  )
}
