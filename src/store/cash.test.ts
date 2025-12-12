/**
 * Testes para o store de caixa
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCash } from './cash'

// Mock do supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
  },
  getCachedUser: vi.fn().mockResolvedValue({ id: 'test-user-id' }),
}))

// Mock do timezone
vi.mock('@/utils/timezone', () => ({
  createISOFromDateTimeBR: vi.fn(() => '2024-01-01T00:00:00Z'),
  getTodayInSaoPaulo: vi.fn(() => '2024-01-01'),
  getCurrentTimeInSaoPaulo: vi.fn(() => '12:00'),
}))

describe('useCash store - helpers', () => {
  beforeEach(() => {
    // Reset store state
    useCash.setState({
      registers: [],
      sessions: [],
      movements: [],
      currentSession: null,
      loading: false,
      error: null,
    })
  })

  describe('getRegister', () => {
    it('deve retornar undefined se nao houver registros', () => {
      const result = useCash.getState().getRegister('non-existent')
      expect(result).toBeUndefined()
    })

    it('deve encontrar registro por id', () => {
      useCash.setState({
        registers: [
          {
            id: 'reg-1',
            userId: 'user-1',
            name: 'Caixa 1',
            description: 'Descricao',
            isActive: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          {
            id: 'reg-2',
            userId: 'user-1',
            name: 'Caixa 2',
            description: null,
            isActive: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      })

      const result = useCash.getState().getRegister('reg-1')
      expect(result).toBeDefined()
      expect(result?.name).toBe('Caixa 1')
    })
  })

  describe('getSession', () => {
    it('deve retornar undefined se nao houver sessoes', () => {
      const result = useCash.getState().getSession('non-existent')
      expect(result).toBeUndefined()
    })

    it('deve encontrar sessao por id', () => {
      useCash.setState({
        sessions: [
          {
            id: 'sess-1',
            userId: 'user-1',
            cashRegisterId: 'reg-1',
            cashRegisterName: 'Caixa 1',
            openedAt: '2024-01-01T08:00:00Z',
            openingBalance: 100,
            status: 'open',
            createdAt: '2024-01-01',
          },
        ],
      })

      const result = useCash.getState().getSession('sess-1')
      expect(result).toBeDefined()
      expect(result?.openingBalance).toBe(100)
    })
  })

  describe('getMovement', () => {
    it('deve retornar undefined se nao houver movimentos', () => {
      const result = useCash.getState().getMovement('non-existent')
      expect(result).toBeUndefined()
    })

    it('deve encontrar movimento por id', () => {
      useCash.setState({
        movements: [
          {
            id: 'mov-1',
            userId: 'user-1',
            cashSessionId: 'sess-1',
            cashRegisterId: 'reg-1',
            type: 'income',
            category: 'procedure',
            amount: 150,
            paymentMethod: 'cash',
            description: 'Pagamento procedimento',
            createdAt: '2024-01-01',
          },
        ],
      })

      const result = useCash.getState().getMovement('mov-1')
      expect(result).toBeDefined()
      expect(result?.amount).toBe(150)
    })
  })

  describe('getSessionTotal', () => {
    it('deve retornar zeros se nao houver movimentos', () => {
      useCash.setState({
        sessions: [
          {
            id: 'sess-1',
            userId: 'user-1',
            cashRegisterId: 'reg-1',
            cashRegisterName: 'Caixa 1',
            openedAt: '2024-01-01T08:00:00Z',
            openingBalance: 100,
            status: 'open',
            createdAt: '2024-01-01',
          },
        ],
        movements: [],
      })

      const result = useCash.getState().getSessionTotal('sess-1')
      expect(result.income).toBe(0)
      expect(result.expense).toBe(0)
      expect(result.withdrawals).toBe(0)
      expect(result.deposits).toBe(0)
      expect(result.balance).toBe(100) // Saldo abertura
    })

    it('deve calcular totais corretamente', () => {
      useCash.setState({
        sessions: [
          {
            id: 'sess-1',
            userId: 'user-1',
            cashRegisterId: 'reg-1',
            cashRegisterName: 'Caixa 1',
            openedAt: '2024-01-01T08:00:00Z',
            openingBalance: 100,
            status: 'open',
            createdAt: '2024-01-01',
          },
        ],
        movements: [
          {
            id: 'mov-1',
            userId: 'user-1',
            cashSessionId: 'sess-1',
            cashRegisterId: 'reg-1',
            type: 'income',
            category: 'procedure',
            amount: 200,
            paymentMethod: 'cash',
            description: 'Receita',
            createdAt: '2024-01-01',
          },
          {
            id: 'mov-2',
            userId: 'user-1',
            cashSessionId: 'sess-1',
            cashRegisterId: 'reg-1',
            type: 'expense',
            category: 'expense',
            amount: 50,
            paymentMethod: 'cash',
            description: 'Despesa',
            createdAt: '2024-01-01',
          },
          {
            id: 'mov-3',
            userId: 'user-1',
            cashSessionId: 'sess-1',
            cashRegisterId: 'reg-1',
            type: 'withdrawal',
            category: 'other',
            amount: 30,
            paymentMethod: 'cash',
            description: 'Sangria',
            createdAt: '2024-01-01',
          },
          {
            id: 'mov-4',
            userId: 'user-1',
            cashSessionId: 'sess-1',
            cashRegisterId: 'reg-1',
            type: 'deposit',
            category: 'other',
            amount: 20,
            paymentMethod: 'cash',
            description: 'Reforco',
            createdAt: '2024-01-01',
          },
        ],
      })

      const result = useCash.getState().getSessionTotal('sess-1')
      expect(result.income).toBe(200)
      expect(result.expense).toBe(50)
      expect(result.withdrawals).toBe(30)
      expect(result.deposits).toBe(20)
      // balance = 100 (abertura) + 200 (income) - 50 (expense) - 30 (withdrawal) + 20 (deposit) = 240
      expect(result.balance).toBe(240)
    })

    it('deve ignorar movimentos de outras sessoes', () => {
      useCash.setState({
        sessions: [
          {
            id: 'sess-1',
            userId: 'user-1',
            cashRegisterId: 'reg-1',
            cashRegisterName: 'Caixa 1',
            openedAt: '2024-01-01T08:00:00Z',
            openingBalance: 100,
            status: 'open',
            createdAt: '2024-01-01',
          },
        ],
        movements: [
          {
            id: 'mov-1',
            userId: 'user-1',
            cashSessionId: 'sess-1',
            cashRegisterId: 'reg-1',
            type: 'income',
            category: 'procedure',
            amount: 100,
            paymentMethod: 'cash',
            description: 'Receita sess-1',
            createdAt: '2024-01-01',
          },
          {
            id: 'mov-2',
            userId: 'user-1',
            cashSessionId: 'sess-2', // Outra sessao
            cashRegisterId: 'reg-1',
            type: 'income',
            category: 'procedure',
            amount: 500,
            paymentMethod: 'cash',
            description: 'Receita sess-2',
            createdAt: '2024-01-01',
          },
        ],
      })

      const result = useCash.getState().getSessionTotal('sess-1')
      expect(result.income).toBe(100) // Apenas mov-1
    })
  })

  describe('getExpectedBalance', () => {
    it('deve retornar o saldo esperado', () => {
      useCash.setState({
        sessions: [
          {
            id: 'sess-1',
            userId: 'user-1',
            cashRegisterId: 'reg-1',
            cashRegisterName: 'Caixa 1',
            openedAt: '2024-01-01T08:00:00Z',
            openingBalance: 500,
            status: 'open',
            createdAt: '2024-01-01',
          },
        ],
        movements: [
          {
            id: 'mov-1',
            userId: 'user-1',
            cashSessionId: 'sess-1',
            cashRegisterId: 'reg-1',
            type: 'income',
            category: 'procedure',
            amount: 300,
            paymentMethod: 'cash',
            description: 'Receita',
            createdAt: '2024-01-01',
          },
        ],
      })

      const result = useCash.getState().getExpectedBalance('sess-1')
      expect(result).toBe(800) // 500 + 300
    })
  })

  describe('getMovementsByType', () => {
    it('deve filtrar movimentos por tipo', () => {
      useCash.setState({
        movements: [
          {
            id: 'mov-1',
            userId: 'user-1',
            cashSessionId: 'sess-1',
            cashRegisterId: 'reg-1',
            type: 'income',
            category: 'procedure',
            amount: 100,
            paymentMethod: 'cash',
            description: 'Receita 1',
            createdAt: '2024-01-01',
          },
          {
            id: 'mov-2',
            userId: 'user-1',
            cashSessionId: 'sess-1',
            cashRegisterId: 'reg-1',
            type: 'income',
            category: 'sale',
            amount: 50,
            paymentMethod: 'card',
            description: 'Receita 2',
            createdAt: '2024-01-01',
          },
          {
            id: 'mov-3',
            userId: 'user-1',
            cashSessionId: 'sess-1',
            cashRegisterId: 'reg-1',
            type: 'expense',
            category: 'expense',
            amount: 30,
            paymentMethod: 'cash',
            description: 'Despesa',
            createdAt: '2024-01-01',
          },
        ],
      })

      const incomes = useCash.getState().getMovementsByType('sess-1', 'income')
      expect(incomes).toHaveLength(2)

      const expenses = useCash.getState().getMovementsByType('sess-1', 'expense')
      expect(expenses).toHaveLength(1)

      const withdrawals = useCash.getState().getMovementsByType('sess-1', 'withdrawal')
      expect(withdrawals).toHaveLength(0)
    })
  })
})

describe('useCash store - state', () => {
  it('deve ter estado inicial correto', () => {
    const state = useCash.getState()
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('deve atualizar loading', () => {
    useCash.setState({ loading: true })
    expect(useCash.getState().loading).toBe(true)
  })

  it('deve atualizar error', () => {
    useCash.setState({ error: 'Erro de teste' })
    expect(useCash.getState().error).toBe('Erro de teste')
  })
})
