export type Procedure = {
  id: string
  name: string
  value: number // valor em reais
  description?: string
  duration?: number // duração em minutos
  active: boolean
  createdAt: string
}
