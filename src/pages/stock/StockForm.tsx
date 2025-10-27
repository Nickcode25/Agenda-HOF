import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom'
import { useStock } from '@/store/stock'
import { useCategories } from '@/store/categories'
import { parseCurrency } from '@/utils/currency'
import { Save, ArrowLeft, Plus } from 'lucide-react'
import CreateCategoryModal from '@/components/CreateCategoryModal'
import SearchableSelect from '@/components/SearchableSelect'

// Produtos pré-cadastrados por categoria e marca (em ordem alfabética)
const PREDEFINED_PRODUCTS: Record<string, Record<string, string[]>> = {
  'Bioestimuladores de Colágeno': {
    'Allergan Aesthetics': [
      'HArmonyCa'
    ],
    'Galderma': [
      'Sculptra'
    ],
    'Merz Aesthetics': [
      'Radiesse',
      'Radiesse (+) Lidocaine',
      'Radiesse Duo'
    ],
    'Rennova': [
      'Rennova Diamond',
      'Rennova Diamond Lido',
      'Rennova Elleva',
      'Rennova Elleva C/210mg',
      'Rennova Elleva X'
    ]
  },
  'Preenchedores de Ácido Hialurônico': {
    'Allergan Aesthetics': [
      'Juvéderm Kysse',
      'Juvéderm Ultra Plus XC',
      'Juvéderm Ultra XC',
      'Juvéderm Volbella',
      'Juvéderm Volift',
      'Juvéderm Voluma',
      'Juvéderm Volux',
      'SKINVIVE by Juvéderm'
    ],
    'Galderma': [
      'Restylane',
      'Restylane Contour',
      'Restylane Defyne',
      'Restylane Kysse',
      'Restylane Lidocaine',
      'Restylane Lyft',
      'Restylane Refyne',
      'Restylane Skinboosters Vital',
      'Restylane Skinboosters Vital Light',
      'Restylane Volyme'
    ],
    'Merz Aesthetics': [
      'Belotero Balance',
      'Belotero Hydro',
      'Belotero Intense',
      'Belotero Lips',
      'Belotero Revive',
      'Belotero Soft',
      'Belotero Volume'
    ],
    'Pharmaesthetics': [
      'Biogelis Fine Lines',
      'Biogelis Global',
      'Biogelis Volume',
      'Biogelis Volumax'
    ],
    'Rennova': [
      'Rennova Deep Lido',
      'Rennova Elleva',
      'Rennova Fill',
      'Rennova Fill Corporal 30',
      'Rennova Fill Eyes Lines',
      'Rennova Fill Fine Lines',
      'Rennova Fill Lido',
      'Rennova Fill Soft Lips Lido',
      'Rennova Lift',
      'Rennova Lift Deep Line Lido',
      'Rennova Lift Lido',
      'Rennova Lift Lips Plus Lido',
      'Rennova Ultra Deep',
      'Rennova Ultra Deep Lido',
      'Rennova Ultra Volume Lido'
    ]
  },
  'Toxina Botulínica': {
    'Allergan Aesthetics': [
      'Botox 100U',
      'Botox 200U',
      'Botox 50U'
    ],
    'Galderma': [
      'Dysport 300U',
      'Dysport 500U'
    ],
    'Merz Aesthetics': [
      'Xeomin 100U'
    ],
    'Rennova': [
      'Nabota 100U',
      'Nabota 200U'
    ]
  }
}

