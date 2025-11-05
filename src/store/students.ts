import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Student } from '@/types/student'

export type StudentsState = {
  students: Student[]
  loading: boolean
  error: string | null
  fetched: boolean
  // Actions
  fetchAll: (force?: boolean) => Promise<void>
  search: (query: string) => Promise<void>
  add: (s: Omit<Student, 'id' | 'createdAt'>) => Promise<string | null>
  update: (id: string, patch: Partial<Student>) => Promise<void>
  remove: (id: string) => Promise<void>
  clearError: () => void
}

export const useStudents = create<StudentsState>()((set, get) => ({
  students: [],
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
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      const students = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        cpf: s.cpf || '',
        birth_date: s.birth_date || '',
        phone: s.phone || '',
        cep: s.cep || '',
        street: s.street || '',
        number: s.number || '',
        complement: s.complement || '',
        neighborhood: s.neighborhood || '',
        city: s.city || '',
        state: s.state || '',
        notes: s.notes || '',
        photoUrl: s.photo_url || undefined,
        plannedMentorships: s.planned_mentorships || [],
        createdAt: s.created_at,
      }))

      set({ students, loading: false, fetched: true })
    } catch (error: any) {
      set({ error: error.message, loading: false, fetched: false })
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
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .or(`name.ilike.%${query}%,cpf.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      const students = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        cpf: s.cpf || '',
        birth_date: s.birth_date || '',
        phone: s.phone || '',
        cep: s.cep || '',
        street: s.street || '',
        number: s.number || '',
        complement: s.complement || '',
        neighborhood: s.neighborhood || '',
        city: s.city || '',
        state: s.state || '',
        notes: s.notes || '',
        photoUrl: s.photo_url || undefined,
        plannedMentorships: s.planned_mentorships || [],
        createdAt: s.created_at,
      }))

      set({ students, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  add: async (s) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ [STUDENTS] Usuário não autenticado')
        throw new Error('Usuário não autenticado')
      }

      console.log('✅ [STUDENTS] Usuário autenticado:', user.id)

      const insertData = {
        user_id: user.id,
        name: s.name,
        cpf: s.cpf || null,
        birth_date: s.birth_date || null,
        phone: s.phone || null,
        cep: s.cep || null,
        street: s.street || null,
        number: s.number || null,
        complement: s.complement || null,
        neighborhood: s.neighborhood || null,
        city: s.city || null,
        state: s.state || null,
        notes: s.notes || null,
        photo_url: s.photoUrl || null,
        planned_mentorships: s.plannedMentorships || [],
      }

      console.log('📝 [STUDENTS] Dados para inserir:', insertData)

      const { data, error} = await supabase
        .from('students')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ [STUDENTS] Erro do Supabase:', error)
        console.error('❌ [STUDENTS] Detalhes do erro:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ [STUDENTS] Aluno criado com sucesso:', data)

      const newStudent: Student = {
        id: data.id,
        name: data.name,
        cpf: data.cpf || '',
        birth_date: data.birth_date || '',
        phone: data.phone || '',
        cep: data.cep || '',
        street: data.street || '',
        number: data.number || '',
        complement: data.complement || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        notes: data.notes || '',
        photoUrl: data.photo_url || undefined,
        plannedMentorships: data.planned_mentorships || [],
        createdAt: data.created_at,
      }

      set({
        students: [newStudent, ...get().students],
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
      if (patch.birth_date !== undefined) updateData.birth_date = patch.birth_date || null
      if (patch.phone !== undefined) updateData.phone = patch.phone || null
      if (patch.cep !== undefined) updateData.cep = patch.cep || null
      if (patch.street !== undefined) updateData.street = patch.street || null
      if (patch.number !== undefined) updateData.number = patch.number || null
      if (patch.complement !== undefined) updateData.complement = patch.complement || null
      if (patch.neighborhood !== undefined) updateData.neighborhood = patch.neighborhood || null
      if (patch.city !== undefined) updateData.city = patch.city || null
      if (patch.state !== undefined) updateData.state = patch.state || null
      if (patch.notes !== undefined) updateData.notes = patch.notes || null
      if (patch.photoUrl !== undefined) updateData.photo_url = patch.photoUrl || null
      if (patch.plannedMentorships !== undefined) updateData.planned_mentorships = patch.plannedMentorships

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      set({
        students: get().students.map(s =>
          s.id === id ? { ...s, ...patch } : s
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
        .from('students')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({
        students: get().students.filter(s => s.id !== id),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
