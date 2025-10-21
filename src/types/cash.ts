// Types para Controle de Caixa e Despesas

export type PaymentMethod = 'cash' | 'card' | 'pix' | 'transfer' | 'check'
export type PaymentStatus = 'pending' | 'paid' | 'overdue'

// ============================================
// CATEGORIAS DE DESPESAS
// ============================================
export type ExpenseCategory = {
  id: string
  userId: string
  name: string
  description?: string
  color: string
  icon: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============================================
// DESPESAS
// ============================================
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type Expense = {
  id: string
  userId: string
  categoryId?: string
  categoryName: string
  description: string
  amount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  dueDate?: string
  paidAt?: string

  // Recorrência
  isRecurring: boolean
  recurringFrequency?: RecurringFrequency
  recurringDay?: number
  recurringEndDate?: string
  parentExpenseId?: string

  attachments?: Array<{
    name: string
    url: string
    type: string
  }>

  notes?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// CAIXAS
// ============================================
export type CashRegister = {
  id: string
  userId: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
}

// ============================================
// SESSÕES DE CAIXA
// ============================================
export type CashSessionStatus = 'open' | 'closed'

export type CashSession = {
  id: string
  userId: string
  cashRegisterId: string
  cashRegisterName?: string

  // Abertura
  openedByUserId?: string
  openedByName?: string
  openedAt: string
  openingBalance: number
  openingNotes?: string

  // Fechamento
  closedByUserId?: string
  closedByName?: string
  closedAt?: string
  closingBalance?: number
  expectedBalance?: number
  difference?: number
  closingNotes?: string
  notes?: string

  status: CashSessionStatus
  createdAt: string
  updatedAt?: string
}

// ============================================
// MOVIMENTAÇÕES DE CAIXA
// ============================================
export type CashMovementType = 'income' | 'expense' | 'withdrawal' | 'deposit'
export type CashMovementCategory = 'procedure' | 'sale' | 'subscription' | 'expense' | 'other'

export type CashMovement = {
  id: string
  userId: string
  cashSessionId: string
  cashRegisterId?: string

  // Tipo
  type: CashMovementType
  category: CashMovementCategory

  // Valores
  amount: number
  paymentMethod: PaymentMethod

  // Referências
  referenceType?: string
  referenceId?: string
  referenceName?: string

  // Info
  description: string
  notes?: string
  performedByUserId?: string
  performedByName?: string

  createdAt: string
}

// ============================================
// HELPERS
// ============================================
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  transfer: 'Transferência',
  check: 'Cheque'
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido'
}

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual'
}

export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
  income: 'Entrada',
  expense: 'Saída',
  withdrawal: 'Sangria',
  deposit: 'Reforço'
}

export const CASH_MOVEMENT_CATEGORY_LABELS: Record<CashMovementCategory, string> = {
  procedure: 'Procedimento',
  sale: 'Venda',
  subscription: 'Mensalidade',
  expense: 'Despesa',
  other: 'Outro'
}

// Categorias padrão de despesas
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Aluguel', description: 'Aluguel do imóvel', color: '#EF4444', icon: 'Home' },
  { name: 'Salários', description: 'Folha de pagamento', color: '#F59E0B', icon: 'Users' },
  { name: 'Fornecedores', description: 'Compra de produtos e insumos', color: '#10B981', icon: 'ShoppingCart' },
  { name: 'Água/Luz/Internet', description: 'Contas de consumo', color: '#3B82F6', icon: 'Zap' },
  { name: 'Manutenção', description: 'Reparos e manutenções', color: '#8B5CF6', icon: 'Wrench' },
  { name: 'Marketing', description: 'Publicidade e marketing', color: '#EC4899', icon: 'Megaphone' },
  { name: 'Impostos', description: 'Tributos e impostos', color: '#6B7280', icon: 'FileText' },
  { name: 'Outros', description: 'Outras despesas', color: '#94A3B8', icon: 'MoreHorizontal' }
]
