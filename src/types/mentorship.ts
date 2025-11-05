export type Mentorship = {
  id: string
  userId: string
  name: string
  description?: string
  price: number
  duration?: string // Ex: "3 meses", "6 sessões"
  isActive: boolean
  createdAt: string
  updatedAt: string
}
