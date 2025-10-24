import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { useCategories } from '@/store/categories'
import { parseCurrency } from '@/utils/currency'
import { Save, ArrowLeft } from 'lucide-react'

export default function ProcedureForm() {
  const add = useProcedures(s => s.add)
  const error = useProcedures(s => s.error)
  const { getProcedureCategories, fetchCategories } = useCategories()
  const navigate = useNavigate()

  const [value, setValue] = useState('')
  const [cashValue, setCashValue] = useState('')
  const [cardValue, setCardValue] = useState('')
  const [category, setCategory] = useState('')

  // Carregar categorias ao montar o componente
  useEffect(() => {
    fetchCategories()
  }, [])

  // Obter categorias de procedimentos do banco
  const procedureCategories = getProcedureCategories().map(cat => cat.name)


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
      price: value ? parseCurrency(value) : 0,
      cashValue: cashValue ? parseCurrency(cashValue) : undefined,
      cardValue: cardValue ? parseCurrency(cardValue) : undefined,
      description: String(data.get('description')||''),
      durationMinutes: durationValue ? Number(durationValue) : 0,
      category: category || undefined,
      isActive: true,
      stockCategories: category ? [{ category: category, quantityUsed: 1 }] : []
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
    <div className="max-w-4xl mx-auto">
      {/* Form com Header Integrado */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700 flex items-center gap-4">
          <Link
            to="/app/procedimentos"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={20} className="text-gray-400 hover:text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Novo Procedimento</h1>
            <p className="text-sm text-gray-400">Preencha os dados do procedimento</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 lg:p-8">
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
              Selecione a categoria do procedimento
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Valor à Vista</label>
            <input
              name="value"
              value={value}
              onChange={handleValueChange}
              placeholder="R$ 0,00"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Valor principal do procedimento (à vista) - opcional</p>
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
        </div>
      </form>
    </div>
  )
}
