import { useState, useMemo, useEffect } from 'react'
import { isToday, parseISO, isSameDay } from 'date-fns'
import type { Appointment } from '@/types/schedule'
import { toSaoPauloTime } from '@/utils/timezone'
import CalendarHeader from './CalendarHeader'
import CalendarControls from './CalendarControls'
import WeekGrid from './WeekGrid'
import UpcomingAppointments from './UpcomingAppointments'

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

    // Por enquanto, receita é 0 pois Appointment não tem price
    // No futuro, pode ser calculado a partir dos procedimentos
    const revenue = 0

    return {
      count: todayAppointments.length,
      revenue
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
        revenueToday={todayStats.revenue}
      />

      {/* Controles de visualização e navegação */}
      <CalendarControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onToday={handleToday}
      />

      {/* Layout principal com calendário e sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4">
        {/* Calendário */}
        <div>
          {viewMode === 'week' && (
            <WeekGrid
              currentDate={currentDate}
              appointments={appointments}
              onAppointmentClick={onAppointmentClick}
              onTimeSlotClick={onTimeSlotClick}
            />
          )}

          {viewMode === 'day' && (
            <WeekGrid
              currentDate={currentDate}
              appointments={appointments}
              onAppointmentClick={onAppointmentClick}
              onTimeSlotClick={onTimeSlotClick}
            />
          )}

          {viewMode === 'month' && (
            <WeekGrid
              currentDate={currentDate}
              appointments={appointments}
              onAppointmentClick={onAppointmentClick}
              onTimeSlotClick={onTimeSlotClick}
            />
          )}
        </div>

        {/* Sidebar com próximos agendamentos */}
        <div className="hidden lg:block">
          <UpcomingAppointments
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
          />
        </div>
      </div>
    </div>
  )
}
