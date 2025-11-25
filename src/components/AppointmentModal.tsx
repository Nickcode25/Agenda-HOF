import { X, Calendar, Clock, User, MapPin, FileText, Trash2, MessageCircle, Check, XCircle, Pencil, CalendarOff } from 'lucide-react'
import type { Appointment } from '@/types/schedule'
import { useConfirm } from '@/hooks/useConfirm'
import { usePatients } from '@/store/patients'
import { useSchedule } from '@/store/schedule'
import { getWhatsAppUrl } from '@/utils/env'
import { formatInSaoPaulo } from '@/utils/timezone'
import { useToast } from '@/hooks/useToast'
import { useNavigate } from 'react-router-dom'

type AppointmentModalProps = {
  appointment: Appointment | null
  onClose: () => void
  onDelete: (id: string) => void
  onStatusChange?: () => void
}

export default function AppointmentModal({ appointment, onClose, onDelete, onStatusChange }: AppointmentModalProps) {
  const { confirm, ConfirmDialog } = useConfirm()
  const patients = usePatients(s => s.patients)
  const updateAppointmentStatus = useSchedule(s => s.updateAppointmentStatus)
  const { show: showToast } = useToast()
  const navigate = useNavigate()

  if (!appointment) return null

  // Buscar telefone do paciente
  const patient = patients.find(p => p.id === appointment.patientId)
  const patientPhone = patient?.phone

  const statusColors = {
    scheduled: 'bg-orange-100 text-orange-600 border-orange-300',
    confirmed: 'bg-green-100 text-green-600 border-green-300',
    done: 'bg-gray-100 text-gray-600 border-gray-300',
    cancelled: 'bg-red-100 text-red-600 border-red-300',
  }

  const statusLabels = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    done: 'Concluído',
    cancelled: 'Cancelado',
  }

  const handleDelete = async () => {
    const message = appointment.isPersonal
      ? 'Tem certeza que deseja remover este compromisso?'
      : 'Tem certeza que deseja remover este agendamento?'
    if (await confirm({ title: 'Confirmação', message })) {
      onDelete(appointment.id)
      onClose()
    }
  }

  const handleWhatsApp = () => {
    if (!patientPhone) {
      showToast('Paciente não possui telefone cadastrado', 'warning')
      return
    }

    window.open(getWhatsAppUrl(patientPhone), '_blank')
  }

  const handleStatusChange = async (status: 'confirmed' | 'cancelled' | 'done') => {
    await updateAppointmentStatus(appointment.id, status)
    const messages = {
      confirmed: 'Agendamento confirmado!',
      cancelled: 'Agendamento cancelado',
      done: 'Agendamento concluído!'
    }
    const types = {
      confirmed: 'success' as const,
      cancelled: 'warning' as const,
      done: 'success' as const
    }
    showToast(messages[status], types[status])
    onStatusChange?.()
    onClose()
  }

  const handleEdit = () => {
    onClose()
    navigate(`/app/agenda/editar/${appointment.id}`)
  }

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-modal-title"
    >
      <div
        className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            {appointment.isPersonal ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <CalendarOff size={24} className="text-sky-500" />
                  <h2 id="appointment-modal-title" className="text-2xl font-bold text-gray-900">{appointment.title}</h2>
                </div>
                <span className="inline-block px-3 py-1 rounded-lg bg-sky-100 text-sky-600 text-sm font-medium">
                  Compromisso Pessoal
                </span>
              </>
            ) : (
              <>
                <h2 id="appointment-modal-title" className="text-2xl font-bold text-gray-900 mb-2">{appointment.patientName}</h2>
                <div className="flex items-center gap-2">
                  <span className="inline-block px-3 py-1 rounded-lg bg-orange-100 text-orange-600 text-sm font-medium">
                    {appointment.procedure}
                  </span>
                  <span className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${statusColors[appointment.status || 'scheduled']}`}>
                    {statusLabels[appointment.status || 'scheduled']}
                  </span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            aria-label="Fechar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${appointment.isPersonal ? 'bg-sky-100' : 'bg-orange-100'}`}>
                <Calendar size={20} className={appointment.isPersonal ? 'text-sky-500' : 'text-orange-500'} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Data</p>
                <p className="text-gray-900 font-medium">
                  {formatInSaoPaulo(appointment.start, "dd 'de' MMMM 'de' yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${appointment.isPersonal ? 'bg-sky-100' : 'bg-orange-100'}`}>
                <Clock size={20} className={appointment.isPersonal ? 'text-sky-500' : 'text-orange-500'} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Horário</p>
                <p className="text-gray-900 font-medium">
                  {formatInSaoPaulo(appointment.start, 'HH:mm')} - {formatInSaoPaulo(appointment.end, 'HH:mm')}
                </p>
              </div>
            </div>
          </div>

          {/* Professional & Room - Só mostra para agendamentos de pacientes */}
          {!appointment.isPersonal && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <User size={20} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Profissional</p>
                  <p className="text-gray-900 font-medium">{appointment.professional}</p>
                </div>
              </div>

              {appointment.room && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MapPin size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Sala</p>
                    <p className="text-gray-900 font-medium">Sala {appointment.room}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${appointment.isPersonal ? 'bg-sky-100' : 'bg-orange-100'}`}>
                <FileText size={20} className={appointment.isPersonal ? 'text-sky-500' : 'text-orange-500'} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Observações</p>
                <p className="text-gray-900">{appointment.notes}</p>
              </div>
            </div>
          )}

          {/* Status Buttons - Só mostra para agendamentos de pacientes */}
          {!appointment.isPersonal && appointment.status !== 'done' && appointment.status !== 'cancelled' && (
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500 font-medium">Alterar status:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {appointment.status !== 'confirmed' && (
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <Check size={18} />
                    Confirmado
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange('done')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  <Check size={18} />
                  Concluído
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  <XCircle size={18} />
                  Cancelado
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
                appointment.isPersonal
                  ? 'bg-sky-50 hover:bg-sky-100 text-sky-600 border-sky-200'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
              }`}
            >
              <Pencil size={18} />
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors border border-red-200"
            >
              <Trash2 size={18} />
              Remover
            </button>
            {!appointment.isPersonal && patientPhone && (
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-medium transition-colors border border-green-200"
                title="Enviar mensagem no WhatsApp"
              >
                <MessageCircle size={18} />
                WhatsApp
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
