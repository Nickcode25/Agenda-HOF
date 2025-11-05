import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Power, PowerOff, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
  duration_months: number
  is_active: boolean
  has_trial: boolean
  trial_days: number
  billing_day: number | null
  retry_failed_payments: boolean
  max_retry_attempts: number
  retry_interval_days: number
  created_at: string
}

interface PlanFormData {
  name: string
  description: string
  price: string
  features: string
  duration_months: string
  has_trial: boolean
  trial_days: string
  billing_day: string
  retry_failed_payments: boolean
  max_retry_attempts: string
  retry_interval_days: string
}

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: '',
    features: '',
    duration_months: '1',
    has_trial: false,
    trial_days: '7',
    billing_day: '',
    retry_failed_payments: true,
    max_retry_attempts: '3',
    retry_interval_days: '3'
  })

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (err) {
      console.error('Erro ao carregar planos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const planData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      features: formData.features.split('\n').filter(f => f.trim()),
      duration_months: parseInt(formData.duration_months),
      is_active: true,
      has_trial: formData.has_trial,
      trial_days: formData.has_trial ? parseInt(formData.trial_days) : 0,
      billing_day: formData.billing_day ? parseInt(formData.billing_day) : null,
      retry_failed_payments: formData.retry_failed_payments,
      max_retry_attempts: parseInt(formData.max_retry_attempts),
      retry_interval_days: parseInt(formData.retry_interval_days),
      sessions_per_year: 999999,
      max_patients: 999999
    }

    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData])

        if (error) throw error
      }

      await loadPlans()
      resetForm()
    } catch (err) {
      console.error('Erro ao salvar plano:', err)
      alert('Erro ao salvar plano')
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      features: plan.features.join('\n'),
      duration_months: plan.duration_months.toString(),
      has_trial: plan.has_trial,
      trial_days: plan.trial_days.toString(),
      billing_day: plan.billing_day ? plan.billing_day.toString() : '',
      retry_failed_payments: plan.retry_failed_payments,
      max_retry_attempts: plan.max_retry_attempts.toString(),
      retry_interval_days: plan.retry_interval_days.toString()
    })
    setShowForm(true)
  }

  const handleToggleActive = async (plan: Plan) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id)

      if (error) throw error
      await loadPlans()
    } catch (err) {
      console.error('Erro ao alternar status:', err)
    }
  }

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Tem certeza que deseja deletar o plano "${plan.name}"?`)) return

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', plan.id)

      if (error) throw error
      await loadPlans()
    } catch (err) {
      console.error('Erro ao deletar plano:', err)
      alert('Erro ao deletar plano')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      features: '',
      duration_months: '1',
      has_trial: false,
      trial_days: '7',
      billing_day: '',
      retry_failed_payments: true,
      max_retry_attempts: '3',
      retry_interval_days: '3'
    })
    setEditingPlan(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-white text-center py-8">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Gestão de Planos</h3>
          <p className="text-gray-400 mt-1">{plans.length} planos cadastrados</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span>{showForm ? 'Cancelar' : 'Novo Plano'}</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h4 className="text-xl font-bold text-white mb-4">
            {editingPlan ? 'Editar Plano' : 'Novo Plano'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ex: Plano Premium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preço Mensal (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="99.90"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duração (meses) *
                </label>
                <input
                  type="number"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Descrição do plano..."
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Features (uma por linha) *
              </label>
              <textarea
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Agendamentos ilimitados&#10;Gestão de pacientes&#10;Relatórios financeiros"
                rows={5}
                required
              />
            </div>

            {/* Trial Configuration */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h5 className="text-lg font-semibold text-blue-400 mb-3">Período de Trial</h5>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="has_trial"
                  checked={formData.has_trial}
                  onChange={(e) => setFormData({ ...formData, has_trial: e.target.checked })}
                  className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="has_trial" className="text-gray-300 font-medium">
                  Este plano tem período de trial gratuito
                </label>
              </div>

              {formData.has_trial && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dias de Trial Gratuito *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="7"
                    required={formData.has_trial}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Primeira cobrança ocorrerá após {formData.trial_days || 0} dias
                  </p>
                </div>
              )}
            </div>

            {/* Billing Configuration */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <h5 className="text-lg font-semibold text-purple-400 mb-3">Configuração de Cobrança</h5>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dia de Cobrança (opcional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.billing_day}
                  onChange={(e) => setFormData({ ...formData, billing_day: e.target.value })}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Deixe vazio para cobrar 30 dias após assinatura"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.billing_day
                    ? `Cobrança no dia ${formData.billing_day} de cada mês`
                    : 'Cobrança 30 dias após a data de assinatura (ou após trial)'}
                </p>
              </div>
            </div>

            {/* Retry Configuration */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h5 className="text-lg font-semibold text-orange-400 mb-3">Reprocessamento de Pagamentos Falhados</h5>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="retry_failed_payments"
                  checked={formData.retry_failed_payments}
                  onChange={(e) => setFormData({ ...formData, retry_failed_payments: e.target.checked })}
                  className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                />
                <label htmlFor="retry_failed_payments" className="text-gray-300 font-medium">
                  Tentar reprocessar pagamentos falhados automaticamente
                </label>
              </div>

              {formData.retry_failed_payments && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Máximo de Tentativas *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.max_retry_attempts}
                      onChange={(e) => setFormData({ ...formData, max_retry_attempts: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="3"
                      required={formData.retry_failed_payments}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Intervalo entre Tentativas (dias) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={formData.retry_interval_days}
                      onChange={(e) => setFormData({ ...formData, retry_interval_days: e.target.value })}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="3"
                      required={formData.retry_failed_payments}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3">
                {formData.retry_failed_payments
                  ? `Sistema tentará ${formData.max_retry_attempts}x a cada ${formData.retry_interval_days} dias. Após todas as tentativas falharem, a assinatura será cancelada.`
                  : 'Assinatura será cancelada imediatamente após primeira falha de pagamento.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
              >
                <Save className="w-5 h-5" />
                <span>Salvar</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20 bg-white/5">
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">Plano</th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">Descrição</th>
                <th className="text-center py-4 px-6 text-gray-300 font-semibold">Preço</th>
                <th className="text-center py-4 px-6 text-gray-300 font-semibold">Duração</th>
                <th className="text-center py-4 px-6 text-gray-300 font-semibold">Features</th>
                <th className="text-center py-4 px-6 text-gray-300 font-semibold">Status</th>
                <th className="text-center py-4 px-6 text-gray-300 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6">
                    <div className="text-white font-medium">{plan.name}</div>
                  </td>
                  <td className="py-4 px-6 text-gray-300 text-sm max-w-xs truncate">
                    {plan.description}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-green-400 font-bold">R$ {plan.price.toFixed(2)}</span>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-300">
                    {plan.duration_months} {plan.duration_months === 1 ? 'mês' : 'meses'}
                  </td>
                  <td className="py-4 px-6 text-center text-gray-300">
                    {plan.features.length} itens
                  </td>
                  <td className="py-4 px-6 text-center">
                    {plan.is_active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                        <Power className="w-3 h-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm">
                        <PowerOff className="w-3 h-3" />
                        Pausado
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(plan)}
                        className={`p-2 ${
                          plan.is_active
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400'
                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                        } rounded-lg transition-all`}
                        title={plan.is_active ? 'Pausar' : 'Ativar'}
                      >
                        {plan.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(plan)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {plans.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhum plano cadastrado ainda.</p>
              <p className="text-sm mt-2">Clique em "Novo Plano" para começar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
