import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSubscriptionStore } from '../../store/subscriptions'

export default function PlanForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { plans, addPlan, updatePlan, getPlanById } = useSubscriptionStore()

  const isEditing = !!id
  const existingPlan = isEditing ? getPlanById(id) : null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (existingPlan) {
      setName(existingPlan.name)
      setDescription(existingPlan.description)
      setActive(existingPlan.active)
    }
  }, [existingPlan])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const planData = {
      name,
      description,
      price: 0, // Valor padrão - será definido por assinatura
      sessionsPerYear: 0, // Valor padrão - será definido por assinatura
      benefits: [], // Removido da criação do plano
      active,
    }

    if (isEditing && id) {
      updatePlan(id, planData)
    } else {
      addPlan(planData)
    }

    navigate('/app/mensalidades/planos')
  }

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/app/mensalidades/planos')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Voltar
      </button>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                  placeholder="Ex: Clube do Botox"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 h-20 resize-none"
                  placeholder="Descreva o plano de mensalidade"
                />
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                💡 <strong>Dica:</strong> O valor e detalhes específicos serão definidos ao adicionar cada paciente ao plano.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="active" className="text-sm text-gray-300">
                Plano ativo (disponível para novas assinaturas)
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg transition-colors font-medium"
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Plano'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/mensalidades/planos')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
