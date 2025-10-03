import { FormEvent, useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { parseCurrency } from '@/utils/currency'
import { Save, ArrowLeft } from 'lucide-react'

export default function ProcedureEdit() {
  const { id } = useParams()
  const { procedures, update } = useProcedures(s => ({ procedures: s.procedures, update: s.update }))
  const navigate = useNavigate()

  const procedure = procedures.find(p => p.id === id)

  const [value, setValue] = useState('')
  const [cashValue, setCashValue] = useState('')
  const [cardValue, setCardValue] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')

  useEffect(() => {
    if (procedure) {
      setName(procedure.name)
      setDescription(procedure.description || '')
      setDuration(procedure.duration?.toString() || '')
      setValue(formatCurrency(procedure.value.toString()))
      setCashValue(procedure.cashValue ? formatCurrency(procedure.cashValue.toString()) : '')
      setCardValue(procedure.cardValue ? formatCurrency(procedure.cardValue.toString()) : '')
    }
  }, [procedure])

  function formatCurrency(val: string | number) {
    // Se for número, converte para string com centavos
    if (typeof val === 'number') {
      val = (val * 100).toString()
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


  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!procedure) return

    update(procedure.id, {
      name,
      value: parseCurrency(value),
      cashValue: cashValue ? parseCurrency(cashValue) : undefined,
      cardValue: cardValue ? parseCurrency(cardValue) : undefined,
      description: description || undefined,
      duration: duration ? Number(duration) : undefined,
    })
    
    navigate(`/procedimentos/${procedure.id}`)
  }

  if (!procedure) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/procedimentos" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Procedimento não encontrado</h1>
            <p className="text-gray-400">O procedimento que você está tentando editar não existe.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/procedimentos" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Editar Procedimento</h1>
          <p className="text-gray-400">Edite as informações do procedimento</p>
        </div>
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
          <Link to="/procedimentos" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
