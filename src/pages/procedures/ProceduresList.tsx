import { Link } from 'react-router-dom'
import { useProcedures } from '@/store/procedures'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect } from 'react'
import { Plus, DollarSign, Clock, ToggleLeft, ToggleRight, Edit, Syringe, Sparkles, Heart, Zap, Eye, Smile, Droplet, Star, Gem, Flower2, Palette, Triangle, Tag, CheckCircle } from 'lucide-react'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { PageHeader, SearchInput, EmptyState, StatusBadge } from '@/components/ui'

export default function ProceduresList() {
  const { procedures, update, fetchAll } = useProcedures(s => ({ procedures: s.procedures, update: s.update, fetchAll: s.fetchAll }))
  const [q, setQ] = useState('')
  const { hasActiveSubscription } = useSubscription()

  useEffect(() => {
    fetchAll()
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return procedures
    return procedures.filter(p =>
      containsIgnoringAccents(p.name, q) ||
      containsIgnoringAccents(p.description || '', q)
    )
  }, [q, procedures])

  // Stats calculations
  const stats = useMemo(() => {
    const total = procedures.length
    const active = procedures.filter(p => p.isActive).length
    const avgPrice = procedures.length > 0
      ? procedures.reduce((sum, p) => sum + p.price, 0) / procedures.length
      : 0

    return { total, active, avgPrice }
  }, [procedures])


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
    <div className="min-h-screen bg-gray-50 -m-8 p-8 space-y-6 relative">
      {/* Overlay de bloqueio se não tiver assinatura */}
      {!hasActiveSubscription && <UpgradeOverlay message="Procedimentos bloqueados" feature="o cadastro e gestão de procedimentos" />}

      {/* Header */}
      <PageHeader
        icon={Sparkles}
        title="Procedimentos"
        subtitle="Gerencie os procedimentos do consultório"
        stats={[
          { label: 'Total', value: stats.total, icon: Sparkles, color: 'text-purple-500' },
          { label: 'Ativos', value: stats.active, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Preço médio', value: formatCurrency(stats.avgPrice), icon: DollarSign, color: 'text-green-500' }
        ]}
        secondaryAction={{
          label: 'Categorias',
          icon: Tag,
          href: '/app/procedimentos/categorias'
        }}
        primaryAction={{
          label: 'Novo Procedimento',
          icon: Plus,
          href: '/app/procedimentos/novo'
        }}
      />

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Buscar procedimento..."
        />
      </div>

      {/* Procedures List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nenhum procedimento encontrado"
          description="Cadastre os procedimentos oferecidos pelo consultório"
          action={{
            label: 'Cadastrar Procedimento',
            icon: Plus,
            href: '/app/procedimentos/novo'
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 px-1">
            {filtered.length} procedimento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </div>

          {filtered.map(proc => {
            const iconConfig = getProcedureIcon(proc.name)
            const IconComponent = iconConfig.icon

            return (
              <Link
                key={proc.id}
                to={`/app/procedimentos/${proc.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`h-14 w-14 rounded-lg ${iconConfig.bgColor.replace('/10', '-50')} flex items-center justify-center border ${iconConfig.borderColor.replace('/30', '-200')}`}>
                    <IconComponent size={24} className={iconConfig.color.replace('-400', '-500')} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900">{proc.name}</h3>
                      {proc.isActive ? (
                        <StatusBadge label="Ativo" variant="success" dot />
                      ) : (
                        <StatusBadge label="Inativo" variant="error" dot />
                      )}
                    </div>

                    {proc.description && (
                      <p className="text-sm text-gray-500 mb-2">{proc.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <DollarSign size={16} className="text-green-500" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Valor Padrão:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(proc.price)}</span>
                          </div>
                          {proc.cashValue && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">À vista c/ desconto:</span>
                              <span className="text-xs text-blue-600">{formatCurrency(proc.cashValue)}</span>
                            </div>
                          )}
                          {proc.cardValue && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500">Parcelado:</span>
                              <span className="text-xs text-purple-600">{formatCurrency(proc.cardValue)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {proc.durationMinutes && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Clock size={16} className="text-orange-500" />
                          <span>{proc.durationMinutes} min</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                    <Link
                      to={`/app/procedimentos/${proc.id}/editar`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                      title="Editar procedimento"
                    >
                      <Edit size={18} />
                    </Link>

                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        update(proc.id, { isActive: !proc.isActive })
                      }}
                      className={`p-2 rounded-lg transition-all ${proc.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                      title={proc.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {proc.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
