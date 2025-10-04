import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SubscriptionPlan, Subscription, SubscriptionPayment } from '../types/subscription'

type SubscriptionStore = {
  plans: SubscriptionPlan[]
  subscriptions: Subscription[]

  // Plans
  addPlan: (plan: Omit<SubscriptionPlan, 'id' | 'createdAt'>) => void
  updatePlan: (id: string, plan: Partial<SubscriptionPlan>) => void
  deletePlan: (id: string) => void
  getPlanById: (id: string) => SubscriptionPlan | undefined

  // Subscriptions
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void
  updateSubscription: (id: string, subscription: Partial<Subscription>) => void
  cancelSubscription: (id: string) => void
  removeSubscription: (id: string) => void

  // Payments
  addPayment: (subscriptionId: string, payment: Omit<SubscriptionPayment, 'id' | 'subscriptionId'>) => void
  confirmPayment: (subscriptionId: string, paymentId: string, paymentMethod: string) => void
  generateNextPayment: (subscriptionId: string) => void
  simulatePixPayment: (subscriptionId: string) => Promise<boolean>

  // Reports
  getMonthlyRecurringRevenue: () => number
  getReceivedRevenue: () => number
  getOverdueRevenue: () => number
  getActiveSubscriptionsCount: () => number
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      plans: [],
      subscriptions: [],

      // Plans
      addPlan: (plan) => {
        const newPlan: SubscriptionPlan = {
          ...plan,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ plans: [...state.plans, newPlan] }))
      },

      updatePlan: (id, planData) => {
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === id ? { ...plan, ...planData } : plan
          ),
        }))
      },

      deletePlan: (id) => {
        set((state) => ({
          plans: state.plans.filter((plan) => plan.id !== id),
        }))
      },

      getPlanById: (id) => {
        return get().plans.find((plan) => plan.id === id)
      },

      // Subscriptions
      addSubscription: (subscription) => {
        const newSubscription: Subscription = {
          ...subscription,
          id: crypto.randomUUID(),
        }
        set((state) => ({
          subscriptions: [...state.subscriptions, newSubscription],
        }))
      },

      updateSubscription: (id, subscriptionData) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, ...subscriptionData } : sub
          ),
        }))
      },

      cancelSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, status: 'cancelled' as const } : sub
          ),
        }))
      },

      removeSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
        }))
      },

      // Payments
      addPayment: (subscriptionId, payment) => {
        const newPayment: SubscriptionPayment = {
          ...payment,
          id: crypto.randomUUID(),
          subscriptionId,
        }

        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id === subscriptionId) {
              return {
                ...sub,
                payments: [...sub.payments, newPayment],
              }
            }
            return sub
          }),
        }))
      },

      confirmPayment: (subscriptionId, paymentId, paymentMethod) => {
        const now = new Date().toISOString()

        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => {
            if (sub.id === subscriptionId) {
              const updatedPayments = sub.payments.map((payment) =>
                payment.id === paymentId
                  ? { ...payment, status: 'paid' as const, paidAt: now, paymentMethod }
                  : payment
              )

              return {
                ...sub,
                payments: updatedPayments,
              }
            }
            return sub
          }),
        }))
      },

      generateNextPayment: (subscriptionId) => {
        const { subscriptions, addPayment } = get()
        const subscription = subscriptions.find(s => s.id === subscriptionId)

        if (!subscription) return

        // Verificar se já existe um pagamento pendente/overdue
        const hasPendingPayment = subscription.payments.some(
          p => p.status === 'pending' || p.status === 'overdue'
        )

        if (hasPendingPayment) return

        // Criar próximo pagamento com vencimento na data atual de nextBillingDate
        addPayment(subscriptionId, {
          amount: subscription.price,
          dueDate: subscription.nextBillingDate,
          status: 'pending',
        })

        // Calcular a próxima data de cobrança (adicionar 1 mês)
        const dateStr = subscription.nextBillingDate.split('T')[0]
        const [year, month, day] = dateStr.split('-').map(Number)
        const nextDate = new Date(year, month - 1, day)
        nextDate.setMonth(nextDate.getMonth() + 1)
        const nextBillingDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`

        // Atualizar próxima data de cobrança
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === subscriptionId
              ? { ...sub, nextBillingDate: nextBillingDateStr }
              : sub
          ),
        }))
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
              confirmPayment(subscriptionId, pendingPayment.id, 'PIX')
            }
          }
        }

        return success
      },

      // Reports
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
    }),
    {
      name: 'subscription-storage',
    }
  )
)
