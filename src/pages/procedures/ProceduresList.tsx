import { Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, Scissors, DollarSign, Clock, ToggleLeft, ToggleRight, Edit, Syringe, Sparkles, Heart, Zap, Eye, Smile, Droplet, Star, Diamond, Gem, Flower2, Palette, Triangle } from 'lucide-react'

export default function ProceduresList() {
  const { procedures, update, fetchAll } = useProcedures(s => ({ procedures: s.procedures, update: s.update, fetchAll: s.fetchAll }))
  const [q, setQ] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return procedures
    return procedures.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    )
  }, [q, procedures])


  const getProcedureIcon = (procedureName: string) => {
    const name = procedureName.toLowerCase()
    
    // Toxina Botulínica / Botox / Full Face
    if (name.includes('botox') || name.includes('toxina') || name.includes('botulínica') || name.includes('full face')) {
      return { icon: Syringe, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' }
    }
    
    // Preenchimento
    if (name.includes('preenchimento') || name.includes('ácido hialurônico') || name.includes('hialuronico')) {
      return { icon: Droplet, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' }
    }
    
    // Harmonização Facial
    if (name.includes('harmonização') || name.includes('facial')) {
      return { icon: Sparkles, color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' }
    }
    
    // Rinomodelação
    if (name.includes('rino') || name.includes('nariz')) {
      return { icon: Triangle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' }
    }
    
    // Lábios
    if (name.includes('labial') || name.includes('lábio') || name.includes('labio')) {
      return { icon: Heart, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30' }
    }
    
    // Olheiras / Olhos
    if (name.includes('olheira') || name.includes('olho') || name.includes('pálpebra') || name.includes('palpebra')) {
      return { icon: Eye, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' }
    }
    
    // Sorriso / Gengival
    if (name.includes('sorriso') || name.includes('gengival') || name.includes('gummy')) {
      return { icon: Smile, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' }
    }
    
    // Laser / Tecnologia
    if (name.includes('laser') || name.includes('ipl') || name.includes('radiofrequência')) {
      return { icon: Zap, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' }
    }
    
    // Peeling / Tratamento de Pele
    if (name.includes('peeling') || name.includes('pele') || name.includes('acne') || name.includes('manchas')) {
      return { icon: Star, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' }
    }
    
    // Microagulhamento
    if (name.includes('microagulhamento') || name.includes('microneedling')) {
      return { icon: Gem, color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/30' }
    }
    
    // Limpeza / Hidratação
    if (name.includes('limpeza') || name.includes('hidratação') || name.includes('hidratante')) {
      return { icon: Flower2, color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' }
    }
    
    // Maquiagem / Micropigmentação
    if (name.includes('maquiagem') || name.includes('micropigmentação') || name.includes('sobrancelha')) {
      return { icon: Palette, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30' }
    }
    
    // Padrão (procedimentos não categorizados)
    return { icon: Sparkles, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' }
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
          to="/app/procedimentos/novo"
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
            to="/app/procedimentos/novo"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Cadastrar Procedimento
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(proc => {
            const iconConfig = getProcedureIcon(proc.name)
            const IconComponent = iconConfig.icon
            
            return (
              <div 
                key={proc.id} 
                className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`h-16 w-16 rounded-xl ${iconConfig.bgColor} flex items-center justify-center border-2 ${iconConfig.borderColor}`}>
                    <IconComponent size={28} className={iconConfig.color} />
                  </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-white">{proc.name}</h3>
                    {!proc.isActive && (
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
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Valor Padrão:</span>
                          <span className="font-semibold text-green-400">{formatCurrency(proc.price)}</span>
                        </div>
                        {proc.cashValue && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">À vista c/ desconto:</span>
                            <span className="text-xs text-blue-400">{formatCurrency(proc.cashValue)}</span>
                          </div>
                        )}
                        {proc.cardValue && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">Parcelado:</span>
                            <span className="text-xs text-purple-400">{formatCurrency(proc.cardValue)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {proc.durationMinutes && (
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Clock size={16} className="text-orange-500" />
                        <span>{proc.durationMinutes} min</span>
                      </div>
                    )}
                  </div>
                </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/app/procedimentos/${proc.id}/editar`}
                      className="p-2 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all border border-transparent hover:border-orange-500/30"
                      title="Editar procedimento"
                    >
                      <Edit size={18} />
                    </Link>

                    <button
                      onClick={() => update(proc.id, { isActive: !proc.isActive })}
                      className={`p-2 rounded-lg transition-all ${proc.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-gray-700'}`}
                      title={proc.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {proc.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>

                    <Link
                      to={`/app/procedimentos/${proc.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                      title="Ver detalhes"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
