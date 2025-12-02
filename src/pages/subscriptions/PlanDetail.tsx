import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, DollarSign, Calendar, CheckCircle, AlertCircle, Clock, Trash2, FileText, Users, CreditCard, TrendingUp, AlertTriangle, Search, X } from 'lucide-react'
import { useSubscriptionStore } from '../../store/subscriptions'
import { usePatients } from '../../store/patients'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Toast from '../../components/Toast'
import { useConfirm } from '@/hooks/useConfirm'
import AddSubscriberModal from './components/AddSubscriberModal'
import ConfirmPaymentModal from './components/ConfirmPaymentModal'
import { parseCurrency, formatCurrency } from '@/utils/currency'
import { normalizeDateString } from '@/utils/dateHelpers'
import { getTodayInSaoPaulo } from '@/utils/timezone'
import { normalizeForSearch, anyWordStartsWithIgnoringAccents } from '@/utils/textSearch'

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
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(new Date().toISOString().split('T')[0])
  const [paidAmount, setPaidAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PIX')
  const [confirmPaymentMethod, setConfirmPaymentMethod] = useState('PIX')
  const { confirm, ConfirmDialog } = useConfirm()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [subscriberSearch, setSubscriberSearch] = useState('')

  // Carregar planos, assinaturas e pacientes ao montar o componente (em paralelo)
  useEffect(() => {
    Promise.all([
      fetchPlans(),
      fetchSubscriptions(),
      fetchPatients()
    ])
  }, [])

  const plan = useMemo(() => plans.find(p => p.id === id), [plans, id])
  const planSubscriptions = useMemo(() => subscriptions.filter(s => s.planId === id), [subscriptions, id])

  // Filtrar assinantes conforme a busca
  const filteredSubscriptions = useMemo(() => {
    if (!subscriberSearch.trim()) return planSubscriptions

    return planSubscriptions.filter(sub =>
      anyWordStartsWithIgnoringAccents(sub.patientName, subscriberSearch)
    )
  }, [planSubscriptions, subscriberSearch])

  // Filtrar pacientes que ainda não são assinantes deste plano
  const subscribedPatientIds = useMemo(() => planSubscriptions.map(s => s.patientId), [planSubscriptions])
  const allAvailablePatients = useMemo(() =>
    patients.filter(p => !subscribedPatientIds.includes(p.id)),
    [patients, subscribedPatientIds]
  )

  // Filtrar pacientes conforme a busca (usando função centralizada para ignorar acentos)
  const availablePatients = searchPatient.trim().length > 0
    ? allAvailablePatients.filter(p => {
        const search = normalizeForSearch(searchPatient)

        // Buscar no nome (início de qualquer palavra)
        const matchName = anyWordStartsWithIgnoringAccents(p.name, searchPatient)

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
      <div className="min-h-screen bg-gray-50 -m-8 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200">
              <CreditCard size={32} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Plano não encontrado</h2>
            <Link to="/app/mensalidades" className="text-orange-600 hover:text-orange-700 font-medium">
              Voltar para Mensalidades
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Cálculos (memoizados para melhor performance)
  const totalSubscribers = useMemo(() =>
    planSubscriptions.filter(s => s.status === 'active').length,
    [planSubscriptions]
  )

  const monthlyRevenue = useMemo(() =>
    planSubscriptions
      .filter(s => s.status === 'active')
      .reduce((total, sub) => total + sub.price, 0),
    [planSubscriptions]
  )

  const receivedRevenue = useMemo(() =>
    planSubscriptions.reduce((total, sub) => {
      const paidPayments = sub.payments.filter(p => p.status === 'paid')
      return total + paidPayments.reduce((sum, p) => sum + p.amount, 0)
    }, 0),
    [planSubscriptions]
  )

  const overdueRevenue = useMemo(() =>
    planSubscriptions.reduce((total, sub) => {
      const overduePayments = sub.payments.filter(p => p.status === 'overdue')
      return total + overduePayments.reduce((sum, p) => sum + p.amount, 0)
    }, 0),
    [planSubscriptions]
  )

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault()

    const selectedPatient = patients.find(p => p.id === selectedPatientId)
    if (!selectedPatient) return

    // Usar o valor digitado pelo usuário (campo obrigatório)
    const subscriptionPrice = parseCurrency(paidAmount)

    // Validar que o valor é maior que zero
    if (subscriptionPrice <= 0) {
      alert('Por favor, preencha o campo "Valor Pago" com um valor válido maior que zero.')
      return
    }

    // Calcular próxima data de cobrança baseada na DATA DE INÍCIO (não na data de pagamento)
    const [year, month, day] = subscriptionStartDate.split('-').map(Number)

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
      planId: plan.id,
      planName: plan.name,
      price: subscriptionPrice,
      startDate: subscriptionStartDate, // Usar data de início da assinatura
      nextBillingDate: nextBillingDateStr,
      status: 'active' as const,
      payments: [],
    }

    const patientName = selectedPatient.name

    // Fechar o modal imediatamente para melhor UX
    setShowAddSubscriberModal(false)
    resetForm()
    setToast({ message: `Adicionando ${patientName} ao plano...`, type: 'success' })

    const newSubscriptionId = await addSubscription(subscriptionData)

    if (!newSubscriptionId) {
      setToast({ message: 'Erro ao criar assinatura. Tente novamente.', type: 'error' })
      return
    }

    // Adicionar pagamentos SEQUENCIALMENTE (evitar condição de corrida)
    // skipFetch=true para evitar múltiplos fetches durante a operação

    // 1. Adicionar o primeiro pagamento como PAGO (referente à data de início)
    await addPayment(newSubscriptionId, {
      amount: subscriptionPrice,
      dueDate: subscriptionStartDate, // Data de vencimento = data de início da assinatura
      status: 'paid',
      paidAt: paymentDate + 'T12:00:00.000Z', // Usar a data real do pagamento
      paymentMethod: paymentMethod,
    }, true) // skipFetch=true

    // 2. Adicionar a próxima cobrança como PENDENTE
    await addPayment(newSubscriptionId, {
      amount: subscriptionPrice,
      dueDate: nextBillingDateStr,
      status: 'pending',
    }, false) // skipFetch=false - faz o fetch final aqui

    setToast({ message: `${patientName} adicionado ao plano com sucesso!`, type: 'success' })
  }

  const resetForm = () => {
    setSelectedPatientId('')
    setSearchPatient('')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setSubscriptionStartDate(new Date().toISOString().split('T')[0])
    setPaidAmount('')
    setPaymentMethod('PIX')
  }

  const handleOpenPaymentModal = (subscriptionId: string, paymentId: string) => {
    setSelectedSubscriptionId(subscriptionId)
    setSelectedPaymentId(paymentId)
    setConfirmPaymentMethod('PIX')
    setShowPaymentModal(true)
  }

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await confirmPayment(selectedSubscriptionId, selectedPaymentId, confirmPaymentMethod)
      await generateNextPayment(selectedSubscriptionId)
      setShowPaymentModal(false)
      setToast({ message: 'Pagamento confirmado com sucesso!', type: 'success' })
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error)
      setToast({ message: 'Erro ao confirmar pagamento', type: 'error' })
    }
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
    // Retorna o pagamento pendente mais próximo (ordenado por data)
    const unpaidPayments = sub.payments
      .filter((p: any) => p.status === 'pending' || p.status === 'overdue')
      .sort((a: any, b: any) => {
        const dateA = new Date(a.dueDate.split('T')[0])
        const dateB = new Date(b.dueDate.split('T')[0])
        return dateA.getTime() - dateB.getTime()
      })
    return unpaidPayments[0]
  }

  const getSubscriberStatus = (sub: any) => {
    // Busca o pagamento pendente mais PRÓXIMO (ordenado por data)
    const unpaidPayments = sub.payments
      .filter((p: any) => p.status === 'pending' || p.status === 'overdue')
      .sort((a: any, b: any) => {
        const dateA = new Date(a.dueDate.split('T')[0])
        const dateB = new Date(b.dueDate.split('T')[0])
        return dateA.getTime() - dateB.getTime()
      })

    const unpaidPayment = unpaidPayments[0]

    if (!unpaidPayment) {
      // Não tem pagamento pendente = está em dia
      return { label: 'Em dia', className: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle }
    }

    // Verifica se a data de vencimento já passou
    // Usa o timezone de São Paulo para comparação correta
    const todayStr = getTodayInSaoPaulo()

    // Parse da data corretamente (formato YYYY-MM-DD)
    const dueDateStr = unpaidPayment.dueDate.split('T')[0] // Remove timezone se houver

    // Comparação direta de strings YYYY-MM-DD
    if (dueDateStr < todayStr) {
      // Data passou = atrasado
      return { label: 'Atrasado', className: 'bg-red-50 text-red-600 border-red-200', icon: AlertCircle }
    } else {
      // Data ainda não passou ou é hoje = em dia
      return { label: 'Em dia', className: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle }
    }
  }

  const getPaymentStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Pago', className: 'bg-green-50 text-green-600 border-green-200', icon: CheckCircle }
      case 'pending':
        return { label: 'Pendente', className: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Clock }
      case 'overdue':
        return { label: 'Atrasado', className: 'bg-red-50 text-red-600 border-red-200', icon: AlertCircle }
      default:
        return { label: status, className: 'bg-gray-50 text-gray-600 border-gray-200', icon: Clock }
    }
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-200">
                <CreditCard size={24} className="text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
                {plan.description && <p className="text-sm text-gray-500">{plan.description}</p>}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddSubscriberModal(true)}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <Plus size={18} />
            Adicionar Assinante
          </button>
        </div>

        {/* Benefícios do Plano */}
        {plan.benefits.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              {plan.benefits.map((benefit, i) => (
                <span key={i} className="px-3 py-1.5 bg-orange-50 rounded-lg text-sm text-orange-700 border border-orange-200">
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Total de Assinantes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-orange-600">Assinantes</span>
              <Users size={18} className="text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{totalSubscribers}</div>
            <div className="text-sm text-gray-500">Ativos</div>
          </div>

          {/* Receita Mensal */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-600">Receita Mensal</span>
              <DollarSign size={18} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(monthlyRevenue)}</div>
            <div className="text-sm text-gray-500">Prevista</div>
          </div>

          {/* Total Recebido */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-600">Total Recebido</span>
              <TrendingUp size={18} className="text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(receivedRevenue)}</div>
            <div className="text-sm text-gray-500">Histórico</div>
          </div>

          {/* Valor em Atraso */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-red-600">Em Atraso</span>
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(overdueRevenue)}</div>
            <div className="text-sm text-gray-500">A receber</div>
          </div>
        </div>

        {/* Lista de Assinantes */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Assinantes do Plano</h2>

            {/* Barra de Pesquisa */}
            {planSubscriptions.length > 0 && (
              <div className="relative w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  placeholder="Buscar assinante..."
                  className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                {subscriberSearch && (
                  <button
                    onClick={() => setSubscriberSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {planSubscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200">
                <Users size={32} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum assinante</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">Adicione pacientes a este plano</p>
              <button
                onClick={() => setShowAddSubscriberModal(true)}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
              >
                <Plus size={18} />
                Adicionar Assinante
              </button>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum resultado encontrado</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Não encontramos assinantes com o nome "{subscriberSearch}"
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Paciente</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Próxima Cobrança</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Valor</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => {
                    const pendingPayment = getPendingPayment(sub)
                    const statusConfig = getSubscriberStatus(sub)
                    const StatusIcon = statusConfig.icon

                    return (
                      <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-gray-900 font-medium">{sub.patientName}</div>
                          <div className="text-sm text-gray-500">
                            Desde {(() => {
                              const dateStr = sub.startDate.split('T')[0]
                              const [year, month, day] = dateStr.split('-').map(Number)
                              const date = new Date(year, month - 1, day)
                              return format(date, 'dd/MM/yyyy', { locale: ptBR })
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${statusConfig.className}`}>
                            <StatusIcon size={12} />
                            <span>{statusConfig.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
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
                          <div className="text-gray-900 font-medium">
                            {formatCurrency(pendingPayment?.amount || sub.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {pendingPayment && pendingPayment.status !== 'paid' ? (
                              <button
                                onClick={() => handleOpenPaymentModal(sub.id, pendingPayment.id)}
                                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                              >
                                <DollarSign size={14} />
                                Confirmar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGenerateNextPayment(sub.id)}
                                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                                title="Gerar próxima cobrança"
                              >
                                <FileText size={14} />
                                Gerar
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveSubscriber(sub.id, sub.patientName)}
                              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg transition-colors text-sm"
                              title="Remover assinante"
                            >
                              <Trash2 size={14} />
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
          subscriptionStartDate={subscriptionStartDate}
          paidAmount={paidAmount}
          paymentMethod={paymentMethod}
          onPatientSelect={setSelectedPatientId}
          onSearchChange={setSearchPatient}
          onPaymentDateChange={setPaymentDate}
          onSubscriptionStartDateChange={setSubscriptionStartDate}
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
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
