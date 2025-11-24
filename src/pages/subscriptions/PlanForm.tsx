import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CreditCard, FileText, ToggleLeft, Lightbulb } from 'lucide-react'
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/mensalidades/planos')}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Voltar</span>
        </button>
      </div>

      {/* Card Principal */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Barra de Status */}
        <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>

        {/* Header do Card */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl">
              <CreditCard size={22} className="text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Editar Plano' : 'Novo Plano'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Atualize as informações do plano' : 'Preencha os dados para criar um novo plano'}
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Nome do Plano */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="text-gray-400" />
                Nome do Plano <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all placeholder:text-gray-400"
                placeholder="Ex: Clube do Botox"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="text-gray-400" />
                Descrição <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all h-24 resize-none placeholder:text-gray-400"
                placeholder="Descreva o plano de mensalidade"
              />
            </div>

            {/* Dica */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Lightbulb size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>Dica:</strong> O valor e detalhes específicos serão definidos ao adicionar cada paciente ao plano.
                </p>
              </div>
            </div>

            {/* Status Ativo */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <input
                type="checkbox"
                id="active"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              />
              <label htmlFor="active" className="flex items-center gap-2 text-gray-700 cursor-pointer select-none">
                <ToggleLeft size={18} className="text-gray-400" />
                Plano ativo (disponível para novas assinaturas)
              </label>
            </div>
          </div>

          {/* Ações */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl transition-colors font-medium shadow-sm"
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Plano'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/mensalidades/planos')}
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl transition-colors font-medium border border-gray-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
