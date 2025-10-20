import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { parseCurrency } from '@/utils/currency'
import { Save, ArrowLeft } from 'lucide-react'

export default function ProcedureForm() {
  const add = useProcedures(s => s.add)
  const error = useProcedures(s => s.error)
  const { items: stockItems, fetchItems } = useStock()
  const navigate = useNavigate()

  const [value, setValue] = useState('')
  const [cashValue, setCashValue] = useState('')
  const [cardValue, setCardValue] = useState('')
  const [category, setCategory] = useState('')

  // Carregar itens do estoque ao montar o componente
  useEffect(() => {
    fetchItems()
  }, [])

  // Categorias fixas de procedimentos em ordem alfabética
  const procedureCategories = [
    'Bioestimuladores de Colágeno',
    'Preenchedores de Ácido Hialurônico',
    'Toxina Botulínica'
  ]


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
      stockCategories: category ? [{ category, quantityUsed: 1 }] : []
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
              {procedureCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Selecione a categoria de produto deste procedimento
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
