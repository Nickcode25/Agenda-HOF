import { useState } from 'react'
import { Plus, Search, DollarSign, Calendar, CheckCircle, AlertCircle, XCircle, Clock, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSubscriptionStore } from '../../store/subscriptions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Toast from '../../components/Toast'
import { normalizeDateString } from '@/utils/dateHelpers'

type ToastState = {
  show: boolean
  message: string
  type: 'success' | 'error' | 'warning'
}

export default function SubscribersList() {
  const { subscriptions, confirmPayment, generateNextPayment, simulatePixPayment } = useSubscriptionStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  const filteredSubscriptions = subscriptions.filter((sub) =>
    sub.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Ativo', icon: CheckCircle, className: 'text-green-400 bg-green-500/20' }
      case 'cancelled':
        return { label: 'Cancelado', icon: XCircle, className: 'text-red-400 bg-red-500/20' }
      case 'suspended':
        return { label: 'Suspenso', icon: AlertCircle, className: 'text-yellow-400 bg-yellow-500/20' }
      default:
        return { label: status, icon: Clock, className: 'text-gray-400 bg-gray-500/20' }
    }
  }

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Pago', className: 'text-green-400 bg-green-500/20' }
      case 'pending':
        return { label: 'Pendente', className: 'text-yellow-400 bg-yellow-500/20' }
      case 'overdue':
        return { label: 'Atrasado', className: 'text-red-400 bg-red-500/20' }
      default:
        return { label: status, className: 'text-gray-400 bg-gray-500/20' }
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ show: true, message, type })
  }

  const handleMarkAsPaid = (subscriptionId: string, paymentId: string, patientName: string) => {
    confirmPayment(subscriptionId, paymentId, 'Manual')
    generateNextPayment(subscriptionId)
    showToast(`Pagamento de ${patientName} confirmado com sucesso!`, 'success')
  }

  const handleSimulatePixPayment = async (subscriptionId: string, patientName: string) => {
    setProcessingPayment(subscriptionId)
    showToast(`Processando pagamento PIX de ${patientName}...`, 'warning')

    try {
      const success = await simulatePixPayment(subscriptionId)

      if (success) {
        generateNextPayment(subscriptionId)
        showToast(`Pagamento PIX de ${patientName} recebido com sucesso!`, 'success')
      } else {
        showToast(`Falha ao processar pagamento PIX de ${patientName}. Tente novamente.`, 'error')
      }
    } catch (error) {
      showToast(`Erro ao processar pagamento. Tente novamente.`, 'error')
    } finally {
      setProcessingPayment(null)
    }
  }

  const getCurrentPayment = (sub: any) => {
    return sub.payments.find((p: any) => p.status === 'pending' || p.status === 'overdue')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-end mb-8">
        <Link
          to="/app/mensalidades/assinantes/novo"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nova Assinatura
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome do paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {filteredSubscriptions.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="text-gray-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {searchTerm ? 'Nenhum assinante encontrado' : 'Nenhum assinante cadastrado'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? 'Tente buscar por outro nome'
              : 'Comece adicionando a primeira assinatura'}
          </p>
          {!searchTerm && (
            <Link
              to="/app/mensalidades/assinantes/novo"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Adicionar Assinatura
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-750">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Paciente</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Plano</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Valor</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Próxima Cobrança</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Pagamento</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((sub) => {
                  const statusConfig = getStatusConfig(sub.status)
                  const StatusIcon = statusConfig.icon
                  const currentPayment = getCurrentPayment(sub)
                  const paymentStatus = currentPayment ? getPaymentStatusConfig(currentPayment.status) : null

                  return (
                    <tr key={sub.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{sub.patientName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300">{sub.planName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          R$ {sub.price.toFixed(2).replace('.', ',')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.className}`}>
                          <StatusIcon size={14} />
                          <span className="text-sm font-medium">{statusConfig.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar size={16} />
                          {(() => {
                            const dateStr = sub.nextBillingDate.split('T')[0]
                            const [year, month, day] = dateStr.split('-').map(Number)
                            const date = new Date(year, month - 1, day)
                            return format(date, "dd 'de' MMMM", { locale: ptBR })
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {paymentStatus ? (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${paymentStatus.className}`}>
                            <span className="text-sm font-medium">{paymentStatus.label}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {currentPayment && currentPayment.status !== 'paid' ? (
                            <>
                              <button
                                onClick={() => handleMarkAsPaid(sub.id, currentPayment.id, sub.patientName)}
                                className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                              >
                                <CheckCircle size={16} />
                                Marcar como Pago
                              </button>
                              <button
                                onClick={() => handleSimulatePixPayment(sub.id, sub.patientName)}
                                disabled={processingPayment === sub.id}
                                className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Zap size={16} />
                                {processingPayment === sub.id ? 'Processando...' : 'Simular PIX'}
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-green-400">
                              <CheckCircle size={16} />
                              <span className="text-sm font-medium">Pago ✅</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  )
}
