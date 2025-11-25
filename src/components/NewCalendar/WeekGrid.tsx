import { useMemo } from 'react'
import { format, startOfWeek, startOfMonth, endOfMonth, addDays, isSameDay, isToday, parseISO, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/types/schedule'
import type { VirtualBlock } from '@/utils/recurringBlocks'
import { toSaoPauloTime, formatInSaoPaulo } from '@/utils/timezone'

type ViewMode = 'day' | 'week' | 'month'

interface WeekGridProps {
  currentDate: Date
  appointments: Appointment[]
  recurringBlocks?: VirtualBlock[]
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
  viewMode: ViewMode
}

export default function WeekGrid({
  currentDate,
  appointments,
  recurringBlocks = [],
  onAppointmentClick,
  onTimeSlotClick,
  viewMode
}: WeekGridProps) {
  // Altura de cada slot de hora em pixels
  // 176px por hora = 88px para 30min, 44px para 15min (base legível)
  const HOUR_HEIGHT = 176

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

  // Obter bloqueios recorrentes para um dia específico
  const getRecurringBlocksForDay = (date: Date) => {
    return recurringBlocks.filter(block => {
      const blockDate = parseISO(block.start)
      return isSameDay(blockDate, date)
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }

  // Calcular duração do agendamento em minutos
  const getAppointmentDuration = (apt: Appointment) => {
    const aptStart = toSaoPauloTime(parseISO(apt.start))
    const aptEnd = toSaoPauloTime(parseISO(apt.end))
    return (aptEnd.getTime() - aptStart.getTime()) / (1000 * 60)
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

    // Altura mínima de 44px para agendamentos curtos (15min)
    // Com HOUR_HEIGHT=176: 15min=44px, 30min=88px, 1h=176px
    const minHeight = 44

    return {
      top: `${topPx + 1}px`, // +1px para criar espaço entre agendamentos consecutivos
      height: `${Math.max(heightPx - 2, minHeight)}px`, // -2px para criar espaço
      position: 'absolute' as const,
      left: '3px',
      right: '3px',
    }
  }

  // Calcular posição e altura de um bloqueio recorrente
  const getRecurringBlockStyle = (block: VirtualBlock) => {
    const blockStart = parseISO(block.start)
    const blockEnd = parseISO(block.end)

    const startMinutesFromDayStart = (blockStart.getHours() - 7) * 60 + blockStart.getMinutes()
    const endMinutesFromDayStart = (blockEnd.getHours() - 7) * 60 + blockEnd.getMinutes()

    const topPx = (startMinutesFromDayStart / 60) * HOUR_HEIGHT
    const heightPx = ((endMinutesFromDayStart - startMinutesFromDayStart) / 60) * HOUR_HEIGHT

    const minHeight = 30

    return {
      top: `${topPx + 1}px`,
      height: `${Math.max(heightPx - 2, minHeight)}px`,
      position: 'absolute' as const,
      left: '3px',
      right: '3px',
    }
  }

  // Calcular duração de um bloqueio recorrente em minutos
  const getRecurringBlockDuration = (block: VirtualBlock) => {
    const blockStart = parseISO(block.start)
    const blockEnd = parseISO(block.end)
    return (blockEnd.getTime() - blockStart.getTime()) / (1000 * 60)
  }

  // Obter classes de cor baseado no status do agendamento
  const getAppointmentColors = (apt: Appointment) => {
    // Compromisso pessoal = azul claro
    if (apt.isPersonal) {
      return 'bg-gradient-to-r from-sky-300 to-sky-400 hover:from-sky-400 hover:to-sky-500'
    }

    switch (apt.status) {
      case 'confirmed':
        return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
      case 'done':
        return 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
      default: // scheduled
        return 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
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
                      className={`w-full text-left p-1 rounded ${getAppointmentColors(apt)} text-white text-xs truncate transition-all`}
                    >
                      {formatInSaoPaulo(apt.start, 'HH:mm')} - {apt.isPersonal ? apt.title : apt.patientName}
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
      {/* Header com dias */}
      <div className={`grid ${gridCols} border-b border-gray-200 flex-shrink-0`}>
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
      <div className="flex-1 overflow-y-auto">
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
            const dayRecurringBlocks = getRecurringBlocksForDay(day)
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

                {/* Bloqueios recorrentes (renderizados atrás dos agendamentos) */}
                {dayRecurringBlocks.map(block => (
                  <div
                    key={block.id}
                    style={getRecurringBlockStyle(block)}
                    className="rounded-lg bg-sky-100 border-2 border-dashed border-sky-300 overflow-hidden z-5 flex flex-col justify-center items-center p-1.5 text-center opacity-80"
                  >
                    <div className={`font-medium text-sky-700 ${getRecurringBlockDuration(block) <= 30 ? 'text-[10px]' : 'text-xs'}`}>
                      {format(parseISO(block.start), 'HH:mm')} - {format(parseISO(block.end), 'HH:mm')}
                    </div>
                    <div className={`font-medium text-sky-600 leading-tight truncate w-full ${getRecurringBlockDuration(block) <= 30 ? 'text-xs' : 'text-sm'}`}>
                      {block.title}
                    </div>
                  </div>
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
                    className={`rounded-lg ${getAppointmentColors(apt)} text-white shadow-sm hover:shadow-lg transition-all overflow-hidden z-10 flex flex-col justify-center items-center p-1.5 text-center border-2 border-white/30`}
                  >
                    <div className={`font-semibold opacity-90 ${getAppointmentDuration(apt) <= 15 ? 'text-[10px]' : 'text-xs'}`}>
                      {formatInSaoPaulo(apt.start, 'HH:mm')} - {formatInSaoPaulo(apt.end, 'HH:mm')}
                    </div>
                    <div className={`font-medium leading-tight truncate w-full ${getAppointmentDuration(apt) <= 15 ? 'text-xs' : 'text-[13px]'}`}>
                      {apt.isPersonal ? apt.title : apt.patientName}
                    </div>
                    {!apt.isPersonal && viewMode === 'day' && apt.professional && getAppointmentDuration(apt) >= 30 && (
                      <div className="text-[10px] opacity-80 truncate w-full mt-0.5">
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
