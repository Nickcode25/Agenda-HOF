import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { format, startOfWeek, startOfMonth, endOfMonth, addDays, isSameDay, isToday, parseISO, getDay, addMinutes, subMinutes } from 'date-fns'
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
  onAppointmentResize?: (appointmentId: string, newStart: Date, newEnd: Date) => void
  viewMode: ViewMode
}

export default function WeekGrid({
  currentDate,
  appointments,
  recurringBlocks = [],
  onAppointmentClick,
  onTimeSlotClick,
  onAppointmentResize,
  viewMode
}: WeekGridProps) {
  // Altura de cada slot de hora em pixels
  // 60px por hora = estilo Google Agenda, mais compacto
  const HOUR_HEIGHT = 60

  // Estado para resize - agora com preview local para fluidez
  const [resizing, setResizing] = useState<{
    appointmentId: string
    edge: 'top' | 'bottom'
    initialY: number
    initialStart: Date
    initialEnd: Date
    currentStart: Date
    currentEnd: Date
  } | null>(null)

  // Ref para o container de scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Funções de resize
  const handleResizeStart = useCallback((
    e: React.MouseEvent,
    apt: Appointment,
    edge: 'top' | 'bottom'
  ) => {
    e.stopPropagation()
    e.preventDefault()

    const start = parseISO(apt.start)
    const end = parseISO(apt.end)

    setResizing({
      appointmentId: apt.id,
      edge,
      initialY: e.clientY,
      initialStart: start,
      initialEnd: end,
      currentStart: start,
      currentEnd: end
    })
  }, [])

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizing) return

    const deltaY = e.clientY - resizing.initialY
    // Converter pixels para minutos (HOUR_HEIGHT px = 60 min)
    const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 60 / 15) * 15 // Arredondar para 15 min

    let newStart = resizing.initialStart
    let newEnd = resizing.initialEnd

    if (resizing.edge === 'top') {
      newStart = addMinutes(resizing.initialStart, deltaMinutes)
      // Garantir que não ultrapasse o fim e tenha pelo menos 15 min
      if (newStart >= resizing.initialEnd) {
        newStart = subMinutes(resizing.initialEnd, 15)
      }
    } else {
      newEnd = addMinutes(resizing.initialEnd, deltaMinutes)
      // Garantir que não seja antes do início e tenha pelo menos 15 min
      if (newEnd <= resizing.initialStart) {
        newEnd = addMinutes(resizing.initialStart, 15)
      }
    }

    // Atualiza apenas o estado local (preview visual fluido)
    setResizing(prev => prev ? { ...prev, currentStart: newStart, currentEnd: newEnd } : null)
  }, [resizing, HOUR_HEIGHT])

  const handleResizeEnd = useCallback(() => {
    if (resizing && onAppointmentResize) {
      // Só salva no banco quando soltar o mouse
      onAppointmentResize(resizing.appointmentId, resizing.currentStart, resizing.currentEnd)
    }
    setResizing(null)
  }, [resizing, onAppointmentResize])

  // Adicionar listeners globais para mouse move/up durante resize
  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'

      return () => {
        window.removeEventListener('mousemove', handleResizeMove)
        window.removeEventListener('mouseup', handleResizeEnd)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [resizing, handleResizeMove, handleResizeEnd])

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

  // Encontrar o primeiro agendamento de hoje para scroll automático
  const firstTodayAppointment = useMemo(() => {
    const today = new Date()
    const todayAppointments = appointments.filter(apt => {
      const aptDate = toSaoPauloTime(parseISO(apt.start))
      return isSameDay(aptDate, today)
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    return todayAppointments[0] || null
  }, [appointments])

  // Scroll automático para o primeiro agendamento do dia ao carregar
  useEffect(() => {
    if (viewMode === 'month' || !scrollContainerRef.current) return

    // Pequeno delay para garantir que o DOM está renderizado
    const timer = setTimeout(() => {
      if (!scrollContainerRef.current) return

      let scrollPosition = 0

      if (firstTodayAppointment) {
        // Se tem agendamento hoje, scroll para o primeiro agendamento
        const aptStart = toSaoPauloTime(parseISO(firstTodayAppointment.start))
        const startHour = aptStart.getHours()
        const startMinutes = aptStart.getMinutes()

        // Calcular posição em pixels (horário - 7h de início - 1h de margem)
        const hoursFromStart = Math.max(0, startHour - 7 - 1) // -1h para dar margem visual
        scrollPosition = (hoursFromStart * 60 + startMinutes) / 60 * HOUR_HEIGHT
      } else {
        // Se não tem agendamento, scroll para 8h da manhã (1h após o início)
        scrollPosition = HOUR_HEIGHT // 1 hora após as 7h
      }

      scrollContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [firstTodayAppointment, viewMode, HOUR_HEIGHT])

  // Calcular duração do agendamento em minutos
  const getAppointmentDuration = (apt: Appointment) => {
    const aptStart = toSaoPauloTime(parseISO(apt.start))
    const aptEnd = toSaoPauloTime(parseISO(apt.end))
    return (aptEnd.getTime() - aptStart.getTime()) / (1000 * 60)
  }

  // Verificar se dois agendamentos se sobrepõem
  const doAppointmentsOverlap = (apt1: Appointment, apt2: Appointment) => {
    const start1 = new Date(apt1.start).getTime()
    const end1 = new Date(apt1.end).getTime()
    const start2 = new Date(apt2.start).getTime()
    const end2 = new Date(apt2.end).getTime()
    return start1 < end2 && start2 < end1
  }

  // Calcular posição horizontal para agendamentos sobrepostos
  const getOverlappingPosition = (apt: Appointment, dayAppointments: Appointment[]) => {
    // Encontrar todos os agendamentos que se sobrepõem com este
    const overlapping = dayAppointments.filter(other =>
      other.id !== apt.id && doAppointmentsOverlap(apt, other)
    )

    if (overlapping.length === 0) {
      return { index: 0, total: 1 }
    }

    // Incluir o agendamento atual na lista e ordenar por horário de início
    const allOverlapping = [...overlapping, apt].sort((a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    )

    const index = allOverlapping.findIndex(a => a.id === apt.id)
    return { index, total: allOverlapping.length }
  }

  // Calcular posição e altura do agendamento baseado no horário
  const getAppointmentStyle = (apt: Appointment, dayAppointments: Appointment[]) => {
    // Se este agendamento está sendo redimensionado, usa os valores do preview
    const isBeingResized = resizing?.appointmentId === apt.id
    const aptStart = isBeingResized ? resizing.currentStart : toSaoPauloTime(parseISO(apt.start))
    const aptEnd = isBeingResized ? resizing.currentEnd : toSaoPauloTime(parseISO(apt.end))

    // Calcular minutos desde o início do dia (7h)
    const startMinutesFromDayStart = (aptStart.getHours() - 7) * 60 + aptStart.getMinutes()
    const endMinutesFromDayStart = (aptEnd.getHours() - 7) * 60 + aptEnd.getMinutes()

    // Converter minutos para pixels (HOUR_HEIGHT pixels por 60 minutos)
    const topPx = (startMinutesFromDayStart / 60) * HOUR_HEIGHT
    const heightPx = ((endMinutesFromDayStart - startMinutesFromDayStart) / 60) * HOUR_HEIGHT

    // Altura mínima de 20px para agendamentos curtos
    // Com HOUR_HEIGHT=60: 15min=15px, 30min=30px, 1h=60px
    const minHeight = 20

    // Calcular posição horizontal para agendamentos sobrepostos
    const { index, total } = getOverlappingPosition(apt, dayAppointments)
    const width = 100 / total
    const leftPercent = index * width

    return {
      top: `${topPx + 1}px`,
      height: `${Math.max(heightPx - 2, minHeight)}px`,
      position: 'absolute' as const,
      left: `calc(${leftPercent}% + 2px)`,
      width: `calc(${width}% - 4px)`,
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

    const minHeight = 18

    return {
      top: `${topPx + 1}px`,
      height: `${Math.max(heightPx - 2, minHeight)}px`,
      position: 'absolute' as const,
      left: '2px',
      right: '2px',
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
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
                    className="rounded bg-sky-100 border border-dashed border-sky-300 overflow-hidden z-5 flex flex-col justify-center px-1.5 py-0.5 text-left opacity-80"
                  >
                    <div className="text-[10px] font-medium text-sky-700 leading-tight">
                      {format(parseISO(block.start), 'HH:mm')} - {format(parseISO(block.end), 'HH:mm')}
                    </div>
                    <div className="text-[11px] font-medium text-sky-600 leading-tight truncate w-full">
                      {block.title}
                    </div>
                  </div>
                ))}

                {/* Agendamentos posicionados absolutamente */}
                {dayAppointments.map(apt => {
                  const isBeingResized = resizing?.appointmentId === apt.id
                  const displayStart = isBeingResized ? resizing.currentStart : parseISO(apt.start)

                  return (
                    <div
                      key={apt.id}
                      style={getAppointmentStyle(apt, dayAppointments)}
                      className={`rounded ${getAppointmentColors(apt)} text-white shadow-sm hover:shadow-md overflow-hidden z-10 flex flex-col border border-white/20 group relative ${isBeingResized ? 'ring-2 ring-white/50' : ''}`}
                    >
                      {/* Handle superior para resize */}
                      {onAppointmentResize && (
                        <div
                          onMouseDown={(e) => handleResizeStart(e, apt, 'top')}
                          className="absolute top-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity z-20"
                        />
                      )}

                      {/* Conteúdo do card - centralizado */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!resizing) onAppointmentClick(apt)
                        }}
                        className="flex-1 flex items-center justify-center px-1 w-full"
                      >
                        <span className="text-[10px] font-medium opacity-90 whitespace-nowrap">
                          {format(displayStart, 'HH:mm')}
                        </span>
                        <span className="text-[11px] font-semibold truncate ml-1">
                          {apt.isPersonal ? apt.title : apt.patientName}
                        </span>
                      </button>

                      {/* Handle inferior para resize */}
                      {onAppointmentResize && (
                        <div
                          onMouseDown={(e) => handleResizeStart(e, apt, 'bottom')}
                          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-opacity z-20"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
