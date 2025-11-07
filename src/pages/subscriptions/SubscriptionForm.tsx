import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'
import { useSubscriptionStore } from '../../store/subscriptions'
import { usePatients } from '../../store/patients'

export default function SubscriptionForm() {
  const navigate = useNavigate()
  const { plans, addSubscription, addPayment } = useSubscriptionStore()
  const { patients } = usePatients()

  const [patientId, setPatientId] = useState('')
  const [planId, setPlanId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])

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
    <div className="p-8">
      <button
        onClick={() => navigate('/app/mensalidades/assinantes')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Voltar
      </button>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Paciente *
              </label>
              <select
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Plano de Mensalidade *
              </label>
              <select
                required
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
              >
                <option value="">Selecione um plano</option>
                {activePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              {activePlans.length === 0 && (
                <p className="text-sm text-yellow-400 mt-2">
                  Nenhum plano ativo disponível. Crie um plano primeiro.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Início *
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg pl-12 pr-4 py-2 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {planId && (
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h3 className="text-white font-medium mb-2">Resumo da Assinatura</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">
                    <span className="text-gray-400">Plano:</span>{' '}
                    {activePlans.find((p) => p.id === planId)?.name}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">Valor mensal:</span>{' '}
                    <span className="text-orange-400 font-medium">
                      R$ {activePlans.find((p) => p.id === planId)?.price.toFixed(2).replace('.', ',')}
                    </span>
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">Primeira cobrança:</span>{' '}
                    {new Date(startDate).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={activePlans.length === 0}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-colors font-medium"
            >
              Criar Assinatura
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/mensalidades/assinantes')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
