export type MentorshipPhoto = {
  id: string
  url: string
  type: 'before' | 'after'
  uploadedAt: string
  notes?: string
}

export type PlannedMentorship = {
  id: string
  mentorshipName: string
  quantity: number
  unitValue: number // valor unitário em reais
  totalValue: number // quantidade * valor unitário
  paymentType: 'cash' | 'installment' // à vista ou parcelado
  paymentMethod: 'cash' | 'pix' | 'card' // método de pagamento (dinheiro, pix, cartão)
  installments: number // número de parcelas (1 para à vista)
  status: 'pending' | 'in_progress' | 'completed'
  notes?: string
  createdAt: string
  completedAt?: string
  photos?: MentorshipPhoto[] // Fotos antes/depois da mentoria
}

export type Student = {
  id: string
  name: string
  cpf: string
  birth_date?: string
  phone?: string
  email?: string
  gender?: string
  profession?: string
  interest_area?: string
  objectives?: string
  availability?: string
  mentorship_duration?: string
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  notes?: string
  photoUrl?: string
  plannedMentorships?: PlannedMentorship[]
  createdAt: string
}
