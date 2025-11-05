import { CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import { PlannedMentorship } from '@/types/student'

interface CompletedMentorshipListProps {
  mentorships: PlannedMentorship[]
  onRemove: (mentId: string) => void
}

export default function CompletedMentorshipList({ mentorships, onRemove }: CompletedMentorshipListProps) {
  if (mentorships.length === 0) {
    return <p className="text-gray-400 text-center py-8">Nenhuma mentoria realizada ainda</p>
  }

  const sortedMentorships = mentorships
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())

  return (
    <div className="space-y-4">
      {sortedMentorships.map(ment => (
        <div key={ment.id} className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-lg border border-green-500/30">
              <CheckCircle size={20} className="text-green-400" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium text-white">{ment.mentorshipName}</h4>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full">
                  {ment.quantity}x
                </span>
              </div>

              <div className="flex items-center gap-6 mb-2">
                <span className="text-sm text-gray-400">Unitário: {formatCurrency(ment.unitValue)}</span>
                <span className="text-sm font-medium text-green-400">Total: {formatCurrency(ment.totalValue)}</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {ment.paymentType === 'cash'
                    ? ment.paymentMethod === 'cash' ? 'Dinheiro' : ment.paymentMethod === 'pix' ? 'PIX' : 'À Vista'
                    : ment.installments > 1 ? `Cartão ${ment.installments}x` : 'Cartão à Vista'}
                </span>
              </div>

              {ment.notes && <p className="text-sm text-gray-400 mb-2">{ment.notes}</p>}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Planejado em {new Date(ment.createdAt).toLocaleDateString('pt-BR')}</span>
                {ment.completedAt && (
                  <span className="text-green-400">• Realizado em {new Date(ment.completedAt).toLocaleDateString('pt-BR')}</span>
                )}
              </div>

              <button
                onClick={() => onRemove(ment.id)}
                className="mt-2 px-3 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/30 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-300">Total Arrecadado:</span>
          <span className="text-xl font-bold text-green-400">
            {formatCurrency(mentorships.reduce((sum, m) => sum + m.totalValue, 0))}
          </span>
        </div>
      </div>
    </div>
  )
}
