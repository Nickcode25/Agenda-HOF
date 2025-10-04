export type Professional = {
  id: string
  name: string
  specialty: string
  registrationNumber: string // CRO, CRM, etc
  cpf?: string
  phone?: string
  email?: string
  // Endereço separado
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  photoUrl?: string
  active: boolean
  createdAt: string
}
