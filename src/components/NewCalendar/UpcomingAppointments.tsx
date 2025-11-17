import { useMemo } from 'react'
import { format, parseISO, isToday, isTomorrow, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import type { Appointment } from '@/types/schedule'
import { toSaoPauloTime, formatInSaoPaulo } from '@/utils/timezone'

interface UpcomingAppointmentsProps {
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
}

export default function UpcomingAppointments({
  appointments,
  onAppointmentClick
}: UpcomingAppointmentsProps) {
  // Filtrar e ordenar próximos agendamentos
  const upcomingAppointments = useMemo(() => {
    const now = new Date()

    return appointments
      .filter(apt => {
        const aptDate = toSaoPauloTime(parseISO(apt.start))
        return isAfter(aptDate, now) || isToday(aptDate)
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 10) // Mostrar até 10 próximos
  }, [appointments])

  // Obter status badge
  const getStatusIndicator = (status?: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return <div className="w-2.5 h-2.5 rounded-full bg-green-500" title="Confirmado" />
      case 'done':
        return <div className="w-2.5 h-2.5 rounded-full bg-blue-500" title="Concluído" />
      case 'cancelled':
        return <div className="w-2.5 h-2.5 rounded-full bg-red-500" title="Cancelado" />
      default:
        return <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" title="Pendente" />
    }
  }

  // Formatar label de data
  const getDateLabel = (dateStr: string) => {
    const date = toSaoPauloTime(parseISO(dateStr))
    if (isToday(date)) {
      return ''
    }
    if (isTomorrow(date)) {
      return '(Amanhã)'
    }
    return `(${format(date, 'dd/MM', { locale: ptBR })})`
  }

  // Obter cor da borda baseado no status
  const getBorderColor = (status?: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'border-l-green-500'
      case 'done':
        return 'border-l-blue-500'
      case 'cancelled':
        return 'border-l-red-500'
      default:
        return 'border-l-orange-500'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CalendarIcon size={20} className="text-orange-500" />
          <h3 className="text-lg font-bold text-gray-900">Próximos Agendamentos</h3>
        </div>
      </div>

      {/* Lista de agendamentos */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Nenhum agendamento próximo</p>
          </div>
        ) : (
          upcomingAppointments.map(apt => (
            <button
              key={apt.id}
              onClick={() => onAppointmentClick(apt)}
              className={`w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-3 border-l-4 ${getBorderColor(apt.status)} transition-all hover:translate-x-1`}
            >
              <div className="flex items-center gap-2 mb-1">
                {getStatusIndicator(apt.status)}
                <span className="text-sm font-bold text-gray-900">
                  {formatInSaoPaulo(apt.start, 'HH:mm')}
                </span>
                <span className="text-xs text-gray-500">
                  {getDateLabel(apt.start)}
                </span>
              </div>

              <div className="text-sm font-medium text-gray-900 mb-1">
                {apt.patientName}
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span className="text-blue-500">•</span>
                <span>{apt.procedure}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
