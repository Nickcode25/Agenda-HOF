import { FormEvent, useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import { Save, Search, Calendar, X, User, Phone, Clock, FileText, Stethoscope, UserPlus, CalendarOff } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { createISOFromDateTimeBR, formatInSaoPaulo } from '@/utils/timezone'
import { normalizeForSearch, anyWordStartsWithIgnoringAccents } from '@/utils/textSearch'
import { formatTimeInput, formatDateInput } from '@/utils/inputFormatters'
import QuickPatientModal from '@/components/QuickPatientModal'

export default function AppointmentForm() {
  const { id: appointmentId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(appointmentId)

  // Parâmetros pré-preenchidos da URL (vindos do calendário)
  const urlDate = searchParams.get('date')
  const urlStartTime = searchParams.get('start')
  const urlEndTime = searchParams.get('end')

  const patients = usePatients(s => s.patients)
  const fetchPatients = usePatients(s => s.fetchAll)
  const professionals = useProfessionals(s => s.professionals.filter(p => p.active))
  const allProfessionals = useProfessionals(s => s.professionals)
  const fetchProfessionals = useProfessionals(s => s.fetchAll)
  const { selectedProfessional } = useProfessionalContext()
  const add = useSchedule(s => s.addAppointment)
  const update = useSchedule(s => s.updateAppointment)
  const appointments = useSchedule(s => s.appointments)
  const fetchAppointments = useSchedule(s => s.fetchAppointments)
  const navigate = useNavigate()
  const showToast = useToast(s => s.show)

  // Carregar todos os dados necessários ao montar o componente
  useEffect(() => {
    fetchPatients()
    fetchProfessionals()
    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [customProcedureName, setCustomProcedureName] = useState('')
  const [room, setRoom] = useState('')
  const [notes, setNotes] = useState('')
  const [professionalId, setProfessionalId] = useState(selectedProfessional || '')

  // Compromisso pessoal
  const [isPersonal, setIsPersonal] = useState(false)
  const [personalTitle, setPersonalTitle] = useState('')

  // Autocomplete patient search
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null)
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const patientSearchRef = useRef<HTMLDivElement>(null)

  // Quick patient modal
  const [showQuickPatientModal, setShowQuickPatientModal] = useState(false)

  // Obter nome do profissional selecionado
  const selectedProfessionalName = selectedProfessional
    ? professionals.find(p => p.id === selectedProfessional)?.name || ''
    : ''

  // Carregar dados do agendamento quando estiver editando
  useEffect(() => {
    if (isEditing && appointmentId && appointments.length > 0) {
      const appointment = appointments.find(a => a.id === appointmentId)
      if (appointment) {
        // Verificar se é compromisso pessoal
        if (appointment.isPersonal) {
          setIsPersonal(true)
          setPersonalTitle(appointment.title || '')
        } else {
          // Preencher dados do paciente
          const patient = patients.find(p => p.id === appointment.patientId)
          if (patient) {
            setSelectedPatient(patient)
            setPatientSearch(patient.name)
          }

          // Preencher procedimento
          setCustomProcedureName(appointment.procedure || '')
        }

        // Preencher profissional
        const prof = allProfessionals.find(p => p.name === appointment.professional)
        if (prof) {
          setProfessionalId(prof.id)
        }

        // Preencher sala e notas
        setRoom(appointment.room || '')
        setNotes(appointment.notes || '')

        // Preencher data e horários
        setAppointmentDate(formatInSaoPaulo(appointment.start, 'dd/MM/yyyy'))
        setStartTime(formatInSaoPaulo(appointment.start, 'HH:mm'))
        setEndTime(formatInSaoPaulo(appointment.end, 'HH:mm'))
      }
    }
  }, [isEditing, appointmentId, appointments, patients, allProfessionals])

  // Preencher campos com parâmetros da URL (vindos do calendário)
  useEffect(() => {
    if (!isEditing && urlDate && urlStartTime && urlEndTime) {
      setAppointmentDate(urlDate)
      setStartTime(urlStartTime)
      setEndTime(urlEndTime)
    }
  }, [isEditing, urlDate, urlStartTime, urlEndTime])

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

  const handleStartTimeChange = (value: string) => {
    setStartTime(formatTimeInput(value))
  }

  const handleEndTimeChange = (value: string) => {
    setEndTime(formatTimeInput(value))
  }

  const handleDateChange = (value: string) => {
    setAppointmentDate(formatDateInput(value))
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Validações diferentes para compromisso pessoal vs agendamento
    if (isPersonal) {
      if (!personalTitle.trim()) {
        showToast('Por favor, informe o título do compromisso', 'error')
        return
      }
      if (!professionalId) {
        showToast('Por favor, selecione um profissional para o compromisso', 'error')
        return
      }
    } else {
      if (!selectedPatient) {
        showToast('Por favor, selecione um paciente', 'error')
        return
      }

      if (!professionalId) {
        showToast('Por favor, selecione um profissional', 'error')
        return
      }
    }

    const professional = professionals.find(p => p.id === professionalId) || allProfessionals.find(p => p.id === professionalId)
    const start = createISOFromDateTimeBR(appointmentDate, startTime)
    const end = createISOFromDateTimeBR(appointmentDate, endTime)

    if (isEditing && appointmentId) {
      // Atualizar agendamento existente
      if (isPersonal) {
        await update(appointmentId, {
          patientId: '',
          patientName: personalTitle,
          procedure: 'Compromisso Pessoal',
          professional: professional?.name || '',
          room: room || undefined,
          start,
          end,
          notes: notes || undefined,
          isPersonal: true,
          title: personalTitle,
        })
      } else {
        await update(appointmentId, {
          patientId: selectedPatient!.id,
          patientName: selectedPatient!.name,
          procedure: customProcedureName,
          professional: professional?.name || '',
          room,
          start,
          end,
          notes,
          isPersonal: false,
          title: '',
        })
      }

      await fetchAppointments()
      showToast(isPersonal ? 'Compromisso atualizado com sucesso!' : 'Agendamento atualizado com sucesso!', 'success')
      navigate('/app/agenda')
    } else {
      // Criar novo agendamento ou compromisso
      const newAppointmentId = await add({
        patientId: isPersonal ? '' : selectedPatient!.id,
        patientName: isPersonal ? personalTitle : selectedPatient!.name,
        procedure: isPersonal ? 'Compromisso Pessoal' : customProcedureName,
        procedureId: undefined,
        selectedProducts: undefined,
        professional: professional?.name || '',
        room: room || undefined,
        start,
        end,
        notes: notes || undefined,
        status: 'scheduled',
        isPersonal,
        title: isPersonal ? personalTitle : undefined,
      })

      if (!newAppointmentId) {
        showToast(isPersonal ? 'Erro ao criar compromisso. Tente novamente.' : 'Erro ao criar agendamento. Tente novamente.', 'error')
        return
      }

      await fetchAppointments()
      showToast(isPersonal ? 'Compromisso criado com sucesso!' : 'Agendamento criado com sucesso!', 'success')
      navigate('/app/agenda')
    }
  }

  // Para compromisso pessoal: precisa de título, profissional, data e horários
  // Para agendamento: precisa de paciente, procedimento, profissional, data e horários
  const canSubmit = isPersonal
    ? (personalTitle.trim() && professionalId && appointmentDate && startTime && endTime)
    : (selectedPatient && customProcedureName.trim() && professionalId && appointmentDate && startTime && endTime)

  // Callback quando paciente é criado pelo modal rápido
  const handleQuickPatientCreated = (newPatient: { id: string; name: string; phone?: string }) => {
    // Buscar o paciente completo na lista atualizada
    fetchPatients().then(() => {
      const foundPatient = patients.find(p => p.id === newPatient.id)
      if (foundPatient) {
        setSelectedPatient(foundPatient)
      } else {
        // Criar objeto temporário caso o paciente ainda não esteja na lista
        setSelectedPatient({
          id: newPatient.id,
          name: newPatient.name,
          phone: newPatient.phone || '',
          cpf: '',
          createdAt: new Date().toISOString(),
        })
      }
      setPatientSearch(newPatient.name)
      setShowPatientDropdown(false)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing
                ? (isPersonal ? 'Editar Compromisso' : 'Editar Agendamento')
                : (isPersonal ? 'Novo Compromisso' : 'Novo Agendamento')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing
                ? (isPersonal ? 'Altere os dados do compromisso pessoal' : 'Altere os dados do agendamento')
                : isPersonal
                  ? 'Bloqueie um horário na sua agenda'
                  : selectedProfessionalName
                    ? `Agenda: ${selectedProfessionalName}`
                    : 'Agende um novo procedimento'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/agenda"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            {!isPersonal && (
              <button
                type="button"
                onClick={() => setShowQuickPatientModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"
              >
                <UserPlus size={18} />
                Adicionar Paciente
              </button>
            )}
            <button
              type="submit"
              form="appointment-form"
              disabled={!canSubmit}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                !canSubmit
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isPersonal
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
              }`}
            >
              <Save size={18} />
              {isEditing ? 'Salvar Alterações' : (isPersonal ? 'Salvar Compromisso' : 'Salvar Agendamento')}
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="appointment-form" onSubmit={onSubmit} className="space-y-4">
          {/* Toggle: Tipo de agendamento */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className={`p-2 rounded-lg ${isPersonal ? 'bg-orange-50' : 'bg-gray-100'}`}>
                <CalendarOff size={18} className={isPersonal ? 'text-orange-600' : 'text-gray-500'} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Tipo</h3>
                <p className="text-xs text-gray-500">Selecione o tipo de evento na agenda</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPersonal(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  !isPersonal
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <User size={18} />
                Agendamento de Paciente
              </button>
              <button
                type="button"
                onClick={() => setIsPersonal(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                  isPersonal
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <CalendarOff size={18} />
                Compromisso Pessoal
              </button>
            </div>
          </div>

          {/* Seção: Compromisso Pessoal (quando isPersonal = true) */}
          {isPersonal && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <CalendarOff size={18} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Compromisso</h3>
                  <p className="text-xs text-gray-500">Bloqueie um horário na sua agenda</p>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Compromisso <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={personalTitle}
                    onChange={(e) => setPersonalTitle(e.target.value)}
                    placeholder="Ex: Reunião, Gravação, Viagem..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">Descreva brevemente o compromisso</p>
                </div>

                <div className="md:col-span-2">
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
                  <p className="text-xs text-gray-500 mt-0.5">A quem pertence este compromisso</p>
                </div>
              </div>
            </div>
          )}

          {/* Seção: Paciente (quando isPersonal = false) */}
          {!isPersonal && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-orange-50 rounded-lg">
                <User size={18} className="text-orange-600" />
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
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
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
                              className="w-full text-left px-3 py-2 hover:bg-orange-50 transition-all rounded-lg mb-1 last:mb-0 border border-transparent hover:border-orange-200 group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center border border-orange-200 group-hover:border-orange-400 transition-colors">
                                  <User size={14} className="text-orange-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-gray-900 font-medium group-hover:text-orange-600 transition-colors truncate text-sm">
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
                            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 text-xs font-medium underline"
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
          )}

          {/* Seção: Procedimento (quando isPersonal = false) */}
          {!isPersonal && (
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
          )}

          {/* Seção: Data e Horário */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 rounded-lg bg-orange-50">
                <Calendar size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Data e Horário</h3>
                <p className="text-xs text-gray-500">{isPersonal ? 'Quando será o compromisso' : 'Quando será o agendamento'}</p>
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
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
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
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
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
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Ex: 1000 para 10:00</p>
              </div>
            </div>
          </div>

          {/* Seção: Observações */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-orange-50 rounded-lg">
                <FileText size={18} className="text-orange-600" />
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
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm resize-none"
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
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                }`}
              >
                <Save size={18} />
                {isEditing ? 'Salvar Alterações' : 'Salvar Agendamento'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Cadastro Rápido de Paciente */}
      <QuickPatientModal
        isOpen={showQuickPatientModal}
        onClose={() => setShowQuickPatientModal(false)}
        onPatientCreated={handleQuickPatientCreated}
      />
    </div>
  )
}
