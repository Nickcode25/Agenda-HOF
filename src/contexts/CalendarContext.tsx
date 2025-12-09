import { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { isToday, parseISO } from 'date-fns'
import { toSaoPauloTime } from '@/utils/timezone'
import type { Appointment } from '@/types/schedule'

export type ViewMode = 'day' | 'week' | 'month'

interface CalendarContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  currentDate: Date
  setCurrentDate: (date: Date) => void
  goToToday: () => void
  appointmentsToday: number
  setAppointments: (appointments: Appointment[]) => void
  isCalendarPage: boolean
  setIsCalendarPage: (value: boolean) => void
}

const CalendarContext = createContext<CalendarContextType | null>(null)

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isCalendarPage, setIsCalendarPage] = useState(false)

  const goToToday = () => setCurrentDate(new Date())

  // Calcular estatísticas do dia
  const appointmentsToday = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = toSaoPauloTime(parseISO(apt.start))
      return isToday(aptDate)
    }).length
  }, [appointments])

  const value = {
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    goToToday,
    appointmentsToday,
    setAppointments,
    isCalendarPage,
    setIsCalendarPage
  }

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendarContext() {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider')
  }
  return context
}
