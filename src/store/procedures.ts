import { create } from 'zustand'
import { supabase, getCachedUser } from '@/lib/supabase'

export type Procedure = {
  id: string
  name: string
  description?: string
  price: number
  value?: number // alias para price (compatibilidade)
  cashValue?: number
  cardValue?: number
  durationMinutes?: number
  category?: string
  isActive: boolean
  stockCategories?: Array<{
    category: string
    quantityUsed: number
  }>
  createdAt: string
}

type ProceduresState = {
  procedures: Procedure[]
  loading: boolean
  error: string | null
  fetched: boolean
  fetchAll: (force?: boolean) => Promise<void>
  add: (p: Omit<Procedure, 'id' | 'createdAt'>) => Promise<string | null>
  update: (id: string, patch: Partial<Procedure>) => Promise<void>
  remove: (id: string) => Promise<void>
  clearError: () => void
}

export const useProcedures = create<ProceduresState>()((set, get) => ({
  procedures: [],
  loading: false,
  error: null,
  fetched: false,

  fetchAll: async (force = false) => {
    // Se já carregou e não é forçado, não carrega novamente
    if (get().fetched && !force) {
      console.log('⚡ [PROCEDURES] Usando cache - dados já carregados')
      return
    }

    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) {
        console.error('❌ [PROCEDURES] Usuário não autenticado')
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ [PROCEDURES] Erro do Supabase:', error)
        throw error
      }

      const procedures = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: parseFloat(p.price),
        value: parseFloat(p.price), // alias para compatibilidade
        cashValue: p.cash_value ? parseFloat(p.cash_value) : undefined,
        cardValue: p.card_value ? parseFloat(p.card_value) : undefined,
        durationMinutes: p.duration_minutes,
        category: p.category || '',
        isActive: p.is_active,
        stockCategories: p.stock_categories || [],
        createdAt: p.created_at,
      }))

      set({ procedures, loading: false, fetched: true })
    } catch (error: any) {
      console.error('❌ [PROCEDURES] Erro ao buscar:', error)
      set({ error: error.message, loading: false, fetched: false })
    }
  },

  add: async (p) => {
    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const insertData = {
        user_id: user.id,
        name: p.name,
        description: p.description || null,
        price: p.price,
        cash_value: p.cashValue || null,
        card_value: p.cardValue || null,
        duration_minutes: p.durationMinutes || null,
        category: p.category || null,
        is_active: p.isActive,
        stock_categories: p.stockCategories || [],
      }

      const { data, error } = await supabase
        .from('procedures')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      const newProcedure: Procedure = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        price: parseFloat(data.price),
        cashValue: data.cash_value ? parseFloat(data.cash_value) : undefined,
        cardValue: data.card_value ? parseFloat(data.card_value) : undefined,
        durationMinutes: data.duration_minutes,
        category: data.category || '',
        isActive: data.is_active,
        stockCategories: data.stock_categories || [],
        createdAt: data.created_at,
      }

      set({ procedures: [...get().procedures, newProcedure], loading: false })
      return data.id
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return null
    }
  },

  update: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const updateData: any = {}
      if (patch.name !== undefined) updateData.name = patch.name
      if (patch.description !== undefined) updateData.description = patch.description || null
      if (patch.price !== undefined) updateData.price = patch.price
      if (patch.cashValue !== undefined) updateData.cash_value = patch.cashValue || null
      if (patch.cardValue !== undefined) updateData.card_value = patch.cardValue || null
      if (patch.durationMinutes !== undefined) updateData.duration_minutes = patch.durationMinutes
      if (patch.category !== undefined) updateData.category = patch.category || null
      if (patch.isActive !== undefined) updateData.is_active = patch.isActive
      if (patch.stockCategories !== undefined) updateData.stock_categories = patch.stockCategories || []

      const { error } = await supabase
        .from('procedures')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set({
        procedures: get().procedures.map(p => p.id === id ? { ...p, ...patch } : p),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  remove: async (id) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('procedures')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({ procedures: get().procedures.filter(p => p.id !== id), loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
