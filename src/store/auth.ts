import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { AdminUser } from '@/types/admin'
import { getErrorMessage } from '@/types/errors'

type AuthState = {
  user: User | null
  adminUser: AdminUser | null
  loading: boolean
  error: string | null
  _checkingSession: boolean // Flag interno para evitar race conditions
  _sessionCheckPromise: Promise<void> | null // Promise para aguardar verificação em andamento

  // Actions
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<boolean>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  updatePassword: (newPassword: string) => Promise<boolean>
  clearError: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      adminUser: null,
      loading: false,
      error: null,
      _checkingSession: false,
      _sessionCheckPromise: null,

      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null })
        try {
          // 1. Fazer login com Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (authError) throw authError

          // 2. Verificar se é admin (opcional - não bloqueia login)
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .maybeSingle()

          // 3. Mapear admin se existir
          let adminUser: AdminUser | null = null

          if (adminData) {
            adminUser = {
              id: adminData.id,
              email: adminData.email,
              fullName: adminData.full_name,
              role: adminData.role,
              createdAt: adminData.created_at,
              updatedAt: adminData.updated_at,
            }
          }

          set({
            user: authData.user,
            adminUser,
            loading: false,
          })

          return true
        } catch (error) {
          set({
            error: getErrorMessage(error),
            loading: false,
            user: null,
            adminUser: null,
          })
          return false
        }
      },

      signUp: async (email: string, password: string, fullName: string, phone?: string) => {
        set({ loading: true, error: null })
        try {
          // Calcular data de fim do trial (7 dias a partir de agora)
          const trialEndDate = new Date()
          trialEndDate.setDate(trialEndDate.getDate() + 7)

          // 1. Criar conta no Supabase Auth com trial_end_date e phone no metadata
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                phone: phone || null,
                trial_end_date: trialEndDate.toISOString()
              }
            }
          })

          if (authError) throw authError

          // 2. Fazer login automaticamente se confirmação de email não for necessária
          if (authData.user) {
            set({
              user: authData.user,
              adminUser: null,
              loading: false,
            })
            return true
          }

          set({ loading: false })
          return false
        } catch (error) {
          set({
            error: getErrorMessage(error),
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
        } catch (error) {
          set({ error: getErrorMessage(error), loading: false })
        }
      },

      checkSession: async () => {
        // Se já existe uma verificação em andamento, aguardar ela terminar
        const existingPromise = get()._sessionCheckPromise
        if (existingPromise) {
          return existingPromise
        }

        // Criar nova promise para esta verificação
        const checkPromise = (async () => {
          set({ loading: true, _checkingSession: true })
          try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
              set({ user: null, adminUser: null, loading: false, _checkingSession: false, _sessionCheckPromise: null })
              return
            }

            // Verificar se é admin (opcional - não força logout)
            const { data: adminData } = await supabase
              .from('admin_users')
              .select('*')
              .eq('email', session.user.email)
              .maybeSingle()

            let adminUser: AdminUser | null = null

            if (adminData) {
              adminUser = {
                id: adminData.id,
                email: adminData.email,
                fullName: adminData.full_name,
                role: adminData.role,
                createdAt: adminData.created_at,
                updatedAt: adminData.updated_at,
              }
            }

            set({
              user: session.user,
              adminUser,
              loading: false,
              _checkingSession: false,
              _sessionCheckPromise: null,
            })
          } catch (error) {
            set({ error: getErrorMessage(error), loading: false, _checkingSession: false, _sessionCheckPromise: null })
          }
        })()

        set({ _sessionCheckPromise: checkPromise })
        return checkPromise
      },

      resetPassword: async (email: string) => {
        set({ loading: true, error: null })
        try {
          // Chamar backend para gerar token e enviar email customizado
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

          const response = await fetch(`${backendUrl}/api/auth/request-password-reset`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Erro ao solicitar redefinição de senha')
          }

          console.log('✅ Email de reset de senha enviado com sucesso')

          set({ loading: false })
          return true
        } catch (error) {
          console.error('❌ Erro ao solicitar reset de senha:', error)
          set({
            error: getErrorMessage(error),
            loading: false,
          })
          return false
        }
      },

      updatePassword: async (newPassword: string) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          })

          if (error) throw error

          set({ loading: false })
          return true
        } catch (error) {
          set({
            error: getErrorMessage(error),
            loading: false,
          })
          return false
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
