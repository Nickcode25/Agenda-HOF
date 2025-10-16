import { useMemo } from 'react'
import { Clock, User, MapPin, FileText, Edit2, Trash2 } from 'lucide-react'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Appointment } from '@/types/schedule'
import { getProcedureColor } from '@/utils/procedureColors'

interface DayTimelineProps {
  date: Date
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>
  onDeleteAppointment: (id: string) => void
}

// Status badges
const getStatusBadge = (status?: Appointment['status']) => {
  switch (status) {
    case 'confirmed':
      return <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">Confirmado</span>
    case 'done':
      return <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">Concluído</span>
    case 'cancelled':
      return <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">Cancelado</span>
    default:
      return <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full">Agendado</span>
  }
}

function SortableAppointment({
  appointment,
  onAppointmentClick,
  onUpdateStatus,
  onDelete
}: {
  appointment: Appointment
  onAppointmentClick: (appointment: Appointment) => void
  onUpdateStatus: (id: string, status: Appointment['status']) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: appointment.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const startTime = new Date(appointment.start).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const endTime = new Date(appointment.end).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const colors = getProcedureColor(appointment.procedure)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-l-4 rounded-lg p-4 transition-all cursor-move ${colors.bg} border ${colors.border} ${
        isDragging ? 'shadow-2xl scale-105' : 'shadow-md'
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{appointment.patientName}</h3>
            {getStatusBadge(appointment.status)}
          </div>
          <p className="text-sm text-gray-400 mb-2">{appointment.procedure}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAppointmentClick(appointment)
            }}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Editar"
          >
            <Edit2 size={14} className="text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Deseja realmente excluir este agendamento?')) {
                onDelete(appointment.id)
              }
            }}
            className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 size={14} className="text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-300">
          <Clock size={14} className="text-gray-500" />
          <span>{startTime} - {endTime}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <User size={14} className="text-gray-500" />
          <span>{appointment.professional}</span>
        </div>
        {appointment.room && (
          <div className="flex items-center gap-2 text-gray-300">
            <MapPin size={14} className="text-gray-500" />
            <span>Sala {appointment.room}</span>
          </div>
        )}
        {appointment.notes && (
          <div className="flex items-center gap-2 text-gray-300">
            <FileText size={14} className="text-gray-500" />
            <span className="truncate">{appointment.notes}</span>
          </div>
        )}
      </div>

      {/* Quick Status Update */}
      <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(appointment.id, 'confirmed')
          }}
          className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        >
          Confirmar
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(appointment.id, 'done')
          }}
          className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
        >
          Concluído
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUpdateStatus(appointment.id, 'cancelled')
          }}
          className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function DayTimeline({
  date,
  appointments,
  onAppointmentClick,
  onUpdateAppointment,
  onDeleteAppointment
}: DayTimelineProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Ordenar agendamentos por horário
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) =>
      new Date(a.start).getTime() - new Date(b.start).getTime()
    )
  }, [appointments])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    // Aqui você pode implementar a lógica de reagendamento
    console.log('Drag ended:', active.id, 'over:', over.id)
  }

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    await onUpdateAppointment(id, { status })
  }

  const dateStr = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h2 className="text-xl font-bold text-white capitalize">{dateStr}</h2>
        <p className="text-sm text-gray-400 mt-1">
          {sortedAppointments.length} agendamento{sortedAppointments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Legend */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Legenda de Cores</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-300">Botox/Toxina</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span className="text-gray-300">Preenchimento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span className="text-gray-300">Bioestimulador</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-300">Limpeza/Peeling</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-300">Avaliação</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-300">Outros</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedAppointments.map(a => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sortedAppointments.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
                <Clock size={48} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400">Nenhum agendamento para este dia</p>
              </div>
            ) : (
              sortedAppointments.map((appointment) => (
                <SortableAppointment
                  key={appointment.id}
                  appointment={appointment}
                  onAppointmentClick={onAppointmentClick}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={onDeleteAppointment}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
