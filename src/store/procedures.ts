import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type Procedure = {
  id: string
  name: string
  description?: string
  price: number
  durationMinutes: number
  category?: string
  isActive: boolean
  createdAt: string
}

type ProceduresState = {
  procedures: Procedure[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (p: Omit<Procedure, 'id' | 'createdAt'>) => Promise<string | null>
  update: (id: string, patch: Partial<Procedure>) => Promise<void>
  remove: (id: string) => Promise<void>
  clearError: () => void
}

export const useProcedures = create<ProceduresState>()((set, get) => ({
  procedures: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (error) throw error

      const procedures = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: parseFloat(p.price),
        durationMinutes: p.duration_minutes,
        category: p.category || '',
        isActive: p.is_active,
        createdAt: p.created_at,
      }))

      set({ procedures, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  add: async (p) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('procedures')
        .insert({
          user_id: user.id,
          name: p.name,
          description: p.description || null,
          price: p.price,
          duration_minutes: p.durationMinutes,
          category: p.category || null,
          is_active: p.isActive,
        })
        .select()
        .single()

      if (error) throw error

      const newProcedure: Procedure = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        price: parseFloat(data.price),
        durationMinutes: data.duration_minutes,
        category: data.category || '',
        isActive: data.is_active,
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
      if (patch.durationMinutes !== undefined) updateData.duration_minutes = patch.durationMinutes
      if (patch.category !== undefined) updateData.category = patch.category || null
      if (patch.isActive !== undefined) updateData.is_active = patch.isActive

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
