import { Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { Patient } from '@/types/patient'
import { useMemo, useState, useEffect, useCallback, memo } from 'react'
import { Phone, UserPlus, Users, Calendar, TrendingUp } from 'lucide-react'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import { PageHeader, SearchInput, EmptyState } from '@/components/ui'
import { getWhatsAppUrl } from '@/utils/env'
import { useToast } from '@/hooks/useToast'

// Função para remover acentos - movida para fora do componente
const removeAccents = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Função para obter iniciais - movida para fora do componente
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Skeleton loader para lista de pacientes
const PatientSkeleton = memo(() => (
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
      <div className="flex gap-2">
        <div className="h-9 w-9 bg-gray-100 rounded-lg" />
        <div className="h-9 w-9 bg-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
))

// Componente de card do paciente memoizado
interface PatientCardProps {
  patient: Patient
  onWhatsApp: (name: string, phone?: string) => void
}

const PatientCard = memo(({
  patient: p,
  onWhatsApp
}: PatientCardProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all">
      <Link to={`/app/pacientes/${p.id}`} className="block px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {p.photoUrl ? (
            <img src={p.photoUrl} className="h-10 w-10 rounded-lg object-cover border border-gray-100" alt={p.name} />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{getInitials(p.name)}</span>
            </div>
          )}

          {/* Nome */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{p.name}</h3>
          </div>

          {/* Telefone + WhatsApp */}
          {p.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={14} className="text-gray-400" />
              <span>{p.phone}</span>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onWhatsApp(p.name, p.phone)
                }}
                className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                title="Enviar mensagem no WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
})

export default function PatientsList() {
  // Consolidar selectors para evitar múltiplos re-renders
  const { patients, loading, fetched, fetchPatients } = usePatients(s => ({
    patients: s.patients,
    loading: s.loading,
    fetched: s.fetched,
    fetchPatients: s.fetchAll
  }))
  const { hasActiveSubscription } = useSubscription()
  const { show: showToast } = useToast()

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const [q, setQ] = useState('')

  // Ordenar pacientes uma única vez (memoizado)
  const sortedPatients = useMemo(() => {
    const safePatients = Array.isArray(patients) ? patients : []
    return [...safePatients].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    )
  }, [patients])

  // Filtrar pacientes (memoizado)
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return sortedPatients

    const normalizedQuery = removeAccents(query)
    const normalizedQueryCpf = query.replace(/\D/g, '')

    return sortedPatients.filter(p => {
      const normalizedName = removeAccents(p.name.toLowerCase())
      const nameWords = normalizedName.split(' ')
      const matchesNameWord = nameWords.some(word => word.startsWith(normalizedQuery))
      const matchName = matchesNameWord || normalizedName.startsWith(normalizedQuery)

      if (normalizedQueryCpf.length > 0) {
        const matchCpf = p.cpf.replace(/\D/g, '').includes(normalizedQueryCpf)
        const matchPhone = p.phone?.replace(/\D/g, '').includes(normalizedQueryCpf) || false
        return matchName || matchCpf || matchPhone
      }

      return matchName
    })
  }, [q, sortedPatients])

  // Callback memoizado para WhatsApp
  const handleWhatsApp = useCallback((_patientName: string, patientPhone?: string) => {
    if (!patientPhone) {
      showToast('Paciente não possui telefone cadastrado', 'warning')
      return
    }
    window.open(getWhatsAppUrl(patientPhone), '_blank')
  }, [showToast])

  // Stats calculations - otimizado
  const stats = useMemo(() => {
    const safePatients = Array.isArray(patients) ? patients : []
    const total = safePatients.length
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let withProcedures = 0
    let activeThisMonth = 0

    for (const p of safePatients) {
      const procs = Array.isArray(p.plannedProcedures) ? p.plannedProcedures : []
      if (procs.length > 0) {
        withProcedures++
        for (const proc of procs) {
          if (proc.createdAt) {
            const date = new Date(proc.createdAt)
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
              activeThisMonth++
              break
            }
          }
        }
      }
    }

    return { total, withProcedures, activeThisMonth }
  }, [patients])

  // Verificar se está carregando inicialmente
  const isInitialLoading = loading && !fetched

  return (
    <>
    <div className="min-h-screen bg-gray-50 -m-8 p-8 space-y-6 relative">
      {/* Overlay de bloqueio se não tiver assinatura */}
      {!hasActiveSubscription && <UpgradeOverlay message="Pacientes bloqueados" feature="o cadastro e gestão completa de pacientes" />}

      {/* Header */}
      <PageHeader
        icon={Users}
        title="Pacientes"
        subtitle="Gerencie seus pacientes e planejamentos"
        stats={[
          { label: 'Total', value: stats.total, icon: Users, color: 'text-blue-500' },
          { label: 'Com procedimentos', value: stats.withProcedures, icon: Calendar, color: 'text-green-500' },
          { label: 'Ativos este mês', value: stats.activeThisMonth, icon: TrendingUp, color: 'text-orange-500' }
        ]}
        primaryAction={{
          label: 'Novo Paciente',
          icon: UserPlus,
          href: '/app/pacientes/novo'
        }}
      />

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Buscar por nome, CPF ou telefone..."
        />
      </div>

      {/* Patients List */}
      {isInitialLoading ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-400 px-1 animate-pulse">Carregando pacientes...</div>
          {[...Array(8)].map((_, i) => (
            <PatientSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum paciente encontrado"
          description="Tente ajustar sua busca ou cadastre um novo paciente"
          action={{
            label: 'Cadastrar Paciente',
            icon: UserPlus,
            href: '/app/pacientes/novo'
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 px-1">
            {filtered.length} paciente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(p => (
              <PatientCard
                key={p.id}
                patient={p}
                onWhatsApp={handleWhatsApp}
              />
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
