export interface StockItem {
  id: string
  name: string
  description?: string
  category: string
  quantity: number
  minQuantity: number // Quantidade mínima para alerta
  unit: string // ml, g, unidade, etc.
  cost: number // Custo por unidade
  supplier?: string
  expirationDate?: string
  batchNumber?: string
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  stockItemId: string
  type: 'in' | 'out' // entrada ou saída
  quantity: number
  reason: string // "Compra", "Uso em procedimento", "Vencimento", etc.
  procedureId?: string // Se foi usado em um procedimento
  patientId?: string // Se foi usado em um paciente
  cost?: number // Custo da movimentação
  createdAt: string
  createdBy?: string
}

export interface StockAlert {
  id: string
  stockItemId: string
  type: 'low_stock' | 'expired' | 'expiring_soon'
  message: string
  isRead: boolean
  createdAt: string
}
