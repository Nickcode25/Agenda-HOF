import { create } from 'zustand'
import { SubscriptionPlan, Subscription, SubscriptionPayment } from '../types/subscription'
import { autoRegisterCashMovement, removeCashMovementByReference } from './cash'
import { supabase } from '@/lib/supabase'

type SubscriptionStore = {
  plans: SubscriptionPlan[]
  subscriptions: Subscription[]
  loading: boolean
  error: string | null

  // Data loading
  fetchPlans: () => Promise<void>
  fetchSubscriptions: () => Promise<void>

  // Plans
  addPlan: (plan: Omit<SubscriptionPlan, 'id' | 'createdAt'>) => Promise<void>
  updatePlan: (id: string, plan: Partial<SubscriptionPlan>) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  getPlanById: (id: string) => SubscriptionPlan | undefined

  // Subscriptions
  addSubscription: (subscription: Omit<Subscription, 'id'>) => Promise<string>
  updateSubscription: (id: string, subscription: Partial<Subscription>) => Promise<void>
  cancelSubscription: (id: string) => Promise<void>
  removeSubscription: (id: string) => Promise<void>

  // Payments
  addPayment: (subscriptionId: string, payment: Omit<SubscriptionPayment, 'id' | 'subscriptionId'>) => Promise<void>
  confirmPayment: (subscriptionId: string, paymentId: string, paymentMethod: string) => Promise<void>
  generateNextPayment: (subscriptionId: string) => Promise<void>
  simulatePixPayment: (subscriptionId: string) => Promise<boolean>

  // Reports
  getMonthlyRecurringRevenue: () => number
  getReceivedRevenue: () => number
  getOverdueRevenue: () => number
  getActiveSubscriptionsCount: () => number
}

