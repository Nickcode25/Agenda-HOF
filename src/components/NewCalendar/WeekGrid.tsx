import { useMemo } from 'react'
import { format, startOfWeek, startOfMonth, endOfMonth, addDays, isSameDay, isToday, parseISO, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/types/schedule'
import { toSaoPauloTime, formatInSaoPaulo } from '@/utils/timezone'

type ViewMode = 'day' | 'week' | 'month'

interface WeekGridProps {
  currentDate: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
  viewMode: ViewMode
}

export default function WeekGrid({
  currentDate,
  appointments,
  onAppointmentClick,
  onTimeSlotClick,
  viewMode
}: WeekGridProps) {
  // Gerar dias baseado no modo de visualização
  const days = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate]
    }
    if (viewMode === 'week') {
      // Começar na segunda-feira (weekStartsOn: 1)
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const daysArray = []
      for (let i = 0; i < 7; i++) {
        daysArray.push(addDays(start, i))
      }
      return daysArray
    }
    // month - retorna todos os dias do mês
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const daysArray = []
    let day = monthStart
    while (day <= monthEnd) {
      daysArray.push(day)
      day = addDays(day, 1)
    }
    return daysArray
  }, [currentDate, viewMode])

  // Gerar horários (7h às 24h)
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 7; hour <= 23; hour++) {
      slots.push(hour)
    }
    return slots
  }, [])

  // Obter agendamentos para um slot de hora específico
  const getAppointmentsForSlot = (date: Date, hour: number) => {
    return appointments.filter(apt => {
      const aptDate = toSaoPauloTime(parseISO(apt.start))
      return isSameDay(aptDate, date) && aptDate.getHours() === hour
    })
  }

  // Obter agendamentos para um dia (para visualização de mês)
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = toSaoPauloTime(parseISO(apt.start))
      return isSameDay(aptDate, date)
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  // Grid columns baseado no modo - para dia, usamos layout flexível
  const gridCols = viewMode === 'day' ? 'grid-cols-[80px_1fr]' : 'grid-cols-8'

  // Renderizar visualização de mês
  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate)
    // getDay retorna 0 para domingo, 1 para segunda, etc.
    // Para começar na segunda, ajustamos: se for domingo (0), vira 6, senão subtrai 1
    const dayOfWeek = getDay(monthStart)
    const startDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    // Criar array com dias vazios antes do primeiro dia do mês
    const calendarDays: (Date | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push(null)
    }
    days.forEach(day => calendarDays.push(day))

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header com dias da semana - Segunda a Domingo */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dayName, index) => (
            <div key={index} className="p-3 text-center bg-gray-50 border-r border-gray-200 last:border-r-0">
              <span className="text-xs font-medium text-gray-500 uppercase">{dayName}</span>
            </div>
          ))}
        </div>

        {/* Grid de dias do mês */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-[100px] p-2 border-r border-b border-gray-100 bg-gray-50/50" />
            }

            const isDayToday = isToday(day)
            const dayAppointments = getAppointmentsForDay(day)

            return (
              <div
                key={index}
                onClick={() => onTimeSlotClick?.(day, 9)}
                className={`min-h-[100px] p-2 border-r border-b border-gray-100 last:border-r-0 cursor-pointer hover:bg-gray-50 transition-all ${
                  isDayToday ? 'bg-orange-50/50' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isDayToday ? 'text-orange-500' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map(apt => (
                    <button
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick(apt)
                      }}
                      className="w-full text-left p-1 rounded bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs truncate hover:from-orange-600 hover:to-orange-700 transition-all"
                    >
                      {formatInSaoPaulo(apt.start, 'HH:mm')} - {formatInSaoPaulo(apt.end, 'HH:mm')} | {apt.patientName}
                    </button>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayAppointments.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Renderizar visualização de dia ou semana
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header com dias */}
      <div className={`grid ${gridCols} border-b border-gray-200`}>
        {/* Coluna vazia para horários */}
        <div className="p-3 bg-gray-50 border-r border-gray-200" />

        {/* Dias */}
        {days.map((day, index) => {
          const isDayToday = isToday(day)
          return (
            <div
              key={index}
              className={`p-3 ${viewMode === 'day' ? 'text-left pl-6' : 'text-center'} border-r border-gray-200 last:border-r-0 ${
                isDayToday ? 'bg-orange-50' : 'bg-gray-50'
              }`}
            >
              <div className="text-xs font-medium text-gray-500 uppercase">
                {viewMode === 'day'
                  ? format(day, "EEEE, d 'de' MMMM", { locale: ptBR })
                  : format(day, 'EEE', { locale: ptBR })
                }
              </div>
              {viewMode !== 'day' && (
                <>
                  <div className={`text-lg font-bold mt-1 ${
                    isDayToday ? 'text-orange-500' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  {isDayToday && (
                    <div className="text-xs text-orange-500 font-medium">(Hoje)</div>
                  )}
                </>
              )}
              {viewMode === 'day' && isDayToday && (
                <span className="ml-2 text-xs text-orange-500 font-medium">(Hoje)</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Grid de horários e agendamentos */}
      <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
        {timeSlots.map(hour => (
          <div key={hour} className={`grid ${gridCols} border-b border-gray-100 last:border-b-0`}>
            {/* Coluna de horário */}
            <div className="p-2 text-right pr-3 text-sm text-gray-500 font-medium border-r border-gray-200 bg-gray-50">
              {String(hour).padStart(2, '0')}:00
            </div>

            {/* Células para cada dia */}
            {days.map((day, dayIndex) => {
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
                      className={`text-left mb-1 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${
                        viewMode === 'day' ? 'p-3 max-w-md' : 'p-2 w-full'
                      }`}
                    >
                      <div className="text-xs font-semibold">
                        {formatInSaoPaulo(apt.start, 'HH:mm')} - {formatInSaoPaulo(apt.end, 'HH:mm')}
                      </div>
                      <div className={`font-medium truncate ${viewMode === 'day' ? 'text-base' : 'text-sm'}`}>
                        {apt.patientName}
                      </div>
                      {viewMode === 'day' && apt.professional && (
                        <div className="text-xs text-white/80 mt-1">
                          {apt.professional}
                        </div>
                      )}
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
