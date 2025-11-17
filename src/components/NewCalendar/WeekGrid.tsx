import { useMemo } from 'react'
import { format, startOfWeek, addDays, isSameDay, isToday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/types/schedule'
import { toSaoPauloTime, formatInSaoPaulo } from '@/utils/timezone'

interface WeekGridProps {
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
}

export default function WeekGrid({
  currentDate,
  appointments,
  onAppointmentClick,
  onTimeSlotClick
}: WeekGridProps) {
  // Gerar dias da semana
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: ptBR })
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i))
    }
    return days
  }, [currentDate])

  // Gerar horários (7h às 20h)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 7; hour <= 20; hour++) {
      slots.push(hour)
    }
    return slots
  }, [])

  // Obter agendamentos para um dia específico
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = toSaoPauloTime(parseISO(apt.start))
      return isSameDay(aptDate, date)
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  // Obter agendamentos para um slot de hora específico
  const getAppointmentsForSlot = (date: Date, hour: number) => {
    return appointments.filter(apt => {
      const aptDate = toSaoPauloTime(parseISO(apt.start))
      return isSameDay(aptDate, date) && aptDate.getHours() === hour
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header com dias da semana */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        {/* Coluna vazia para horários */}
        <div className="p-3 bg-gray-50 border-r border-gray-200" />

        {/* Dias da semana */}
        {weekDays.map((day, index) => {
          const isDayToday = isToday(day)
          return (
            <div
              key={index}
              className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                isDayToday ? 'bg-orange-50' : 'bg-gray-50'
              }`}
            >
              <div className="text-xs font-medium text-gray-500 uppercase">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className={`text-lg font-bold mt-1 ${
                isDayToday ? 'text-orange-500' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
              {isDayToday && (
                <div className="text-xs text-orange-500 font-medium">(Hoje)</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Grid de horários e agendamentos */}
      <div className="max-h-[600px] overflow-y-auto">
        {timeSlots.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
            {/* Coluna de horário */}
            <div className="p-2 text-right pr-3 text-sm text-gray-500 font-medium border-r border-gray-200 bg-gray-50">
              {String(hour).padStart(2, '0')}:00
            </div>

            {/* Células para cada dia */}
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForSlot(day, hour)
              const isDayToday = isToday(day)

              return (
                <div
                  key={dayIndex}
                  onClick={() => onTimeSlotClick?.(day, hour)}
                  className={`min-h-[60px] p-1 border-r border-gray-100 last:border-r-0 transition-all cursor-pointer hover:bg-gray-50 ${
                    isDayToday ? 'bg-orange-50/30' : ''
                  }`}
                >
                  {dayAppointments.map(apt => (
                    <button
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick(apt)
                      }}
                      className="w-full text-left p-2 mb-1 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      <div className="text-xs font-semibold">
                        {formatInSaoPaulo(apt.start, 'HH:mm')}
                      </div>
                      <div className="text-sm font-medium truncate">
                        {apt.patientName}
                      </div>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
