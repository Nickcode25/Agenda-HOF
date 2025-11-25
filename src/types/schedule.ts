export type ProcedureType = string

export type Appointment = {
  id: string
  patientId: string
  patientName: string
  procedure: ProcedureType
  procedureId?: string // ID do procedimento cadastrado
  selectedProducts?: Array<{
    category: string // Categoria do produto (ex: "Toxina Botulínica")
    stockItemId: string // ID do produto específico escolhido
    quantity: number // Quantidade a ser usada
  }>
  professional: string
  room?: string
  start: string // ISO
  end: string   // ISO
  notes?: string
  status?: 'scheduled' | 'confirmed' | 'done' | 'cancelled'
  isPersonal?: boolean // Compromisso pessoal (não é atendimento de paciente)
  title?: string // Título do compromisso pessoal (ex: "Almoço", "Viagem")
}

export type WaitlistItem = {
  id: string
  patientName: string
  phone?: string
  desiredProcedure?: ProcedureType
  createdAt: string
}
