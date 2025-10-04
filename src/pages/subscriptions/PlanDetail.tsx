import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, DollarSign, Calendar, CheckCircle, AlertCircle, Clock, Users, TrendingUp, X, Trash2, FileText } from 'lucide-react'
import { useSubscriptionStore } from '../../store/subscriptions'
import { usePatients } from '../../store/patients'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Toast from '../../components/Toast'

export default function PlanDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { plans, subscriptions, addSubscription, addPayment, confirmPayment, removeSubscription, generateNextPayment } = useSubscriptionStore()
  const { patients } = usePatients()

  const plan = plans.find(p => p.id === id)
  const planSubscriptions = subscriptions.filter(s => s.planId === id)

  // Filtrar pacientes que ainda não são assinantes deste plano
  const subscribedPatientIds = planSubscriptions.map(s => s.patientId)
  const availablePatients = patients.filter(p => !subscribedPatientIds.includes(p.id))

  const [showAddSubscriberModal, setShowAddSubscriberModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState('')
  const [selectedPaymentId, setSelectedPaymentId] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paidAmount, setPaidAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [confirmPaymentMethod, setConfirmPaymentMethod] = useState('PIX')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

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

    // Criar data local sem conversão UTC
    const [year, month, day] = paymentDate.split('-').map(Number)
    const nextBillingDate = new Date(year, month - 1, day) // month é 0-indexed
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    // Formatar como string ISO local
    const nextBillingDateStr = `${nextBillingDate.getFullYear()}-${String(nextBillingDate.getMonth() + 1).padStart(2, '0')}-${String(nextBillingDate.getDate()).padStart(2, '0')}`

    const subscriptionData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      planId: plan.id,
      planName: plan.name,
      price: plan.price,
      startDate: paymentDate,
      nextBillingDate: nextBillingDateStr,
      status: 'active' as const,
      payments: [],
    }

    addSubscription(subscriptionData)

    const subscriptions = useSubscriptionStore.getState().subscriptions
    const newSubscription = subscriptions[subscriptions.length - 1]

    addPayment(newSubscription.id, {
      amount: parseFloat(paidAmount || plan.price.toString()),
      dueDate: paymentDate,
      status: 'pending',
    })

    const payments = useSubscriptionStore.getState().subscriptions.find(s => s.id === newSubscription.id)?.payments
    if (payments && payments.length > 0) {
      confirmPayment(newSubscription.id, payments[payments.length - 1].id, paymentMethod)
    }

    setShowAddSubscriberModal(false)
    resetForm()
  }

  const resetForm = () => {
    setSelectedPatientId('')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaidAmount(plan.price.toString())
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

  const handleRemoveSubscriber = (subscriptionId: string, patientName: string) => {
    if (window.confirm(`Tem certeza que deseja remover ${patientName} deste plano?`)) {
      removeSubscription(subscriptionId)
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

  const stats = [
    {
      label: 'Assinantes Ativos',
      value: totalSubscribers.toString(),
      icon: Users,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
    },
    {
      label: 'Receita Mensal',
      value: `R$ ${monthlyRevenue.toFixed(2).replace('.', ',')}`,
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
    },
    {
      label: 'Receita Recebida',
      value: `R$ ${receivedRevenue.toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
    },
    {
      label: 'Em Atraso',
      value: `R$ ${overdueRevenue.toFixed(2).replace('.', ',')}`,
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/20',
    },
  ]

  return (
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
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">
                R$ {plan.price.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-gray-400">/mês</span>
            </div>
            <p className="text-sm text-orange-400 mt-1">{plan.sessionsPerYear} sessões/ano</p>
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
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          )
        })}
      </div>

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
                          Desde {format(new Date(sub.startDate), 'dd/MM/yyyy', { locale: ptBR })}
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
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Confirmar Pagamento</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento *</label>
                <select
                  required
                  value={confirmPaymentMethod}
                  onChange={(e) => setConfirmPaymentMethod(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                >
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="text-blue-400 flex-shrink-0" size={20} />
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-white mb-1">Confirmar recebimento</p>
                    <p>O pagamento será marcado como recebido e a próxima cobrança será agendada automaticamente.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Confirmar Pagamento
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Assinante */}
      {showAddSubscriberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Adicionar Assinante ao {plan.name}</h2>
              <button onClick={() => setShowAddSubscriberModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            {availablePatients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto mb-4 text-gray-500" size={48} />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  {patients.length === 0 ? 'Nenhum paciente cadastrado' : 'Todos os pacientes já são assinantes'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {patients.length === 0
                    ? 'Cadastre pacientes primeiro para poder adicioná-los a este plano'
                    : 'Todos os pacientes disponíveis já estão neste plano'}
                </p>
                {patients.length === 0 && (
                  <button
                    onClick={() => navigate('/app/pacientes/novo')}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Cadastrar Paciente
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddSubscriber} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Paciente *</label>
                  <select
                    required
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Selecione um paciente</option>
                    {availablePatients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name} - {patient.cpf}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-400 mt-2">
                    {availablePatients.length} paciente(s) disponível(is)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data do Pagamento *</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Valor Pago (R$) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                      placeholder={plan.price.toString()}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Método de Pagamento *</label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência</option>
                  </select>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-white font-medium mb-2">Resumo</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">
                      <span className="text-gray-400">Valor mensal:</span>{' '}
                      <span className="text-orange-400 font-medium">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-400">Próxima cobrança:</span>{' '}
                      {(() => {
                        const [year, month, day] = paymentDate.split('-').map(Number)
                        const nextDate = new Date(year, month - 1, day)
                        nextDate.setMonth(nextDate.getMonth() + 1)
                        return nextDate.toLocaleDateString('pt-BR')
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    Adicionar Assinante
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSubscriberModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
