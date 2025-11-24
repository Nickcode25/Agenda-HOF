import { create } from 'zustand'
import { SubscriptionPlan, Subscription, SubscriptionPayment } from '../types/subscription'
import { supabase } from '@/lib/supabase'
import { sendSubscriptionConfirmation } from '@/services/email/resend.service'
import { formatCurrency } from '@/utils/currency'

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
  addPayment: (subscriptionId: string, payment: Omit<SubscriptionPayment, 'id' | 'subscriptionId'>, skipFetch?: boolean) => Promise<void>
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

      // Buscar TODOS os pagamentos de UMA VEZ (muito mais rápido!)
      const subscriptionIds = (subsData || []).map(s => s.id)

      let allPaymentsData: any[] = []
      if (subscriptionIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('subscription_payments')
          .select('*')
          .in('subscription_id', subscriptionIds)
          .order('due_date', { ascending: false })

        if (paymentsError) throw paymentsError
        allPaymentsData = paymentsData || []
      }

      // Agrupar pagamentos por subscription_id para acesso rápido
      const paymentsBySubscription = new Map<string, SubscriptionPayment[]>()
      for (const p of allPaymentsData) {
        if (!paymentsBySubscription.has(p.subscription_id)) {
          paymentsBySubscription.set(p.subscription_id, [])
        }
        paymentsBySubscription.get(p.subscription_id)!.push({
          id: p.id,
          subscriptionId: p.subscription_id,
          amount: parseFloat(p.amount) || 0,
          dueDate: p.due_date,
          paidAt: p.paid_at,
          paymentMethod: p.payment_method,
          status: p.status
        })
      }

      // Montar as subscriptions com seus pagamentos
      const subscriptions: Subscription[] = (subsData || []).map(sub => ({
        id: sub.id,
        patientId: sub.patient_id,
        patientName: sub.patient_name,
        planId: sub.plan_id,
        planName: sub.plan_name,
        price: parseFloat(sub.price),
        startDate: sub.start_date,
        nextBillingDate: sub.next_billing_date,
        status: sub.status,
        payments: paymentsBySubscription.get(sub.id) || []
      }))

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

      if (!data?.id) {
        throw new Error('Falha ao criar assinatura: ID não retornado')
      }

      // Tentar enviar email de confirmação de assinatura (não bloqueia a operação se falhar)
      try {
        // Buscar informações do paciente para obter email
        const { data: patientData } = await supabase
          .from('patients')
          .select('email, name')
          .eq('id', subscriptionData.patientId)
          .single()

        if (patientData?.email) {
          const startDateFormatted = new Date(subscriptionData.startDate).toLocaleDateString('pt-BR')

          await sendSubscriptionConfirmation({
            to: patientData.email,
            userName: subscriptionData.patientName,
            planName: subscriptionData.planName,
            planPrice: formatCurrency(subscriptionData.price),
            startDate: startDateFormatted
          })

          console.log('Email de confirmação de assinatura enviado com sucesso')
        }
      } catch (emailError) {
        console.error('Erro ao enviar email de confirmação de assinatura:', emailError)
        // Não propaga o erro - assinatura foi criada com sucesso
      }

      return data.id
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
  addPayment: async (subscriptionId, paymentData, skipFetch = false) => {
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

      // Só faz fetch se não foi pedido para pular (útil para operações em lote)
      if (!skipFetch) {
        await get().fetchSubscriptions()
      }
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
      // Validar formato da data antes de fazer split
      const billingDate = subscription.nextBillingDate || ''
      const dateStr = billingDate.includes('T') ? billingDate.split('T')[0] : billingDate

      if (!dateStr || !dateStr.includes('-')) {
        console.error('Formato de data inválido:', subscription.nextBillingDate)
        return
      }

      const [year, month, day] = dateStr.split('-').map(Number)

      // Validar se os valores são números válidos
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        console.error('Data inválida:', dateStr)
        return
      }

      // Adicionar 1 mês mantendo o mesmo dia
      let nextMonth = month + 1
      let nextYear = year
      if (nextMonth > 12) {
        nextMonth = 1
        nextYear += 1
      }

      // Verificar se o dia é válido para o próximo mês
      // Ex: 31 de janeiro -> 28/29 de fevereiro
      const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate()
      const validDay = Math.min(day, daysInNextMonth)

      const nextBillingDateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`

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
      try {
        const { subscriptions, confirmPayment } = get()
        const subscription = subscriptions.find(s => s.id === subscriptionId)

        if (!subscription) {
          console.error('Assinatura não encontrada:', subscriptionId)
          return false
        }

        const pendingPayment = subscription.payments.find(
          p => p.status === 'pending' || p.status === 'overdue'
        )

        if (!pendingPayment) {
          console.warn('Nenhum pagamento pendente encontrado para:', subscriptionId)
          return false
        }

        await confirmPayment(subscriptionId, pendingPayment.id, 'PIX')
      } catch (error) {
        console.error('Erro ao confirmar pagamento PIX:', error)
        return false
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
