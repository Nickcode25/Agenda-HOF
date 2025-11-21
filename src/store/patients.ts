import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Patient } from '@/types/patient'
import { getErrorMessage } from '@/types/errors'

export type PatientsState = {
  patients: Patient[]
  loading: boolean
  error: string | null
  fetched: boolean
  // Actions
  fetchAll: (force?: boolean) => Promise<void>
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
  fetched: false,

  fetchAll: async (force = false) => {
    // Se já carregou e não é forçado, não carrega novamente
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
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }


      const patients = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        cpf: p.cpf || '',
        phone: p.phone || '',
        cep: p.cep || '',
        street: p.street || '',
        number: p.number || '',
        complement: p.complement || '',
        neighborhood: p.neighborhood || '',
        city: p.city || '',
        state: p.state || '',
        clinicalInfo: p.clinical_info || '',
        notes: p.notes || '',
        photoUrl: p.photo_url || undefined,
        plannedProcedures: p.planned_procedures || [],
        createdAt: p.created_at,
      }))

      set({ patients, loading: false, fetched: true })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false, fetched: false })
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

      // Sanitizar query para evitar SQL Injection - escapar caracteres especiais do LIKE
      const sanitizedQuery = query
        .replace(/\\/g, '\\\\')  // Escapar backslash primeiro
        .replace(/%/g, '\\%')    // Escapar %
        .replace(/_/g, '\\_')    // Escapar _

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)
        .or(`name.ilike.%${sanitizedQuery}%,cpf.ilike.%${sanitizedQuery}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      const patients = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        cpf: p.cpf || '',
        phone: p.phone || '',
        cep: p.cep || '',
        street: p.street || '',
        number: p.number || '',
        complement: p.complement || '',
        neighborhood: p.neighborhood || '',
        city: p.city || '',
        state: p.state || '',
        clinicalInfo: p.clinical_info || '',
        notes: p.notes || '',
        photoUrl: p.photo_url || undefined,
        plannedProcedures: p.planned_procedures || [],
        createdAt: p.created_at,
      }))

      set({ patients, loading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  add: async (p) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error} = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name: p.name,
          cpf: p.cpf || null,
          phone: p.phone || null,
          cep: p.cep || null,
          street: p.street || null,
          number: p.number || null,
          complement: p.complement || null,
          neighborhood: p.neighborhood || null,
          city: p.city || null,
          state: p.state || null,
          clinical_info: p.clinicalInfo || null,
          notes: p.notes || null,
          photo_url: p.photoUrl || null,
          planned_procedures: p.plannedProcedures || [],
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erro do Supabase (patients):', error)
        throw error
      }

      const newPatient: Patient = {
        id: data.id,
        name: data.name,
        cpf: data.cpf || '',
        phone: data.phone || '',
        cep: data.cep || '',
        street: data.street || '',
        number: data.number || '',
        complement: data.complement || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        clinicalInfo: data.clinical_info || '',
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
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
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
      if (patch.cep !== undefined) updateData.cep = patch.cep || null
      if (patch.street !== undefined) updateData.street = patch.street || null
      if (patch.number !== undefined) updateData.number = patch.number || null
      if (patch.complement !== undefined) updateData.complement = patch.complement || null
      if (patch.neighborhood !== undefined) updateData.neighborhood = patch.neighborhood || null
      if (patch.city !== undefined) updateData.city = patch.city || null
      if (patch.state !== undefined) updateData.state = patch.state || null
      if (patch.clinicalInfo !== undefined) updateData.clinical_info = patch.clinicalInfo || null
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
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
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
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
