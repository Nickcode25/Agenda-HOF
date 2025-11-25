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
  // Altura de cada slot de hora em pixels
  // 120px por hora = 60px para 30min, 30px para 15min
  const HOUR_HEIGHT = 120

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

  // Obter agendamentos para um dia específico
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = toSaoPauloTime(parseISO(apt.start))
      return isSameDay(aptDate, date)
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  // Calcular posição e altura do agendamento baseado no horário
  const getAppointmentStyle = (apt: Appointment) => {
    const aptStart = toSaoPauloTime(parseISO(apt.start))
    const aptEnd = toSaoPauloTime(parseISO(apt.end))

    // Calcular minutos desde o início do dia (7h)
    const startMinutesFromDayStart = (aptStart.getHours() - 7) * 60 + aptStart.getMinutes()
    const endMinutesFromDayStart = (aptEnd.getHours() - 7) * 60 + aptEnd.getMinutes()

    // Converter minutos para pixels (HOUR_HEIGHT pixels por 60 minutos)
    const topPx = (startMinutesFromDayStart / 60) * HOUR_HEIGHT
    const heightPx = ((endMinutesFromDayStart - startMinutesFromDayStart) / 60) * HOUR_HEIGHT

    // Altura mínima de 28px para agendamentos curtos (15min)
    // Com HOUR_HEIGHT=120: 15min=30px, 30min=60px, 1h=120px
    const minHeight = 28

    return {
      top: `${topPx + 1}px`, // +1px para criar espaço entre agendamentos consecutivos
      height: `${Math.max(heightPx - 2, minHeight)}px`, // -2px para criar espaço
      position: 'absolute' as const,
      left: '3px',
      right: '3px',
    }
  }

  // Grid columns baseado no modo
  const gridCols = viewMode === 'day' ? 'grid-cols-[60px_1fr]' : 'grid-cols-[60px_repeat(7,1fr)]'

  // Renderizar visualização de mês
  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate)
    const dayOfWeek = getDay(monthStart)
    const startDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    const calendarDays: (Date | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push(null)
    }
    days.forEach(day => calendarDays.push(day))

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dayName, index) => (
            <div key={index} className="p-3 text-center bg-gray-50 border-r border-gray-200 last:border-r-0">
              <span className="text-xs font-medium text-gray-500 uppercase">{dayName}</span>
            </div>
          ))}
        </div>

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
                      {formatInSaoPaulo(apt.start, 'HH:mm')} - {apt.patientName}
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
        <div className={`grid ${gridCols}`}>
          {/* Coluna de horários */}
          <div className="border-r border-gray-200 bg-gray-50">
            {timeSlots.map(hour => (
              <div
                key={hour}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="flex items-start justify-end pr-2 pt-1 text-xs text-gray-500 font-medium border-b border-gray-100"
              >
                {String(hour).padStart(2, '0')}h00
              </div>
            ))}
          </div>

          {/* Colunas dos dias com agendamentos */}
          {days.map((day, dayIndex) => {
            const dayAppointments = getAppointmentsForDay(day)
            const isDayToday = isToday(day)

            return (
              <div
                key={dayIndex}
                className={`relative border-r border-gray-100 last:border-r-0 ${
                  isDayToday ? 'bg-orange-50/20' : ''
                }`}
                style={{ height: `${timeSlots.length * HOUR_HEIGHT}px` }}
              >
                {/* Linhas de hora */}
                {timeSlots.map(hour => (
                  <div
                    key={hour}
                    onClick={() => onTimeSlotClick?.(day, hour)}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  />
                ))}

                {/* Agendamentos posicionados absolutamente */}
                {dayAppointments.map(apt => (
                  <button
                    key={apt.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAppointmentClick(apt)
                    }}
                    style={getAppointmentStyle(apt)}
                    className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all overflow-hidden z-10 flex flex-col justify-start p-1.5 text-left border-2 border-white/30"
                  >
                    <div className="text-[10px] font-semibold opacity-90">
                      {formatInSaoPaulo(apt.start, 'HH:mm')} - {formatInSaoPaulo(apt.end, 'HH:mm')}
                    </div>
                    <div className="text-xs font-medium leading-tight truncate">
                      {apt.patientName}
                    </div>
                    {viewMode === 'day' && apt.professional && (
                      <div className="text-[10px] opacity-80 truncate mt-0.5">
                        {apt.professional}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
