import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { AdminUser } from '@/types/admin'

type AuthState = {
  user: User | null
  adminUser: AdminUser | null
  loading: boolean
  error: string | null

  // Actions
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
  clearError: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      adminUser: null,
      loading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null })
        try {
          // 1. Fazer login com Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (authError) throw authError

          // 2. Verificar se é admin
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .maybeSingle()

          if (adminError) {
            await supabase.auth.signOut()
            throw new Error(`Erro ao verificar permissões: ${adminError.message}`)
          }

          if (!adminData) {
            await supabase.auth.signOut()
            throw new Error('Usuário não tem permissão de administrador')
          }

          // 3. Mapear para formato da aplicação
          const adminUser: AdminUser = {
            id: adminData.id,
            email: adminData.email,
            fullName: adminData.full_name,
            role: adminData.role,
            createdAt: adminData.created_at,
            updatedAt: adminData.updated_at,
          }

          set({
            user: authData.user,
            adminUser,
            loading: false,
          })

          return true
        } catch (error: any) {
          set({
            error: error.message,
            loading: false,
            user: null,
            adminUser: null,
          })
          return false
        }
      },

      signOut: async () => {
        set({ loading: true })
        try {
          await supabase.auth.signOut()
          set({
            user: null,
            adminUser: null,
            loading: false,
          })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      checkSession: async () => {
        set({ loading: true })
        try {
          const { data: { session } } = await supabase.auth.getSession()

          if (!session) {
            set({ user: null, adminUser: null, loading: false })
            return
          }

          // Verificar se ainda é admin
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle()

          if (!adminData) {
            await supabase.auth.signOut()
            set({ user: null, adminUser: null, loading: false })
            return
          }

          const adminUser: AdminUser = {
            id: adminData.id,
            email: adminData.email,
            fullName: adminData.full_name,
            role: adminData.role,
            createdAt: adminData.created_at,
            updatedAt: adminData.updated_at,
          }

          set({
            user: session.user,
            adminUser,
            loading: false,
          })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        adminUser: state.adminUser,
      }),
    }
  )
)
