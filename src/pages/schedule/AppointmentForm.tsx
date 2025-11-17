import { FormEvent, useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import type { PlannedProcedure } from '@/types/patient'
import { Save, Package, AlertTriangle, Search, Calendar, X, User, Phone, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '@/utils/currency'
import { useToast } from '@/hooks/useToast'
import { useUserProfile } from '@/store/userProfile'
import { createISOFromDateTimeBR } from '@/utils/timezone'
import { normalizeForSearch, anyWordStartsWithIgnoringAccents } from '@/utils/textSearch'

export default function AppointmentForm() {
  const patients = usePatients(s => s.patients)
  const fetchPatients = usePatients(s => s.fetchAll)
  const updatePatient = usePatients(s => s.update)
  const professionals = useProfessionals(s => s.professionals.filter(p => p.active))
  const fetchProfessionals = useProfessionals(s => s.fetchAll)
  const { currentProfile } = useUserProfile()
  const { procedures: registeredProcedures, fetchAll: fetchProcedures } = useProcedures()
  const { items: stockItems, fetchItems } = useStock()
  const { selectedProfessional } = useProfessionalContext()
  const add = useSchedule(s => s.addAppointment)
  const fetchAppointments = useSchedule(s => s.fetchAppointments)
  const navigate = useNavigate()
  const showToast = useToast(s => s.show)

  // Carregar todos os dados necessários ao montar o componente
  useEffect(() => {
    fetchPatients()
    fetchProfessionals()
    fetchProcedures()
    fetchItems()
  }, [])

  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [customProcedureName, setCustomProcedureName] = useState('')

  // Autocomplete patient search
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null)
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const patientSearchRef = useRef<HTMLDivElement>(null)

  // Obter nome do profissional selecionado
  const selectedProfessionalName = selectedProfessional
    ? professionals.find(p => p.id === selectedProfessional)?.name || ''
    : ''

  // Patient search filter (usando função centralizada para ignorar acentos)
  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim()

    // Ordenar todos os pacientes alfabeticamente
    const sortedPatients = [...patients].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    )

    if (!query) {
      return sortedPatients.slice(0, 10) // Show first 10 when empty
    }

    const normalizedQuery = normalizeForSearch(query)

    const result = sortedPatients.filter(p => {
      // Buscar no nome (início de qualquer palavra)
      const matchName = anyWordStartsWithIgnoringAccents(p.name, query)

      const normalizedQueryCpf = normalizedQuery.replace(/\D/g, '')
      let matchCpf = false
      let matchPhone = false

      if (normalizedQueryCpf.length > 0) {
        const normalizedCpf = p.cpf.replace(/\D/g, '')
        matchCpf = normalizedCpf.includes(normalizedQueryCpf)
        matchPhone = p.phone ? p.phone.replace(/\D/g, '').includes(normalizedQueryCpf) : false
      }

      return matchName || matchCpf || matchPhone
    })

    return result.slice(0, 10) // Limit to 10 results
  }, [patientSearch, patients])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Função para formatar horário enquanto digita
  const formatTimeInput = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')

    // Limita a 4 dígitos
    const limited = numbers.slice(0, 4)

    // Formata como HH:MM
    if (limited.length >= 3) {
      return `${limited.slice(0, 2)}:${limited.slice(2)}`
    } else if (limited.length >= 1) {
      return limited
    }

    return ''
  }

  // Função para formatar data enquanto digita
  const formatDateInput = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')

    // Limita a 8 dígitos (ddmmaaaa)
    const limited = numbers.slice(0, 8)

    // Formata como dd/mm/aaaa
    if (limited.length >= 5) {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`
    } else if (limited.length >= 3) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`
    } else if (limited.length >= 1) {
      return limited
    }

    return ''
  }

  const handleStartTimeChange = (value: string) => {
    const formatted = formatTimeInput(value)
    setStartTime(formatted)
  }

  const handleEndTimeChange = (value: string) => {
    const formatted = formatTimeInput(value)
    setEndTime(formatted)
  }

  const handleDateChange = (value: string) => {
    const formatted = formatDateInput(value)
    setAppointmentDate(formatted)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!selectedPatient) {
      showToast('Por favor, selecione um paciente', 'error')
      return
    }

    const data = new FormData(e.currentTarget)

    const patientId = selectedPatient.id
    const patient = selectedPatient
    const professionalId = String(data.get('professional')||'')
    const professional = professionals.find(p => p.id === professionalId)

    // Criar ISO strings usando o fuso horário de São Paulo
    const start = createISOFromDateTimeBR(appointmentDate, startTime)
    const end = createISOFromDateTimeBR(appointmentDate, endTime)

    // Adicionar agendamento
    const appointmentId = await add({
      patientId,
      patientName: patient?.name || '',
      procedure: customProcedureName,
      procedureId: undefined,
      selectedProducts: undefined,
      professional: professional?.name || '',
      room: String(data.get('room')||''),
      start,
      end,
      notes: String(data.get('notes')||''),
      status: 'scheduled'
    })

    if (!appointmentId) {
      showToast('Erro ao criar agendamento. Tente novamente.', 'error')
      return
    }

    // Recarregar lista de agendamentos
    await fetchAppointments()

    // Mostrar mensagem de sucesso
    showToast('Agendamento criado com sucesso!', 'success')
    navigate('/app/agenda')
  }

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Calendar size={32} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Novo Agendamento</h1>
              <p className="text-gray-400">
                {selectedProfessionalName ? `Agenda: ${selectedProfessionalName}` : 'Agende um novo procedimento'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Autocomplete Search */}
          <div ref={patientSearchRef} className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">Paciente *</label>
            {selectedPatient ? (
              <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3">
                <span className="flex-1">{selectedPatient.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null)
                    setPatientSearch('')
                    setShowPatientDropdown(false)
                  }}
                  className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X size={16} className="text-gray-400 hover:text-red-400" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value)
                      setShowPatientDropdown(true)
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    placeholder="Buscar por nome, CPF ou telefone..."
                    className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
                {showPatientDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-80 overflow-auto">
                    {filteredPatients.length > 0 ? (
                      <div className="p-2">
                        {filteredPatients.map(patient => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(patient)
                              setPatientSearch(patient.name)
                              setShowPatientDropdown(false)
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-orange-600/10 transition-all rounded-lg mb-2 last:mb-0 border border-transparent hover:border-orange-500/30 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30 group-hover:border-orange-500/50 transition-colors">
                                <User size={18} className="text-blue-400 group-hover:text-orange-400 transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium group-hover:text-orange-400 transition-colors truncate">
                                  {patient.name}
                                </div>
                                {patient.phone && (
                                  <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-0.5">
                                    <Phone size={12} />
                                    <span>{patient.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-400">
                        <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-3">
                          <User size={32} className="text-gray-500" />
                        </div>
                        <p className="mb-3 text-white font-medium">Nenhum paciente encontrado</p>
                        <Link
                          to="/app/pacientes/novo"
                          className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm font-medium underline"
                        >
                          Cadastrar novo paciente
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento *</label>
            <input
              type="text"
              value={customProcedureName}
              onChange={(e) => setCustomProcedureName(e.target.value)}
              required
              placeholder="Digite o procedimento ou apenas agendamento"
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profissional *</label>
            <select
              name="professional"
              required
              defaultValue={selectedProfessional}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer hover:bg-gray-700"
            >
              <option value="">Selecione um profissional</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.name} - {prof.specialty}</option>
              ))}
            </select>
            {professionals.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                Nenhum profissional cadastrado. <Link to="/app/profissionais/novo" className="underline hover:text-yellow-300">Cadastre aqui</Link>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sala</label>
            <input name="room" placeholder="Número da sala" className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-orange-500" />
                <span>Data do Agendamento *</span>
              </div>
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="appointmentDate"
                value={appointmentDate}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                maxLength={10}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              Digite apenas números (ex: 05112025 para 05/11/2025)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                <span>Horário de Início *</span>
              </div>
            </label>
            <div className="relative">
              <Clock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="startTime"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required
                maxLength={5}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              Digite apenas números (ex: 0900 para 09:00)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-green-500" />
                <span>Horário de Término *</span>
              </div>
            </label>
            <div className="relative">
              <Clock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="endTime"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                required
                maxLength={5}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 ml-1">Digite apenas números (ex: 1000 para 10:00)</p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
          <textarea name="notes" placeholder="Adicione observações sobre o agendamento..." className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" rows={4}></textarea>
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
