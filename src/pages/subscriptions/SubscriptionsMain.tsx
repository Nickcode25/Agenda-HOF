import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
    fetchPlans,
    fetchSubscriptions,
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

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchPlans()
    fetchSubscriptions()
  }, [])

  const [activeTab, setActiveTab] = useState<'plans' | 'subscribers'>('plans')

  // Modal de novo plano
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planName, setPlanName] = useState('')
  const [planDescription, setPlanDescription] = useState('')
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

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addPlan({
        name: planName,
        description: planDescription,
        price: 0,
        sessionsPerYear: 0,
        benefits: planBenefits,
        active: true,
      })
      setShowPlanModal(false)
      resetPlanForm()
      showToast('Plano criado com sucesso!', 'success')
    } catch (error) {
      showToast('Erro ao criar plano. Tente novamente.', 'error')
    }
  }

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const selectedPatient = patients.find((p) => p.id === selectedPatientId)
      const selectedPlan = plans.find((p) => p.id === selectedPlanId)

      if (!selectedPatient || !selectedPlan) return

      // Usar o valor digitado pelo usuário (campo obrigatório)
      const subscriptionPrice = parseFloat(paidAmount)

      // Validar que o valor é maior que zero
      if (isNaN(subscriptionPrice) || subscriptionPrice <= 0) {
        showToast('Por favor, preencha o campo "Valor Pago" com um valor válido maior que zero.', 'error')
        return
      }

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

      const subscriptionData = {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: subscriptionPrice,
        startDate: paymentDate,
        nextBillingDate: nextBillingDateStr,
        status: 'active' as const,
        payments: [],
      }

      await addSubscription(subscriptionData)

      // Buscar a assinatura recém-criada
      const subscriptions = useSubscriptionStore.getState().subscriptions
      const newSubscription = subscriptions[subscriptions.length - 1]

      if (newSubscription) {
        // Criar primeiro pagamento como pendente
        await addPayment(newSubscription.id, {
          amount: subscriptionPrice,
          dueDate: paymentDate,
          status: 'pending',
        })
      }

      setShowSubscriberModal(false)
      resetSubscriberForm()
      showToast('Assinante adicionado com sucesso!', 'success')
    } catch (error) {
      showToast('Erro ao adicionar assinante. Tente novamente.', 'error')
    }
  }

  const resetPlanForm = () => {
    setPlanName('')
    setPlanDescription('')
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
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header com breadcrumb */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link to="/app" className="hover:text-purple-600 transition-colors">Início</Link>
              <span>›</span>
              <span className="text-gray-900">Mensalidades</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200">
                <CreditCard size={24} className="text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Planos de Mensalidade</h1>
                <p className="text-sm text-gray-500">Gerencie planos e assinaturas recorrentes</p>
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
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
              >
                <Plus size={18} />
                Criar Plano
              </button>
            </div>

            {plans.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-200">
                  <Sparkles className="text-purple-500" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum plano cadastrado</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Comece criando seu primeiro plano de mensalidade</p>
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
                >
                  <Plus size={18} />
                  Criar Primeiro Plano
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => navigate(`/app/mensalidades/planos/${plan.id}`)}
                    className={`group relative bg-white rounded-xl border ${
                      plan.active ? 'border-purple-200 hover:border-purple-400' : 'border-gray-200 hover:border-gray-300'
                    } p-6 text-left transition-all hover:shadow-md cursor-pointer block`}
                  >
                    {/* Badge de destaque */}
                    {plan.active && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs font-medium text-purple-600">
                        Ativo
                      </div>
                    )}

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200">
                          <Sparkles className="text-purple-500" size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      </div>

                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">{plan.description}</p>

                      <div className="mb-4">
                        <span className="text-sm text-gray-500">Valor definido por paciente</span>
                      </div>

                      {plan.benefits.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-gray-100">
                          {plan.benefits.slice(0, 3).map((benefit, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Check className="text-purple-500 mt-0.5 flex-shrink-0" size={16} />
                              <span className="text-sm text-gray-600">{benefit}</span>
                            </div>
                          ))}
                          {plan.benefits.length > 3 && (
                            <p className="text-xs text-purple-600 mt-2">+{plan.benefits.length - 3} benefícios</p>
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
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
              >
                <Plus size={18} />
                Adicionar Assinante
              </button>
            </div>

            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-200">
                  <Users className="text-purple-500" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum assinante</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Adicione pacientes aos planos de mensalidade</p>
                <button
                  onClick={() => setShowSubscriberModal(true)}
                  className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
                >
                  <Plus size={18} />
                  Adicionar Primeiro Assinante
                </button>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Paciente</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Plano</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Valor</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Próxima Cobrança</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Ações</th>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Criar Novo Plano</h2>
                <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Plano *</label>
                  <input
                    type="text"
                    required
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="Ex: Clube do Botox"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all h-20 resize-none"
                    placeholder="Descreva o plano (opcional)"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-600">
                    O valor e detalhes específicos serão definidos ao adicionar cada paciente ao plano.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Benefícios</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                      className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Digite um benefício"
                    />
                    <button
                      type="button"
                      onClick={handleAddBenefit}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {planBenefits.length > 0 && (
                    <div className="space-y-2">
                      {planBenefits.map((benefit, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                          <div className="flex items-center gap-2">
                            <Check className="text-purple-500" size={16} />
                            <span className="text-gray-900 text-sm">{benefit}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBenefit(index)}
                            className="text-red-500 hover:text-red-600 transition-colors"
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
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all"
                  >
                    Criar Plano
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 px-6 py-2.5 rounded-lg transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Adicionar Assinante ao Plano</h2>
                <button onClick={() => setShowSubscriberModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateSubscription} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paciente *</label>
                  <select
                    required
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plano *</label>
                  <select
                    required
                    value={selectedPlanId}
                    onChange={(e) => {
                      setSelectedPlanId(e.target.value)
                    }}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  >
                    <option value="">Selecione um plano</option>
                    {activePlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data do Pagamento *</label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor Pago (R$) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="225.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento *</label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência">Transferência</option>
                  </select>
                </div>

                {selectedPlanId && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h3 className="text-gray-900 font-medium mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-500" />
                      Resumo da Assinatura
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        <span className="text-gray-500">Plano:</span>{' '}
                        <span className="font-medium">{activePlans.find((p) => p.id === selectedPlanId)?.name}</span>
                      </p>
                      <p className="text-gray-600">
                        <span className="text-gray-500">Próxima cobrança:</span>{' '}
                        <span className="font-medium">{(() => {
                          const [year, month, day] = paymentDate.split('-').map(Number)
                          let nextMonth = month + 1
                          let nextYear = year
                          if (nextMonth > 12) {
                            nextMonth = 1
                            nextYear += 1
                          }
                          const nextDate = new Date(nextYear, nextMonth - 1, day)
                          return nextDate.toLocaleDateString('pt-BR')
                        })()}</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={activePlans.length === 0}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all"
                  >
                    Adicionar Assinante
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubscriberModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 px-6 py-2.5 rounded-lg transition-colors"
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
    </div>
  )
}
