import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Check, DollarSign, Calendar, Users, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { useSubscriptionStore } from '../../store/subscriptions'
import { usePatients } from '../../store/patients'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Toast from '../../components/Toast'

type ToastState = {
  show: boolean
  message: string
  type: 'success' | 'error' | 'warning'
}

export default function SubscriptionsMain() {
  const navigate = useNavigate()
  const {
    plans,
    subscriptions,
    addPlan,
    addSubscription,
    addPayment,
    confirmPayment,
    generateNextPayment,
    simulatePixPayment,
    getMonthlyRecurringRevenue,
    getReceivedRevenue,
    getOverdueRevenue,
    getActiveSubscriptionsCount,
  } = useSubscriptionStore()

  const { patients } = usePatients()

  const [activeTab, setActiveTab] = useState<'plans' | 'subscribers' | 'reports'>('plans')

  // Modal de novo plano
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planName, setPlanName] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [planPrice, setPlanPrice] = useState('')
  const [planSessions, setPlanSessions] = useState('')
  const [planBenefits, setPlanBenefits] = useState<string[]>([])
  const [newBenefit, setNewBenefit] = useState('')

  // Modal de novo assinante
  const [showSubscriberModal, setShowSubscriberModal] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paidAmount, setPaidAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PIX')

  // Toast e estados de processamento
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  const mrr = getMonthlyRecurringRevenue()
  const receivedRevenue = getReceivedRevenue()
  const overdueRevenue = getOverdueRevenue()
  const activeCount = getActiveSubscriptionsCount()

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault()
    addPlan({
      name: planName,
      description: planDescription,
      price: parseFloat(planPrice),
      sessionsPerYear: parseInt(planSessions),
      benefits: planBenefits,
      active: true,
    })
    setShowPlanModal(false)
    resetPlanForm()
  }

  const handleCreateSubscription = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedPatient = patients.find((p) => p.id === selectedPatientId)
    const selectedPlan = plans.find((p) => p.id === selectedPlanId)

    if (!selectedPatient || !selectedPlan) return

    const nextBillingDate = new Date(paymentDate)
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    const subscriptionData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      price: selectedPlan.price,
      startDate: paymentDate,
      nextBillingDate: nextBillingDate.toISOString(),
      status: 'active' as const,
      payments: [],
    }

    addSubscription(subscriptionData)

    // Criar e confirmar primeiro pagamento
    const subscriptions = useSubscriptionStore.getState().subscriptions
    const newSubscription = subscriptions[subscriptions.length - 1]

    addPayment(newSubscription.id, {
      amount: parseFloat(paidAmount || selectedPlan.price.toString()),
      dueDate: paymentDate,
      status: 'pending',
    })

    // Confirmar pagamento imediatamente
    const payments = useSubscriptionStore.getState().subscriptions.find(s => s.id === newSubscription.id)?.payments
    if (payments && payments.length > 0) {
      confirmPayment(newSubscription.id, payments[payments.length - 1].id, paymentMethod)
    }

    setShowSubscriberModal(false)
    resetSubscriberForm()
  }

  const resetPlanForm = () => {
    setPlanName('')
    setPlanDescription('')
    setPlanPrice('')
    setPlanSessions('')
    setPlanBenefits([])
    setNewBenefit('')
  }

  const resetSubscriberForm = () => {
    setSelectedPatientId('')
    setSelectedPlanId('')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaidAmount('')
    setPaymentMethod('PIX')
  }

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setPlanBenefits([...planBenefits, newBenefit.trim()])
      setNewBenefit('')
    }
  }

  const handleRemoveBenefit = (index: number) => {
    setPlanBenefits(planBenefits.filter((_, i) => i !== index))
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

  const stats = [
    {
      label: 'Receita Recorrente (MRR)',
      value: `R$ ${mrr.toFixed(2).replace('.', ',')}`,
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
    {
      label: 'Assinantes Ativos',
      value: activeCount.toString(),
      icon: Users,
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
    },
  ]

  const activePlans = plans.filter(p => p.active)

  return (
    <div className="p-8">
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

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'plans'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Planos
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'subscribers'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Assinantes
        </button>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div>
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowPlanModal(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Criar Plano
            </button>
          </div>

          {plans.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="text-gray-500" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum plano cadastrado</h3>
              <p className="text-gray-500 mb-6">Comece criando seu primeiro plano de mensalidade</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => navigate(`/app/mensalidades/planos/${plan.id}`)}
                  className={`bg-gray-800 rounded-xl border ${
                    plan.active ? 'border-orange-500/50' : 'border-gray-700'
                  } p-6 text-left hover:border-orange-500 transition-all cursor-pointer`}
                >
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-white">
                      R$ {plan.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                  <p className="text-sm text-orange-400">{plan.sessionsPerYear} sessões/ano</p>
                  {plan.benefits.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {plan.benefits.slice(0, 3).map((benefit, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="text-orange-500 mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-sm text-gray-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subscribers Tab */}
      {activeTab === 'subscribers' && (
        <div>
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowSubscriberModal(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Adicionar Assinante
            </button>
          </div>

          {subscriptions.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-gray-500" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum assinante</h3>
              <p className="text-gray-500 mb-6">Adicione pacientes aos planos de mensalidade</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Paciente</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Plano</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Valor</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Próxima Cobrança</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status Pagamento</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => {
                    const currentPayment = getCurrentPayment(sub)
                    return (
                      <tr key={sub.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{sub.patientName}</td>
                        <td className="px-6 py-4 text-gray-300">{sub.planName}</td>
                        <td className="px-6 py-4 text-white">R$ {sub.price.toFixed(2).replace('.', ',')}</td>
                        <td className="px-6 py-4 text-gray-300">
                          <div className="flex items-center gap-2">
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
                          {currentPayment ? (
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              currentPayment.status === 'paid'
                                ? 'bg-green-500/20 text-green-400'
                                : currentPayment.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {currentPayment.status === 'paid' ? 'Pago' : currentPayment.status === 'pending' ? 'Pendente' : 'Atrasado'}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
                              Em dia
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {currentPayment && currentPayment.status !== 'paid' ? (
                              <>
                                <button
                                  onClick={() => handleMarkAsPaid(sub.id, currentPayment.id, sub.patientName)}
                                  className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                                >
                                  <CheckCircle size={14} />
                                  Marcar como Pago
                                </button>
                                <button
                                  onClick={() => handleSimulatePixPayment(sub.id, sub.patientName)}
                                  disabled={processingPayment === sub.id}
                                  className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Zap size={14} />
                                  {processingPayment === sub.id ? 'Processando...' : 'Simular PIX'}
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-green-400">
                                <CheckCircle size={14} />
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
          )}
        </div>
      )}

      {/* Modal Criar Plano */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Criar Novo Plano</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Plano *</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Clube do Botox"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 h-20 resize-none"
                  placeholder="Descreva o plano (opcional)"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor Mensal (R$) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                    placeholder="225.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sessões por Ano *</label>
                  <input
                    type="number"
                    required
                    value={planSessions}
                    onChange={(e) => setPlanSessions(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                    placeholder="3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Benefícios</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                    className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                    placeholder="Digite um benefício"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {planBenefits.length > 0 && (
                  <div className="space-y-2">
                    {planBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2">
                        <span className="text-white text-sm">{benefit}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Criar Plano
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Assinante */}
      {showSubscriberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Adicionar Assinante ao Plano</h2>
              <button onClick={() => setShowSubscriberModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Paciente *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                >
                  <option value="">Selecione um paciente</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} - {patient.cpf}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Plano *</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => {
                    setSelectedPlanId(e.target.value)
                    const plan = activePlans.find(p => p.id === e.target.value)
                    if (plan) setPaidAmount(plan.price.toString())
                  }}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                >
                  <option value="">Selecione um plano</option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price.toFixed(2).replace('.', ',')}
                    </option>
                  ))}
                </select>
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
                    placeholder="225.00"
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

              {selectedPlanId && (
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-white font-medium mb-2">Resumo</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">
                      <span className="text-gray-400">Plano:</span>{' '}
                      {activePlans.find((p) => p.id === selectedPlanId)?.name}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-400">Próxima cobrança:</span>{' '}
                      {new Date(new Date(paymentDate).setMonth(new Date(paymentDate).getMonth() + 1)).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={activePlans.length === 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Adicionar Assinante
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubscriberModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
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
