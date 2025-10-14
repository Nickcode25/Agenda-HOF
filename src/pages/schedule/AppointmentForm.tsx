import { FormEvent, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import type { PlannedProcedure } from '@/types/patient'
import { Save, ArrowLeft, Package, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/currency'

export default function AppointmentForm() {
  const patients = usePatients(s => s.patients)
  const fetchPatients = usePatients(s => s.fetchAll)
  const updatePatient = usePatients(s => s.update)
  const professionals = useProfessionals(s => s.professionals.filter(p => p.active))
  const fetchProfessionals = useProfessionals(s => s.fetchAll)
  const { procedures: registeredProcedures, fetchAll: fetchProcedures } = useProcedures()
  const { items: stockItems, fetchItems } = useStock()
  const { selectedProfessional } = useProfessionalContext()
  const add = useSchedule(s => s.addAppointment)
  const fetchAppointments = useSchedule(s => s.fetchAppointments)
  const navigate = useNavigate()

  // Carregar todos os dados necessários ao montar o componente
  useEffect(() => {
    fetchPatients()
    fetchProfessionals()
    fetchProcedures()
    fetchItems()
  }, [])

  const [selectedProcedureId, setSelectedProcedureId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // Obter nome do profissional selecionado
  const selectedProfessionalName = selectedProfessional
    ? professionals.find(p => p.id === selectedProfessional)?.name || ''
    : ''

  const selectedProcedure = registeredProcedures.find(p => p.id === selectedProcedureId)

  // Obter produtos disponíveis da categoria do procedimento selecionado
  const availableProducts = selectedProcedure?.category
    ? stockItems.filter(item => item.category === selectedProcedure.category)
    : []

  // Calcular horário de término automaticamente baseado na duração do procedimento
  const handleStartTimeChange = (time: string) => {
    setStartTime(time)
    if (time && selectedProcedure?.durationMinutes) {
      const [hours, minutes] = time.split(':').map(Number)
      const startDate = new Date()
      startDate.setHours(hours, minutes, 0, 0)
      startDate.setMinutes(startDate.getMinutes() + selectedProcedure.durationMinutes)

      const endHours = String(startDate.getHours()).padStart(2, '0')
      const endMinutes = String(startDate.getMinutes()).padStart(2, '0')
      setEndTime(`${endHours}:${endMinutes}`)
    }
  }

  // Quando o procedimento mudar
  const handleProcedureChange = (procId: string) => {
    setSelectedProcedureId(procId)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)

    const patientId = String(data.get('patientId')||'')
    const patient = patients.find(p => p.id === patientId)
    const professionalId = String(data.get('professional')||'')
    const professional = professionals.find(p => p.id === professionalId)

    // Combinar data e hora para criar datetime completo com timezone correto
    const appointmentDate = String(data.get('appointmentDate')||'')
    const startTime = String(data.get('startTime')||'')
    const endTime = String(data.get('endTime')||'')

    // Criar objetos Date e converter para ISO string (UTC)
    const startDateTime = new Date(`${appointmentDate}T${startTime}:00`)
    const endDateTime = new Date(`${appointmentDate}T${endTime}:00`)

    const start = startDateTime.toISOString()
    const end = endDateTime.toISOString()

    // Adicionar agendamento
    const appointmentId = await add({
      patientId,
      patientName: patient?.name || '',
      procedure: selectedProcedure?.name || '',
      procedureId: selectedProcedureId || undefined,
      professional: professional?.name || '',
      room: String(data.get('room')||''),
      start,
      end,
      notes: String(data.get('notes')||''),
      status: 'scheduled'
    })

    if (!appointmentId) {
      alert('Erro ao criar agendamento. Tente novamente.')
      return
    }

    // Adicionar procedimento ao planejamento do paciente
    if (patient && selectedProcedure) {
      const newPlannedProcedure: PlannedProcedure = {
        id: crypto.randomUUID(),
        procedureName: selectedProcedure.name,
        quantity: 1,
        unitValue: selectedProcedure.cashValue || selectedProcedure.price,
        totalValue: selectedProcedure.cashValue || selectedProcedure.price,
        paymentType: 'default',
        status: 'pending',
        notes: String(data.get('notes')||''),
        createdAt: new Date().toISOString()
      }

      const currentPlanned = patient.plannedProcedures || []
      await updatePatient(patient.id, {
        plannedProcedures: [...currentPlanned, newPlannedProcedure]
      })
    }

    // Recarregar lista de agendamentos
    await fetchAppointments()

    // Mostrar mensagem de sucesso
    alert('✅ Agendamento criado com sucesso!')
    navigate('/app/agenda')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/agenda" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Novo Agendamento</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-400">Preencha os dados do agendamento</p>
            {selectedProfessionalName && (
              <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30">
                <span>Agenda: {selectedProfessionalName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Paciente *</label>
            <select name="patientId" required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all">
              <option value="">Selecione um paciente</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento *</label>
            <select
              name="procedure"
              required
              value={selectedProcedureId}
              onChange={(e) => handleProcedureChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Selecione um procedimento</option>
              {registeredProcedures.filter(p => p.isActive).map(proc => (
                <option key={proc.id} value={proc.id}>
                  {proc.name} - {formatCurrency(proc.cashValue || proc.price)}
                </option>
              ))}
            </select>
            {registeredProcedures.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                Nenhum procedimento cadastrado. <Link to="/app/procedimentos/novo" className="underline">Cadastre aqui</Link>
              </p>
            )}
          </div>

          {/* Mostrar categoria e produtos disponíveis (apenas visualização) */}
          {selectedProcedure && (
            <div className="md:col-span-2">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Package size={18} className="text-orange-500" />
                  <h4 className="font-medium text-white">
                    Categoria: {selectedProcedure.category || 'Não definida'}
                  </h4>
                </div>

                {selectedProcedure.category ? (
                  availableProducts.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-400 mb-3">
                        Produtos disponíveis nesta categoria:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableProducts.map(product => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                Estoque: {product.quantity} {product.unit}
                              </p>
                            </div>
                            <div
                              className={`ml-2 w-2 h-2 rounded-full ${
                                product.quantity > product.minQuantity
                                  ? 'bg-green-500'
                                  : product.quantity > 0
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              title={
                                product.quantity > product.minQuantity
                                  ? 'Em estoque'
                                  : product.quantity > 0
                                  ? 'Estoque baixo'
                                  : 'Sem estoque'
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        💡 O produto específico será escolhido durante a realização do procedimento
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <AlertTriangle size={16} className="text-yellow-500" />
                      <p className="text-sm text-yellow-500">
                        Nenhum produto cadastrado na categoria "{selectedProcedure.category}".{' '}
                        <Link to="/app/estoque/novo" className="underline hover:text-yellow-400">
                          Cadastrar produto
                        </Link>
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <AlertTriangle size={16} className="text-blue-400" />
                    <p className="text-sm text-blue-400">
                      Este procedimento não possui categoria definida.{' '}
                      <Link
                        to={`/app/procedimentos/${selectedProcedure.id}/editar`}
                        className="underline hover:text-blue-300"
                      >
                        Editar procedimento
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profissional *</label>
            <select
              name="professional"
              required
              defaultValue={selectedProfessional}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Selecione um profissional</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.name} - {prof.specialty}</option>
              ))}
            </select>
            {professionals.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                Nenhum profissional cadastrado. <Link to="/app/profissionais/novo" className="underline">Cadastre aqui</Link>
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sala</label>
            <input name="room" placeholder="Número da sala" className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Data do Agendamento *</label>
            <input
              type="date"
              name="appointmentDate"
              required
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Horário de Início *</label>
            <input
              type="time"
              name="startTime"
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              required
              step="300"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              {selectedProcedure?.durationMinutes
                ? `O horário de término será calculado automaticamente (duração: ${selectedProcedure.durationMinutes} min)`
                : 'Selecione um procedimento para calcular a duração automaticamente'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Horário de Término *</label>
            <input
              type="time"
              name="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              step="300"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Ajuste manualmente se necessário</p>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
          <textarea name="notes" placeholder="Adicione observações sobre o agendamento..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" rows={4}></textarea>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40">
            <Save size={20} />
            Salvar Agendamento
          </button>
          <Link to="/app/agenda" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
