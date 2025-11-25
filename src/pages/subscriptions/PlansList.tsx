import { Plus, Edit, Trash2, Check, X, CreditCard, Users, DollarSign, Calendar, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSubscriptionStore } from '../../store/subscriptions'
import { useConfirm } from '@/hooks/useConfirm'
import { formatCurrency } from '@/utils/currency'

export default function PlansList() {
  const { plans, subscriptions, deletePlan, updatePlan } = useSubscriptionStore()
  const { confirm, ConfirmDialog } = useConfirm()

  const handleToggleActive = (planId: string, currentStatus: boolean) => {
    updatePlan(planId, { active: !currentStatus })
  }

  const handleDelete = async (planId: string, planName: string) => {
    const confirmed = await confirm({
      title: 'Excluir Plano',
      message: `Tem certeza que deseja excluir o plano "${planName}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    })
    if (confirmed) {
      deletePlan(planId)
    }
  }

  // Calcular estatísticas gerais
  const activePlans = plans.filter(p => p.active).length
  const totalSubscribers = subscriptions.filter(s => s.status === 'active').length
  const monthlyRevenue = subscriptions
    .filter(s => s.status === 'active')
    .reduce((total, sub) => total + sub.price, 0)
  const receivedRevenue = subscriptions.reduce((total, sub) => {
    const paidPayments = sub.payments.filter(p => p.status === 'paid')
    return total + paidPayments.reduce((sum, p) => sum + p.amount, 0)
  }, 0)

  // Contar assinantes por plano
  const getSubscribersCount = (planId: string) => {
    return subscriptions.filter(s => s.planId === planId && s.status === 'active').length
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-200">
                <CreditCard size={24} className="text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Planos de Mensalidade</h1>
                <p className="text-sm text-gray-500">Gerencie os planos de assinatura</p>
              </div>
            </div>
          </div>
          <Link
            to="/app/mensalidades/planos/novo"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-all"
          >
            <Plus size={18} />
            Novo Plano
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Planos Ativos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-orange-600">Planos Ativos</span>
              <Crown size={18} className="text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{activePlans}</div>
            <div className="text-sm text-gray-500">Disponíveis</div>
          </div>

          {/* Total de Assinantes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-blue-600">Total de Assinantes</span>
              <Users size={18} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{totalSubscribers}</div>
            <div className="text-sm text-gray-500">Ativos</div>
          </div>

          {/* Receita Mensal */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-green-600">Receita Mensal</span>
              <DollarSign size={18} className="text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(monthlyRevenue)}</div>
            <div className="text-sm text-gray-500">Prevista</div>
          </div>

          {/* Total Recebido */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-emerald-600">Total Recebido</span>
              <Calendar size={18} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(receivedRevenue)}</div>
            <div className="text-sm text-gray-500">Histórico</div>
          </div>
        </div>

        {/* Lista de Planos */}
        {plans.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200">
              <CreditCard size={32} className="text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum plano cadastrado
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Comece criando seu primeiro plano de mensalidade
            </p>
            <Link
              to="/app/mensalidades/planos/novo"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
            >
              <Plus size={18} />
              Criar Primeiro Plano
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const subscribersCount = getSubscribersCount(plan.id)

              return (
                <Link
                  key={plan.id}
                  to={`/app/mensalidades/planos/${plan.id}`}
                  className={`bg-white rounded-xl border ${
                    plan.active ? 'border-orange-200 hover:border-orange-400' : 'border-gray-200 hover:border-gray-300'
                  } p-6 transition-all hover:shadow-md cursor-pointer block`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{plan.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleToggleActive(plan.id, plan.active)
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        plan.active
                          ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border border-gray-200'
                      }`}
                      title={plan.active ? 'Ativo' : 'Inativo'}
                    >
                      {plan.active ? <Check size={16} /> : <X size={16} />}
                    </button>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {subscribersCount} {subscribersCount === 1 ? 'assinante' : 'assinantes'}
                    </span>
                  </div>

                  {plan.benefits.length > 0 && (
                    <div className="mb-6 space-y-2">
                      {plan.benefits.slice(0, 3).map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Check className="text-orange-500 mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-sm text-gray-600">{benefit}</span>
                        </div>
                      ))}
                      {plan.benefits.length > 3 && (
                        <p className="text-xs text-gray-400 mt-2">
                          +{plan.benefits.length - 3} benefícios
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Link
                      to={`/app/mensalidades/planos/${plan.id}/editar`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                    >
                      <Edit size={16} />
                      Editar
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(plan.id, plan.name)
                      }}
                      className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg transition-colors"
                      title="Excluir plano"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