export const useSubscriptionStore = create<SubscriptionStore>()((set, get) => ({
  plans: [],
  subscriptions: [],
  loading: false,
  error: null,

  // ============================================
  // DATA LOADING
  // ============================================
  fetchPlans: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('user_monthly_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const plans: SubscriptionPlan[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        price: parseFloat(row.price),
        sessionsPerYear: row.sessions_per_year,
        benefits: row.benefits || [],
        active: row.active,
        createdAt: row.created_at
      }))

      set({ plans, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Erro ao carregar planos:', error)
    }
  },

  fetchSubscriptions: async () => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Buscar assinaturas
      const { data: subsData, error: subsError } = await supabase
        .from('patient_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (subsError) throw subsError

      // Buscar pagamentos de cada assinatura
      const subscriptions: Subscription[] = []

      for (const sub of subsData || []) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('subscription_payments')
          .select('*')
          .eq('subscription_id', sub.id)
          .order('due_date', { ascending: false })

        if (paymentsError) throw paymentsError

        const payments: SubscriptionPayment[] = (paymentsData || []).map(p => ({
          id: p.id,
          subscriptionId: p.subscription_id,
          amount: parseFloat(p.amount) || 0,
          dueDate: p.due_date,
          paidAt: p.paid_at,
          paymentMethod: p.payment_method,
          status: p.status
        }))

        subscriptions.push({
          id: sub.id,
          patientId: sub.patient_id,
          patientName: sub.patient_name,
          planId: sub.plan_id,
          planName: sub.plan_name,
          price: parseFloat(sub.price),
          startDate: sub.start_date,
          nextBillingDate: sub.next_billing_date,
          status: sub.status,
          payments
        })
      }

      set({ subscriptions, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Erro ao carregar assinaturas:', error)
    }
  },

  // ============================================
  // PLANS
  // ============================================
  addPlan: async (planData) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('user_monthly_plans')
        .insert({
          user_id: user.id,
          name: planData.name,
          description: planData.description || null,
          price: planData.price,
          sessions_per_year: planData.sessionsPerYear,
          benefits: planData.benefits || [],
          active: planData.active
        })

      if (error) throw error

      await get().fetchPlans()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Erro ao adicionar plano:', error)
      throw error
    }
  },

  updatePlan: async (id, planData) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const updateData: any = {}
      if (planData.name !== undefined) updateData.name = planData.name
      if (planData.description !== undefined) updateData.description = planData.description
      if (planData.price !== undefined) updateData.price = planData.price
      if (planData.sessionsPerYear !== undefined) updateData.sessions_per_year = planData.sessionsPerYear
      if (planData.benefits !== undefined) updateData.benefits = planData.benefits
      if (planData.active !== undefined) updateData.active = planData.active

      const { error } = await supabase
        .from('user_monthly_plans')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchPlans()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Erro ao atualizar plano:', error)
      throw error
    }
  },

  deletePlan: async (id) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('user_monthly_plans')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchPlans()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Erro ao deletar plano:', error)
      throw error
    }
  },

  getPlanById: (id) => {
    return get().plans.find((plan) => plan.id === id)
  },

  // ============================================
  // SUBSCRIPTIONS
  // ============================================
  addSubscription: async (subscriptionData) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('patient_subscriptions')
        .insert({
          user_id: user.id,
          patient_id: subscriptionData.patientId,
          patient_name: subscriptionData.patientName,
          plan_id: subscriptionData.planId,
          plan_name: subscriptionData.planName,
          price: subscriptionData.price,
          start_date: subscriptionData.startDate,
          next_billing_date: subscriptionData.nextBillingDate,
          status: subscriptionData.status
        })
        .select()
        .single()

      if (error) throw error

      await get().fetchSubscriptions()
      set({ loading: false })

      return data?.id
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Erro ao adicionar assinatura:', error)
      throw error
    }
  },

  updateSubscription: async (id, subscriptionData) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const updateData: any = {}
      if (subscriptionData.status !== undefined) updateData.status = subscriptionData.status
      if (subscriptionData.nextBillingDate !== undefined) updateData.next_billing_date = subscriptionData.nextBillingDate
      if (subscriptionData.price !== undefined) updateData.price = subscriptionData.price

      const { error } = await supabase
        .from('patient_subscriptions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchSubscriptions()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Erro ao atualizar assinatura:', error)
      throw error
    }
  },

  cancelSubscription: async (id) => {
    await get().updateSubscription(id, { status: 'cancelled' })
  },

  removeSubscription: async (id) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Buscar pagamentos antes de remover
      const subscription = get().subscriptions.find(sub => sub.id === id)
      if (subscription) {
        for (const payment of subscription.payments) {
          await removeCashMovementByReference(payment.id)
        }
      }

      const { error } = await supabase
        .from('patient_subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await get().fetchSubscriptions()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Erro ao remover assinatura:', error)
      throw error
    }
  },

  // ============================================
  // PAYMENTS
  // ============================================
  addPayment: async (subscriptionId, paymentData) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const insertData: any = {
        subscription_id: subscriptionId,
        amount: paymentData.amount,
        due_date: paymentData.dueDate,
        status: paymentData.status || 'pending'
      }

      // Adicionar campos opcionais se fornecidos
      if (paymentData.paidAt) insertData.paid_at = paymentData.paidAt
      if (paymentData.paymentMethod) insertData.payment_method = paymentData.paymentMethod

      const { error } = await supabase
        .from('subscription_payments')
        .insert(insertData)

      if (error) throw error

      await get().fetchSubscriptions()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Erro ao adicionar pagamento:', error)
      throw error
    }
  },

  confirmPayment: async (subscriptionId, paymentId, paymentMethod) => {
    set({ loading: true, error: null })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const now = new Date().toISOString()
      const subscription = get().subscriptions.find(s => s.id === subscriptionId)
      const payment = subscription?.payments.find(p => p.id === paymentId)

      const { error } = await supabase
        .from('subscription_payments')
        .update({
          status: 'paid',
          paid_at: now,
          payment_method: paymentMethod
        })
        .eq('id', paymentId)

      if (error) throw error

      // Registrar movimentação no caixa
      if (subscription && payment) {
        await autoRegisterCashMovement({
          type: 'income',
          category: 'subscription',
          amount: payment.amount,
          paymentMethod: paymentMethod.toLowerCase() as 'cash' | 'card' | 'pix' | 'transfer' | 'check',
          referenceId: paymentId,
          description: `Mensalidade - ${subscription.patientName} - ${subscription.planName}`
        })
      }

      await get().fetchSubscriptions()
      set({ loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
      console.error('Erro ao confirmar pagamento:', error)
      throw error
    }
  },

  generateNextPayment: async (subscriptionId) => {
    try {
      const { subscriptions, addPayment, updateSubscription } = get()
      const subscription = subscriptions.find(s => s.id === subscriptionId)

      if (!subscription) return

      // Verificar se já existe um pagamento pendente/overdue
      const hasPendingPayment = subscription.payments.some(
        p => p.status === 'pending' || p.status === 'overdue'
      )

      if (hasPendingPayment) return

      // Criar próximo pagamento
      await addPayment(subscriptionId, {
        amount: subscription.price,
        dueDate: subscription.nextBillingDate,
        status: 'pending',
      })

      // Calcular próxima data de cobrança (mesmo dia do mês seguinte)
      const dateStr = subscription.nextBillingDate.split('T')[0]
      const [year, month, day] = dateStr.split('-').map(Number)

      // Adicionar 1 mês mantendo o mesmo dia
      let nextMonth = month + 1
      let nextYear = year
      if (nextMonth > 12) {
        nextMonth = 1
        nextYear += 1
      }

      const nextBillingDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      // Atualizar próxima data de cobrança
      await updateSubscription(subscriptionId, {
        nextBillingDate: nextBillingDateStr
      })
    } catch (error: any) {
      console.error('Erro ao gerar próximo pagamento:', error)
      throw error
    }
  },

  simulatePixPayment: async (subscriptionId) => {
    // Simular delay de API (500ms - 2s)
    const delay = Math.random() * 1500 + 500
    await new Promise(resolve => setTimeout(resolve, delay))

    // Simular 95% de sucesso
    const success = Math.random() > 0.05

    if (success) {
      const { subscriptions, confirmPayment } = get()
      const subscription = subscriptions.find(s => s.id === subscriptionId)

      if (subscription) {
        const pendingPayment = subscription.payments.find(
          p => p.status === 'pending' || p.status === 'overdue'
        )

        if (pendingPayment) {
          await confirmPayment(subscriptionId, pendingPayment.id, 'PIX')
        }
      }
    }

    return success
  },

  // ============================================
  // REPORTS
  // ============================================
  getMonthlyRecurringRevenue: () => {
    const { subscriptions } = get()
    return subscriptions
      .filter((sub) => sub.status === 'active')
      .reduce((total, sub) => total + sub.price, 0)
  },

  getReceivedRevenue: () => {
    const { subscriptions } = get()
    return subscriptions.reduce((total, sub) => {
      const paidPayments = sub.payments.filter((p) => p.status === 'paid')
      return total + paidPayments.reduce((sum, p) => sum + p.amount, 0)
    }, 0)
  },

  getOverdueRevenue: () => {
    const { subscriptions } = get()
    return subscriptions.reduce((total, sub) => {
      const overduePayments = sub.payments.filter((p) => p.status === 'overdue')
      return total + overduePayments.reduce((sum, p) => sum + p.amount, 0)
    }, 0)
  },

  getActiveSubscriptionsCount: () => {
    const { subscriptions } = get()
    return subscriptions.filter((sub) => sub.status === 'active').length
  },
}))
