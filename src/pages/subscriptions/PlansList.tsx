import { Plus, Edit, Trash2, Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSubscriptionStore } from '../../store/subscriptions'

export default function PlansList() {
  const { plans, deletePlan, updatePlan } = useSubscriptionStore()

  const handleToggleActive = (planId: string, currentStatus: boolean) => {
    updatePlan(planId, { active: !currentStatus })
  }

  const handleDelete = (planId: string, planName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o plano "${planName}"?`)) {
      deletePlan(planId)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Planos de Mensalidade</h1>
          <p className="text-gray-400">Gerencie os planos de assinatura da sua clínica</p>
        </div>
        <Link
          to="/app/mensalidades/planos/novo"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Plano
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="text-gray-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Nenhum plano cadastrado
          </h3>
          <p className="text-gray-500 mb-6">
            Comece criando seu primeiro plano de mensalidade
          </p>
          <Link
            to="/app/mensalidades/planos/novo"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Criar Primeiro Plano
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-gray-800 rounded-xl border ${
                plan.active ? 'border-orange-500/50' : 'border-gray-700'
              } p-6 hover:border-orange-500 transition-all`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(plan.id, plan.active)}
                  className={`p-2 rounded-lg transition-colors ${
                    plan.active
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  title={plan.active ? 'Ativo' : 'Inativo'}
                >
                  {plan.active ? <Check size={16} /> : <X size={16} />}
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-gray-400">/mês</span>
                </div>
                <p className="text-sm text-orange-400 mt-1">
                  {plan.sessionsPerYear} sessões por ano
                </p>
              </div>

              {plan.benefits.length > 0 && (
                <div className="mb-6 space-y-2">
                  {plan.benefits.slice(0, 3).map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="text-orange-500 mt-0.5 flex-shrink-0" size={16} />
                      <span className="text-sm text-gray-300">{benefit}</span>
                    </div>
                  ))}
                  {plan.benefits.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{plan.benefits.length - 3} benefícios
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <Link
                  to={`/app/mensalidades/planos/${plan.id}/editar`}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Edit size={16} />
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(plan.id, plan.name)}
                  className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
