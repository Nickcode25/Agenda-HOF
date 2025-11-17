import { FormEvent, useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import { Save, Search, Calendar, X, User, Phone, Clock, FileText, Stethoscope } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { createISOFromDateTimeBR } from '@/utils/timezone'
import { normalizeForSearch, anyWordStartsWithIgnoringAccents } from '@/utils/textSearch'

export default function AppointmentForm() {
  const patients = usePatients(s => s.patients)
  const fetchPatients = usePatients(s => s.fetchAll)
  const professionals = useProfessionals(s => s.professionals.filter(p => p.active))
  const fetchProfessionals = useProfessionals(s => s.fetchAll)
  const { fetchAll: fetchProcedures } = useProcedures()
  const { fetchItems } = useStock()
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
  const [room, setRoom] = useState('')
  const [notes, setNotes] = useState('')
  const [professionalId, setProfessionalId] = useState(selectedProfessional || '')

  // Autocomplete patient search
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null)
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const patientSearchRef = useRef<HTMLDivElement>(null)

  // Obter nome do profissional selecionado
  const selectedProfessionalName = selectedProfessional
    ? professionals.find(p => p.id === selectedProfessional)?.name || ''
    : ''

  // Patient search filter
  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim()

    const sortedPatients = [...patients].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    )

    if (!query) {
      return sortedPatients.slice(0, 10)
    }

    const normalizedQuery = normalizeForSearch(query)

    const result = sortedPatients.filter(p => {
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

    return result.slice(0, 10)
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

  // Função para formatar horário
  const formatTimeInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    const limited = numbers.slice(0, 4)

    if (limited.length >= 3) {
      return `${limited.slice(0, 2)}:${limited.slice(2)}`
    } else if (limited.length >= 1) {
      return limited
    }

    return ''
  }

  // Função para formatar data
  const formatDateInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    const limited = numbers.slice(0, 8)

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

    if (!professionalId) {
      showToast('Por favor, selecione um profissional', 'error')
      return
    }

    const professional = professionals.find(p => p.id === professionalId)
    const start = createISOFromDateTimeBR(appointmentDate, startTime)
    const end = createISOFromDateTimeBR(appointmentDate, endTime)

    const appointmentId = await add({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      procedure: customProcedureName,
      procedureId: undefined,
      selectedProducts: undefined,
      professional: professional?.name || '',
      room,
      start,
      end,
      notes,
      status: 'scheduled'
    })

    if (!appointmentId) {
      showToast('Erro ao criar agendamento. Tente novamente.', 'error')
      return
    }

    await fetchAppointments()
    showToast('Agendamento criado com sucesso!', 'success')
    navigate('/app/agenda')
  }

  const canSubmit = selectedPatient && customProcedureName.trim() && professionalId && appointmentDate && startTime && endTime

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Agendamento</h1>
            <p className="text-sm text-gray-500 mt-1">
              {selectedProfessionalName ? `Agenda: ${selectedProfessionalName}` : 'Agende um novo procedimento'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/agenda"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              form="appointment-form"
              disabled={!canSubmit}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                !canSubmit
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
              }`}
            >
              <Save size={18} />
              Salvar Agendamento
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="appointment-form" onSubmit={onSubmit} className="space-y-4">
          {/* Seção: Paciente */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Paciente</h3>
                <p className="text-xs text-gray-500">Selecione o paciente para o agendamento</p>
              </div>
            </div>

            <div ref={patientSearchRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paciente <span className="text-red-500">*</span>
              </label>
              {selectedPatient ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-gray-900 rounded-lg px-3 py-2">
                  <User size={16} className="text-green-600" />
                  <span className="flex-1 font-medium">{selectedPatient.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null)
                      setPatientSearch('')
                      setShowPatientDropdown(false)
                    }}
                    className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={16} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value)
                        setShowPatientDropdown(true)
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      placeholder="Buscar por nome, CPF ou telefone..."
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Digite para buscar o paciente</p>
                  {showPatientDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
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
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-all rounded-lg mb-1 last:mb-0 border border-transparent hover:border-blue-200 group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200 group-hover:border-blue-400 transition-colors">
                                  <User size={14} className="text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors truncate text-sm">
                                    {patient.name}
                                  </div>
                                  {patient.phone && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                      <Phone size={10} />
                                      <span>{patient.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <User size={24} className="text-gray-400" />
                          </div>
                          <p className="mb-2 text-gray-900 font-medium text-sm">Nenhum paciente encontrado</p>
                          <Link
                            to="/app/pacientes/novo"
                            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 text-xs font-medium underline"
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
          </div>

          {/* Seção: Procedimento */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Stethoscope size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Procedimento</h3>
                <p className="text-xs text-gray-500">Informações do procedimento</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Procedimento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customProcedureName}
                  onChange={(e) => setCustomProcedureName(e.target.value)}
                  required
                  placeholder="Ex: Botox, Preenchimento, Consulta..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Digite o procedimento ou apenas "agendamento"</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profissional <span className="text-red-500">*</span>
                </label>
                <select
                  value={professionalId}
                  onChange={(e) => setProfessionalId(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                >
                  <option value="">Selecione um profissional</option>
                  {professionals.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.name} - {prof.specialty}</option>
                  ))}
                </select>
                {professionals.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-0.5">
                    Nenhum profissional cadastrado. <Link to="/app/profissionais/novo" className="underline hover:text-yellow-700">Cadastre aqui</Link>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                <input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Número da sala"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Opcional</p>
              </div>
            </div>
          </div>

          {/* Seção: Data e Horário */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-green-50 rounded-lg">
                <Calendar size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Data e Horário</h3>
                <p className="text-xs text-gray-500">Quando será o agendamento</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={appointmentDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    required
                    maxLength={10}
                    placeholder="dd/mm/aaaa"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Ex: 05112025 para 05/11/2025</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário de Início <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    required
                    maxLength={5}
                    placeholder="HH:MM"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Ex: 0900 para 09:00</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário de Término <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    required
                    maxLength={5}
                    placeholder="HH:MM"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Ex: 1000 para 10:00</p>
              </div>
            </div>
          </div>

          {/* Seção: Observações */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText size={18} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Observações</h3>
                <p className="text-xs text-gray-500">Informações adicionais</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anotações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o agendamento..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm resize-none"
              />
              <p className="text-xs text-gray-500 mt-0.5">Opcional - informações relevantes sobre o agendamento</p>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-2 -mx-8 px-8 border-t border-gray-200">
            <div className="flex items-center justify-end gap-3 max-w-5xl mx-auto">
              <Link
                to="/app/agenda"
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  !canSubmit
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm'
                }`}
              >
                <Save size={18} />
                Salvar Agendamento
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
