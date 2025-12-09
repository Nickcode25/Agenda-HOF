import { useState, useMemo } from 'react'
import { isToday, parseISO, startOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns'
import type { Appointment } from '@/types/schedule'
import type { RecurringBlock } from '@/types/recurring'
import { toSaoPauloTime } from '@/utils/timezone'
import { generateRecurringBlocksForPeriod } from '@/utils/recurringBlocks'
import CalendarControls, { ViewMode } from './CalendarControls'
import WeekGrid from './WeekGrid'

// Re-exportar tipos úteis
export type { ViewMode }
export { CalendarControls }

interface NewCalendarProps {
  appointments: Appointment[]
  recurringBlocks?: RecurringBlock[]
  userName: string
  userPlan: string
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
  onTimeSlotSelect?: (date: Date, startHour: number, startMinutes: number, endHour: number, endMinutes: number) => void
  onAppointmentResize?: (appointmentId: string, newStart: Date, newEnd: Date) => void
  onAppointmentMove?: (appointmentId: string, newStart: Date, newEnd: Date) => void
  // Novos props para controle externo
  externalViewMode?: ViewMode
  externalCurrentDate?: Date
  onExternalViewModeChange?: (mode: ViewMode) => void
  onExternalDateChange?: (date: Date) => void
  hideControls?: boolean
}

export default function NewCalendar({
  appointments,
  recurringBlocks = [],
  onAppointmentClick,
  onTimeSlotClick,
  onTimeSlotSelect,
  onAppointmentResize,
  onAppointmentMove,
  externalViewMode,
  externalCurrentDate,
  onExternalViewModeChange,
  onExternalDateChange,
  hideControls = false
}: NewCalendarProps) {
  // Estado interno (usado quando não há controle externo)
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('week')
  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date())

  // Usar estado externo se fornecido, senão usar interno
  const viewMode = externalViewMode ?? internalViewMode
  const currentDate = externalCurrentDate ?? internalCurrentDate
  const setViewMode = onExternalViewModeChange ?? setInternalViewMode
  const setCurrentDate = onExternalDateChange ?? setInternalCurrentDate

  // Gerar array de datas baseado no viewMode e currentDate
  const visibleDates = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDate]
    }
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const daysArray = []
      for (let i = 0; i < 7; i++) {
        daysArray.push(addDays(start, i))
      }
      return daysArray
    }
    // month
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

  // Gerar bloqueios virtuais com lógica de sobreposição
  const virtualBlocks = useMemo(() => {
    if (recurringBlocks.length === 0) return []
    return generateRecurringBlocksForPeriod(visibleDates, recurringBlocks, appointments)
  }, [visibleDates, recurringBlocks, appointments])

  // Calcular estatísticas do dia
  const todayStats = useMemo(() => {
    const todayAppointments = appointments.filter(apt => {
      const aptDate = toSaoPauloTime(parseISO(apt.start))
      return isToday(aptDate)
    })

    return {
      count: todayAppointments.length
    }
  }, [appointments])

  // Handler para ir para hoje
  const handleToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <div className="flex flex-col">
      {/* Controles de visualização e navegação (apenas se não estiver oculto) */}
      {!hideControls && (
        <div className="flex-shrink-0 mb-4">
          <CalendarControls
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onToday={handleToday}
            appointmentsToday={todayStats.count}
          />
        </div>
      )}

      {/* Calendário */}
      <div>
        <WeekGrid
          currentDate={currentDate}
          appointments={appointments}
          recurringBlocks={virtualBlocks}
          onAppointmentClick={onAppointmentClick}
          onTimeSlotClick={onTimeSlotClick}
          onTimeSlotSelect={onTimeSlotSelect}
          onAppointmentResize={onAppointmentResize}
          onAppointmentMove={onAppointmentMove}
          viewMode={viewMode}
        />
      </div>
    </div>
  )
}

// Hook auxiliar para usar o estado do calendário em componentes externos
export function useCalendarState(initialViewMode: ViewMode = 'week') {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [currentDate, setCurrentDate] = useState(new Date())

  const goToToday = () => setCurrentDate(new Date())

  return {
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    goToToday
  }
}
