import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { useSubscriptionStore } from '../../store/subscriptions'

export default function PlanForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { plans, addPlan, updatePlan, getPlanById } = useSubscriptionStore()

  const isEditing = !!id
  const existingPlan = isEditing ? getPlanById(id) : null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [sessionsPerYear, setSessionsPerYear] = useState('')
  const [benefits, setBenefits] = useState<string[]>([])
  const [newBenefit, setNewBenefit] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (existingPlan) {
      setName(existingPlan.name)
      setDescription(existingPlan.description)
      setPrice(existingPlan.price.toString())
      setSessionsPerYear(existingPlan.sessionsPerYear.toString())
      setBenefits(existingPlan.benefits)
      setActive(existingPlan.active)
    }
  }, [existingPlan])

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setBenefits([...benefits, newBenefit.trim()])
      setNewBenefit('')
    }
  }

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const planData = {
      name,
      description,
      price: parseFloat(price),
      sessionsPerYear: parseInt(sessionsPerYear),
      benefits,
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
        <h1 className="text-3xl font-bold text-white mb-2">
          {isEditing ? 'Editar Plano' : 'Novo Plano de Mensalidade'}
        </h1>
        <p className="text-gray-400 mb-8">
          {isEditing ? 'Atualize as informações do plano' : 'Preencha os dados do novo plano'}
        </p>

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
                  Descrição *
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 h-20 resize-none"
                  placeholder="Descreva o plano de mensalidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor Mensal (R$) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                  placeholder="225.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sessões por Ano *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={sessionsPerYear}
                  onChange={(e) => setSessionsPerYear(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                  placeholder="3"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Benefícios do Plano
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                  className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                  placeholder="Digite um benefício"
                />
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>

              {benefits.length > 0 && (
                <div className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-2"
                    >
                      <span className="text-white text-sm">{benefit}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