export default function StockForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { items, addItem, updateItem, fetchItems } = useStock()
  const { getStockCategories, fetchCategories } = useCategories()
  const navigate = useNavigate()
  const isEditMode = !!id
  const returnCategory = searchParams.get('categoria')

  const item = isEditMode ? items.find(i => i.id === id) : null

  const [cost, setCost] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [customBrand, setCustomBrand] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [minQuantity, setMinQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [dosesPerUnit, setDosesPerUnit] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Carregar categorias ao montar o componente
  useEffect(() => {
    fetchCategories()
  }, [])

  // Obter categorias de estoque do banco
  const stockCategories = getStockCategories().map(cat => cat.name)

  // Obter produtos disponíveis baseado na categoria e marca selecionadas
  const availableProducts = category && brand && PREDEFINED_PRODUCTS[category]?.[brand]
    ? PREDEFINED_PRODUCTS[category][brand]
    : []

  // Limpar o produto quando categoria ou marca mudarem (exceto em modo de edição)
  useEffect(() => {
    if (!isEditMode && name && availableProducts.length > 0 && !availableProducts.includes(name)) {
      setName('')
    }
  }, [category, brand, availableProducts, isEditMode])

  // Limpar marca quando selecionar Insumos
  useEffect(() => {
    if (category === 'Insumos' && !isEditMode) {
      setBrand('')
    }
  }, [category, isEditMode])

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
      setDosesPerUnit(item.dosesPerUnit ? item.dosesPerUnit.toString() : '')
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

    // Validação: apenas categoria é obrigatória
    if (!category) {
      alert('Por favor, selecione uma categoria')
      return
    }

    // Usar marca customizada se "Outro" for selecionado
    const finalBrand = brand === 'Outro' ? customBrand : brand

    const itemData = {
      category,
      supplier: category === 'Insumos' ? '' : (finalBrand || ''),
      name: name || '',
      quantity: quantity ? Number(quantity) : 0,
      minQuantity: minQuantity ? Number(minQuantity) : 0,
      unit: unit || 'unidade',
      dosesPerUnit: dosesPerUnit ? Number(dosesPerUnit) : undefined,
      costPrice: cost ? parseCurrency(cost) : 0,
    }

    if (isEditMode && id) {
      await updateItem(id, itemData)
      await fetchItems(true) // Força reload dos dados
      navigate(returnCategory ? `/app/estoque?categoria=${encodeURIComponent(returnCategory)}` : '/app/estoque')
    } else {
      const newId = await addItem(itemData)
      if (newId) {
        await fetchItems(true) // Força reload dos dados
        navigate(returnCategory ? `/app/estoque?categoria=${encodeURIComponent(returnCategory)}` : '/app/estoque')
      }
    }
  }

  const handleCategoryCreated = (newCategoryName: string) => {
    setCategory(newCategoryName)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Form com Header Integrado */}
      <form onSubmit={onSubmit} className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header Premium */}
        <div className="relative overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6 border-b border-gray-700/50">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <Link
              to={returnCategory ? `/app/estoque?categoria=${encodeURIComponent(returnCategory)}` : '/app/estoque'}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft size={20} className="text-gray-400 hover:text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{isEditMode ? 'Editar Produto' : 'Novo Produto'}</h1>
              <p className="text-sm text-gray-400">Preencha os dados do produto no estoque</p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 lg:p-10">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Categoria - Ocupa 2 colunas para evitar sobreposição */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Categoria *</label>
            <div className="flex gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="flex-1 bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="">Selecione uma categoria</option>
                {stockCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={18} />
                Nova
              </button>
            </div>
          </div>

          {/* Marca */}
          {category !== 'Insumos' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Marca</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                >
                  <option value="">Selecione uma marca</option>
                  <option value="Allergan Aesthetics">Allergan Aesthetics</option>
                  <option value="Galderma">Galderma</option>
                  <option value="Merz Aesthetics">Merz Aesthetics</option>
                  <option value="Mesoestetic">Mesoestetic</option>
                  <option value="Pharmaesthetics">Pharmaesthetics</option>
                  <option value="Rennova">Rennova</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {brand === 'Outro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Digite a Marca</label>
                  <input
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="Ex: Azzalure, Bocouture, etc..."
                    className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              )}
            </>
          )}

          {/* Produto */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Produto</label>
            {category === 'Insumos' ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cânula, Agulha, Seringa..."
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            ) : availableProducts.length > 0 ? (
              <select
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="">Selecione um produto</option>
                {availableProducts.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do produto..."
                className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            )}
            {category && brand && availableProducts.length === 0 && category !== 'Insumos' && (
              <p className="text-xs text-gray-400 mt-1">
                Nenhum produto pré-cadastrado para esta combinação. Digite manualmente.
              </p>
            )}
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              type="number"
              min="0"
              step="1"
              placeholder="Ex: 100"
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade Mínima</label>
            <input
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Quantidade para alerta de estoque baixo</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Unidade</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
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

          {/* Doses por Unidade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Doses/Aplicações por Unidade</label>
            <input
              value={dosesPerUnit}
              onChange={(e) => setDosesPerUnit(e.target.value)}
              type="number"
              min="1"
              step="1"
              placeholder="Ex: 4 (para toxinas botulínicas)"
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">
              Quantas aplicações rendem cada unidade? Ex: 1 frasco de Nabota = 4 aplicações.
              <br />
              <span className="text-orange-400">Se deixar em branco, 1 aplicação = 1 unidade de estoque.</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Custo Unitário</label>
            <input
              value={cost}
              onChange={handleCostChange}
              placeholder="R$ 0,00"
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
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
            {isEditMode ? 'Salvar Alterações' : 'Adicionar Produto'}
          </button>
          <Link
            to={returnCategory ? `/app/estoque?categoria=${encodeURIComponent(returnCategory)}` : '/app/estoque'}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </Link>
        </div>
        </div>
      </form>

      {/* Modal de Criar Categoria */}
      <CreateCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        type="both"
        onCategoryCreated={handleCategoryCreated}
      />
    </div>
  )
}
