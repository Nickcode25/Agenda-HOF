import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { parseCurrency } from '@/utils/currency'
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'

export default function ProcedureForm() {
  const add = useProcedures(s => s.add)
  const error = useProcedures(s => s.error)
  const { items: stockItems, fetchItems } = useStock()
  const navigate = useNavigate()

  const [value, setValue] = useState('')
  const [cashValue, setCashValue] = useState('')
  const [cardValue, setCardValue] = useState('')
  const [category, setCategory] = useState('')
  const [stockCategories, setStockCategories] = useState<Array<{
    category: string
    quantityUsed: number
  }>>([])

  // Carregar itens do estoque ao montar o componente
  useEffect(() => {
    fetchItems()
  }, [])

  // Obter categorias únicas do estoque
  const uniqueCategories = [...new Set(stockItems.map(item => item.category))].sort()

  const addStockCategory = () => {
    setStockCategories([...stockCategories, { category: '', quantityUsed: 1 }])
  }

  const removeStockCategory = (index: number) => {
    setStockCategories(stockCategories.filter((_, i) => i !== index))
  }

  const updateStockCategory = (index: number, field: 'category' | 'quantityUsed', value: string | number) => {
    const updated = [...stockCategories]
    updated[index] = { ...updated[index], [field]: value }
    setStockCategories(updated)
  }

  function formatCurrency(val: string) {
    // Remove tudo que não é número
    const numbers = val.replace(/\D/g, '')
    
    // Converte para centavos
    const cents = Number(numbers) / 100
    
    // Formata como moeda
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents)
  }

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value)
    setValue(formatted)
  }

  function handleCashValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value)
    setCashValue(formatted)
  }

  function handleCardValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrency(e.target.value)
    setCardValue(formatted)
  }


  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)

    const durationValue = data.get('duration')
    const procedureData = {
      name: String(data.get('name')||''),
      price: parseCurrency(value),
      cashValue: cashValue ? parseCurrency(cashValue) : undefined,
      cardValue: cardValue ? parseCurrency(cardValue) : undefined,
      description: String(data.get('description')||''),
      durationMinutes: durationValue ? Number(durationValue) : 0,
      category: category || undefined,
      isActive: true,
      stockCategories: stockCategories.filter(item => item.category && item.quantityUsed > 0)
    }

    const id = await add(procedureData)

    if (id) {
      navigate(`/app/procedimentos/${id}`)
    } else {
      const errorMsg = error || 'Erro ao criar procedimento'
      alert(`Erro: ${errorMsg}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/procedimentos" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Novo Procedimento</h1>
          <p className="text-gray-400">Cadastre um novo procedimento</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Procedimento *</label>
            <input
              name="name"
              required
              placeholder="Ex: Botox, Preenchimento Labial..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Categoria do Procedimento</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Selecione uma categoria</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {uniqueCategories.length === 0
                ? 'Nenhuma categoria disponível. Cadastre produtos no estoque primeiro.'
                : 'Selecione a categoria de produto deste procedimento (ex: Toxina Botulínica, Preenchimento, etc.)'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Valor à Vista *</label>
            <input 
              name="value" 
              value={value}
              onChange={handleValueChange}
              required 
              placeholder="R$ 0,00"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
            />
            <p className="text-xs text-gray-400 mt-1">Valor principal do procedimento (à vista)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duração (minutos)</label>
            <input 
              name="duration" 
              type="number"
              min="0"
              placeholder="Ex: 30, 60, 90..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Valor com Desconto Adicional</label>
            <input 
              value={cashValue}
              onChange={handleCashValueChange}
              placeholder="R$ 0,00"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
            />
            <p className="text-xs text-gray-400 mt-1">Valor com desconto especial à vista (opcional)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Valor Parcelado</label>
            <input 
              value={cardValue}
              onChange={handleCardValueChange}
              placeholder="R$ 0,00"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
            />
            <p className="text-xs text-gray-400 mt-1">Valor para pagamento parcelado no cartão (opcional)</p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
            <textarea
              name="description"
              placeholder="Descreva o procedimento..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              rows={4}
            ></textarea>
          </div>

          {/* Categorias de Produtos */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Categorias de Produtos Utilizados</label>
                <p className="text-xs text-gray-400 mt-1">Defina as categorias. A marca/produto específico será escolhido no agendamento.</p>
              </div>
              <button
                type="button"
                onClick={addStockCategory}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30 transition-all"
              >
                <Plus size={16} />
                Adicionar Categoria
              </button>
            </div>

            {stockCategories.length === 0 ? (
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6 text-center">
                <p className="text-gray-400 text-sm">Nenhuma categoria adicionada. Exemplo: "Toxina Botulínica" - o produto específico será escolhido no agendamento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stockCategories.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-400 mb-2">Categoria</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateStockCategory(index, 'category', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      >
                        <option value="">
                          {uniqueCategories.length === 0 ? 'Nenhuma categoria no estoque' : 'Selecione uma categoria'}
                        </option>
                        {uniqueCategories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {uniqueCategories.length === 0 && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Cadastre produtos no <Link to="/app/estoque" className="underline hover:text-yellow-300">estoque</Link> primeiro
                        </p>
                      )}
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-400 mb-2">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantityUsed}
                        onChange={(e) => updateStockCategory(index, 'quantityUsed', Number(e.target.value))}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStockCategory(index)}
                      className="mt-7 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40">
            <Save size={20} />
            Salvar Procedimento
          </button>
          <Link to="/app/procedimentos" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
