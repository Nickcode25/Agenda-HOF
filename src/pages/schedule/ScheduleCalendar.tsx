import { useState, useMemo } from 'react'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import { Link } from 'react-router-dom'
import { Plus, User, CalendarDays, CalendarRange, Calendar as CalendarIcon } from 'lucide-react'
import Calendar from '@/components/Calendar'
import AppointmentModal from '@/components/AppointmentModal'
import DayAppointmentsModal from '@/components/DayAppointmentsModal'
import type { Appointment } from '@/types/schedule'

type ViewMode = 'day' | 'week' | 'month'

export default function ScheduleCalendar() {
  const { appointments, removeAppointment } = useSchedule()
  const { professionals } = useProfessionals()
  const { selectedProfessional } = useProfessionalContext()
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  // Filtrar agendamentos por profissional selecionado
  const filteredAppointments = useMemo(() => {
    if (!selectedProfessional) return appointments
    const selectedProf = professionals.find(p => p.id === selectedProfessional)
    if (!selectedProf) return appointments
    return appointments.filter(apt => apt.professional === selectedProf.name)
  }, [appointments, selectedProfessional, professionals])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Agenda</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-400">Visualize e gerencie seus agendamentos</p>
            {selectedProfessionalName && (
              <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30">
                <User size={14} />
                <span>{selectedProfessionalName}</span>
              </div>
            )}
          </div>
        </div>
        <Link
          to="/app/agenda/nova"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105"
        >
          <Plus size={20} />
          Novo Agendamento
        </Link>
      </div>

      {/* View Mode Selector */}
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

      {/* Calendar */}
      <Calendar
        appointments={filteredAppointments}
        onAppointmentClick={handleAppointmentClick}
        onDayClick={handleDayClick}
        viewMode={viewMode}
      />

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
