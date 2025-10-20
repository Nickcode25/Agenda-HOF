import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { parseCurrency } from '@/utils/currency'
import { Save, ArrowLeft } from 'lucide-react'

export default function ProcedureEdit() {
  const { id } = useParams()
  const { procedures, update, fetchAll } = useProcedures(s => ({ procedures: s.procedures, update: s.update, fetchAll: s.fetchAll }))
  const { items: stockItems, fetchItems } = useStock()
  const navigate = useNavigate()

  const procedure = procedures.find(p => p.id === id)

  useEffect(() => {
    fetchAll()
    fetchItems()
  }, [])

  const [value, setValue] = useState('')
  const [cashValue, setCashValue] = useState('')
  const [cardValue, setCardValue] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [category, setCategory] = useState('')

  // Categorias fixas de procedimentos em ordem alfabética
  const procedureCategories = [
    'Bioestimuladores de Colágeno',
    'Preenchedores de Ácido Hialurônico',
    'Toxina Botulínica'
  ]

  useEffect(() => {
    if (procedure) {
      setName(procedure.name)
      setDescription(procedure.description || '')
      setDuration(procedure.durationMinutes?.toString() || '')
      setCategory(procedure.category || '')
      setValue(formatCurrency(procedure.price))
      setCashValue(procedure.cashValue ? formatCurrency(procedure.cashValue) : '')
      setCardValue(procedure.cardValue ? formatCurrency(procedure.cardValue) : '')
    }
  }, [procedure])

  function formatCurrency(val: string | number) {
    // Se for número (vindo do banco), formata diretamente
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(val)
    }

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

    if (!procedure) return

    await update(procedure.id, {
      name,
      price: parseCurrency(value),
      cashValue: cashValue ? parseCurrency(cashValue) : undefined,
      cardValue: cardValue ? parseCurrency(cardValue) : undefined,
      description: description || undefined,
      durationMinutes: duration ? Number(duration) : undefined,
      category: category || undefined,
    })

    navigate(`/app/procedimentos/${procedure.id}`)
  }

  if (!procedure) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/app/procedimentos" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center">
          <p className="text-gray-400">Procedimento não encontrado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/procedimentos" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Procedimento *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o procedimento..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
              rows={4}
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40">
            <Save size={20} />
            Salvar Alterações
          </button>
          <Link to="/app/procedimentos" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
