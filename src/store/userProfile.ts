import { create } from 'zustand'
import { supabase, getCachedUser } from '@/lib/supabase'
import type { UserProfile, CreateStaffData } from '@/types/user'

type UserProfileState = {
  currentProfile: UserProfile | null
  staffMembers: UserProfile[]
  loading: boolean
  error: string | null

  // Actions
  fetchCurrentProfile: () => Promise<void>
  fetchStaffMembers: () => Promise<void>
  createStaff: (data: CreateStaffData) => Promise<{ success: boolean; error?: string }>
  updateStaff: (id: string, data: Partial<UserProfile>) => Promise<void>
  toggleStaffActive: (id: string) => Promise<void>
  isOwner: () => boolean
  canAccessDashboard: () => boolean
}

export const useUserProfile = create<UserProfileState>((set, get) => ({
  currentProfile: null,
  staffMembers: [],
  loading: false,
  error: null,

  fetchCurrentProfile: async () => {
    try {
      set({ loading: true, error: null })

      const user = await getCachedUser()

      if (!user) {
        set({ currentProfile: null, loading: false })
        return
      }

      let { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Se o perfil não existe, criar um novo (fallback para usuários antigos)
      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            role: 'owner',
            clinic_id: user.id,
            display_name: user.email?.split('@')[0] || 'Usuário',
            is_active: true,
          })
          .select()
          .single()

        if (createError) {
          set({ currentProfile: null, loading: false, error: createError.message })
          return
        }

        data = newProfile
      } else if (error) {
        set({ currentProfile: null, loading: false, error: error.message })
        return
      }

      const profile: UserProfile = {
        id: data.id,
        role: data.role,
        clinicId: data.clinic_id,
        parentUserId: data.parent_user_id,
        displayName: data.display_name,
        isActive: data.is_active,
        email: user.email,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        // Extended profile fields
        profilePhoto: data.profile_photo,
        socialName: data.social_name,
        fullName: data.full_name,
        username: data.username,
        address: data.address,
        phone: data.phone,
        secondaryPhone: data.secondary_phone,
      }

      set({ currentProfile: profile, loading: false })
    } catch (error: any) {
      set({ currentProfile: null, error: error.message, loading: false })
    }
  },

  fetchStaffMembers: async () => {
    try {
      set({ loading: true, error: null })

      const user = await getCachedUser()
      if (!user) {
        set({ staffMembers: [], loading: false })
        return
      }

      // Buscar funcionários da clínica
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('parent_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        set({ staffMembers: [], loading: false, error: error.message })
        return
      }

      const staff: UserProfile[] = (data || []).map(s => ({
        id: s.id,
        role: s.role,
        clinicId: s.clinic_id,
        parentUserId: s.parent_user_id,
        displayName: s.display_name,
        isActive: s.is_active,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }))

      set({ staffMembers: staff, loading: false })
    } catch (error: any) {
      set({ staffMembers: [], error: error.message, loading: false })
    }
  },

  createStaff: async (data: CreateStaffData) => {
    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Não autenticado')

      // Verificar se é owner
      const profile = get().currentProfile
      if (!profile || profile.role !== 'owner') {
        throw new Error('Apenas o proprietário pode criar funcionários')
      }

      // Criar usuário usando signUp (método alternativo)
      // Salvar sessão atual
      const { data: currentSession } = await supabase.auth.getSession()

      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.displayName,
            role: 'staff',
            clinic_id: profile.clinicId,
            parent_user_id: user.id,
          },
          emailRedirectTo: undefined, // Não enviar email de confirmação
        }
      })

      if (signUpError) throw signUpError
      if (!newUser.user) throw new Error('Falha ao criar usuário')

      // Restaurar sessão do owner
      if (currentSession?.session) {
        await supabase.auth.setSession(currentSession.session)
      }

      // Criar/atualizar perfil do funcionário
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: newUser.user.id,
          role: 'staff',
          clinic_id: profile.clinicId,
          parent_user_id: user.id,
          display_name: data.displayName,
          is_active: true,
        })

      if (profileError) throw profileError

      // Recarregar lista de funcionários
      await get().fetchStaffMembers()

      set({ loading: false })
      return { success: true }
    } catch (error: any) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  updateStaff: async (id: string, updates: Partial<UserProfile>) => {
    set({ loading: true, error: null })
    try {
      const updateData: any = {}
      if (updates.displayName !== undefined) updateData.display_name = updates.displayName
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      // Atualizar lista local
      set({
        staffMembers: get().staffMembers.map(s =>
          s.id === id ? { ...s, ...updates } : s
        ),
        loading: false,
      })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  toggleStaffActive: async (id: string) => {
    const staff = get().staffMembers.find(s => s.id === id)
    if (!staff) return

    await get().updateStaff(id, { isActive: !staff.isActive })
  },

  isOwner: () => {
    const profile = get().currentProfile
    return profile?.role === 'owner'
  },

  canAccessDashboard: () => {
    return get().isOwner()
  },
}))
