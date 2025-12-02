import { create } from 'zustand'
import { supabase, getCachedUser } from '@/lib/supabase'

export interface Category {
  id: string
  user_id: string
  name: string
  type: 'procedure' | 'stock' | 'both'
  created_at: string
  updated_at: string
}

interface CategoriesState {
  categories: Category[]
  loading: boolean
  error: string | null

  fetchCategories: () => Promise<void>
  addCategory: (name: string, type: 'procedure' | 'stock' | 'both') => Promise<string | null>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  // Helper functions
  getProcedureCategories: () => Category[]
  getStockCategories: () => Category[]
}

export const useCategories = create<CategoriesState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null })
    try {
      const user = await getCachedUser()
      if (!user) {
        set({ loading: false })
        return
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error

      set({ categories: data || [], loading: false })
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error)
      set({ error: error.message, loading: false, categories: [] })
    }
  },

  addCategory: async (name: string, type: 'procedure' | 'stock' | 'both') => {
    set({ error: null })
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Verificar se já existe
      const existing = get().categories.find(
        c => c.name.toLowerCase() === name.toLowerCase()
      )
      if (existing) {
        throw new Error('Categoria já existe')
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name,
          type,
        })
        .select()
        .single()

      if (error) throw error

      set(state => ({
        categories: [...state.categories, data].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      }))

      return data.id
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error)
      set({ error: error.message })
      return null
    }
  },

  updateCategory: async (id: string, updates: Partial<Category>) => {
    set({ error: null })
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      set(state => ({
        categories: state.categories.map(cat =>
          cat.id === id ? { ...cat, ...updates } : cat
        )
      }))
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error)
      set({ error: error.message })
    }
  },

  deleteCategory: async (id: string) => {
    set({ error: null })
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        categories: state.categories.filter(cat => cat.id !== id)
      }))
    } catch (error: any) {
      console.error('Erro ao deletar categoria:', error)
      set({ error: error.message })
    }
  },

  getProcedureCategories: () => {
    return get().categories.filter(cat =>
      cat.type === 'procedure' || cat.type === 'both'
    )
  },

  getStockCategories: () => {
    return get().categories.filter(cat =>
      cat.type === 'stock' || cat.type === 'both'
    )
  }
}))
