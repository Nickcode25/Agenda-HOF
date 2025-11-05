import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Mentorship } from '@/types/mentorship'

export type MentorshipsState = {
  mentorships: Mentorship[]
  loading: boolean
  error: string | null
  fetched: boolean
  // Actions
  fetchAll: (force?: boolean) => Promise<void>
  add: (m: Omit<Mentorship, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | null>
  update: (id: string, patch: Partial<Mentorship>) => Promise<void>
  remove: (id: string) => Promise<void>
  clearError: () => void
}

export const useMentorships = create<MentorshipsState>()((set, get) => ({
  mentorships: [],
  loading: false,
  error: null,
  fetched: false,

  fetchAll: async (force = false) => {
    if (get().fetched && !force) {
      return
    }

    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('mentorships')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) {
        throw error
      }

      const mentorships = (data || []).map(m => ({
        id: m.id,
        userId: m.user_id,
        name: m.name,
        description: m.description || '',
        price: m.price,
        duration: m.duration || '',
        isActive: m.is_active,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }))

      set({ mentorships, loading: false, fetched: true })
    } catch (error: any) {
      set({ error: error.message, loading: false, fetched: false })
    }
  },

  add: async (m) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error} = await supabase
        .from('mentorships')
        .insert({
          user_id: user.id,
          name: m.name,
          description: m.description || null,
          price: m.price,
          duration: m.duration || null,
          is_active: m.isActive
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erro do Supabase (mentorships):', error)
        throw error
      }

      const newMentorship: Mentorship = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description || '',
        price: data.price,
        duration: data.duration || '',
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      set({
        mentorships: [...get().mentorships, newMentorship].sort((a, b) => a.name.localeCompare(b.name)),
        loading: false,
      })

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
      if (patch.duration !== undefined) updateData.duration = patch.duration || null
      if (patch.isActive !== undefined) updateData.is_active = patch.isActive

      const { error } = await supabase
        .from('mentorships')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set({
        mentorships: get().mentorships.map(m =>
          m.id === id ? { ...m, ...patch } : m
        ),
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
        .from('mentorships')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({
        mentorships: get().mentorships.filter(m => m.id !== id),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
