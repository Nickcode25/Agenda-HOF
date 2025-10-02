import { useState } from 'react'
import { useSchedule } from '@/store/schedule'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import Calendar from '@/components/Calendar'
import AppointmentModal from '@/components/AppointmentModal'
import DayAppointmentsModal from '@/components/DayAppointmentsModal'
import type { Appointment } from '@/types/schedule'

export default function ScheduleCalendar() {
  const { appointments, removeAppointment } = useSchedule()
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([])

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
          <p className="text-gray-400">Visualize e gerencie seus agendamentos</p>
        </div>
        <Link 
          to="/agenda/nova" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105"
        >
          <Plus size={20} />
          Novo Agendamento
        </Link>
      </div>

      {/* Calendar */}
      <Calendar 
        appointments={appointments} 
        onAppointmentClick={handleAppointmentClick}
        onDayClick={handleDayClick}
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
