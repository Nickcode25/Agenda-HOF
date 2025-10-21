export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'

export type Customer = {
  id: string
  name: string
  email: string
  phone?: string
  cpf?: string
  createdAt: string
  updatedAt: string
}

export type Purchase = {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  productName: string
  amount: number
  paymentStatus: PaymentStatus
  paymentMethod?: string
  purchaseDate: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type AdminUser = {
  id: string
  email: string
  fullName?: string
  role: 'admin' | 'super_admin' | 'employee'
  createdAt: string
  updatedAt: string
}

export type MonthlySalesStats = {
  month: string
  totalPurchases: number
  totalRevenue: number
  uniqueCustomers: number
}

export type MonthlyRegistrations = {
  month: string
  newCustomers: number
}

export type DashboardStats = {
  totalCustomers: number
  totalRevenue: number
  pendingPayments: number
  newCustomersThisMonth: number
  salesThisMonth: number
  monthlySales: MonthlySalesStats[]
  monthlyRegistrations: MonthlyRegistrations[]
}

export type CourtesyUser = {
  id: string
  authUserId?: string
  name: string
  email: string
  phone?: string
  notes?: string
  createdBy?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Campos da view
  createdByEmail?: string
  createdByName?: string
  isCurrentlyActive?: boolean
}
