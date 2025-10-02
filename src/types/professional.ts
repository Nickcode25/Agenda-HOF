export type Professional = {
  id: string
  name: string
  specialty: string
  registrationNumber: string // CRO, CRM, etc
  cpf?: string
  phone?: string
  email?: string
  address?: string
  photoUrl?: string
  active: boolean
  createdAt: string
}
