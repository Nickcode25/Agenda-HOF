import { FormEvent, useState, useEffect, useMemo } from 'react'
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom'
import { useStock } from '@/store/stock'
import { useCategories } from '@/store/categories'
import { parseCurrency, formatCurrency as formatCurrencyUtil } from '@/utils/currency'
import { Save, BarChart3, DollarSign, Plus, ArrowLeft } from 'lucide-react'
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
  'Preenchedores com Ácido Hialurônico': {
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

  // Categorias nativas do sistema
  const NATIVE_CATEGORIES = [
    'Anestésicos',
    'Bioestimuladores de Colágeno',
    'Fios de Sustentação',
    'Insumos',
    'Peeling e Microagulhamento',
    'Preenchedores com Ácido Hialurônico',
    'Toxina Botulínica',
    'Tratamentos Vasculares'
  ]

  // Carregar categorias ao montar o componente
  useEffect(() => {
    fetchCategories()
  }, [])

  // Obter categorias de estoque do banco e combinar com nativas
  const dbCategories = getStockCategories().map(cat => cat.name)
  const stockCategories = [...new Set([...NATIVE_CATEGORIES, ...dbCategories])].sort((a, b) => a.localeCompare(b, 'pt-BR'))

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

    // Validação: apenas nome é obrigatório (no modo criação)
    if (!isEditMode && !name.trim()) {
      alert('Por favor, informe o nome do produto')
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

  // ==========================================
  // MODO DE EDIÇÃO RÁPIDA (Simplificado)
  // ==========================================
  if (isEditMode && item) {
    const productTitle = item.supplier
      ? `${item.name} - ${item.supplier}`
      : item.name

    return (
      <div className="min-h-screen bg-gray-50 -m-8 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header com nome do produto */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                to={returnCategory ? `/app/estoque?categoria=${encodeURIComponent(returnCategory)}` : '/app/estoque'}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-500" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Editar Produto</h1>
                <p className="text-sm text-gray-500">{productTitle}</p>
              </div>
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
                form="stock-edit-form"
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all shadow-sm"
              >
                <Save size={18} />
                Salvar
              </button>
            </div>
          </div>

          {/* Form de Edição Rápida */}
          <form id="stock-edit-form" onSubmit={onSubmit} className="space-y-4">
            {/* Seção Única: Estoque e Valores */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Estoque */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <BarChart3 size={18} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Estoque</h3>
                </div>

                <div className="grid gap-4 grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                    <input
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      type="number"
                      min="0"
                      step="1"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
                    <input
                      value={minQuantity}
                      onChange={(e) => setMinQuantity(e.target.value)}
                      type="number"
                      min="0"
                      step="1"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                    <SearchableSelect
                      options={[
                        { value: 'ml', label: 'ml' },
                        { value: 'g', label: 'g' },
                        { value: 'mg', label: 'mg' },
                        { value: 'unidade', label: 'unidade' },
                        { value: 'caixa', label: 'caixa' },
                        { value: 'frasco', label: 'frasco' },
                        { value: 'ampola', label: 'ampola' },
                        { value: 'seringa', label: 'seringa' }
                      ]}
                      value={unit}
                      onChange={setUnit}
                      placeholder="Unidade"
                    />
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <DollarSign size={18} className="text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Valores</h3>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unitário</label>
                    <input
                      value={cost}
                      onChange={handleCostChange}
                      placeholder="R$ 0,00"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total</label>
                    <input
                      value={formatCurrencyUtil(totalValue)}
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // ==========================================
  // MODO DE CRIAÇÃO (Formulário Simplificado)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to={returnCategory ? `/app/estoque?categoria=${encodeURIComponent(returnCategory)}` : '/app/estoque'}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-500" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Novo Produto</h1>
              <p className="text-sm text-gray-500">Cadastro rápido de produto</p>
            </div>
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
              disabled={!name}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all ${
                !name
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
              }`}
            >
              <Save size={18} />
              Adicionar
            </button>
          </div>
        </div>

        {/* Form Simplificado - Card Único */}
        <form id="stock-form" onSubmit={onSubmit}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

            {/* A. Identificação do Produto */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Produto (Nome) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto <span className="text-red-500">*</span>
                </label>
                {category === 'Insumos' ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Cânula, Agulha, Seringa..."
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                  />
                ) : availableProducts.length > 0 ? (
                  <SearchableSelect
                    options={availableProducts.map(product => ({
                      value: product,
                      label: product
                    }))}
                    value={name}
                    onChange={setName}
                    placeholder="Selecione ou digite o produto"
                  />
                ) : (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Botox 100U, Restylane..."
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                  />
                )}
              </div>

              {/* Marca */}
              {category !== 'Insumos' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  {brand === 'Outro' ? (
                    <input
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="Digite a marca..."
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                    />
                  ) : (
                    <SearchableSelect
                      options={[
                        { value: 'Allergan Aesthetics', label: 'Allergan Aesthetics' },
                        { value: 'Galderma', label: 'Galderma' },
                        { value: 'Merz Aesthetics', label: 'Merz Aesthetics' },
                        { value: 'Mesoestetic', label: 'Mesoestetic' },
                        { value: 'Pharmaesthetics', label: 'Pharmaesthetics' },
                        { value: 'Rennova', label: 'Rennova' },
                        { value: 'Outro', label: 'Outro' }
                      ]}
                      value={brand}
                      onChange={setBrand}
                      placeholder="Selecione"
                    />
                  )}
                </div>
              )}

              {/* Categoria */}
              <div className={category === 'Insumos' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={stockCategories.map(cat => ({
                        value: cat,
                        label: cat
                      }))}
                      value={category}
                      onChange={setCategory}
                      placeholder="Selecione"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                    title="Nova categoria"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-100" />

            {/* B. Controle de Estoque */}
            <div className="grid gap-4 grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                <SearchableSelect
                  options={[
                    { value: 'unidade', label: 'unidade' },
                    { value: 'seringa', label: 'seringa' },
                    { value: 'frasco', label: 'frasco' },
                    { value: 'ampola', label: 'ampola' },
                    { value: 'caixa', label: 'caixa' },
                    { value: 'ml', label: 'ml' },
                    { value: 'g', label: 'g' },
                    { value: 'mg', label: 'mg' }
                  ]}
                  value={unit}
                  onChange={setUnit}
                  placeholder="Unidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
                <input
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
                <p className="text-xs text-gray-400 mt-0.5">Alerta de estoque</p>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-100" />

            {/* C. Valores */}
            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unitário</label>
                <input
                  value={cost}
                  onChange={handleCostChange}
                  placeholder="R$ 0,00"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total</label>
                <input
                  value={formatCurrencyUtil(totalValue)}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
                />
              </div>
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
