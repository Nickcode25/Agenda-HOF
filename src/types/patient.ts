export type PlannedProcedure = {
  id: string
  procedureName: string
  quantity: number
  unitValue: number // valor unitário em reais
  totalValue: number // quantidade * valor unitário
  paymentType: 'default' | 'cash' | 'card' // tipo de pagamento escolhido
  status: 'pending' | 'in_progress' | 'completed'
  notes?: string
  createdAt: string
  completedAt?: string
  usedProductId?: string // ID do produto usado do estoque
  usedProductName?: string // Nome do produto usado
}

export type Patient = {
  id: string
  name: string
  cpf: string
  birth_date?: string
  phone?: string
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  clinicalInfo?: string
  notes?: string
  photoUrl?: string
  plannedProcedures?: PlannedProcedure[]
  createdAt: string
}
