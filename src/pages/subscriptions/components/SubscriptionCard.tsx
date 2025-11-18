import { Calendar, Users, Sparkles, CheckCircle, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Payment {
  id: string
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
}

interface Subscription {
  id: string
  patientName: string
  planName: string
  price: number
  nextBillingDate?: string
  payments: Payment[]
}

interface SubscriptionCardProps {
  subscription: Subscription
  currentPayment: Payment | undefined
  processingPayment: string | null
  onMarkAsPaid: (subscriptionId: string, paymentId: string, patientName: string) => void
  onSimulatePixPayment: (subscriptionId: string, patientName: string) => void
}

export default function SubscriptionCard({
  subscription,
  currentPayment,
  processingPayment,
  onMarkAsPaid,
  onSimulatePixPayment
}: SubscriptionCardProps) {
  const sub = subscription

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center border border-purple-200">
            <Users size={18} className="text-purple-500" />
          </div>
          <span className="font-medium text-gray-900">{sub.patientName}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-sm font-medium text-purple-600">
          <Sparkles size={12} />
          {sub.planName}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="font-semibold text-gray-900">R$ {sub.price.toFixed(2).replace('.', ',')}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={16} className="text-purple-500" />
          {(() => {
            if (!sub.nextBillingDate) return '-'
            const dateStr = sub.nextBillingDate.split('T')[0]
            const [year, month, day] = dateStr.split('-').map(Number)
            if (!year || !month || !day) return '-'
            const date = new Date(year, month - 1, day)
            if (isNaN(date.getTime())) return '-'
            return format(date, "dd 'de' MMMM", { locale: ptBR })
          })()}
        </div>
      </td>
      <td className="px-6 py-4">
        {currentPayment ? (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
            currentPayment.status === 'paid'
              ? 'bg-green-50 border border-green-200 text-green-600'
              : currentPayment.status === 'pending'
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-600'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {currentPayment.status === 'paid' ? '✓ Pago' : currentPayment.status === 'pending' ? '○ Pendente' : '! Atrasado'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 border border-green-200 text-green-600">
            ✓ Em dia
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {currentPayment && currentPayment.status !== 'paid' ? (
            <>
              <button
                onClick={() => onMarkAsPaid(sub.id, currentPayment.id, sub.patientName)}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 px-3 py-2 rounded-lg transition-all text-sm font-medium"
              >
                <CheckCircle size={14} />
                Confirmar
              </button>
              <button
                onClick={() => onSimulatePixPayment(sub.id, sub.patientName)}
                disabled={processingPayment === sub.id}
                className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-600 px-3 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={14} />
                {processingPayment === sub.id ? 'Processando...' : 'PIX'}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Pago</span>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}
