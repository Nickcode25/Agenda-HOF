import { useState, useMemo, useEffect } from 'react'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import { Link } from 'react-router-dom'
import { Plus, User, CalendarDays, CalendarRange, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import Calendar from '@/components/Calendar'
import AppointmentModal from '@/components/AppointmentModal'
import DayAppointmentsModal from '@/components/DayAppointmentsModal'
import DayTimeline from '@/components/DayTimeline'
import type { Appointment } from '@/types/schedule'

type ViewMode = 'day' | 'week' | 'month'

export default function ScheduleCalendar() {
  const { appointments, removeAppointment, updateAppointment, fetchAppointments } = useSchedule()
  const { professionals, fetchAll: fetchProfessionals } = useProfessionals()
  const { selectedProfessional } = useProfessionalContext()

  // Carregar profissionais e agendamentos ao montar o componente
  useEffect(() => {
    fetchProfessionals()
    fetchAppointments()
  }, [])

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDayView, setCurrentDayView] = useState<Date>(new Date())

  // Filtrar agendamentos por profissional selecionado
  const filteredAppointments = useMemo(() => {
    if (!selectedProfessional) return appointments
    const selectedProf = professionals.find(p => p.id === selectedProfessional)
    if (!selectedProf) return appointments
    return appointments.filter(apt => apt.professional === selectedProf.name)
  }, [appointments, selectedProfessional, professionals])

  // Filtrar agendamentos do dia atual na visualização de dia
  const dayViewAppointments = useMemo(() => {
    const dayStart = new Date(currentDayView)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(currentDayView)
    dayEnd.setHours(23, 59, 59, 999)

    return filteredAppointments.filter(apt => {
      const aptDate = new Date(apt.start)
      return aptDate >= dayStart && aptDate <= dayEnd
    })
  }, [filteredAppointments, currentDayView])

  // Obter nome do profissional selecionado
  const selectedProfessionalName = useMemo(() => {
    if (!selectedProfessional) return null
    return professionals.find(p => p.id === selectedProfessional)?.name
  }, [selectedProfessional, professionals])

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setSelectedDay(null) // Fecha o modal de dia se estiver aberto
  }

  const handleDayClick = (date: Date, appointments: Appointment[]) => {
    setSelectedDay(date)
    setDayAppointments(appointments)
  }

  const handleCloseModal = () => {
    setSelectedAppointment(null)
  }

  const handleCloseDayModal = () => {
    setSelectedDay(null)
    setDayAppointments([])
  }

  const handleDeleteAppointment = (id: string) => {
    removeAppointment(id)
  }

  const handleUpdateAppointment = async (id: string, updates: Partial<Appointment>) => {
    await updateAppointment(id, updates)
  }

  // Navegação de dia
  const goToPreviousDay = () => {
    const newDate = new Date(currentDayView)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDayView(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(currentDayView)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDayView(newDate)
  }

  const goToToday = () => {
    setCurrentDayView(new Date())
  }

  return (
    <div className="space-y-6">
      {/* Header with Professional Filter */}
      {selectedProfessionalName && (
        <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30 w-fit">
          <User size={14} />
          <span>{selectedProfessionalName}</span>
        </div>
      )}

      {/* View Mode Selector and New Appointment Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-xl border border-gray-700 w-fit">
          <button
            onClick={() => setViewMode('day')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'day'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <CalendarDays size={18} />
            <span className="hidden sm:inline">Dia</span>
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <CalendarRange size={18} />
            <span className="hidden sm:inline">Semana</span>
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'month'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <CalendarIcon size={18} />
            <span className="hidden sm:inline">Mês</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Day Navigation */}
          {viewMode === 'day' && (
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                title="Dia anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
              >
                Hoje
              </button>
              <button
                onClick={goToNextDay}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                title="Próximo dia"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* New Appointment Button */}
          <Link
            to="/app/agenda/nova"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105"
          >
            <Plus size={20} />
            Novo Agendamento
          </Link>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'day' ? (
        <DayTimeline
          date={currentDayView}
          appointments={dayViewAppointments}
          onAppointmentClick={handleAppointmentClick}
          onUpdateAppointment={handleUpdateAppointment}
          onDeleteAppointment={handleDeleteAppointment}
        />
      ) : (
        <Calendar
          appointments={filteredAppointments}
          onAppointmentClick={handleAppointmentClick}
          onDayClick={handleDayClick}
          viewMode={viewMode}
        />
      )}

      {/* Day Appointments Modal */}
      <DayAppointmentsModal
        date={selectedDay}
        appointments={dayAppointments}
        onClose={handleCloseDayModal}
        onAppointmentClick={handleAppointmentClick}
      />

      {/* Appointment Modal */}
      <AppointmentModal
        appointment={selectedAppointment}
        onClose={handleCloseModal}
        onDelete={handleDeleteAppointment}
      />
    </div>
  )
}
