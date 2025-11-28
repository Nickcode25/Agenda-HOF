import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { X, Clock, User, Stethoscope, Calendar as CalendarIcon } from 'lucide-react'
import type { Appointment } from '@/types/schedule'
import { formatInSaoPaulo } from '@/utils/timezone'

type DayAppointmentsModalProps = {
  date: Date | null
  appointments: Appointment[]
  onClose: () => void
  onAppointmentClick: (appointment: Appointment) => void
}

export default function DayAppointmentsModal({ 
  date, 
  appointments, 
  onClose, 
  onAppointmentClick 
}: DayAppointmentsModalProps) {
  if (!date) return null

  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  )

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <CalendarIcon size={24} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {format(date, "dd 'de' MMMM", { locale: ptBR })}
              </h2>
              <p className="text-sm text-gray-400">
                {sortedAppointments.length} {sortedAppointments.length === 1 ? 'agendamento' : 'agendamentos'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {sortedAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon size={40} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Nenhum paciente agendado para este dia
              </h3>
              <p className="text-gray-400 text-sm">
                Este dia está livre para novos agendamentos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAppointments.map((apt) => (
                <button
                  type="button"
                  key={apt.id}
                  onClick={() => onAppointmentClick(apt)}
                  className="w-full bg-gray-700/50 hover:bg-gray-700 border border-gray-600 hover:border-orange-500/50 rounded-xl p-4 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    {/* Time */}
                    <div className="flex flex-col items-center justify-center bg-orange-500/10 rounded-lg px-3 py-2 min-w-[80px]">
                      <Clock size={18} className="text-orange-500 mb-1" />
                      <span className="text-orange-400 font-bold text-sm">
                        {formatInSaoPaulo(apt.start, 'HH:mm')}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {formatInSaoPaulo(apt.end, 'HH:mm')}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold mb-1 group-hover:text-orange-400 transition-colors">
                        {apt.patientName}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Stethoscope size={14} className="text-orange-500" />
                          <span>{apt.procedure}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <User size={14} className="text-orange-500" />
                          <span>{apt.professional}</span>
                        </div>
                      </div>

                      {apt.room && (
                        <div className="mt-1 text-xs text-gray-500">
                          Sala {apt.room}
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center">
                      <span className={`text-xs px-2 py-1 rounded-lg border ${
                        apt.status === 'confirmed' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : apt.status === 'done'
                          ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          : apt.status === 'cancelled'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}>
                        {apt.status === 'confirmed' ? 'Confirmado' :
                         apt.status === 'done' ? 'Concluído' :
                         apt.status === 'cancelled' ? 'Cancelado' :
                         'Agendado'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
