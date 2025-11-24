import { CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import { PlannedMentorship } from '@/types/student'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'

interface CompletedMentorshipListProps {
  mentorships: PlannedMentorship[]
  onRemove: (mentId: string) => void
}

export default function CompletedMentorshipList({ mentorships, onRemove }: CompletedMentorshipListProps) {
  if (mentorships.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Nenhuma mentoria realizada ainda</p>
      </div>
    )
  }

  const sortedMentorships = mentorships
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())

  return (
    <div className="space-y-3">
      {sortedMentorships.map(ment => (
        <div key={ment.id} className="p-4 bg-green-50 rounded-xl border border-green-100 hover:border-green-200 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle size={18} className="text-green-500" />
                <h4 className="font-semibold text-gray-900">{ment.mentorshipName}</h4>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
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

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 ml-7">
                <span>Planejado em {formatDateTimeBRSafe(ment.createdAt)}</span>
                {ment.completedAt && (
                  <span className="text-green-600 font-medium">Realizado em {formatDateTimeBRSafe(ment.completedAt)}</span>
                )}
              </div>
            </div>

            <button
              onClick={() => onRemove(ment.id)}
              className="px-3 py-1.5 text-sm bg-white hover:bg-red-50 text-red-600 rounded-lg border border-red-200 transition-colors"
            >
              Remover
            </button>
          </div>
        </div>
      ))}

      <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Arrecadado:</span>
          <span className="text-xl font-bold text-green-600">
            {formatCurrency(mentorships.reduce((sum, m) => sum + m.totalValue, 0))}
          </span>
        </div>
      </div>
    </div>
  )
}
