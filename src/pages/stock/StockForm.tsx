import { FormEvent, useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom'
import { useStock } from '@/store/stock'
import { useCategories } from '@/store/categories'
import { parseCurrency, formatCurrency as formatCurrencyUtil } from '@/utils/currency'
import { Save, Package, BarChart3, DollarSign, FileText, Plus } from 'lucide-react'
import CreateCategoryModal from '@/components/CreateCategoryModal'

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
  const [notes, setNotes] = useState('')
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
      setNotes(item.notes || '')
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

  // Calcular valor total automaticamente
  const totalValue = useMemo(() => {
    const qty = quantity ? Number(quantity) : 0
    const unitCost = cost ? parseCurrency(cost) : 0
    return qty * unitCost
  }, [quantity, cost])

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
      notes: notes || ''
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
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Editar Produto' : 'Novo Produto'}</h1>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados do produto no estoque</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={returnCategory ? `/app/estoque?categoria=${encodeURIComponent(returnCategory)}` : '/app/estoque'}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              form="stock-form"
              disabled={!category}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                !category
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
              }`}
            >
              <Save size={18} />
              {isEditMode ? 'Salvar Alterações' : 'Adicionar Produto'}
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="stock-form" onSubmit={onSubmit} className="space-y-4">
          {/* Seção: Informações do Produto */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Package size={18} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informações do Produto</h3>
                <p className="text-xs text-gray-500">Dados básicos do produto</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
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
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all shadow-sm flex items-center gap-2 whitespace-nowrap text-sm"
                  >
                    <Plus size={16} />
                    Nova
                  </button>
                </div>
              </div>

              {/* Marca */}
              {category !== 'Insumos' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marca <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Digite a Marca</label>
                      <input
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="Ex: Azzalure, Bocouture, etc..."
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Produto */}
              <div className={category !== 'Insumos' && brand !== 'Outro' ? '' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto <span className="text-red-500">*</span>
                </label>
                {category === 'Insumos' ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Cânula, Agulha, Seringa..."
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                  />
                ) : availableProducts.length > 0 ? (
                  <select
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
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
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                  />
                )}
                {category && brand && availableProducts.length === 0 && category !== 'Insumos' && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Nenhum produto pré-cadastrado para esta combinação
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">Ex: Ácido Hialurônico Premium 1ml</p>
              </div>

              {/* Dosificações/Aplicações */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosificações/Aplicações</label>
                <input
                  value={dosesPerUnit}
                  onChange={(e) => setDosesPerUnit(e.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ex: 4 para toxinas botulínicas"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Descreva as aplicações e dosificações recomendadas</p>
              </div>
            </div>
          </div>

          {/* Seção: Quantidade */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Quantidade</h3>
                <p className="text-xs text-gray-500">Controle de estoque</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade
                </label>
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ex: 100"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Quantidade inicial em estoque</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade Mínima</label>
                <input
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Quantidade para alertar estoque baixo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
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
            </div>
          </div>

          {/* Seção: Valores */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Valores</h3>
                <p className="text-xs text-gray-500">Preço e custos</p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custo Unitário
                </label>
                <input
                  value={cost}
                  onChange={handleCostChange}
                  placeholder="R$ 0,00"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-500 mt-0.5">Calcule o preço das vendas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total</label>
                <input
                  value={formatCurrencyUtil(totalValue)}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-0.5">Calculado automaticamente (Qty × Custo)</p>
              </div>
            </div>
          </div>

          {/* Seção: Descrição */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-purple-50 rounded-lg">
                <FileText size={18} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Descrição</h3>
                <p className="text-xs text-gray-500">Informações adicionais</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anotações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o produto..."
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm resize-none"
              />
              <p className="text-xs text-gray-500 mt-0.5">Opcional - informações relevantes sobre o produto</p>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-gray-50 pt-4 pb-2 -mx-8 px-8 border-t border-gray-200">
            <div className="flex items-center justify-end gap-3 max-w-5xl mx-auto">
              <Link
                to={returnCategory ? `/app/estoque?categoria=${encodeURIComponent(returnCategory)}` : '/app/estoque'}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={!category}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                  !category
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                }`}
              >
                <Save size={18} />
                {isEditMode ? 'Salvar Alterações' : 'Adicionar Produto'}
              </button>
            </div>
          </div>
        </form>
      </div>

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
