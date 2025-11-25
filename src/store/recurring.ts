import { create } from 'zustand'
import type { RecurringBlock } from '@/types/recurring'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/types/errors'

export type RecurringState = {
  blocks: RecurringBlock[]
  loading: boolean
  error: string | null

  fetchBlocks: () => Promise<void>
  addBlock: (block: Omit<RecurringBlock, 'id' | 'createdAt'>) => Promise<string | null>
  updateBlock: (id: string, patch: Partial<RecurringBlock>) => Promise<void>
  removeBlock: (id: string) => Promise<void>
  toggleBlockActive: (id: string) => Promise<void>
  clearError: () => void
}

export const useRecurring = create<RecurringState>((set, get) => ({
  blocks: [],
  loading: false,
  error: null,

  fetchBlocks: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('recurring_blocks')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true })

      if (error) throw error

      const blocks: RecurringBlock[] = (data || []).map(row => ({
        id: row.id,
        title: row.title,
        startTime: row.start_time,
        endTime: row.end_time,
        daysOfWeek: row.days_of_week || [],
        active: row.active ?? true,
        createdAt: row.created_at,
      }))

      set({ blocks, loading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  addBlock: async (block) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('recurring_blocks')
        .insert({
          user_id: user.id,
          title: block.title,
          start_time: block.startTime,
          end_time: block.endTime,
          days_of_week: block.daysOfWeek,
          active: block.active,
        })
        .select()
        .single()

      if (error) throw error

      await get().fetchBlocks()
      set({ loading: false })
      return data.id
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
      return null
    }
  },

  updateBlock: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const updateData: any = {}
      if (patch.title !== undefined) updateData.title = patch.title
      if (patch.startTime !== undefined) updateData.start_time = patch.startTime
      if (patch.endTime !== undefined) updateData.end_time = patch.endTime
      if (patch.daysOfWeek !== undefined) updateData.days_of_week = patch.daysOfWeek
      if (patch.active !== undefined) updateData.active = patch.active

      const { error } = await supabase
        .from('recurring_blocks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchBlocks()
      set({ loading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  removeBlock: async (id) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('recurring_blocks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchBlocks()
      set({ loading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  toggleBlockActive: async (id) => {
    const block = get().blocks.find(b => b.id === id)
    if (block) {
      await get().updateBlock(id, { active: !block.active })
    }
  },

  clearError: () => set({ error: null }),
}))
