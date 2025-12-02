import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, CreditCard, User, FileText } from 'lucide-react'
import { useSubscriptionStore } from '../../store/subscriptions'
import { usePatients } from '../../store/patients'
import DateInput from '@/components/DateInput'

export default function SubscriptionForm() {
  const navigate = useNavigate()
  const { plans, addSubscription, addPayment, fetchPlans } = useSubscriptionStore()
  const { patients, fetchAll } = usePatients()

  const [patientId, setPatientId] = useState('')
  const [planId, setPlanId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchPlans()
    fetchAll()
  }, [])

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/app/mensalidades/assinantes')
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate])

  const activePlans = plans.filter((plan) => plan.active)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedPatient = patients.find((p) => p.id === patientId)
    const selectedPlan = plans.find((p) => p.id === planId)

    if (!selectedPatient || !selectedPlan) return

    // Calcular próxima data de cobrança (mesmo dia do mês seguinte)
    const [year, month, day] = startDate.split('-').map(Number)

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
      price: selectedPlan.price,
      startDate,
      nextBillingDate: nextBillingDateStr,
      status: 'active' as const,
      payments: [],
    }

    addSubscription(subscriptionData)

    // Criar primeiro pagamento
    const subscriptions = useSubscriptionStore.getState().subscriptions
    const newSubscription = subscriptions[subscriptions.length - 1]

    addPayment(newSubscription.id, {
      amount: selectedPlan.price,
      dueDate: nextBillingDateStr,
      status: 'pending',
    })

    navigate('/app/mensalidades/assinantes')
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/app/mensalidades/assinantes" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova Assinatura</h1>
            <p className="text-sm text-gray-500">Adicione um novo assinante</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paciente */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Paciente</h3>
                <p className="text-xs text-gray-500">Selecione o paciente para a assinatura</p>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="">Selecione um paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} {patient.cpf ? `- ${patient.cpf}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plano */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-orange-50 rounded-lg">
                <CreditCard size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Plano de Mensalidade</h3>
                <p className="text-xs text-gray-500">Escolha o plano para o assinante</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plano *</label>
                <select
                  required
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                >
                  <option value="">Selecione um plano</option>
                  {activePlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - R$ {plan.price.toFixed(2).replace('.', ',')}
                    </option>
                  ))}
                </select>
                {activePlans.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    Nenhum plano ativo disponível. Crie um plano primeiro.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início *</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={18} />
                  <DateInput
                    required
                    value={startDate}
                    onChange={setStartDate}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-12 pr-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resumo */}
          {planId && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="p-2 bg-green-50 rounded-lg">
                  <FileText size={18} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Resumo da Assinatura</h3>
                  <p className="text-xs text-gray-500">Confira os detalhes antes de confirmar</p>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano:</span>
                  <span className="text-gray-900 font-medium">
                    {activePlans.find((p) => p.id === planId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor mensal:</span>
                  <span className="text-orange-600 font-medium">
                    R$ {activePlans.find((p) => p.id === planId)?.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Primeira cobrança:</span>
                  <span className="text-gray-900">
                    {new Date(startDate).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={activePlans.length === 0}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all"
            >
              Criar Assinatura
            </button>
            <Link
              to="/app/mensalidades/assinantes"
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
