import { useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  subDays,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { Appointment } from '@/types/schedule'

type ViewMode = 'day' | 'week' | 'month'

type CalendarProps = {
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onDayClick?: (date: Date, appointments: Appointment[]) => void
  viewMode?: ViewMode
}

export default function Calendar({ appointments, onAppointmentClick, onDayClick, viewMode = 'month' }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentDay, setCurrentDay] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { locale: ptBR })
  const endDate = endOfWeek(monthEnd, { locale: ptBR })

  const dateFormat = 'd'
  const rows: Date[][] = []
  let days: Date[] = []
  let day = startDate

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day)
      day = addDays(day, 1)
    }
    rows.push(days)
    days = []
  }

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.start)
      return isSameDay(aptDate, date)
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextWeek = () => setCurrentDay(addWeeks(currentDay, 1))
  const prevWeek = () => setCurrentDay(subWeeks(currentDay, 1))
  const nextDay = () => setCurrentDay(addDays(currentDay, 1))
  const prevDay = () => setCurrentDay(subDays(currentDay, 1))
  const today = () => {
    setCurrentMonth(new Date())
    setCurrentDay(new Date())
  }

  const getWeekDays = () => {
    const start = startOfWeek(currentDay, { locale: ptBR })
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i))
    }
    return days
  }

  const getHoursRange = () => {
    const hours = []
    for (let i = 7; i <= 23; i++) {
      hours.push(i)
    }
    return hours
  }

  const getAppointmentsForDayAndHour = (date: Date, hour: number) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.start)
      return isSameDay(aptDate, date) && aptDate.getHours() === hour
    })
  }

  // Renderização por visualização
  if (viewMode === 'day') {
    const hours = getHoursRange()
    const dayAppointments = getAppointmentsForDay(currentDay)

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {format(currentDay, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={today}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={prevDay}
              className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextDay}
              className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[600px] overflow-y-auto">
          {hours.map(hour => {
            const hourAppointments = getAppointmentsForDayAndHour(currentDay, hour)
            return (
              <div key={hour} className="flex gap-4 border-b border-gray-700/50 py-3">
                <div className="w-20 flex-shrink-0 text-gray-400 font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 space-y-2">
                  {hourAppointments.map(apt => (
                    <button
                      key={apt.id}
                      onClick={() => onAppointmentClick(apt)}
                      className="w-full text-left p-3 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 hover:border-orange-500/50 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-orange-400" />
                        <span className="text-orange-300 font-medium text-sm">
                          {format(parseISO(apt.start), 'HH:mm')} - {format(parseISO(apt.end), 'HH:mm')}
                        </span>
                      </div>
                      <div className="text-white font-medium">{apt.patientName}</div>
                      <div className="text-gray-400 text-sm">{apt.procedure}</div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (viewMode === 'week') {
    const weekDays = getWeekDays()
    const hours = getHoursRange()

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {format(weekDays[0], "d 'de' MMM", { locale: ptBR })} - {format(weekDays[6], "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={today}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={prevWeek}
              className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextWeek}
              className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-sm font-semibold text-gray-400"></div>
              {weekDays.map(day => (
                <div key={day.toString()} className={`text-center text-sm font-semibold py-2 rounded-lg ${
                  isToday(day) ? 'bg-orange-500/10 text-orange-400' : 'text-gray-400'
                }`}>
                  <div>{format(day, 'EEE', { locale: ptBR })}</div>
                  <div className="text-lg">{format(day, 'd')}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-8 gap-2">
                  <div className="text-gray-400 text-sm font-medium py-2">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {weekDays.map(day => {
                    const hourAppointments = getAppointmentsForDayAndHour(day, hour)
                    return (
                      <div key={day.toString()} className="min-h-[60px] border border-gray-700/50 rounded-lg p-1">
                        {hourAppointments.map(apt => (
                          <button
                            key={apt.id}
                            onClick={() => onAppointmentClick(apt)}
                            className="w-full text-left p-1 rounded bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 transition-all mb-1"
                          >
                            <div className="text-xs text-orange-300 font-medium">
                              {format(parseISO(apt.start), 'HH:mm')}
                            </div>
                            <div className="text-xs text-white truncate">{apt.patientName}</div>
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Visualização de mês (código original)
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={today}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="space-y-2">
          {rows.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIdx) => {
                const dayAppointments = getAppointmentsForDay(day)
                const isCurrentMonth = isSameMonth(day, monthStart)
                const isDayToday = isToday(day)

                return (
                  <div
                    key={dayIdx}
                    onClick={() => isCurrentMonth && onDayClick?.(day, dayAppointments)}
                    className={`min-h-[120px] rounded-xl border-2 p-2 transition-all ${
                      isCurrentMonth
                        ? isDayToday
                          ? 'bg-orange-500/10 border-orange-500 cursor-pointer hover:bg-orange-500/20'
                          : 'bg-gray-700/50 border-gray-700 hover:border-orange-500/50 cursor-pointer hover:bg-gray-700'
                        : 'bg-gray-800/30 border-gray-800'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-2 ${
                      isCurrentMonth
                        ? isDayToday
                          ? 'text-orange-400'
                          : 'text-white'
                        : 'text-gray-600'
                    }`}>
                      {format(day, dateFormat)}
                    </div>

                    {/* Appointments */}
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map(apt => (
                        <button
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAppointmentClick(apt)
                          }}
                          className="w-full text-left px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 hover:border-orange-500/50 transition-all group"
                        >
                          <div className="flex items-center gap-1 text-xs">
                            <Clock size={10} className="text-orange-400" />
                            <span className="text-orange-300 font-medium">
                              {format(parseISO(apt.start), 'HH:mm')}
                            </span>
                          </div>
                          <div className="text-xs text-white truncate mt-0.5">
                            {apt.patientName}
                          </div>
                        </button>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-400 text-center py-1">
                          +{dayAppointments.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
