import { useState, useMemo, useEffect } from 'react'
import { isToday, parseISO, isSameDay, startOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns'
import type { Appointment } from '@/types/schedule'
import type { RecurringBlock } from '@/types/recurring'
import { toSaoPauloTime } from '@/utils/timezone'
import { generateRecurringBlocksForPeriod } from '@/utils/recurringBlocks'
import CalendarHeader from './CalendarHeader'
import CalendarControls from './CalendarControls'
import WeekGrid from './WeekGrid'

type ViewMode = 'day' | 'week' | 'month'

interface NewCalendarProps {
  appointments: Appointment[]
  recurringBlocks?: RecurringBlock[]
  userName: string
  userPlan: string
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
  onTimeSlotSelect?: (date: Date, startHour: number, startMinutes: number, endHour: number, endMinutes: number) => void
  onAppointmentResize?: (appointmentId: string, newStart: Date, newEnd: Date) => void
}

export default function NewCalendar({
  appointments,
  recurringBlocks = [],
  userName,
  userPlan,
  onAppointmentClick,
  onTimeSlotClick,
  onTimeSlotSelect,
  onAppointmentResize
}: NewCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

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
    <div className="h-full bg-gray-50 p-6 flex flex-col overflow-hidden">
      {/* Header com info do usuário e stats */}
      <div className="flex-shrink-0 mb-4">
        <CalendarHeader
          userName={userName}
          userPlan={userPlan}
          appointmentsToday={todayStats.count}
        />
      </div>

      {/* Controles de visualização e navegação */}
      <div className="flex-shrink-0 mb-4">
        <CalendarControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onToday={handleToday}
        />
      </div>

      {/* Calendário em tela cheia */}
      <div className="flex-1 min-h-0">
        <WeekGrid
          currentDate={currentDate}
          appointments={appointments}
          recurringBlocks={virtualBlocks}
          onAppointmentClick={onAppointmentClick}
          onTimeSlotClick={onTimeSlotClick}
          onTimeSlotSelect={onTimeSlotSelect}
          onAppointmentResize={onAppointmentResize}
          viewMode={viewMode}
        />
      </div>
    </div>
  )
}
