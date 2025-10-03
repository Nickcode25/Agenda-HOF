import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Professional, Sale, SaleItem, SalesReport } from '@/types/sales'

interface SalesStore {
  professionals: Professional[]
  sales: Sale[]
  
  // Professionals Management
  addProfessional: (professional: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateProfessional: (id: string, updates: Partial<Professional>) => void
  removeProfessional: (id: string) => void
  getProfessional: (id: string) => Professional | undefined
  
  // Sales Management
  createSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => string
  updateSale: (id: string, updates: Partial<Sale>) => void
  removeSale: (id: string) => void
  getSale: (id: string) => Sale | undefined
  getSalesByProfessional: (professionalId: string) => Sale[]
  
  // Payment Management
  markSaleAsPaid: (saleId: string) => void
  markSaleAsOverdue: (saleId: string) => void
  
  // Reports
  generateSalesReport: (startDate?: string, endDate?: string) => SalesReport
  getTotalRevenue: () => number
  getTotalProfit: () => number
}

export const useSales = create<SalesStore>()(
  persist(
    (set, get) => ({
      professionals: [],
      sales: [],

      addProfessional: (professionalData) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        
        const newProfessional: Professional = {
          ...professionalData,
          id,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          professionals: [...state.professionals, newProfessional]
        }))
        
        return id
      },

      updateProfessional: (id, updates) => {
        set((state) => ({
          professionals: state.professionals.map(prof =>
            prof.id === id
              ? { ...prof, ...updates, updatedAt: new Date().toISOString() }
              : prof
          )
        }))
      },

      removeProfessional: (id) => {
        set((state) => ({
          professionals: state.professionals.filter(prof => prof.id !== id),
          // Também remove vendas associadas ao profissional
          sales: state.sales.filter(sale => sale.professionalId !== id)
        }))
      },

      getProfessional: (id) => {
        return get().professionals.find(prof => prof.id === id)
      },

      createSale: (saleData) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        
        const newSale: Sale = {
          ...saleData,
          id,
          createdAt: now,
        }

        set((state) => ({
          sales: [...state.sales, newSale]
        }))
        
        return id
      },

      updateSale: (id, updates) => {
        set((state) => ({
          sales: state.sales.map(sale =>
            sale.id === id ? { ...sale, ...updates } : sale
          )
        }))
      },

      removeSale: (id) => {
        set((state) => ({
          sales: state.sales.filter(sale => sale.id !== id)
        }))
      },

      getSale: (id) => {
        return get().sales.find(sale => sale.id === id)
      },

      getSalesByProfessional: (professionalId) => {
        return get().sales.filter(sale => sale.professionalId === professionalId)
      },

      markSaleAsPaid: (saleId) => {
        get().updateSale(saleId, {
          paymentStatus: 'paid',
          paidAt: new Date().toISOString()
        })
      },

      markSaleAsOverdue: (saleId) => {
        get().updateSale(saleId, {
          paymentStatus: 'overdue'
        })
      },

      generateSalesReport: (startDate, endDate) => {
        const sales = get().sales
        const professionals = get().professionals
        
        // Filtrar por data se fornecida
        let filteredSales = sales
        if (startDate || endDate) {
          filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.createdAt)
            if (startDate && saleDate < new Date(startDate)) return false
            if (endDate && saleDate > new Date(endDate)) return false
            return true
          })
        }

        const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
        const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.totalProfit, 0)
        const totalQuantitySold = filteredSales.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        )

        // Vendas por profissional
        const salesByProfessional = professionals.map(prof => {
          const profSales = filteredSales.filter(sale => sale.professionalId === prof.id)
          return {
            professionalId: prof.id,
            professionalName: prof.name,
            totalSales: profSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
            totalProfit: profSales.reduce((sum, sale) => sum + sale.totalProfit, 0),
            salesCount: profSales.length
          }
        }).filter(prof => prof.salesCount > 0)

        // Vendas por produto
        const productMap = new Map()
        filteredSales.forEach(sale => {
          sale.items.forEach(item => {
            const existing = productMap.get(item.stockItemId) || {
              stockItemId: item.stockItemId,
              stockItemName: item.stockItemName,
              quantitySold: 0,
              totalRevenue: 0,
              totalProfit: 0
            }
            existing.quantitySold += item.quantity
            existing.totalRevenue += item.totalPrice
            existing.totalProfit += item.profit
            productMap.set(item.stockItemId, existing)
          })
        })
        const salesByProduct = Array.from(productMap.values())

        // Vendas por mês
        const monthMap = new Map()
        filteredSales.forEach(sale => {
          const month = new Date(sale.createdAt).toLocaleDateString('pt-BR', { 
            year: 'numeric', 
            month: 'long' 
          })
          const existing = monthMap.get(month) || {
            month,
            totalSales: 0,
            totalProfit: 0,
            salesCount: 0
          }
          existing.totalSales += sale.totalAmount
          existing.totalProfit += sale.totalProfit
          existing.salesCount += 1
          monthMap.set(month, existing)
        })
        const salesByMonth = Array.from(monthMap.values())

        return {
          totalSales,
          totalProfit,
          totalQuantitySold,
          salesByProfessional,
          salesByProduct,
          salesByMonth
        }
      },

      getTotalRevenue: () => {
        return get().sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      },

      getTotalProfit: () => {
        return get().sales.reduce((sum, sale) => sum + sale.totalProfit, 0)
      }
    }),
    {
      name: 'sales-storage',
    }
  )
)
