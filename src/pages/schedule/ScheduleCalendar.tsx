import { useState, useMemo, useEffect } from 'react'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { useRecurring } from '@/store/recurring'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import { useAuth } from '@/store/auth'
import { useUserProfile } from '@/store/userProfile'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import NewCalendar from '@/components/NewCalendar'
import AppointmentModal from '@/components/AppointmentModal'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import type { Appointment } from '@/types/schedule'

export default function ScheduleCalendar() {
  const { appointments, removeAppointment, fetchAppointments } = useSchedule()
  const { professionals, fetchAll: fetchProfessionals } = useProfessionals()
  const { blocks: recurringBlocks, fetchBlocks: fetchRecurringBlocks } = useRecurring()
  const { selectedProfessional } = useProfessionalContext()
  const { hasActiveSubscription } = useSubscription()
  const { user } = useAuth()
  const { currentProfile } = useUserProfile()

  // Carregar dados ao montar o componente (apenas uma vez)
  useEffect(() => {
    fetchProfessionals()
    fetchAppointments()
    fetchRecurringBlocks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Filtrar agendamentos por profissional selecionado
  const filteredAppointments = useMemo(() => {
    if (!selectedProfessional) return appointments
    const selectedProf = professionals.find(p => p.id === selectedProfessional)
    if (!selectedProf) return appointments
    return appointments.filter(apt => apt.professional === selectedProf.name)
  }, [appointments, selectedProfessional, professionals])

  // Obter nome do usuário e plano
  const userName = currentProfile?.displayName || user?.email?.split('@')[0] || 'Usuário'
  const userPlan = hasActiveSubscription ? 'Premium' : 'Gratuito'

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
  }

  const handleCloseModal = () => {
    setSelectedAppointment(null)
  }

  const handleDeleteAppointment = (id: string) => {
    removeAppointment(id)
  }

  const handleTimeSlotClick = (_date: Date, _hour: number) => {
    // Pode ser usado para criar novo agendamento diretamente no slot
    // Handler disponível para futura implementação
  }

  return (
    <div className="relative -m-8 h-[calc(100vh-64px)] overflow-hidden">
      {/* Overlay de bloqueio se não tiver assinatura */}
      {!hasActiveSubscription && (
        <UpgradeOverlay
          message="Agenda bloqueada"
          feature="a gestão completa da sua agenda"
        />
      )}

      {/* Novo Calendário */}
      <NewCalendar
        appointments={filteredAppointments}
        recurringBlocks={recurringBlocks}
        userName={userName}
        userPlan={userPlan}
        onAppointmentClick={handleAppointmentClick}
        onTimeSlotClick={handleTimeSlotClick}
      />

      {/* Appointment Modal */}
      <AppointmentModal
        appointment={selectedAppointment}
        onClose={handleCloseModal}
        onDelete={handleDeleteAppointment}
      />
    </div>
  )
}
