import { Link } from 'react-router-dom'
import { useProfessionals } from '@/store/professionals'
import { useMemo, useState, useEffect } from 'react'
import { UserPlus, Stethoscope, Phone, Mail, Award, ToggleLeft, ToggleRight, Users, CheckCircle } from 'lucide-react'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { containsIgnoringAccents } from '@/utils/textSearch'
import { PageHeader, SearchInput, EmptyState, StatusBadge } from '@/components/ui'

export default function ProfessionalsList() {
  const { professionals, toggleActive, fetchAll, loading } = useProfessionals(s => ({
    professionals: s.professionals,
    toggleActive: s.toggleActive,
    fetchAll: s.fetchAll,
    loading: s.loading
  }))
  const [q, setQ] = useState('')
  const { hasActiveSubscription } = useSubscription()

  useEffect(() => {
    fetchAll()
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return professionals
    return professionals.filter(p =>
      containsIgnoringAccents(p.name, q) ||
      containsIgnoringAccents(p.specialty, q) ||
      containsIgnoringAccents(p.registrationNumber, q)
    )
  }, [q, professionals])

  // Stats calculations
  const stats = useMemo(() => {
    const total = professionals.length
    const active = professionals.filter(p => p.active).length
    return { total, active }
  }, [professionals])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

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
      {filtered.length === 0 ? (
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
        <div className="space-y-4">
          <div className="text-sm text-gray-500 px-1">
            {filtered.length} profissional{filtered.length !== 1 ? 'is' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </div>

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
                      toggleActive(prof.id)
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
