import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { CashRegister, CashSession, CashMovement } from '@/types/cash'

interface CashStore {
  registers: CashRegister[]
  sessions: CashSession[]
  movements: CashMovement[]
  currentSession: CashSession | null
  loading: boolean
  error: string | null

  // Registers
  fetchRegisters: () => Promise<void>
  addRegister: (register: Omit<CashRegister, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | null>
  updateRegister: (id: string, updates: Partial<CashRegister>) => Promise<void>
  deleteRegister: (id: string) => Promise<void>
  getRegister: (id: string) => CashRegister | undefined

  // Sessions
  fetchSessions: (registerId?: string) => Promise<void>
  getCurrentSession: (registerId: string) => Promise<CashSession | null>
  openSession: (registerId: string, openingBalance: number) => Promise<string | null>
  closeSession: (sessionId: string, closingBalance: number) => Promise<void>
  getSession: (id: string) => CashSession | undefined

  // Movements
  fetchMovements: (sessionId?: string) => Promise<void>
  addMovement: (movement: Omit<CashMovement, 'id' | 'userId' | 'createdAt'>) => Promise<string | null>
  updateMovement: (id: string, updates: Partial<CashMovement>) => Promise<void>
  deleteMovement: (id: string) => Promise<void>
  getMovement: (id: string) => CashMovement | undefined

  // Helpers
  getSessionTotal: (sessionId: string) => { income: number; expense: number; withdrawals: number; deposits: number; balance: number }
  getExpectedBalance: (sessionId: string) => number
  getMovementsByType: (sessionId: string, type: CashMovement['type']) => CashMovement[]
}

export const useCash = create<CashStore>()(
  persist(
    (set, get) => ({
      registers: [],
      sessions: [],
      movements: [],
      currentSession: null,
      loading: false,
      error: null,

      // ============================================
      // REGISTERS
      // ============================================
      fetchRegisters: async () => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('cash_registers')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error

          const registers: CashRegister[] = (data || []).map(row => ({
            id: row.id,
            userId: row.user_id,
            name: row.name,
            description: row.description,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }))

          set({ registers, loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      addRegister: async (registerData) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { data, error } = await supabase
            .from('cash_registers')
            .insert({
              user_id: user.id,
              name: registerData.name,
              description: registerData.description || null,
              is_active: registerData.isActive ?? true
            })
            .select()
            .single()

          if (error) throw error

          await get().fetchRegisters()
          set({ loading: false })
          return data.id
        } catch (error: any) {
          set({ error: error.message, loading: false })
          return null
        }
      },

      updateRegister: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const updateData: any = { updated_at: new Date().toISOString() }
          if (updates.name !== undefined) updateData.name = updates.name
          if (updates.description !== undefined) updateData.description = updates.description
          if (updates.isActive !== undefined) updateData.is_active = updates.isActive

          const { error } = await supabase
            .from('cash_registers')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchRegisters()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      deleteRegister: async (id) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const { error } = await supabase
            .from('cash_registers')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchRegisters()
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      getRegister: (id) => {
        return get().registers.find(reg => reg.id === id)
      },

      // ============================================
      // SESSIONS
      // ============================================
      fetchSessions: async (registerId) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          let query = supabase
            .from('cash_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('opened_at', { ascending: false })

          if (registerId) {
            query = query.eq('cash_register_id', registerId)
          }

          const { data, error } = await query

          if (error) throw error

          const sessions: CashSession[] = (data || []).map(row => ({
            id: row.id,
            userId: row.user_id,
            cashRegisterId: row.cash_register_id,
            cashRegisterName: row.cash_register_name,
            openedAt: row.opened_at,
            openingBalance: parseFloat(row.opening_balance),
            closedAt: row.closed_at,
            closingBalance: row.closing_balance ? parseFloat(row.closing_balance) : undefined,
            expectedBalance: row.expected_balance ? parseFloat(row.expected_balance) : undefined,
            difference: row.difference ? parseFloat(row.difference) : undefined,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }))

          set({ sessions, loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      getCurrentSession: async (registerId) => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return null

          const { data, error } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('cash_register_id', registerId)
            .eq('status', 'open')
            .order('opened_at', { ascending: false })
            .limit(1)
            .single()

          if (error) {
            if (error.code === 'PGRST116') return null // No rows found
            throw error
          }

          const session: CashSession = {
            id: data.id,
            userId: data.user_id,
            cashRegisterId: data.cash_register_id,
            cashRegisterName: data.cash_register_name,
            openedAt: data.opened_at,
            openingBalance: parseFloat(data.opening_balance),
            closedAt: data.closed_at,
            closingBalance: data.closing_balance ? parseFloat(data.closing_balance) : undefined,
            expectedBalance: data.expected_balance ? parseFloat(data.expected_balance) : undefined,
            difference: data.difference ? parseFloat(data.difference) : undefined,
            status: data.status,
            notes: data.notes,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          }

          set({ currentSession: session })
          return session
        } catch (error: any) {
          console.error('Erro ao buscar sessão atual:', error)
          return null
        }
      },

      openSession: async (registerId, openingBalance) => {
        set({ loading: true, error: null })
        try {
          console.log('[CASH] openSession iniciado', { registerId, openingBalance })

          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')
          console.log('[CASH] Usuário autenticado:', user.id)

          // Verificar se já existe sessão aberta
          const existingSession = await get().getCurrentSession(registerId)
          if (existingSession) {
            throw new Error('Já existe uma sessão aberta para este caixa')
          }
          console.log('[CASH] Nenhuma sessão aberta encontrada')

          // Buscar nome do caixa
          const register = get().registers.find(r => r.id === registerId)
          if (!register) throw new Error('Caixa não encontrado')
          console.log('[CASH] Caixa encontrado:', register.name)

          // Buscar dados do usuário para opened_by
          const { data: userData } = await supabase.auth.getUser()
          const userName = userData.user?.user_metadata?.name || userData.user?.email || 'Usuário'

          console.log('[CASH] Inserindo sessão no banco...', {
            user_id: user.id,
            cash_register_id: registerId,
            cash_register_name: register.name,
            opening_balance: openingBalance,
            opened_by_user_id: user.id,
            opened_by_name: userName
          })

          const { data, error } = await supabase
            .from('cash_sessions')
            .insert({
              user_id: user.id,
              cash_register_id: registerId,
              cash_register_name: register.name,
              opening_balance: openingBalance,
              opened_by_user_id: user.id,
              opened_by_name: userName,
              status: 'open'
            })
            .select()
            .single()

          if (error) {
            console.error('[CASH] Erro do Supabase:', error)
            throw error
          }

          console.log('[CASH] Sessão criada com sucesso:', data.id)

          await get().fetchSessions(registerId)
          await get().getCurrentSession(registerId)
          set({ loading: false })
          return data.id
        } catch (error: any) {
          console.error('[CASH] Erro ao abrir sessão:', error)
          set({ error: error.message, loading: false })
          throw error // Lançar o erro ao invés de retornar null
        }
      },

      closeSession: async (sessionId, closingBalance) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const session = get().getSession(sessionId)
          if (!session) throw new Error('Sessão não encontrada')

          console.log('[CASH] Fechando sessão:', sessionId)
          console.log('[CASH] Sessão antes de fechar:', session)

          const expectedBalance = get().getExpectedBalance(sessionId)
          const difference = closingBalance - expectedBalance

          console.log('[CASH] Saldo esperado:', expectedBalance, 'Saldo final:', closingBalance, 'Diferença:', difference)

          const updateData = {
            closed_at: new Date().toISOString(),
            closing_balance: closingBalance,
            expected_balance: expectedBalance,
            difference: difference,
            status: 'closed',
            updated_at: new Date().toISOString()
          }

          console.log('[CASH] Dados para atualizar:', updateData)

          const { data, error } = await supabase
            .from('cash_sessions')
            .update(updateData)
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .select()

          if (error) {
            console.error('[CASH] Erro ao fechar sessão no banco:', error)
            throw error
          }

          console.log('[CASH] Resposta do update:', data)

          if (!data || data.length === 0) {
            throw new Error('Nenhuma sessão foi atualizada. Verifique se a sessão pertence ao usuário.')
          }

          console.log('[CASH] Sessão fechada no banco, atualizando store...')

          // Recarregar todas as sessões
          await get().fetchSessions()

          console.log('[CASH] Sessões após fechar:', get().sessions.length)
          const updatedSession = get().sessions.find(s => s.id === sessionId)
          console.log('[CASH] Sessão atualizada:', updatedSession)

          set({ currentSession: null, loading: false })
        } catch (error: any) {
          console.error('[CASH] Erro ao fechar sessão:', error)
          set({ error: error.message, loading: false })
          throw error
        }
      },

      getSession: (id) => {
        return get().sessions.find(sess => sess.id === id)
      },

      // ============================================
      // MOVEMENTS
      // ============================================
      fetchMovements: async (sessionId) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          let query = supabase
            .from('cash_movements')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (sessionId) {
            query = query.eq('cash_session_id', sessionId)
          }

          const { data, error } = await query

          if (error) throw error

          const movements: CashMovement[] = (data || []).map(row => ({
            id: row.id,
            userId: row.user_id,
            cashSessionId: row.cash_session_id,
            cashRegisterId: row.cash_register_id,
            type: row.type,
            category: row.category,
            amount: parseFloat(row.amount),
            paymentMethod: row.payment_method,
            referenceId: row.reference_id,
            description: row.description,
            createdAt: row.created_at
          }))

          set({ movements, loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      addMovement: async (movementData) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          // Buscar a sessão para obter o cash_register_id
          const session = get().sessions.find(s => s.id === movementData.cashSessionId)
          if (!session) {
            // Se não estiver no cache, buscar do banco
            const { data: sessionData } = await supabase
              .from('cash_sessions')
              .select('cash_register_id')
              .eq('id', movementData.cashSessionId)
              .single()

            if (!sessionData) throw new Error('Sessão de caixa não encontrada')

            const { data, error } = await supabase
              .from('cash_movements')
              .insert({
                user_id: user.id,
                cash_session_id: movementData.cashSessionId,
                cash_register_id: sessionData.cash_register_id,
                type: movementData.type,
                category: movementData.category,
                amount: movementData.amount,
                payment_method: movementData.paymentMethod,
                reference_id: movementData.referenceId || null,
                description: movementData.description
              })
              .select()
              .single()

            if (error) throw error

            await get().fetchMovements(movementData.cashSessionId)
            set({ loading: false })
            return data.id
          }

          const { data, error } = await supabase
            .from('cash_movements')
            .insert({
              user_id: user.id,
              cash_session_id: movementData.cashSessionId,
              cash_register_id: session.cashRegisterId,
              type: movementData.type,
              category: movementData.category,
              amount: movementData.amount,
              payment_method: movementData.paymentMethod,
              reference_id: movementData.referenceId || null,
              description: movementData.description
            })
            .select()
            .single()

          if (error) throw error

          await get().fetchMovements(movementData.cashSessionId)
          set({ loading: false })
          return data.id
        } catch (error: any) {
          set({ error: error.message, loading: false })
          return null
        }
      },

      updateMovement: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const movement = get().getMovement(id)
          if (!movement) throw new Error('Movimento não encontrado')

          // Mapear campos TypeScript para campos do banco
          const updateData: any = {}
          if (updates.amount !== undefined) updateData.amount = updates.amount
          if (updates.description !== undefined) updateData.description = updates.description
          if (updates.type !== undefined) updateData.type = updates.type
          if (updates.category !== undefined) updateData.category = updates.category
          if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod

          const { error } = await supabase
            .from('cash_movements')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchMovements(movement.cashSessionId)
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      deleteMovement: async (id) => {
        set({ loading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Usuário não autenticado')

          const movement = get().getMovement(id)
          if (!movement) throw new Error('Movimento não encontrado')

          const { error } = await supabase
            .from('cash_movements')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

          if (error) throw error

          await get().fetchMovements(movement.cashSessionId)
          set({ loading: false })
        } catch (error: any) {
          set({ error: error.message, loading: false })
        }
      },

      getMovement: (id) => {
        return get().movements.find(mov => mov.id === id)
      },

      // ============================================
      // HELPERS
      // ============================================
      getSessionTotal: (sessionId) => {
        const movements = get().movements.filter(m => m.cashSessionId === sessionId)

        const income = movements
          .filter(m => m.type === 'income')
          .reduce((sum, m) => sum + m.amount, 0)

        const expense = movements
          .filter(m => m.type === 'expense')
          .reduce((sum, m) => sum + m.amount, 0)

        const withdrawals = movements
          .filter(m => m.type === 'withdrawal')
          .reduce((sum, m) => sum + m.amount, 0)

        const deposits = movements
          .filter(m => m.type === 'deposit')
          .reduce((sum, m) => sum + m.amount, 0)

        const session = get().getSession(sessionId)
        const openingBalance = session?.openingBalance || 0

        const balance = openingBalance + income - expense - withdrawals + deposits

        return { income, expense, withdrawals, deposits, balance }
      },

      getExpectedBalance: (sessionId) => {
        const totals = get().getSessionTotal(sessionId)
        return totals.balance
      },

      getMovementsByType: (sessionId, type) => {
        return get().movements.filter(m =>
          m.cashSessionId === sessionId && m.type === type
        )
      }
    }),
    {
      name: 'cash-storage',
      partialize: (state) => ({
        // Não persistir nada no localStorage
      })
    }
  )
)

// ============================================
// HELPER FUNCTION - Auto Register Movement
// ============================================
export const autoRegisterCashMovement = async (params: {
  type: 'income' | 'expense'
  category: 'procedure' | 'sale' | 'subscription' | 'expense' | 'other'
  amount: number
  paymentMethod: 'cash' | 'card' | 'pix' | 'transfer' | 'check'
  referenceId?: string
  description: string
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Buscar todas as sessões abertas (pode ter vários caixas abertos)
    const { data: openSessions } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open')

    if (!openSessions || openSessions.length === 0) {
      console.log('[CASH] Nenhum caixa aberto - movimentação não registrada')
      return // Não há caixa aberto, não registra
    }

    // Registrar a movimentação em todos os caixas abertos
    // (Normalmente será apenas 1, mas pode ter múltiplos pontos de venda)
    for (const session of openSessions) {
      await supabase
        .from('cash_movements')
        .insert({
          user_id: user.id,
          cash_session_id: session.id,
          cash_register_id: session.cash_register_id,
          type: params.type,
          category: params.category,
          amount: params.amount,
          payment_method: params.paymentMethod,
          reference_id: params.referenceId || null,
          description: params.description
        })

      console.log('[CASH] Movimentação registrada automaticamente:', {
        session: session.cash_register_name,
        type: params.type,
        amount: params.amount,
        description: params.description
      })
    }
  } catch (error) {
    console.error('[CASH] Erro ao registrar movimentação automática:', error)
    // Não lançar erro para não quebrar o fluxo principal
  }
}

// ============================================
// HELPER FUNCTION - Remove Movement by Reference
// ============================================
export const removeCashMovementByReference = async (referenceId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Buscar movimentações com este referenceId
    const { data: movements } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('user_id', user.id)
      .eq('reference_id', referenceId)

    if (!movements || movements.length === 0) {
      console.log('[CASH] Nenhuma movimentação encontrada com referenceId:', referenceId)
      return
    }

    // Remover todas as movimentações encontradas
    const { error } = await supabase
      .from('cash_movements')
      .delete()
      .eq('user_id', user.id)
      .eq('reference_id', referenceId)

    if (error) throw error

    console.log('[CASH] Movimentações removidas:', {
      referenceId,
      count: movements.length
    })
  } catch (error) {
    console.error('[CASH] Erro ao remover movimentações:', error)
    // Não lançar erro para não quebrar o fluxo principal
  }
}
