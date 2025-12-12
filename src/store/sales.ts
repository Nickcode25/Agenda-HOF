import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Professional, Sale, SaleItem, SalesReport } from '@/types/sales'
import { supabase, getCachedUser } from '@/lib/supabase'
import { removeCashMovementByReference } from './cash'
import { createISOFromDateTimeBR, getCurrentTimeInSaoPaulo, getTodayInSaoPaulo } from '@/utils/timezone'

interface SalesStore {
  professionals: Professional[]
  sales: Sale[]
  loading: boolean
  error: string | null

  // Fetch data
  fetchSales: () => Promise<void>
  fetchProfessionals: () => Promise<void>

  // Professionals Management (Supabase)
  addProfessional: (professional: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>
  updateProfessional: (id: string, updates: Partial<Professional>) => Promise<void>
  removeProfessional: (id: string) => Promise<void>
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
          const user = await getCachedUser()
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
            soldAt: row.sold_at || undefined,
            notes: row.notes || undefined,
            createdAt: row.created_at,
          }))

          set({ sales, loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      fetchProfessionals: async () => {
        set({ loading: true, error: null })
        try {
          const user = await getCachedUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('sales_professionals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error

          const professionals: Professional[] = (data || []).map(row => ({
            id: row.id,
            name: row.name,
            cpf: row.cpf || undefined,
            phone: row.phone || undefined,
            email: row.email || undefined,
            birthDate: row.birth_date || undefined,
            specialty: row.specialty || undefined,
            registrationNumber: row.registration_number || undefined,
            clinic: row.clinic || undefined,
            cep: row.cep || undefined,
            street: row.street || undefined,
            number: row.number || undefined,
            complement: row.complement || undefined,
            neighborhood: row.neighborhood || undefined,
            city: row.city || undefined,
            state: row.state || undefined,
            notes: row.notes || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }))

          set({ professionals, loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      addProfessional: async (professionalData) => {
        set({ loading: true, error: null })
        try {
          const user = await getCachedUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('sales_professionals')
            .insert({
              user_id: user.id,
              name: professionalData.name,
              cpf: professionalData.cpf || null,
              phone: professionalData.phone || null,
              email: professionalData.email || null,
              birth_date: professionalData.birthDate || null,
              specialty: professionalData.specialty || null,
              registration_number: professionalData.registrationNumber || null,
              clinic: professionalData.clinic || null,
              cep: professionalData.cep || null,
              street: professionalData.street || null,
              number: professionalData.number || null,
              complement: professionalData.complement || null,
              neighborhood: professionalData.neighborhood || null,
              city: professionalData.city || null,
              state: professionalData.state || null,
              notes: professionalData.notes || null,
            })
            .select()
            .single()

          if (error) throw error

          await get().fetchProfessionals()
          set({ loading: false })
          return data.id
        } catch (error: any) {
          set({ error: error.message, loading: false })
          return null
        }
      },

      updateProfessional: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const user = await getCachedUser()
          if (!user) throw new Error('Usuário não autenticado')

          const updateData: any = {}
          if (updates.name !== undefined) updateData.name = updates.name
          if (updates.cpf !== undefined) updateData.cpf = updates.cpf || null
          if (updates.phone !== undefined) updateData.phone = updates.phone || null
          if (updates.email !== undefined) updateData.email = updates.email || null
          if (updates.birthDate !== undefined) updateData.birth_date = updates.birthDate || null
          if (updates.specialty !== undefined) updateData.specialty = updates.specialty || null
          if (updates.registrationNumber !== undefined) updateData.registration_number = updates.registrationNumber || null
          if (updates.clinic !== undefined) updateData.clinic = updates.clinic || null
          if (updates.cep !== undefined) updateData.cep = updates.cep || null
          if (updates.street !== undefined) updateData.street = updates.street || null
          if (updates.number !== undefined) updateData.number = updates.number || null
          if (updates.complement !== undefined) updateData.complement = updates.complement || null
          if (updates.neighborhood !== undefined) updateData.neighborhood = updates.neighborhood || null
          if (updates.city !== undefined) updateData.city = updates.city || null
          if (updates.state !== undefined) updateData.state = updates.state || null
          if (updates.notes !== undefined) updateData.notes = updates.notes || null

          updateData.updated_at = new Date().toISOString()

          const { error } = await supabase
            .from('sales_professionals')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchProfessionals()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      removeProfessional: async (id) => {
        set({ loading: true, error: null })
        try {
          const user = await getCachedUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { error } = await supabase
            .from('sales_professionals')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchProfessionals()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      getProfessional: (id) => {
        return get().professionals.find(prof => prof.id === id)
      },

      createSale: async (saleData) => {
        set({ loading: true, error: null })
        try {
          const user = await getCachedUser()
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
              sold_at: saleData.soldAt || null,
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
          const user = await getCachedUser()
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
          if (updates.soldAt !== undefined) updateData.sold_at = updates.soldAt || null
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
          const user = await getCachedUser()
          if (!user) throw new Error('Usuário não autenticado')

          // Remover movimentações de caixa associadas a esta venda
          await removeCashMovementByReference(id)

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
          paidAt: createISOFromDateTimeBR(getTodayInSaoPaulo(), getCurrentTimeInSaoPaulo())
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
        // Não salvar mais nada no localStorage, tudo vai para o Supabase
      })
    }
  )
)
