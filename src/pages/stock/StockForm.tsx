import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import { useStock } from '@/store/stock'
import { parseCurrency } from '@/utils/currency'
import { Save, ArrowLeft } from 'lucide-react'

export default function StockForm() {
  const { id } = useParams()
  const { items, addItem, updateItem, fetchItems } = useStock()
  const navigate = useNavigate()
  const isEditMode = !!id

  const item = isEditMode ? items.find(i => i.id === id) : null

  const [cost, setCost] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [minQuantity, setMinQuantity] = useState('')
  const [unit, setUnit] = useState('')

  // Carregar item ao editar
  useEffect(() => {
    if (isEditMode) {
      fetchItems()
    }
  }, [isEditMode])

  // Preencher formulário quando em modo de edição
  useEffect(() => {
    if (item) {
      setCategory(item.category)
      setBrand(item.supplier || '')
      setName(item.name)
      setQuantity(item.quantity.toString())
      setMinQuantity(item.minQuantity.toString())
      setUnit(item.unit)
      setCost(new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(item.costPrice || 0))
    }
  }, [item])

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

    const itemData = {
      category,
      supplier: brand,
      name,
      quantity: Number(quantity),
      minQuantity: Number(minQuantity),
      unit,
      costPrice: parseCurrency(cost),
    }

    if (isEditMode && id) {
      await updateItem(id, itemData)
      navigate('/app/estoque')
    } else {
      const newId = await addItem(itemData)
      if (newId) {
        navigate('/app/estoque')
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/estoque" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Categoria *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              placeholder="Ex: Rennova, Allergan, Galderma..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Produto */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Produto *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Nabota, Botulift, Dysport..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade *</label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
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
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
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
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
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
