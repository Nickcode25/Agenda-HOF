import { useState, useMemo, useEffect } from 'react'
import { isToday, parseISO, isSameDay } from 'date-fns'
import type { Appointment } from '@/types/schedule'
import { toSaoPauloTime } from '@/utils/timezone'
import CalendarHeader from './CalendarHeader'
import CalendarControls from './CalendarControls'
import WeekGrid from './WeekGrid'

type ViewMode = 'day' | 'week' | 'month'

interface NewCalendarProps {
  appointments: Appointment[]
  userName: string
  userPlan: string
  onAppointmentClick: (appointment: Appointment) => void
  onTimeSlotClick?: (date: Date, hour: number) => void
}

export default function NewCalendar({
  appointments,
  userName,
  userPlan,
  onAppointmentClick,
  onTimeSlotClick
}: NewCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

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
    <div className="min-h-screen bg-gray-50 p-6 space-y-4">
      {/* Header com info do usuário e stats */}
      <CalendarHeader
        userName={userName}
        userPlan={userPlan}
        appointmentsToday={todayStats.count}
      />

      {/* Controles de visualização e navegação */}
      <CalendarControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onToday={handleToday}
      />

      {/* Calendário em tela cheia */}
      <WeekGrid
        currentDate={currentDate}
        appointments={appointments}
        onAppointmentClick={onAppointmentClick}
        onTimeSlotClick={onTimeSlotClick}
        viewMode={viewMode}
      />
    </div>
  )
}
