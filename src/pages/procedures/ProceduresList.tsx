import { Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { useMemo, useState } from 'react'
import { Search, Plus, Scissors, DollarSign, Clock, ToggleLeft, ToggleRight } from 'lucide-react'

export default function ProceduresList() {
  const { procedures, toggleActive } = useProcedures(s => ({ procedures: s.procedures, toggleActive: s.toggleActive }))
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return procedures
    return procedures.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    )
  }, [q, procedures])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Procedimentos</h1>
          <p className="text-gray-400">Gerencie os procedimentos e valores</p>
        </div>
        <Link 
          to="/procedimentos/novo" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105"
        >
          <Plus size={20} />
          Novo Procedimento
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          value={q} 
          onChange={e=>setQ(e.target.value)} 
          placeholder="Buscar procedimento..." 
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" 
        />
      </div>

      {/* Procedures Grid */}
      {filtered.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors size={40} className="text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Nenhum procedimento encontrado</h3>
          <p className="text-gray-400 mb-6">Cadastre os procedimentos oferecidos pelo consultório</p>
          <Link 
            to="/procedimentos/novo" 
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Cadastrar Procedimento
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(proc => (
            <div 
              key={proc.id} 
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="h-16 w-16 rounded-xl bg-orange-500/10 flex items-center justify-center border-2 border-orange-500/30">
                  <Scissors size={28} className="text-orange-500" />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-white">{proc.name}</h3>
                    {!proc.active && (
                      <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        Inativo
                      </span>
                    )}
                  </div>
                  
                  {proc.description && (
                    <p className="text-sm text-gray-400 mb-2">{proc.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <DollarSign size={16} className="text-green-500" />
                      <span className="font-semibold text-green-400">{formatCurrency(proc.value)}</span>
                    </div>
                    {proc.duration && (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Clock size={16} className="text-orange-500" />
                        <span>{proc.duration} min</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleActive(proc.id)}
                    className={`p-2 rounded-lg transition-all ${proc.active ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-gray-700'}`}
                    title={proc.active ? 'Desativar' : 'Ativar'}
                  >
                    {proc.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <Link
                    to={`/procedimentos/${proc.id}`}
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
