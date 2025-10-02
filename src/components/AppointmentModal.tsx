import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { X, Calendar, Clock, User, MapPin, FileText, Trash2 } from 'lucide-react'
import type { Appointment } from '@/types/schedule'

type AppointmentModalProps = {
  appointment: Appointment | null
  onClose: () => void
  onDelete: (id: string) => void
}

export default function AppointmentModal({ appointment, onClose, onDelete }: AppointmentModalProps) {
  if (!appointment) return null

  const statusColors = {
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
    done: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const statusLabels = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    done: 'Concluído',
    cancelled: 'Cancelado',
  }

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja remover este agendamento?')) {
      onDelete(appointment.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{appointment.patientName}</h2>
            <div className="flex items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium">
                {appointment.procedure}
              </span>
              <span className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${statusColors[appointment.status || 'scheduled']}`}>
                {statusLabels[appointment.status || 'scheduled']}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Calendar size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Data</p>
                <p className="text-white font-medium">
                  {format(parseISO(appointment.start), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Horário</p>
                <p className="text-white font-medium">
                  {format(parseISO(appointment.start), 'HH:mm')} - {format(parseISO(appointment.end), 'HH:mm')}
                </p>
              </div>
            </div>
          </div>

          {/* Professional & Room */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <User size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Profissional</p>
                <p className="text-white font-medium">{appointment.professional}</p>
              </div>
            </div>

            {appointment.room && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <MapPin size={20} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Sala</p>
                  <p className="text-white font-medium">Sala {appointment.room}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <FileText size={20} className="text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">Observações</p>
                <p className="text-white">{appointment.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors border border-red-500/30"
          >
            <Trash2 size={18} />
            Remover
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
