import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, DollarSign, Calendar, CheckCircle, AlertCircle, Clock, Trash2, FileText, Users } from 'lucide-react'
import { useSubscriptionStore } from '../../store/subscriptions'
import { usePatients } from '../../store/patients'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Toast from '../../components/Toast'
import { useConfirm } from '@/hooks/useConfirm'
import PlanStatsGrid from './components/PlanStatsGrid'
import AddSubscriberModal from './components/AddSubscriberModal'
import ConfirmPaymentModal from './components/ConfirmPaymentModal'
import { parseCurrency, formatCurrency } from '@/utils/currency'
import { normalizeDateString } from '@/utils/dateHelpers'

export default function PlanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { plans, subscriptions, fetchPlans, fetchSubscriptions, addSubscription, addPayment, confirmPayment, removeSubscription, generateNextPayment } = useSubscriptionStore()
  const { patients, fetchAll: fetchPatients } = usePatients()

  // Estados do componente
  const [showAddSubscriberModal, setShowAddSubscriberModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('')
  const [selectedPaymentId, setSelectedPaymentId] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [searchPatient, setSearchPatient] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paidAmount, setPaidAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [confirmPaymentMethod, setConfirmPaymentMethod] = useState('PIX')
  const { confirm, ConfirmDialog } = useConfirm()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

  // Carregar planos, assinaturas e pacientes ao montar o componente
  useEffect(() => {
    fetchPlans()
    fetchSubscriptions()
    fetchPatients()
  }, [])

  const plan = plans.find(p => p.id === id)
  const planSubscriptions = subscriptions.filter(s => s.planId === id)

  // Função para remover acentos
  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  // Filtrar pacientes que ainda não são assinantes deste plano
  const subscribedPatientIds = planSubscriptions.map(s => s.patientId)
  const allAvailablePatients = patients.filter(p => !subscribedPatientIds.includes(p.id))

  // Filtrar pacientes conforme a busca
  const availablePatients = searchPatient.trim().length > 0
    ? allAvailablePatients.filter(p => {
        const search = removeAccents(searchPatient.toLowerCase().trim())
        const normalizedName = removeAccents(p.name.toLowerCase())

        // Dividir o nome em palavras para buscar no início de cada palavra
        const nameWords = normalizedName.split(' ')
        const matchesNameWord = nameWords.some(word => word.startsWith(search))
        const matchName = matchesNameWord || normalizedName.startsWith(search)

        // Buscar em CPF e telefone se houver números
        const normalizedSearchCpf = search.replace(/\D/g, '')
        let matchCpf = false
        let matchPhone = false

        if (normalizedSearchCpf.length > 0) {
          const normalizedCpf = p.cpf.replace(/\D/g, '')
          matchCpf = normalizedCpf.includes(normalizedSearchCpf)
          matchPhone = p.phone ? p.phone.replace(/\D/g, '').includes(normalizedSearchCpf) : false
        }

        return matchName || matchCpf || matchPhone
      }).slice(0, 10) // Limitar a 10 resultados
    : allAvailablePatients.slice(0, 10) // Mostrar primeiros 10 quando não há busca

  if (!plan) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Plano não encontrado</h2>
          <Link to="/app/mensalidades" className="text-orange-500 hover:text-orange-400">
            Voltar para Mensalidades
          </Link>
        </div>
      </div>
    )
  }

  // Cálculos
  const totalSubscribers = planSubscriptions.filter(s => s.status === 'active').length
  const monthlyRevenue = totalSubscribers * plan.price
  const receivedRevenue = planSubscriptions.reduce((total, sub) => {
    const paidPayments = sub.payments.filter(p => p.status === 'paid')
    return total + paidPayments.reduce((sum, p) => sum + p.amount, 0)
  }, 0)
  const overdueRevenue = planSubscriptions.reduce((total, sub) => {
    const overduePayments = sub.payments.filter(p => p.status === 'overdue')
    return total + overduePayments.reduce((sum, p) => sum + p.amount, 0)
  }, 0)

  const handleAddSubscriber = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedPatient = patients.find(p => p.id === selectedPatientId)
    if (!selectedPatient) return

    // Calcular próxima data de cobrança (mesmo dia do mês seguinte)
    const [year, month, day] = paymentDate.split('-').map(Number)

    // Adicionar 1 mês mantendo o mesmo dia
    let nextMonth = month + 1
    let nextYear = year
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }

    const nextBillingDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Usar o valor digitado pelo usuário (campo obrigatório)
    const subscriptionPrice = parseCurrency(paidAmount)

    const subscriptionData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      planId: plan.id,
      planName: plan.name,
      price: subscriptionPrice,
      startDate: paymentDate,
      nextBillingDate: nextBillingDateStr,
      status: 'active' as const,
      payments: [],
    }

    addSubscription(subscriptionData)

    const subscriptions = useSubscriptionStore.getState().subscriptions
    const newSubscription = subscriptions[subscriptions.length - 1]

    addPayment(newSubscription.id, {
      amount: subscriptionPrice,
      dueDate: paymentDate,
      status: 'pending',
    })

    setShowAddSubscriberModal(false)
    resetForm()
  }

  const resetForm = () => {
    setSelectedPatientId('')
    setSearchPatient('')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaidAmount('')
    setPaymentMethod('PIX')
  }

  const handleOpenPaymentModal = (subscriptionId: string, paymentId: string) => {
    setSelectedSubscriptionId(subscriptionId)
    setSelectedPaymentId(paymentId)
    setConfirmPaymentMethod('PIX')
    setShowPaymentModal(true)
  }

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault()
    confirmPayment(selectedSubscriptionId, selectedPaymentId, confirmPaymentMethod)
    setShowPaymentModal(false)
    setToast({ message: 'Pagamento confirmado com sucesso!', type: 'success' })
  }

  const handleRemoveSubscriber = async (subscriptionId: string, patientName: string) => {
    const confirmed = await confirm({
      title: 'Remover Assinante',
      message: `Tem certeza que deseja remover ${patientName} deste plano? Esta ação também removerá todas as movimentações de caixa associadas.`,
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    })

    if (confirmed) {
      await removeSubscription(subscriptionId)
      setToast({ message: `${patientName} removido do plano com sucesso!`, type: 'success' })
    }
  }

  const handleGenerateNextPayment = (subscriptionId: string) => {
    generateNextPayment(subscriptionId)
    setToast({ message: 'Próxima cobrança gerada!', type: 'success' })
  }

  const getPendingPayment = (sub: any) => {
    return sub.payments.find((p: any) => p.status === 'pending' || p.status === 'overdue')
  }

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Pago', className: 'bg-green-500/20 text-green-400', icon: CheckCircle }
      case 'pending':
        return { label: 'Pendente', className: 'bg-yellow-500/20 text-yellow-400', icon: Clock }
      case 'overdue':
        return { label: 'Atrasado', className: 'bg-red-500/20 text-red-400', icon: AlertCircle }
      default:
        return { label: status, className: 'bg-gray-500/20 text-gray-400', icon: Clock }
    }
  }

  return (
    <>
    <div className="p-8">
      <button
        onClick={() => navigate('/app/mensalidades')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Voltar
      </button>

      {/* Header do Plano */}
      <div className="bg-gray-800 rounded-xl border border-orange-500/50 p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{plan.name}</h1>
            {plan.description && <p className="text-gray-400">{plan.description}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">
              Valor definido por paciente
            </p>
          </div>
        </div>

        {plan.benefits.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {plan.benefits.map((benefit, i) => (
              <span key={i} className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                {benefit}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <PlanStatsGrid
        totalSubscribers={totalSubscribers}
        monthlyRevenue={monthlyRevenue}
        receivedRevenue={receivedRevenue}
        overdueRevenue={overdueRevenue}
      />

      {/* Ações */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowAddSubscriberModal(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Adicionar Assinante
        </button>
      </div>

      {/* Lista de Assinantes */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Assinantes do Plano</h2>
        </div>

        {planSubscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-4 text-gray-500" size={48} />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum assinante</h3>
            <p className="text-gray-500 mb-6">Adicione pacientes a este plano</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Paciente</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status Pagamento</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Próxima Cobrança</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Valor</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
                </tr>
              </thead>
              <tbody>
                {planSubscriptions.map((sub) => {
                  const pendingPayment = getPendingPayment(sub)
                  const statusConfig = pendingPayment
                    ? getPaymentStatusConfig(pendingPayment.status)
                    : { label: 'Em dia', className: 'bg-green-500/20 text-green-400', icon: CheckCircle }
                  const StatusIcon = statusConfig.icon

                  return (
                    <tr key={sub.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{sub.patientName}</div>
                        <div className="text-sm text-gray-400">
                          Desde {(() => {
                            const dateStr = sub.startDate.split('T')[0]
                            const [year, month, day] = dateStr.split('-').map(Number)
                            const date = new Date(year, month - 1, day)
                            return format(date, 'dd/MM/yyyy', { locale: ptBR })
                          })()}
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
                        <div className="text-white font-medium">
                          R$ {pendingPayment?.amount.toFixed(2).replace('.', ',') || plan.price.toFixed(2).replace('.', ',')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {pendingPayment && pendingPayment.status !== 'paid' ? (
                            <button
                              onClick={() => handleOpenPaymentModal(sub.id, pendingPayment.id)}
                              className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg transition-colors text-sm"
                            >
                              <DollarSign size={16} />
                              Confirmar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGenerateNextPayment(sub.id)}
                              className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-colors text-sm"
                              title="Gerar próxima cobrança"
                            >
                              <FileText size={16} />
                              Gerar Cobrança
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveSubscriber(sub.id, sub.patientName)}
                            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors text-sm"
                            title="Remover assinante"
                          >
                            <Trash2 size={16} />
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Confirmar Pagamento */}
      <ConfirmPaymentModal
        isOpen={showPaymentModal}
        confirmPaymentMethod={confirmPaymentMethod}
        onConfirmPaymentMethodChange={setConfirmPaymentMethod}
        onSubmit={handleConfirmPayment}
        onClose={() => setShowPaymentModal(false)}
      />

      {/* Modal Adicionar Assinante */}
      <AddSubscriberModal
        isOpen={showAddSubscriberModal}
        planName={plan.name}
        planPrice={plan.price}
        availablePatients={availablePatients}
        allAvailablePatients={allAvailablePatients}
        selectedPatientId={selectedPatientId}
        searchPatient={searchPatient}
        paymentDate={paymentDate}
        paidAmount={paidAmount}
        paymentMethod={paymentMethod}
        onPatientSelect={setSelectedPatientId}
        onSearchChange={setSearchPatient}
        onPaymentDateChange={setPaymentDate}
        onPaidAmountChange={setPaidAmount}
        onPaymentMethodChange={setPaymentMethod}
        onSubmit={handleAddSubscriber}
        onClose={() => setShowAddSubscriberModal(false)}
        onNavigateToNewPatient={() => navigate('/app/pacientes/novo')}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
