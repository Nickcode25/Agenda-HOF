import { useState, useEffect, memo } from 'react'
import { Plus, Search, DollarSign, Calendar, CheckCircle, AlertCircle, XCircle, Clock, Zap, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSubscriptionStore } from '../../store/subscriptions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Toast from '../../components/Toast'
import { normalizeDateString } from '@/utils/dateHelpers'
import { containsIgnoringAccents } from '@/utils/textSearch'

type ToastState = {
  show: boolean
  message: string
  type: 'success' | 'error' | 'warning'
}

// Skeleton loader
const SubscriberSkeleton = memo(() => (
  <tr className="border-b border-gray-100">
    <td className="px-6 py-4"><div className="h-5 w-32 bg-gray-200 rounded animate-pulse" /></td>
    <td className="px-6 py-4"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse" /></td>
    <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 rounded animate-pulse" /></td>
    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" /></td>
    <td className="px-6 py-4"><div className="h-5 w-28 bg-gray-200 rounded animate-pulse" /></td>
    <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" /></td>
    <td className="px-6 py-4"><div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse" /></td>
  </tr>
))

export default function SubscribersList() {
  const { subscriptions, confirmPayment, generateNextPayment, simulatePixPayment, fetchSubscriptions } = useSubscriptionStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      await fetchSubscriptions()
      setHasFetched(true)
    }
    loadData()
  }, [])

  const filteredSubscriptions = subscriptions.filter((sub) =>
    containsIgnoringAccents(sub.patientName, searchTerm)
  )

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Ativo', icon: CheckCircle, className: 'text-green-600 bg-green-50 border-green-200' }
      case 'cancelled':
        return { label: 'Cancelado', icon: XCircle, className: 'text-red-600 bg-red-50 border-red-200' }
      case 'suspended':
        return { label: 'Suspenso', icon: AlertCircle, className: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
      default:
        return { label: status, icon: Clock, className: 'text-gray-600 bg-gray-50 border-gray-200' }
    }
  }

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Pago', className: 'text-green-600 bg-green-50 border-green-200' }
      case 'pending':
        return { label: 'Pendente', className: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
      case 'overdue':
        return { label: 'Atrasado', className: 'text-red-600 bg-red-50 border-red-200' }
      default:
        return { label: status, className: 'text-gray-600 bg-gray-50 border-gray-200' }
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
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-200">
              <Users size={24} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assinantes</h1>
              <p className="text-sm text-gray-500">Gerencie as assinaturas ativas</p>
            </div>
          </div>
          <Link
            to="/app/mensalidades/assinantes/novo"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <Plus size={18} />
            Nova Assinatura
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome do paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-12 pr-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>

        {/* Lista */}
        {!hasFetched ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Paciente</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Plano</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Valor</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Próxima Cobrança</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Pagamento</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(3)].map((_, i) => <SubscriberSkeleton key={i} />)}
              </tbody>
            </table>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200">
              <Users size={32} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Nenhum assinante encontrado' : 'Nenhum assinante cadastrado'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm
                ? 'Tente buscar por outro nome'
                : 'Comece adicionando a primeira assinatura'}
            </p>
            {!searchTerm && (
              <Link
                to="/app/mensalidades/assinantes/novo"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
              >
                <Plus size={18} />
                Adicionar Assinatura
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Paciente</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Plano</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Valor</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Próxima Cobrança</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Pagamento</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => {
                    const statusConfig = getStatusConfig(sub.status)
                    const StatusIcon = statusConfig.icon
                    const currentPayment = getCurrentPayment(sub)
                    const paymentStatus = currentPayment ? getPaymentStatusConfig(currentPayment.status) : null

                    return (
                      <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-gray-900 font-medium">{sub.patientName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-700">{sub.planName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 font-medium">
                            R$ {sub.price.toFixed(2).replace('.', ',')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${statusConfig.className}`}>
                            <StatusIcon size={14} />
                            <span className="text-sm font-medium">{statusConfig.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Calendar size={16} className="text-gray-400" />
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
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${paymentStatus.className}`}>
                              <span className="text-sm font-medium">{paymentStatus.label}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {currentPayment && currentPayment.status !== 'paid' ? (
                              <>
                                <button
                                  onClick={() => handleMarkAsPaid(sub.id, currentPayment.id, sub.patientName)}
                                  className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                                >
                                  <CheckCircle size={14} />
                                  Pago
                                </button>
                                <button
                                  onClick={() => handleSimulatePixPayment(sub.id, sub.patientName)}
                                  disabled={processingPayment === sub.id}
                                  className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Zap size={14} />
                                  {processingPayment === sub.id ? '...' : 'PIX'}
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
