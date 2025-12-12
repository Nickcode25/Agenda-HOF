import { FormEvent, useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import { useRecurring } from '@/store/recurring'
import { DAYS_OF_WEEK } from '@/types/recurring'
import { Save, Search, Calendar, X, User, Phone, Clock, FileText, UserPlus, CalendarOff, Repeat, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { createISOFromDateTimeBR, formatInSaoPaulo, getTodayInSaoPaulo, getCurrentTimeInSaoPaulo } from '@/utils/timezone'
import { normalizeForSearch, anyWordStartsWithIgnoringAccents } from '@/utils/textSearch'
import { formatTimeInput, formatDateInput } from '@/utils/inputFormatters'
import QuickPatientModal from '@/components/QuickPatientModal'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'

type AppointmentType = 'patient' | 'personal' | 'recurring'

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
  const { blocks: recurringBlocks, addBlock, fetchBlocks, loading: recurringLoading } = useRecurring()
  const navigate = useNavigate()
  const showToast = useToast(s => s.show)
  const { getPlanLimits, isUnlimited, planType, hasFeature } = useSubscription()

  // Verificar limite de agendamentos do mês atual
  const limits = getPlanLimits()
  const currentMonthAppointments = useMemo(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    return appointments.filter(apt => {
      const aptDate = new Date(apt.start)
      return aptDate >= startOfMonth && aptDate <= endOfMonth && !apt.isPersonal
    }).length
  }, [appointments])

  const hasReachedAppointmentLimit = !isUnlimited() && !isEditing && currentMonthAppointments >= limits.appointments_per_month

  // Carregar todos os dados necessários ao montar o componente
  useEffect(() => {
    fetchPatients()
    fetchProfessionals()
    fetchAppointments()
    fetchBlocks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [customProcedureName, setCustomProcedureName] = useState('')
  const [room, setRoom] = useState('')
  const [notes, setNotes] = useState('')
  const [professionalId, setProfessionalId] = useState(selectedProfessional || '')

  // Tipo de agendamento: patient, personal, recurring
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('patient')
  const [personalTitle, setPersonalTitle] = useState('')

  // Bloqueio recorrente
  const [recurringTitle, setRecurringTitle] = useState('')
  const [recurringStartTime, setRecurringStartTime] = useState('')
  const [recurringEndTime, setRecurringEndTime] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  // Autocomplete patient search
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null)
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const patientSearchRef = useRef<HTMLDivElement>(null)

  // Quick patient modal
  const [showQuickPatientModal, setShowQuickPatientModal] = useState(false)

  // Expandir observações
  const [showNotes, setShowNotes] = useState(false)

  // Obter nome do profissional selecionado
  const selectedProfessionalName = selectedProfessional
    ? professionals.find(p => p.id === selectedProfessional)?.name || ''
    : ''

  // Auto-selecionar o primeiro profissional para plano básico (que não tem seletor de profissional)
  useEffect(() => {
    if (!hasFeature('professionals') && professionals.length > 0 && !professionalId) {
      setProfessionalId(professionals[0].id)
    }
  }, [professionals, professionalId])

  // Carregar dados do agendamento quando estiver editando
  useEffect(() => {
    if (isEditing && appointmentId && appointments.length > 0) {
      const appointment = appointments.find(a => a.id === appointmentId)
      if (appointment) {
        // Verificar se é compromisso pessoal
        if (appointment.isPersonal) {
          setAppointmentType('personal')
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
        if (appointment.notes) setShowNotes(true)

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

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Se for bloqueio recorrente, usar lógica diferente
    if (appointmentType === 'recurring') {
      if (!recurringTitle.trim()) {
        showToast('Por favor, informe o título do bloqueio', 'error')
        return
      }
      if (!recurringStartTime || !recurringEndTime) {
        showToast('Por favor, informe os horários de início e término', 'error')
        return
      }
      if (selectedDays.length === 0) {
        showToast('Por favor, selecione pelo menos um dia da semana', 'error')
        return
      }

      await addBlock({
        title: recurringTitle,
        startTime: recurringStartTime,
        endTime: recurringEndTime,
        daysOfWeek: selectedDays,
        active: true,
      })
      showToast('Bloqueio recorrente criado com sucesso!', 'success')
      navigate('/app/agenda')
      return
    }

    const isPersonal = appointmentType === 'personal'

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
      try {
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
      } catch (error) {
        console.error('❌ [APPOINTMENT] Erro ao criar agendamento:', error)
        showToast('Erro ao criar agendamento. Verifique sua conexão.', 'error')
      }
    }
  }

  // Validação de submit baseada no tipo de agendamento
  const canSubmit = appointmentType === 'recurring'
    ? (recurringTitle.trim() && recurringStartTime && recurringEndTime && selectedDays.length > 0)
    : appointmentType === 'personal'
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
          createdAt: createISOFromDateTimeBR(appointmentDate || getTodayInSaoPaulo(), startTime || getCurrentTimeInSaoPaulo()),
        })
      }
      setPatientSearch(newPatient.name)
      setShowPatientDropdown(false)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Alerta de limite de agendamentos atingido */}
        {hasReachedAppointmentLimit && appointmentType === 'patient' && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800">Limite de agendamentos atingido</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Seu plano {planType === 'basic' ? 'Básico' : 'atual'} permite até {limits.appointments_per_month} agendamentos por mês.
                  Você já possui {currentMonthAppointments} agendamentos neste mês.
                </p>
                <Link
                  to="/planos"
                  className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  Fazer upgrade para agendamentos ilimitados →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Header Compacto */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditing
                ? (appointmentType === 'personal' ? 'Editar Compromisso' : 'Editar Agendamento')
                : appointmentType === 'recurring'
                  ? 'Novo Bloqueio Recorrente'
                  : 'Novo Agendamento'}
            </h1>
            <p className="text-sm text-gray-500">
              {appointmentType === 'recurring'
                ? 'Configure horários que se repetem automaticamente'
                : selectedProfessionalName ? `Agenda: ${selectedProfessionalName}` : 'Agende rapidamente'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/agenda"
              className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              form="appointment-form"
              disabled={!canSubmit || (hasReachedAppointmentLimit && appointmentType === 'patient')}
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm rounded-lg font-medium transition-all ${
                !canSubmit || (hasReachedAppointmentLimit && appointmentType === 'patient')
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
              }`}
            >
              <Save size={16} />
              Salvar
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="appointment-form" onSubmit={onSubmit} className="space-y-4">
          {/* Tipo de Agendamento - Botões compactos (Compromisso e Recorrentes apenas para Pro/Premium) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAppointmentType('patient')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                appointmentType === 'patient'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <User size={16} />
              Paciente
            </button>
            {hasFeature('professionals') && (
              <>
                <button
                  type="button"
                  onClick={() => setAppointmentType('personal')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    appointmentType === 'personal'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CalendarOff size={16} />
                  Compromisso
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentType('recurring')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    appointmentType === 'recurring'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Repeat size={16} />
                  Recorrentes
                </button>
              </>
            )}
          </div>

          {/* Card Principal - Todos os campos essenciais */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {appointmentType === 'recurring' ? (
              /* BLOQUEIO RECORRENTE */
              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recurringTitle}
                    onChange={(e) => setRecurringTitle(e.target.value)}
                    placeholder="Ex: Almoço, Reunião semanal, Intervalo..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                  />
                </div>

                {/* Horários */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Horário de Início <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={recurringStartTime}
                        onChange={(e) => setRecurringStartTime(formatTimeInput(e.target.value))}
                        maxLength={5}
                        placeholder="HH:MM"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Horário de Término <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={recurringEndTime}
                        onChange={(e) => setRecurringEndTime(formatTimeInput(e.target.value))}
                        maxLength={5}
                        placeholder="HH:MM"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Dias da semana */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias da Semana <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border-2 ${
                          selectedDays.includes(day.value)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selecione os dias em que este bloqueio deve aparecer
                  </p>
                </div>

                {/* Dica */}
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    Os bloqueios recorrentes aparecem automaticamente nos dias configurados.
                    Se você agendar um paciente em um horário que tem bloqueio, o agendamento prevalece.
                  </p>
                </div>
              </div>
            ) : appointmentType === 'personal' ? (
              /* COMPROMISSO PESSOAL */
              <div className="space-y-4">
                {/* Título + Profissional em linha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={personalTitle}
                      onChange={(e) => setPersonalTitle(e.target.value)}
                      placeholder="Ex: Reunião, Gravação..."
                      autoFocus
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Profissional <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={professionalId}
                      onChange={(e) => setProfessionalId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                    >
                      <option value="">Selecione...</option>
                      {professionals.map(prof => (
                        <option key={prof.id} value={prof.id}>{prof.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Data e Horários em linha */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Data <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={appointmentDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        maxLength={10}
                        placeholder="dd/mm/aaaa"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Início <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        maxLength={5}
                        placeholder="09:00"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Término <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        maxLength={5}
                        placeholder="10:00"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* AGENDAMENTO DE PACIENTE */
              <div className="space-y-4">
                {/* Paciente + Botão Adicionar */}
                <div ref={patientSearchRef} className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Paciente <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQuickPatientModal(true)}
                      className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      <UserPlus size={14} />
                      Novo Paciente
                    </button>
                  </div>
                  {selectedPatient ? (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-gray-900 rounded-lg px-3 py-2.5">
                      <User size={16} className="text-green-600" />
                      <span className="flex-1 font-medium text-sm">{selectedPatient.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null)
                          setPatientSearch('')
                        }}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
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
                          placeholder="Buscar paciente..."
                          className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                        />
                      </div>
                      {showPatientDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredPatients.length > 0 ? (
                            <div className="p-1">
                              {filteredPatients.map(patient => (
                                <button
                                  key={patient.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPatient(patient)
                                    setPatientSearch(patient.name)
                                    setShowPatientDropdown(false)
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-orange-50 transition-all rounded-lg group"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center border border-orange-200">
                                      <User size={12} className="text-orange-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-gray-900 font-medium text-sm truncate">
                                        {patient.name}
                                      </div>
                                      {patient.phone && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
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
                            <div className="px-4 py-4 text-center text-gray-500 text-sm">
                              <p>Nenhum paciente encontrado</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPatientDropdown(false)
                                  setShowQuickPatientModal(true)
                                }}
                                className="mt-2 text-orange-500 hover:text-orange-600 font-medium text-xs"
                              >
                                + Cadastrar novo paciente
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Procedimento + Profissional + Sala em linha (Profissional e Sala apenas para Pro/Premium) */}
                <div className={`grid grid-cols-1 ${hasFeature('professionals') ? 'md:grid-cols-3' : ''} gap-3`}>
                  <div className={hasFeature('professionals') ? 'md:col-span-1' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Procedimento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customProcedureName}
                      onChange={(e) => setCustomProcedureName(e.target.value)}
                      placeholder="Ex: Botox, Consulta..."
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                    />
                  </div>
                  {hasFeature('professionals') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Profissional <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={professionalId}
                          onChange={(e) => setProfessionalId(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                        >
                          <option value="">Selecione...</option>
                          {professionals.map(prof => (
                            <option key={prof.id} value={prof.id}>{prof.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Sala</label>
                        <input
                          value={room}
                          onChange={(e) => setRoom(e.target.value)}
                          placeholder="Opcional"
                          className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Data e Horários em linha */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Data <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={appointmentDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        maxLength={10}
                        placeholder="dd/mm/aaaa"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Início <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => handleStartTimeChange(e.target.value)}
                        maxLength={5}
                        placeholder="09:00"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Término <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        maxLength={5}
                        placeholder="10:00"
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Observações - Colapsável (não aparece em bloqueios recorrentes) */}
            {appointmentType !== 'recurring' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <FileText size={14} />
                  <span>{showNotes ? 'Ocultar observações' : 'Adicionar observações'}</span>
                </button>
                {showNotes && (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações sobre o agendamento..."
                    rows={2}
                    className="w-full mt-3 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-sm resize-none"
                  />
                )}
              </div>
            )}
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
