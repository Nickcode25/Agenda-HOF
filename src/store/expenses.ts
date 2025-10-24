import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { Expense, ExpenseCategory, DEFAULT_EXPENSE_CATEGORIES } from '@/types/cash'

interface ExpensesStore {
  categories: ExpenseCategory[]
  expenses: Expense[]
  loading: boolean
  error: string | null

  // Categories
  fetchCategories: () => Promise<void>
  addCategory: (category: Omit<ExpenseCategory, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | null>
  updateCategory: (id: string, updates: Partial<ExpenseCategory>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  initializeDefaultCategories: () => Promise<void>

  // Expenses
  fetchExpenses: () => Promise<void>
  addExpense: (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | null>
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  getExpense: (id: string) => Expense | undefined

  // Helpers
  getTotalExpenses: (startDate?: string, endDate?: string) => number
  getExpensesByCategory: () => Array<{ categoryName: string; total: number; count: number }>
}

export const useExpenses = create<ExpensesStore>()(
  persist(
    (set, get) => ({
      categories: [],
      expenses: [],
      loading: false,
      error: null,

      // ============================================
      // CATEGORIES
      // ============================================
      fetchCategories: async () => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('expense_categories')
            .select('*')
            .eq('user_id', user.id)
            .order('name')

          if (error) throw error

          const categories: ExpenseCategory[] = (data || []).map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            color: row.color,
            icon: row.icon,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }))

          set({ categories, loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      initializeDefaultCategories: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          // Verificar se já tem categorias
          const { data: existing } = await supabase
            .from('expense_categories')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

          if (existing && existing.length > 0) return

          // Inserir categorias padrão
          const categoriesToInsert = DEFAULT_EXPENSE_CATEGORIES.map(cat => ({
            user_id: user.id,
            name: cat.name,
            description: cat.description,
            color: cat.color,
            icon: cat.icon
          }))

          await supabase.from('expense_categories').insert(categoriesToInsert)
          await get().fetchCategories()
        } catch (error: any) {
          console.error('Erro ao inicializar categorias:', error)
        }
      },

      addCategory: async (categoryData) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('expense_categories')
            .insert({
              user_id: user.id,
              name: categoryData.name,
              description: categoryData.description || null,
              color: categoryData.color,
              icon: categoryData.icon,
              is_active: categoryData.isActive
            })
            .select()
            .single()

          if (error) throw error

          await get().fetchCategories()
          set({ loading: false })
          return data.id
        } catch (error: any) {
          set({ error: error.message, loading: false })
          return null
        }
      },

      updateCategory: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const updateData: any = { updated_at: new Date().toISOString() }
          if (updates.name !== undefined) updateData.name = updates.name
          if (updates.description !== undefined) updateData.description = updates.description
          if (updates.color !== undefined) updateData.color = updates.color
          if (updates.icon !== undefined) updateData.icon = updates.icon
          if (updates.isActive !== undefined) updateData.is_active = updates.isActive

          const { error } = await supabase
            .from('expense_categories')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchCategories()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      deleteCategory: async (id) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { error } = await supabase
            .from('expense_categories')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchCategories()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      // ============================================
      // EXPENSES
      // ============================================
      fetchExpenses: async () => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error

          const expenses: Expense[] = (data || []).map(row => ({
            id: row.id,
            userId: row.user_id,
            categoryId: row.category_id,
            categoryName: row.category_name,
            description: row.description,
            amount: parseFloat(row.amount),
            paymentMethod: row.payment_method,
            paymentStatus: row.payment_status,
            dueDate: row.due_date,
            paidAt: row.paid_at,
            isRecurring: row.is_recurring,
            recurringFrequency: row.recurring_frequency,
            recurringDay: row.recurring_day,
            recurringEndDate: row.recurring_end_date,
            parentExpenseId: row.parent_expense_id,
            attachments: row.attachments || [],
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }))

          set({ expenses, loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      addExpense: async (expenseData) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('expenses')
            .insert({
              user_id: user.id,
              category_id: expenseData.categoryId || null,
              category_name: expenseData.categoryName,
              description: expenseData.description,
              amount: expenseData.amount,
              payment_method: expenseData.paymentMethod,
              payment_status: expenseData.paymentStatus,
              due_date: expenseData.dueDate || null,
              paid_at: expenseData.paidAt || null,
              is_recurring: expenseData.isRecurring,
              recurring_frequency: expenseData.recurringFrequency || null,
              recurring_day: expenseData.recurringDay || null,
              recurring_end_date: expenseData.recurringEndDate || null,
              parent_expense_id: expenseData.parentExpenseId || null,
              attachments: expenseData.attachments || [],
              notes: expenseData.notes || null
            })
            .select()
            .single()

          if (error) throw error

          // Se a despesa foi paga, criar movimentação no caixa aberto
          if (expenseData.paymentStatus === 'paid') {
            try {
              // Buscar caixa aberto
              const { data: openSession } = await supabase
                .from('cash_sessions')
                .select('id')
                .eq('user_id', user.id)
                .eq('status', 'open')
                .order('opened_at', { ascending: false })
                .limit(1)
                .single()

              if (openSession) {
                // Criar movimentação no caixa
                await supabase
                  .from('cash_movements')
                  .insert({
                    user_id: user.id,
                    cash_session_id: openSession.id,
                    type: 'expense',
                    category: 'expense',
                    amount: expenseData.amount,
                    payment_method: expenseData.paymentMethod,
                    description: `${expenseData.categoryName} - ${expenseData.description}`,
                    reference_type: 'expense',
                    reference_id: data.id
                  })
              }
            } catch (cashError) {
              // Não falhar se não conseguir registrar no caixa
              console.error('Erro ao registrar no caixa:', cashError)
            }
          }

          await get().fetchExpenses()
          set({ loading: false })
          return data.id
        } catch (error: any) {
          set({ error: error.message, loading: false })
          return null
        }
      },

      updateExpense: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const updateData: any = { updated_at: new Date().toISOString() }
          if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId
          if (updates.categoryName !== undefined) updateData.category_name = updates.categoryName
          if (updates.description !== undefined) updateData.description = updates.description
          if (updates.amount !== undefined) updateData.amount = updates.amount
          if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod
          if (updates.paymentStatus !== undefined) updateData.payment_status = updates.paymentStatus
          if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate
          if (updates.paidAt !== undefined) updateData.paid_at = updates.paidAt
          if (updates.notes !== undefined) updateData.notes = updates.notes

          const { error } = await supabase
            .from('expenses')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchExpenses()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      deleteExpense: async (id) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchExpenses()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      getExpense: (id) => {
        return get().expenses.find(exp => exp.id === id)
      },

      // ============================================
      // HELPERS
      // ============================================
      getTotalExpenses: (startDate, endDate) => {
        const expenses = get().expenses.filter(exp => {
          if (exp.paymentStatus !== 'paid') return false
          if (!exp.paidAt) return false

          const paidDate = new Date(exp.paidAt)
          if (startDate && paidDate < new Date(startDate)) return false
          if (endDate && paidDate > new Date(endDate)) return false

          return true
        })

        return expenses.reduce((sum, exp) => sum + exp.amount, 0)
      },

      getExpensesByCategory: () => {
        const expenses = get().expenses.filter(exp => exp.paymentStatus === 'paid')
        const byCategory = new Map<string, { total: number; count: number }>()

        expenses.forEach(exp => {
          const existing = byCategory.get(exp.categoryName) || { total: 0, count: 0 }
          existing.total += exp.amount
          existing.count += 1
          byCategory.set(exp.categoryName, existing)
        })

        return Array.from(byCategory.entries()).map(([categoryName, data]) => ({
          categoryName,
          total: data.total,
          count: data.count
        }))
      }
    }),
    {
      name: 'expenses-storage',
      partialize: (state) => ({
        // Não persistir nada no localStorage
      })
    }
  )
)
