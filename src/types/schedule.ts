export type ProcedureType = 'Botox' | 'Preenchimento' | 'Bioestimulador' | 'Avaliação'

export type Appointment = {
  id: string
  patientId: string
  patientName: string
  procedure: ProcedureType
  professional: string
  room?: string
  start: string // ISO
  end: string   // ISO
  notes?: string
  status?: 'scheduled' | 'confirmed' | 'done' | 'cancelled'
}

export type WaitlistItem = {
  id: string
  patientName: string
  phone?: string
  desiredProcedure?: ProcedureType
  createdAt: string
}
