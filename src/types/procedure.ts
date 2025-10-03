export type Procedure = {
  id: string
  name: string
  value: number // valor padrão (à vista)
  cashValue?: number // valor à vista (opcional, se diferente do padrão)
  cardValue?: number // valor parcelado no cartão
  description?: string
  duration?: number // duração em minutos
  active: boolean
  createdAt: string
}
