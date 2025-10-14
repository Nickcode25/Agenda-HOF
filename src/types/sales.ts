export interface Professional {
  id: string
  name: string
  cpf?: string
  phone?: string
  email?: string
  specialty?: string // Especialidade (Dermatologista, Esteticista, etc.)
  clinic?: string // Nome da clínica
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SaleItem {
  id: string
  stockItemId: string
  stockItemName: string
  quantity: number
  unitCost: number // Custo unitário do produto no estoque
  salePrice: number // Preço de venda para o profissional
  totalPrice: number // quantity × salePrice
  profit: number // (salePrice - unitCost) × quantity
}

export interface Sale {
  id: string
  professionalId: string
  professionalName: string
  patientId?: string
  patientName?: string
  items: SaleItem[]
  subtotal: number
  discount?: number
  totalAmount: number
  totalProfit: number
  paymentMethod: 'cash' | 'card' | 'pix' | 'transfer' | 'check'
  paymentStatus: 'pending' | 'paid' | 'overdue'
  dueDate?: string // Data de vencimento (para vendas a prazo)
  paidAt?: string // Data do pagamento
  notes?: string
  createdAt: string
  createdBy?: string
}

export interface SalesReport {
  totalSales: number
  totalProfit: number
  totalQuantitySold: number
  salesByProfessional: Array<{
    professionalId: string
    professionalName: string
    totalSales: number
    totalProfit: number
    salesCount: number
  }>
  salesByProduct: Array<{
    stockItemId: string
    stockItemName: string
    quantitySold: number
    totalRevenue: number
    totalProfit: number
  }>
  salesByMonth: Array<{
    month: string
    totalSales: number
    totalProfit: number
    salesCount: number
  }>
}
