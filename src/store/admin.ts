import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Customer, Purchase, DashboardStats, MonthlySalesStats, MonthlyRegistrations, CourtesyUser } from '@/types/admin'

type AdminState = {
  customers: Customer[]
  purchases: Purchase[]
  courtesyUsers: CourtesyUser[]
  stats: DashboardStats | null
  loading: boolean
  error: string | null

  // Customers
  fetchCustomers: () => Promise<void>
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  searchCustomers: (query: string) => Promise<void>

  // Purchases
  fetchPurchases: () => Promise<void>
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>
  deletePurchase: (id: string) => Promise<void>
  filterPurchasesByDate: (startDate: string, endDate: string) => Promise<void>

  // Courtesy Users
  fetchCourtesyUsers: () => Promise<void>
  createCourtesyUser: (user: { name: string; email: string; phone?: string; password: string; notes?: string; expiresAt?: string }) => Promise<{ success: boolean; credentials?: { email: string; password: string }; error?: string }>
  toggleCourtesyUserStatus: (id: string, isActive: boolean) => Promise<void>
  deleteCourtesyUser: (id: string) => Promise<void>

  // Stats
  fetchStats: () => Promise<void>

  clearError: () => void
}

export const useAdmin = create<AdminState>()((set, get) => ({
  customers: [],
  purchases: [],
  courtesyUsers: [],
  stats: null,
  loading: false,
  error: null,

  // ========== CUSTOMERS ==========

  fetchCustomers: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const customers = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        cpf: c.cpf || '',
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))

      set({ customers, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  addCustomer: async (customer) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: customer.name,
          email: customer.email,
          phone: customer.phone || null,
          cpf: customer.cpf || null,
        })
        .select()
        .single()

      if (error) throw error

      const newCustomer: Customer = {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        cpf: data.cpf || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      set({
        customers: [newCustomer, ...get().customers],
        loading: false,
      })

      return data.id
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  updateCustomer: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const updateData: any = {}
      if (patch.name !== undefined) updateData.name = patch.name
      if (patch.email !== undefined) updateData.email = patch.email
      if (patch.phone !== undefined) updateData.phone = patch.phone || null
      if (patch.cpf !== undefined) updateData.cpf = patch.cpf || null

      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set({
        customers: get().customers.map(c =>
          c.id === id ? { ...c, ...patch } : c
        ),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  deleteCustomer: async (id) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({
        customers: get().customers.filter(c => c.id !== id),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  searchCustomers: async (query) => {
    set({ loading: true, error: null })
    try {
      if (!query.trim()) {
        await get().fetchCustomers()
        return
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      const customers = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        cpf: c.cpf || '',
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))

      set({ customers, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  // ========== PURCHASES ==========

  fetchPurchases: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('purchase_date', { ascending: false })

      if (error) throw error

      const purchases = (data || []).map(p => ({
        id: p.id,
        customerId: p.customer_id,
        customerName: p.customer_name,
        customerEmail: p.customer_email,
        productName: p.product_name,
        amount: parseFloat(p.amount),
        paymentStatus: p.payment_status,
        paymentMethod: p.payment_method || '',
        purchaseDate: p.purchase_date,
        notes: p.notes || '',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))

      set({ purchases, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  addPurchase: async (purchase) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('purchases')
        .insert({
          customer_id: purchase.customerId,
          customer_name: purchase.customerName,
          customer_email: purchase.customerEmail,
          product_name: purchase.productName,
          amount: purchase.amount,
          payment_status: purchase.paymentStatus,
          payment_method: purchase.paymentMethod || null,
          purchase_date: purchase.purchaseDate,
          notes: purchase.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      const newPurchase: Purchase = {
        id: data.id,
        customerId: data.customer_id,
        customerName: data.customer_name,
        customerEmail: data.customer_email,
        productName: data.product_name,
        amount: parseFloat(data.amount),
        paymentStatus: data.payment_status,
        paymentMethod: data.payment_method || '',
        purchaseDate: data.purchase_date,
        notes: data.notes || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      set({
        purchases: [newPurchase, ...get().purchases],
        loading: false,
      })

      return data.id
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  updatePurchase: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const updateData: any = {}
      if (patch.productName !== undefined) updateData.product_name = patch.productName
      if (patch.amount !== undefined) updateData.amount = patch.amount
      if (patch.paymentStatus !== undefined) updateData.payment_status = patch.paymentStatus
      if (patch.paymentMethod !== undefined) updateData.payment_method = patch.paymentMethod || null
      if (patch.notes !== undefined) updateData.notes = patch.notes || null

      const { error } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set({
        purchases: get().purchases.map(p =>
          p.id === id ? { ...p, ...patch } : p
        ),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  deletePurchase: async (id) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({
        purchases: get().purchases.filter(p => p.id !== id),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  filterPurchasesByDate: async (startDate, endDate) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate)
        .order('purchase_date', { ascending: false })

      if (error) throw error

      const purchases = (data || []).map(p => ({
        id: p.id,
        customerId: p.customer_id,
        customerName: p.customer_name,
        customerEmail: p.customer_email,
        productName: p.product_name,
        amount: parseFloat(p.amount),
        paymentStatus: p.payment_status,
        paymentMethod: p.payment_method || '',
        purchaseDate: p.purchase_date,
        notes: p.notes || '',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))

      set({ purchases, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  // ========== STATS ==========

  fetchStats: async () => {
    set({ loading: true, error: null })
    try {
      // Buscar dados básicos
      const [customersRes, purchasesRes, monthlySalesRes, monthlyRegsRes] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('purchases').select('*'),
        supabase.from('monthly_sales_stats').select('*').limit(6),
        supabase.from('monthly_registrations').select('*').limit(6),
      ])

      if (customersRes.error) throw customersRes.error
      if (purchasesRes.error) throw purchasesRes.error

      const allPurchases = purchasesRes.data || []
      const paidPurchases = allPurchases.filter(p => p.payment_status === 'paid')
      const pendingPurchases = allPurchases.filter(p => p.payment_status === 'pending')

      const totalRevenue = paidPurchases.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      const pendingPayments = pendingPurchases.reduce((sum, p) => sum + parseFloat(p.amount), 0)

      // Calcular novos cadastros este mês
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const { data: newCustomersData } = await supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .gte('created_at', firstDayOfMonth.toISOString())

      // Calcular vendas este mês
      const { data: salesThisMonthData } = await supabase
        .from('purchases')
        .select('amount')
        .eq('payment_status', 'paid')
        .gte('purchase_date', firstDayOfMonth.toISOString())

      const salesThisMonth = (salesThisMonthData || []).reduce((sum, p) => sum + parseFloat(p.amount), 0)

      const stats: DashboardStats = {
        totalCustomers: customersRes.count || 0,
        totalRevenue,
        pendingPayments,
        newCustomersThisMonth: newCustomersData?.length || 0,
        salesThisMonth,
        monthlySales: (monthlySalesRes.data || []).map(s => ({
          month: s.month,
          totalPurchases: s.total_purchases,
          totalRevenue: parseFloat(s.total_revenue),
          uniqueCustomers: s.unique_customers,
        })),
        monthlyRegistrations: (monthlyRegsRes.data || []).map(r => ({
          month: r.month,
          newCustomers: r.new_customers,
        })),
      }

      set({ stats, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  // ========== COURTESY USERS ==========

  fetchCourtesyUsers: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('active_courtesy_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const courtesyUsers = (data || []).map(u => ({
        id: u.id,
        authUserId: u.auth_user_id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        notes: u.notes,
        createdBy: u.created_by,
        expiresAt: u.expires_at,
        isActive: u.is_active,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        createdByEmail: u.created_by_email,
        createdByName: u.created_by_name,
        isCurrentlyActive: u.is_currently_active,
      }))

      set({ courtesyUsers, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  createCourtesyUser: async (user) => {
    set({ loading: true, error: null })
    try {
      // 1. Criar registro na tabela courtesy_users
      const { data: courtesyData, error: courtesyError } = await supabase.rpc('create_courtesy_user', {
        p_name: user.name,
        p_email: user.email,
        p_password: user.password,
        p_phone: user.phone || null,
        p_notes: user.notes || null,
        p_expires_at: user.expiresAt || null,
      })

      if (courtesyError) {
        throw new Error(`Erro ao criar registro cortesia: ${courtesyError.message}`)
      }

      if (!courtesyData.success) {
        throw new Error(courtesyData.error || 'Erro desconhecido ao criar registro')
      }

      // 2. Criar usuário no Supabase Auth usando Admin API
      // IMPORTANTE: O signUp público requer confirmação de email
      // Vamos usar uma abordagem diferente: criar via service role key (se disponível)
      // ou desabilitar confirmação de email no Supabase Dashboard

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name,
            is_courtesy: true,
          },
          emailRedirectTo: undefined,
        }
      })

      // Se der erro de "Email not confirmed", precisamos confirmar manualmente
      if (authError && authError.message.includes('Email not confirmed')) {
        // Tentar criar novamente com auto-confirmação
        const { data: retryData, error: retryError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              name: user.name,
              is_courtesy: true,
            },
            emailRedirectTo: undefined,
          }
        })

        if (retryError) throw new Error(`Erro ao criar usuário: ${retryError.message}`)
      }

      if (authError) {
        // Se falhar ao criar auth user, deletar registro cortesia
        await supabase.from('courtesy_users').delete().eq('id', courtesyData.courtesy_id)
        throw new Error(`Erro ao criar usuário de autenticação: ${authError.message}`)
      }

      // 3. Vincular auth_user_id ao registro cortesia
      if (authData.user) {
        await supabase
          .from('courtesy_users')
          .update({ auth_user_id: authData.user.id })
          .eq('id', courtesyData.courtesy_id)
      }

      // Atualizar lista
      await get().fetchCourtesyUsers()

      set({ loading: false })

      return {
        success: true,
        credentials: {
          email: user.email,
          password: user.password,
        }
      }
    } catch (error: any) {
      console.error('Erro no createCourtesyUser:', error)
      set({ error: error.message, loading: false })
      alert(`Erro ao criar usuário: ${error.message}`)
      return {
        success: false,
        error: error.message
      }
    }
  },

  toggleCourtesyUserStatus: async (id, isActive) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('courtesy_users')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error

      set({
        courtesyUsers: get().courtesyUsers.map(u =>
          u.id === id ? { ...u, isActive } : u
        ),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  deleteCourtesyUser: async (id) => {
    set({ loading: true, error: null })
    try {
      // Chamar função SQL que deleta o usuário
      const { data, error } = await supabase.rpc('delete_courtesy_user', {
        p_courtesy_id: id
      })

      if (error) throw new Error(`Erro ao deletar usuário: ${error.message}`)

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao deletar usuário')
      }

      set({
        courtesyUsers: get().courtesyUsers.filter(u => u.id !== id),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
