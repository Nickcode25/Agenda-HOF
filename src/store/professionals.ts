import { create } from 'zustand'
import { Professional } from '@/types/professional'
import { supabase } from '@/lib/supabase'

export type ProfessionalsState = {
  professionals: Professional[]
  loading: boolean
  error: string | null
  fetched: boolean
  fetchAll: (force?: boolean) => Promise<void>
  add: (p: Omit<Professional, 'id' | 'createdAt'>) => Promise<string | null>
  update: (id: string, patch: Partial<Professional>) => Promise<void>
  remove: (id: string) => Promise<void>
  toggleActive: (id: string) => Promise<void>
}

export const useProfessionals = create<ProfessionalsState>((set, get) => ({
  professionals: [],
  loading: false,
  error: null,
  fetched: false,

  fetchAll: async (force = false) => {
    // Se já carregou e não é forçado, não carrega novamente
    if (get().fetched && !force) {
      console.log('⚡ [PROFESSIONALS] Usando cache - dados já carregados')
      return
    }

    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ [PROFESSIONALS] Usuário não autenticado')
        throw new Error('Usuário não autenticado')
      }

      console.log('👤 [PROFESSIONALS] Buscando para user:', user.id, '| Email:', user.email)

      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [PROFESSIONALS] Erro do Supabase:', error)
        throw error
      }

      console.log(`✅ [PROFESSIONALS] ${data?.length || 0} profissionais encontrados`)

      const professionals: Professional[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        specialty: row.specialty || '',
        registrationNumber: row.cro || '',
        cpf: row.cpf || undefined,
        phone: row.phone || undefined,
        email: row.email || undefined,
        cep: row.zip_code || undefined,
        street: row.street || undefined,
        number: row.number || undefined,
        complement: row.complement || undefined,
        neighborhood: row.neighborhood || undefined,
        city: row.city || undefined,
        state: row.state || undefined,
        photoUrl: row.photo_url || undefined,
        active: row.is_active ?? true,
        createdAt: row.created_at,
      }))

      set({ professionals, loading: false, fetched: true })
    } catch (error: any) {
      console.error('❌ [PROFESSIONALS] Erro ao buscar:', error)
      set({ error: error.message, loading: false, fetched: false })
    }
  },

  add: async (p) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      console.log('👤 Usuário autenticado:', user.id)
      console.log('📝 Dados a serem inseridos:', {
        user_id: user.id,
        name: p.name,
        specialty: p.specialty || null,
        cro: p.registrationNumber || null,
        cpf: p.cpf || null,
        phone: p.phone || null,
        email: p.email || null,
        zip_code: p.cep || null,
        street: p.street || null,
        number: p.number || null,
        complement: p.complement || null,
        neighborhood: p.neighborhood || null,
        city: p.city || null,
        state: p.state || null,
        photo_url: p.photoUrl || null,
        is_active: p.active ?? true,
      })

      const { data, error } = await supabase
        .from('professionals')
        .insert({
          user_id: user.id,
          name: p.name,
          specialty: p.specialty || null,
          cro: p.registrationNumber || null,
          cpf: p.cpf || null,
          phone: p.phone || null,
          email: p.email || null,
          zip_code: p.cep || null,
          street: p.street || null,
          number: p.number || null,
          complement: p.complement || null,
          neighborhood: p.neighborhood || null,
          city: p.city || null,
          state: p.state || null,
          photo_url: p.photoUrl || null,
          is_active: p.active ?? true,
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erro do Supabase:', error)
        throw error
      }

      console.log('✅ Profissional inserido:', data)

      await get().fetchAll()
      set({ loading: false })
      return data.id
    } catch (error: any) {
      console.error('❌ Erro completo:', error)
      set({ error: error.message, loading: false })
      return null
    }
  },

  update: async (id, patch) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const updateData: any = {}
      if (patch.name !== undefined) updateData.name = patch.name
      if (patch.specialty !== undefined) updateData.specialty = patch.specialty || null
      if (patch.registrationNumber !== undefined) updateData.cro = patch.registrationNumber || null
      if (patch.cpf !== undefined) updateData.cpf = patch.cpf || null
      if (patch.phone !== undefined) updateData.phone = patch.phone || null
      if (patch.email !== undefined) updateData.email = patch.email || null
      if (patch.cep !== undefined) updateData.zip_code = patch.cep || null
      if (patch.street !== undefined) updateData.street = patch.street || null
      if (patch.number !== undefined) updateData.number = patch.number || null
      if (patch.complement !== undefined) updateData.complement = patch.complement || null
      if (patch.neighborhood !== undefined) updateData.neighborhood = patch.neighborhood || null
      if (patch.city !== undefined) updateData.city = patch.city || null
      if (patch.state !== undefined) updateData.state = patch.state || null
      if (patch.photoUrl !== undefined) updateData.photo_url = patch.photoUrl || null
      if (patch.active !== undefined) updateData.is_active = patch.active

      const { error } = await supabase
        .from('professionals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchAll()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  remove: async (id) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('professionals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchAll()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  toggleActive: async (id) => {
    const professional = get().professionals.find(p => p.id === id)
    if (!professional) return

    await get().update(id, { active: !professional.active })
  },
}))
