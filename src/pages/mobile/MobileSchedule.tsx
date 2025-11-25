import { useState, useMemo, useEffect } from 'react'
import { Plus, Calendar, Clock, User, Trash2, Edit } from 'lucide-react'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/types/schedule'
import { useNavigate } from 'react-router-dom'

export default function MobileSchedule() {
  const { appointments, removeAppointment, fetchAppointments } = useSchedule()
  const { professionals, fetchAll: fetchProfessionals } = useProfessionals()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfessionals()
    fetchAppointments()
  }, [fetchProfessionals, fetchAppointments])

  // Filtrar agendamentos do dia selecionado
  const todayAppointments = useMemo(() => {
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.start)
        return aptDate.toDateString() === selectedDate.toDateString()
      })
      .sort((a, b) => a.start.localeCompare(b.start))
  }, [appointments, selectedDate])

  const handleDelete = async (id: string) => {
    await removeAppointment(id)
    setShowDeleteConfirm(null)
  }

  const getProfessionalColor = (professionalName: string) => {
    // Generate a color based on professional name for consistency
    const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b']
    const index = professionals.findIndex(p => p.name === professionalName)
    return index >= 0 ? colors[index % colors.length] : '#6B7280'
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Date Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Agenda</h2>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-sm text-orange-600 font-medium"
          >
            Hoje
          </button>
        </div>
        <input
          type="date"
          value={format(selectedDate, 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <p className="text-sm text-gray-600 mt-2">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Add Button */}
      <button
        onClick={() => navigate('/app/agenda/nova')}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-all"
      >
        <Plus size={24} />
        <span>Novo Agendamento</span>
      </button>

      {/* Appointments List */}
      <div className="space-y-3">
        {todayAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum agendamento para este dia</p>
          </div>
        ) : (
          todayAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-xl shadow-sm p-4 border-l-4"
              style={{ borderLeftColor: getProfessionalColor(appointment.professional) }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    {appointment.patientName}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>
                        {format(new Date(appointment.start), 'HH:mm')} - {format(new Date(appointment.end), 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={16} />
                      <span>{appointment.professional}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {/* TODO: Navigate to edit */}}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(appointment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {appointment.notes && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mt-2">
                  {appointment.notes}
                </div>
              )}

              {/* Delete Confirmation */}
              {showDeleteConfirm === appointment.id && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 mb-2">
                    Tem certeza que deseja excluir este agendamento?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(appointment.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 bg-white text-gray-700 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
