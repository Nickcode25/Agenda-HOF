import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStock } from '@/store/stock'
import { parseCurrency } from '@/utils/currency'
import { Save, ArrowLeft } from 'lucide-react'

export default function StockForm() {
  const { addItem } = useStock()
  const navigate = useNavigate()

  const [cost, setCost] = useState('')

  // Função para formatar moeda durante a digitação
  function formatCurrency(value: string): string {
    const numbers = value.replace(/\D/g, '')
    const amount = Number(numbers) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  function handleCostChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value)
    setCost(formatted)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    
    const id = await addItem({
      category: String(data.get('category') || ''),
      supplier: String(data.get('brand') || ''),
      name: String(data.get('name') || ''),
      quantity: Number(data.get('quantity') || 0),
      minQuantity: Number(data.get('minQuantity') || 0),
      unit: String(data.get('unit') || ''),
      costPrice: parseCurrency(cost),
    })
    
    if (id) {
      navigate('/app/estoque')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/estoque" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Adicionar Produto</h1>
          <p className="text-gray-400">Cadastre um novo produto no estoque</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Categoria *</label>
            <select
              name="category"
              required
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Selecione uma categoria</option>
              <option value="Toxina Botulínica">Toxina Botulínica</option>
              <option value="Preenchedores">Preenchedores</option>
              <option value="Bioestimuladores">Bioestimuladores</option>
              <option value="Fios de Sustentação">Fios de Sustentação</option>
              <option value="Anestésicos">Anestésicos</option>
              <option value="Materiais Descartáveis">Materiais Descartáveis</option>
              <option value="Equipamentos">Equipamentos</option>
              <option value="Cosméticos">Cosméticos</option>
              <option value="Medicamentos">Medicamentos</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Marca *</label>
            <input
              name="brand"
              required
              placeholder="Ex: Rennova, Allergan, Galderma..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Produto */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Produto *</label>
            <input
              name="name"
              required
              placeholder="Ex: Nabota, Botulift, Dysport..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade *</label>
            <input
              name="quantity"
              type="number"
              min="0"
              step="1"
              required
              placeholder="Ex: 100"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade Mínima *</label>
            <input
              name="minQuantity"
              type="number"
              min="0"
              step="1"
              required
              placeholder="0"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Quantidade para alerta de estoque baixo</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Unidade *</label>
            <select 
              name="unit" 
              required
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Selecione a unidade</option>
              <option value="ml">ml (mililitros)</option>
              <option value="g">g (gramas)</option>
              <option value="mg">mg (miligramas)</option>
              <option value="unidade">unidade</option>
              <option value="caixa">caixa</option>
              <option value="frasco">frasco</option>
              <option value="ampola">ampola</option>
              <option value="seringa">seringa</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Custo Unitário</label>
            <input
              value={cost}
              onChange={handleCostChange}
              placeholder="R$ 0,00"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Custo por unidade do produto (opcional)</p>
          </div>
        </div>
        
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
          >
            <Save size={18} />
            Adicionar Produto
          </button>
          <Link
            to="/app/estoque"
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
