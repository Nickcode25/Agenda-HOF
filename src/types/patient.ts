export type ProcedurePhoto = {
  id: string
  url: string
  type: 'before' | 'after'
  uploadedAt: string
  notes?: string
}

export type EvolutionPhoto = {
  id: string
  url: string
  date: string
  notes: string
  procedureName?: string
}

export type PaymentSplit = {
  method: 'cash' | 'pix' | 'card' // método de pagamento
  amount: number // valor pago com este método
  installments?: number // número de parcelas (apenas para cartão)
}

export type PlannedProcedure = {
  id: string
  procedureName: string
  quantity: number
  unitValue: number // valor unitário em reais
  totalValue: number // quantidade * valor unitário
  paymentType: 'cash' | 'installment' // à vista ou parcelado
  paymentMethod: 'cash' | 'pix' | 'card' // método de pagamento (dinheiro, pix, cartão) - DEPRECATED, usar paymentSplits
  installments: number // número de parcelas (1 para à vista) - DEPRECATED, usar paymentSplits
  paymentSplits?: PaymentSplit[] // lista de formas de pagamento (quando há múltiplas formas)
  status: 'pending' | 'in_progress' | 'completed'
  notes?: string
  createdAt: string
  completedAt?: string
  usedProductId?: string // ID do produto usado do estoque
  usedProductName?: string // Nome do produto usado
  photos?: ProcedurePhoto[] // Fotos antes/depois do procedimento
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
  evolutionPhotos?: EvolutionPhoto[]
  createdAt: string
}
