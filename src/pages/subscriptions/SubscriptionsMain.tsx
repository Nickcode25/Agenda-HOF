import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Check, Calendar, Sparkles, CreditCard, Users } from 'lucide-react'
import { useSubscriptionStore } from '../../store/subscriptions'
import { usePatients } from '../../store/patients'
import Toast from '../../components/Toast'
import StatsOverview from './components/StatsOverview'
import TabsNav from './components/TabsNav'
import SubscriptionCard from './components/SubscriptionCard'

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

  const [activeTab, setActiveTab] = useState<'plans' | 'subscribers'>('plans')

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
    showToast('Plano criado com sucesso!', 'success')
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
    showToast('Assinante adicionado com sucesso!', 'success')
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

  const activePlans = plans.filter(p => p.active)

  return (
    <div className="space-y-6">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <CreditCard size={32} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Planos de Mensalidade</h1>
              <p className="text-gray-400">Gerencie planos e assinaturas recorrentes</p>
            </div>
          </div>
        </div>
      </div>

      <StatsOverview
        mrr={mrr}
        receivedRevenue={receivedRevenue}
        overdueRevenue={overdueRevenue}
        activeCount={activeCount}
      />

      <TabsNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div>
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowPlanModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
            >
              <Plus size={20} />
              Criar Plano
            </button>
          </div>

          {plans.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-16 text-center">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="text-purple-400" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Nenhum plano cadastrado</h3>
              <p className="text-gray-400 mb-8 text-lg">Comece criando seu primeiro plano de mensalidade</p>
              <button
                onClick={() => setShowPlanModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-medium shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
              >
                <Plus size={20} />
                Criar Primeiro Plano
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => navigate(`/app/mensalidades/planos/${plan.id}`)}
                  className={`group relative bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl rounded-3xl border ${
                    plan.active ? 'border-purple-500/50 hover:border-purple-500' : 'border-gray-700 hover:border-gray-600'
                  } p-8 text-left transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20`}
                >
                  {/* Badge de destaque */}
                  {plan.active && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-xs font-medium text-purple-400">
                      Ativo
                    </div>
                  )}

                  {/* Gradiente de fundo no hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform duration-500">
                        <Sparkles className="text-purple-400" size={24} />
                      </div>
                      <h3 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">{plan.name}</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">{plan.description}</p>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold text-white group-hover:text-purple-400 transition-colors">
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-gray-400">/mês</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6">
                      <Calendar size={14} className="text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">{plan.sessionsPerYear} sessões/ano</span>
                    </div>

                    {plan.benefits.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-gray-700/50">
                        {plan.benefits.slice(0, 3).map((benefit, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="text-purple-500 mt-0.5 flex-shrink-0" size={16} />
                            <span className="text-sm text-gray-300">{benefit}</span>
                          </div>
                        ))}
                        {plan.benefits.length > 3 && (
                          <p className="text-xs text-purple-400 mt-2">+{plan.benefits.length - 3} benefícios</p>
                        )}
                      </div>
                    )}
                  </div>
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
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
            >
              <Plus size={20} />
              Adicionar Assinante
            </button>
          </div>

          {subscriptions.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-16 text-center">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="text-purple-400" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Nenhum assinante</h3>
              <p className="text-gray-400 mb-8 text-lg">Adicione pacientes aos planos de mensalidade</p>
              <button
                onClick={() => setShowSubscriberModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-medium shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
              >
                <Plus size={20} />
                Adicionar Primeiro Assinante
              </button>
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800/50 border-b border-gray-700">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Paciente</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Plano</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Valor</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Próxima Cobrança</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => {
                      const currentPayment = getCurrentPayment(sub)
                      return (
                        <SubscriptionCard
                          key={sub.id}
                          subscription={sub}
                          currentPayment={currentPayment}
                          processingPayment={processingPayment}
                          onMarkAsPaid={handleMarkAsPaid}
                          onSimulatePixPayment={handleSimulatePixPayment}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Criar Plano */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Criar Novo Plano</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-white transition-colors">
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
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="Ex: Clube do Botox"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all h-20 resize-none"
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
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                    className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="Digite um benefício"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {planBenefits.length > 0 && (
                  <div className="space-y-2">
                    {planBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-700/50 rounded-xl px-4 py-3 border border-gray-600">
                        <div className="flex items-center gap-2">
                          <Check className="text-purple-400" size={16} />
                          <span className="text-white text-sm">{benefit}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
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
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/30 transition-all"
                >
                  Criar Plano
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-colors"
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
          <div className="bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-gray-700 p-8 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Adicionar Assinante ao Plano</h2>
              <button onClick={() => setShowSubscriberModal(false)} className="text-gray-400 hover:text-white transition-colors">
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
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>

              {selectedPlanId && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-400" />
                    Resumo da Assinatura
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">
                      <span className="text-gray-400">Plano:</span>{' '}
                      <span className="font-medium">{activePlans.find((p) => p.id === selectedPlanId)?.name}</span>
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-400">Próxima cobrança:</span>{' '}
                      <span className="font-medium">{new Date(new Date(paymentDate).setMonth(new Date(paymentDate).getMonth() + 1)).toLocaleDateString('pt-BR')}</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={activePlans.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/30 transition-all"
                >
                  Adicionar Assinante
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubscriberModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-colors"
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
