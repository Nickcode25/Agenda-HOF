import { Link } from 'react-router-dom'
import { useProfessionals } from '@/store/professionals'
import { useMemo, useState, useEffect, useCallback, memo } from 'react'
import { UserPlus, Stethoscope, Phone, Mail, Award, ToggleLeft, ToggleRight, Users, CheckCircle } from 'lucide-react'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { PageHeader, SearchInput, EmptyState, StatusBadge } from '@/components/ui'

// Função utilitária movida para fora do componente
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Skeleton loader
const ProfessionalSkeleton = memo(() => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-14 w-14 rounded-lg bg-gray-200" />
      <div className="flex-1">
        <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
        <div className="flex gap-4">
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="h-4 w-28 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="h-8 w-8 bg-gray-100 rounded-lg" />
    </div>
  </div>
))

export default function ProfessionalsList() {
  const { professionals, toggleActive, fetchAll, loading, fetched } = useProfessionals(s => ({
    professionals: s.professionals,
    toggleActive: s.toggleActive,
    fetchAll: s.fetchAll,
    loading: s.loading,
    fetched: s.fetched
  }))
  const [q, setQ] = useState('')
  const { hasActiveSubscription } = useSubscription()

  useEffect(() => {
    fetchAll()
  }, [])

  // Ordenar profissionais alfabeticamente
  const sortedProfessionals = useMemo(() => {
    return [...professionals].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    )
  }, [professionals])

  const filtered = useMemo(() => {
    if (!q.trim()) return sortedProfessionals
    return sortedProfessionals.filter(p =>
      containsIgnoringAccents(p.name, q) ||
      containsIgnoringAccents(p.specialty, q) ||
      containsIgnoringAccents(p.registrationNumber, q)
    )
  }, [q, sortedProfessionals])

  // Stats calculations
  const stats = useMemo(() => {
    const total = professionals.length
    const active = professionals.filter(p => p.active).length
    return { total, active }
  }, [professionals])

  // Toggle callback memoizado
  const handleToggleActive = useCallback((id: string) => {
    toggleActive(id)
  }, [toggleActive])

  // Verificar se está carregando inicialmente
  const isInitialLoading = loading && !fetched

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8 space-y-6 relative">
      {/* Overlay de bloqueio se não tiver assinatura */}
      {!hasActiveSubscription && <UpgradeOverlay message="Profissionais bloqueados" feature="o cadastro e gestão de profissionais" />}

      {/* Header */}
      <PageHeader
        icon={Stethoscope}
        title="Profissionais"
        subtitle="Gerencie os profissionais do consultório"
        stats={[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-500' },
          { label: 'Ativos', value: stats.active, icon: CheckCircle, color: 'text-green-500' },
        ]}
        primaryAction={{
          label: 'Novo Profissional',
          icon: UserPlus,
          href: '/app/profissionais/novo'
        }}
      />

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Buscar por nome, especialidade ou registro..."
        />
      </div>

      {/* Professionals List */}
      {isInitialLoading ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-400 px-1 animate-pulse">Carregando profissionais...</div>
          {[...Array(5)].map((_, i) => (
            <ProfessionalSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="Nenhum profissional encontrado"
          description="Cadastre os profissionais que trabalham no consultório"
          action={{
            label: 'Cadastrar Profissional',
            icon: UserPlus,
            href: '/app/profissionais/novo'
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(prof => (
            <Link
              key={prof.id}
              to={`/app/profissionais/${prof.id}`}
              className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {prof.photoUrl ? (
                  <img src={prof.photoUrl} className="h-14 w-14 rounded-lg object-cover border border-gray-100" alt={prof.name} />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{getInitials(prof.name)}</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900">{prof.name}</h3>
                    {prof.active ? (
                      <StatusBadge label="Ativo" variant="success" dot />
                    ) : (
                      <StatusBadge label="Inativo" variant="error" dot />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Award size={14} className="text-orange-500" />
                      <span>{prof.specialty}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award size={14} className="text-cyan-500" />
                      <span>{prof.registrationNumber}</span>
                    </div>
                    {prof.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-orange-500" />
                        <span>{prof.phone}</span>
                      </div>
                    )}
                    {prof.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-orange-500" />
                        <span>{prof.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3" onClick={(e) => e.preventDefault()}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleToggleActive(prof.id)
                    }}
                    className={`p-2 rounded-lg transition-all ${prof.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={prof.active ? 'Desativar' : 'Ativar'}
                  >
                    {prof.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
