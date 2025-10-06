import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Patient } from '@/types/patient'

export type PatientsState = {
  patients: Patient[]
  loading: boolean
  error: string | null
  // Actions
  fetchAll: () => Promise<void>
  search: (query: string) => Promise<void>
  add: (p: Omit<Patient, 'id' | 'createdAt'>) => Promise<string | null>
  update: (id: string, patch: Partial<Patient>) => Promise<void>
  remove: (id: string) => Promise<void>
  clearError: () => void
}

export const usePatients = create<PatientsState>()((set, get) => ({
  patients: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const patients = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        cpf: p.cpf || '',
        phone: p.phone || '',
        email: p.email || '',
        birthDate: p.birth_date || '',
        address: p.address || '',
        notes: p.notes || '',
        photoUrl: p.photo_url || undefined,
        plannedProcedures: p.planned_procedures || [],
        createdAt: p.created_at,
      }))

      set({ patients, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  search: async (query: string) => {
    if (!query.trim()) {
      await get().fetchAll()
      return
    }

    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .or(`name.ilike.%${query}%,cpf.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      const patients = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        cpf: p.cpf || '',
        phone: p.phone || '',
        email: p.email || '',
        birthDate: p.birth_date || '',
        address: p.address || '',
        notes: p.notes || '',
        photoUrl: p.photo_url || undefined,
        plannedProcedures: p.planned_procedures || [],
        createdAt: p.created_at,
      }))

      set({ patients, loading: false })
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
        .from('patients')
        .insert({
          user_id: user.id,
          name: p.name,
          cpf: p.cpf || null,
          phone: p.phone || null,
          email: p.email || null,
          birth_date: p.birthDate || null,
          address: p.address || null,
          notes: p.notes || null,
          photo_url: p.photoUrl || null,
          planned_procedures: p.plannedProcedures || [],
        })
        .select()
        .single()

      if (error) throw error

      const newPatient: Patient = {
        id: data.id,
        name: data.name,
        cpf: data.cpf || '',
        phone: data.phone || '',
        email: data.email || '',
        birthDate: data.birth_date || '',
        address: data.address || '',
        notes: data.notes || '',
        photoUrl: data.photo_url || undefined,
        plannedProcedures: data.planned_procedures || [],
        createdAt: data.created_at,
      }

      set({
        patients: [newPatient, ...get().patients],
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
      if (patch.cpf !== undefined) updateData.cpf = patch.cpf || null
      if (patch.phone !== undefined) updateData.phone = patch.phone || null
      if (patch.email !== undefined) updateData.email = patch.email || null
      if (patch.birthDate !== undefined) updateData.birth_date = patch.birthDate || null
      if (patch.address !== undefined) updateData.address = patch.address || null
      if (patch.notes !== undefined) updateData.notes = patch.notes || null
      if (patch.photoUrl !== undefined) updateData.photo_url = patch.photoUrl || null
      if (patch.plannedProcedures !== undefined) updateData.planned_procedures = patch.plannedProcedures

      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set({
        patients: get().patients.map(p =>
          p.id === id ? { ...p, ...patch } : p
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
        .from('patients')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({
        patients: get().patients.filter(p => p.id !== id),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
