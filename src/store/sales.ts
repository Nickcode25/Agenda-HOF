import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Professional, Sale, SaleItem, SalesReport } from '@/types/sales'
import { supabase } from '@/lib/supabase'

interface SalesStore {
  professionals: Professional[]
  sales: Sale[]
  loading: boolean
  error: string | null
  
  // Fetch data
  fetchSales: () => Promise<void>
  
  // Professionals Management (local storage apenas)
  addProfessional: (professional: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateProfessional: (id: string, updates: Partial<Professional>) => void
  removeProfessional: (id: string) => void
  getProfessional: (id: string) => Professional | undefined
  
  // Sales Management
  createSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<string | null>
  updateSale: (id: string, updates: Partial<Sale>) => Promise<void>
  removeSale: (id: string) => Promise<void>
  getSale: (id: string) => Sale | undefined
  getSalesByProfessional: (professionalId: string) => Sale[]
  
  // Payment Management
  markSaleAsPaid: (saleId: string) => Promise<void>
  markSaleAsOverdue: (saleId: string) => Promise<void>
  
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
      loading: false,
      error: null,

      fetchSales: async () => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error

          const sales: Sale[] = (data || []).map(row => ({
            id: row.id,
            professionalId: row.professional_id,
            professionalName: row.professional_name,
            patientId: row.patient_id || undefined,
            patientName: row.patient_name || undefined,
            items: row.items,
            subtotal: row.subtotal,
            discount: row.discount || 0,
            totalAmount: row.total_amount,
            totalProfit: row.total_profit,
            paymentMethod: row.payment_method,
            paymentStatus: row.payment_status,
            paidAt: row.paid_at || undefined,
            notes: row.notes || undefined,
            createdAt: row.created_at,
          }))

          set({ sales, loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

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
          sales: state.sales.filter(sale => sale.professionalId !== id)
        }))
      },

      getProfessional: (id) => {
        return get().professionals.find(prof => prof.id === id)
      },

      createSale: async (saleData) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('sales')
            .insert({
              user_id: user.id,
              professional_id: saleData.professionalId,
              professional_name: saleData.professionalName,
              patient_id: saleData.patientId || null,
              patient_name: saleData.patientName || null,
              items: saleData.items,
              subtotal: saleData.subtotal,
              discount: saleData.discount || 0,
              total_amount: saleData.totalAmount,
              total_profit: saleData.totalProfit,
              payment_method: saleData.paymentMethod,
              payment_status: saleData.paymentStatus,
              paid_at: saleData.paidAt || null,
              notes: saleData.notes || null,
            })
            .select()
            .single()

          if (error) throw error

          await get().fetchSales()
          set({ loading: false })
          return data.id
        } catch (error: any) {
          set({ error: error.message, loading: false })
          return null
        }
      },

      updateSale: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const updateData: any = {}
          if (updates.professionalId !== undefined) updateData.professional_id = updates.professionalId
          if (updates.professionalName !== undefined) updateData.professional_name = updates.professionalName
          if (updates.patientId !== undefined) updateData.patient_id = updates.patientId || null
          if (updates.patientName !== undefined) updateData.patient_name = updates.patientName || null
          if (updates.items !== undefined) updateData.items = updates.items
          if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal
          if (updates.discount !== undefined) updateData.discount = updates.discount || 0
          if (updates.totalAmount !== undefined) updateData.total_amount = updates.totalAmount
          if (updates.totalProfit !== undefined) updateData.total_profit = updates.totalProfit
          if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod
          if (updates.paymentStatus !== undefined) updateData.payment_status = updates.paymentStatus
          if (updates.paidAt !== undefined) updateData.paid_at = updates.paidAt || null
          if (updates.notes !== undefined) updateData.notes = updates.notes || null

          const { error } = await supabase
            .from('sales')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchSales()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      removeSale: async (id) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { error } = await supabase
            .from('sales')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchSales()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      getSale: (id) => {
        return get().sales.find(sale => sale.id === id)
      },

      getSalesByProfessional: (professionalId) => {
        return get().sales.filter(sale => sale.professionalId === professionalId)
      },

      markSaleAsPaid: async (saleId) => {
        await get().updateSale(saleId, {
          paymentStatus: 'paid',
          paidAt: new Date().toISOString()
        })
      },

      markSaleAsOverdue: async (saleId) => {
        await get().updateSale(saleId, {
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
      partialize: (state) => ({
        professionals: state.professionals
      })
    }
  )
)
