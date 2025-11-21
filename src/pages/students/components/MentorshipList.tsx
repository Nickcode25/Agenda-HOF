import { Clock, Circle, CheckCircle } from 'lucide-react'
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
    return <p className="text-gray-400 text-center py-8">Nenhuma mentoria planejada ainda</p>
  }

  return (
    <>
      <div className="space-y-3">
        {mentorships.map(ment => (
          <div key={ment.id} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {ment.status === 'in_progress' && <Clock size={20} className="text-yellow-400" />}
                  {ment.status === 'pending' && <Circle size={20} className="text-gray-400" />}
                  <h4 className="font-medium text-white">{ment.mentorshipName}</h4>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full">
                    {ment.quantity}x
                  </span>
                </div>

                <div className="flex items-center gap-6 ml-8 mb-2">
                  <span className="text-sm text-gray-400">Unitário: {formatCurrency(ment.unitValue)}</span>
                  <span className="text-sm font-medium text-green-400">Total: {formatCurrency(ment.totalValue)}</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                    {ment.paymentType === 'cash'
                      ? ment.paymentMethod === 'cash' ? 'Dinheiro' : ment.paymentMethod === 'pix' ? 'PIX' : 'À Vista'
                      : ment.installments > 1 ? `Cartão ${ment.installments}x` : 'Cartão à Vista'}
                  </span>
                </div>

                {ment.notes && <p className="text-sm text-gray-400 ml-8 mb-2">{ment.notes}</p>}

                <div className="text-xs text-gray-500 ml-8">
                  Adicionado em {formatDateTimeBRSafe(ment.createdAt)}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <select
                  value={ment.status}
                  onChange={(e) => onUpdateStatus(ment.id, e.target.value as PlannedMentorship['status'])}
                  className="px-3 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="pending">Pendente</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluído</option>
                </select>
                <button
                  onClick={() => onRemove(ment.id)}
                  className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/30 transition-colors"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">Total do Planejamento:</span>
            <span className="text-xl font-bold text-green-400">
              {formatCurrency(mentorships.reduce((sum, m) => sum + m.totalValue, 0))}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
