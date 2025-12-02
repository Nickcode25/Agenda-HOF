import { Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useProcedures } from '@/store/procedures'
import { PlannedProcedure, Patient } from '@/types/patient'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect, useCallback, memo } from 'react'
import { Plus, Phone, Circle, Clock, ChevronDown, ChevronUp, UserPlus, Users, FileText, MessageCircle, Calendar, TrendingUp } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { useSubscription } from '@/components/SubscriptionProtectedRoute'
import UpgradeOverlay from '@/components/UpgradeOverlay'
import AddProcedureInlineForm from './components/AddProcedureInlineForm'
import { PageHeader, SearchInput, EmptyState, StatusBadge } from '@/components/ui'
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
  isExpanded: boolean
  showAddProcedure: boolean
  procedures: any[]
  onToggleExpanded: (id: string) => void
  onToggleAddProcedure: (id: string | null) => void
  onWhatsApp: (name: string, phone?: string) => void
  onAddProcedure: (patientId: string, data: any) => void
  onUpdateProcedureStatus: (patientId: string, procId: string, status: PlannedProcedure['status']) => void
  onRemoveProcedure: (patientId: string, procId: string) => void
}

const PatientCard = memo(({
  patient: p,
  isExpanded,
  showAddProcedure,
  procedures,
  onToggleExpanded,
  onToggleAddProcedure,
  onWhatsApp,
  onAddProcedure,
  onUpdateProcedureStatus,
  onRemoveProcedure
}: PatientCardProps) => {
  const [selectedProcedure, setSelectedProcedure] = useState('')
  const [procedureNotes, setProcedureNotes] = useState('')
  const [procedureQuantity, setProcedureQuantity] = useState(1)
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'card' | 'credit_card_1x' | 'debit_card'>('cash')
  const [installments, setInstallments] = useState(1)

  const patientProcedures = useMemo(() =>
    Array.isArray(p.plannedProcedures) ? p.plannedProcedures : [],
    [p.plannedProcedures]
  )

  const counts = useMemo(() => ({
    pending: patientProcedures.filter(proc => proc.status === 'pending').length,
    inProgress: patientProcedures.filter(proc => proc.status === 'in_progress').length,
    completed: patientProcedures.filter(proc => proc.status === 'completed').length
  }), [patientProcedures])

  const handleSubmitProcedure = useCallback(() => {
    if (!selectedProcedure) return
    const selectedProc = procedures.find(proc => proc.name === selectedProcedure)
    const unitValue = selectedProc?.price || 0
    onAddProcedure(p.id, {
      procedureName: selectedProcedure,
      quantity: procedureQuantity,
      unitValue,
      totalValue: procedureQuantity * unitValue,
      paymentType,
      paymentMethod,
      installments,
      notes: procedureNotes
    })
    setSelectedProcedure('')
    setProcedureNotes('')
    setProcedureQuantity(1)
    setPaymentType('cash')
    setPaymentMethod('cash')
    setInstallments(1)
    onToggleAddProcedure(null)
  }, [selectedProcedure, procedureQuantity, paymentType, paymentMethod, installments, procedureNotes, procedures, p.id, onAddProcedure, onToggleAddProcedure])

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all">
      {/* Main Card */}
      <Link to={`/app/pacientes/${p.id}`} className="block p-5 cursor-pointer hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {p.photoUrl ? (
            <img src={p.photoUrl} className="h-14 w-14 rounded-lg object-cover border border-gray-100" alt={p.name} />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{getInitials(p.name)}</span>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-semibold text-gray-900">{p.name}</h3>
              <div className="flex items-center gap-1.5">
                {counts.pending > 0 && (
                  <StatusBadge label={`${counts.pending} pendente${counts.pending > 1 ? 's' : ''}`} variant="warning" />
                )}
                {counts.inProgress > 0 && (
                  <StatusBadge label={`${counts.inProgress} em andamento`} variant="info" />
                )}
                {counts.completed > 0 && (
                  <StatusBadge label={`${counts.completed} realizado${counts.completed > 1 ? 's' : ''}`} variant="success" />
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <FileText size={14} className="text-orange-500" />
                <span>{p.cpf}</span>
              </div>
              {p.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-orange-500" />
                  <span>{p.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
            {p.phone && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onWhatsApp(p.name, p.phone)
                }}
                className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                title="Enviar mensagem no WhatsApp"
              >
                <MessageCircle size={18} />
              </button>
            )}

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleAddProcedure(showAddProcedure ? null : p.id)
              }}
              className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors"
              title="Adicionar procedimento"
            >
              <Plus size={18} />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleExpanded(p.id)
              }}
              className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
              title={isExpanded ? "Recolher planejamento" : "Expandir planejamento"}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </Link>

      {/* Add Procedure Form */}
      {showAddProcedure && (
        <div className="border-t border-gray-100 bg-gray-50 p-5">
          <AddProcedureInlineForm
            selectedProcedure={selectedProcedure}
            procedureNotes={procedureNotes}
            procedureQuantity={procedureQuantity}
            paymentType={paymentType}
            procedures={procedures}
            onProcedureChange={setSelectedProcedure}
            onNotesChange={setProcedureNotes}
            onQuantityChange={setProcedureQuantity}
            onPaymentTypeChange={(type) => {
              setPaymentType(type)
              if (type === 'cash') {
                setPaymentMethod('cash')
                setInstallments(1)
              } else {
                setPaymentMethod('card')
              }
            }}
            onSubmit={handleSubmitProcedure}
            onCancel={() => {
              onToggleAddProcedure(null)
              setSelectedProcedure('')
              setProcedureNotes('')
              setProcedureQuantity(1)
              setPaymentType('cash')
              setPaymentMethod('cash')
              setInstallments(1)
            }}
          />
        </div>
      )}

      {/* Expanded Planning Section */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50/50">
          <div className="pt-4">
            <h4 className="text-sm font-semibold text-orange-600 mb-3">Planejamento de Procedimentos</h4>

            {patientProcedures.filter(proc => proc.status !== 'completed').length > 0 ? (
              <div className="space-y-3">
                {patientProcedures
                  .filter(proc => proc.status !== 'completed')
                  .map(proc => (
                  <div key={proc.id} className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {proc.status === 'in_progress' && <Clock size={16} className="text-blue-500 mt-0.5" />}
                        {proc.status === 'pending' && <Circle size={16} className="text-gray-400 mt-0.5" />}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">{proc.procedureName}</p>
                            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full font-medium">
                              {proc.quantity}x
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-1">
                            <span>Unit: {formatCurrency(proc.unitValue)}</span>
                            <span className="text-green-600 font-medium">Total: {formatCurrency(proc.totalValue)}</span>
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                              {proc.paymentType === 'cash'
                                ? proc.paymentMethod === 'cash'
                                  ? 'Dinheiro'
                                  : proc.paymentMethod === 'pix'
                                  ? 'PIX'
                                  : 'À Vista'
                                : proc.installments > 1
                                ? `Cartão ${proc.installments}x`
                                : 'Cartão à Vista'}
                            </span>
                          </div>

                          {proc.notes && (
                            <p className="text-xs text-gray-500">{proc.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <select
                          value={proc.status}
                          onChange={(e) => onUpdateProcedureStatus(p.id, proc.id, e.target.value as PlannedProcedure['status'])}
                          className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-900 focus:outline-none focus:border-orange-500"
                        >
                          <option value="pending">Pendente</option>
                          <option value="in_progress">Em Andamento</option>
                          <option value="completed">Concluído</option>
                        </select>

                        <button
                          onClick={() => onRemoveProcedure(p.id, proc.id)}
                          className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total do Planejamento */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total do Planejamento:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(
                        patientProcedures
                          .filter(proc => proc.status !== 'completed')
                          .reduce((sum, proc) => sum + proc.totalValue, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum procedimento planejado</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

export default function PatientsList() {
  // Consolidar selectors para evitar múltiplos re-renders
  const { patients, loading, fetched, update, fetchPatients } = usePatients(s => ({
    patients: s.patients,
    loading: s.loading,
    fetched: s.fetched,
    update: s.update,
    fetchPatients: s.fetchAll
  }))
  const procedures = useProcedures(s => s.procedures)
  const fetchProcedures = useProcedures(s => s.fetchAll)
  const { hasActiveSubscription } = useSubscription()
  const { show: showToast } = useToast()

  useEffect(() => {
    fetchPatients()
    fetchProcedures()
  }, [fetchPatients, fetchProcedures])

  const [q, setQ] = useState('')
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set())
  const [showAddProcedure, setShowAddProcedure] = useState<string | null>(null)

  const { confirm, ConfirmDialog } = useConfirm()

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

  // Callbacks memoizados para evitar re-renders
  const toggleExpanded = useCallback((patientId: string) => {
    setExpandedPatients(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(patientId)) {
        newExpanded.delete(patientId)
      } else {
        newExpanded.add(patientId)
      }
      return newExpanded
    })
  }, [])

  const handleAddProcedure = useCallback((patientId: string, data: any) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return

    const newPlannedProcedure: PlannedProcedure = {
      id: crypto.randomUUID(),
      procedureName: data.procedureName,
      quantity: data.quantity,
      unitValue: data.unitValue,
      totalValue: data.totalValue,
      paymentType: data.paymentType,
      paymentMethod: data.paymentMethod,
      installments: data.installments,
      status: 'pending',
      notes: data.notes,
      createdAt: new Date().toISOString()
    }

    const currentPlanned = patient.plannedProcedures || []
    update(patient.id, {
      plannedProcedures: [...currentPlanned, newPlannedProcedure]
    })
  }, [patients, update])

  const handleUpdateProcedureStatus = useCallback((patientId: string, procId: string, status: PlannedProcedure['status']) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return

    const updated = (patient.plannedProcedures || []).map(p =>
      p.id === procId
        ? { ...p, status, completedAt: status === 'completed' ? new Date().toISOString() : undefined }
        : p
    )

    update(patient.id, { plannedProcedures: updated })
  }, [patients, update])

  const handleRemoveProcedure = useCallback(async (patientId: string, procId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return
    if (!(await confirm({ title: 'Confirmação', message: 'Remover este procedimento do planejamento?' }))) return

    const updated = (patient.plannedProcedures || []).filter(p => p.id !== procId)
    update(patient.id, { plannedProcedures: updated })
  }, [patients, update, confirm])

  const handleWhatsApp = useCallback((_patientName: string, patientPhone?: string) => {
    if (!patientPhone) {
      showToast('Paciente não possui telefone cadastrado', 'warning')
      return
    }
    window.open(getWhatsAppUrl(patientPhone), '_blank')
  }, [showToast])

  const handleToggleAddProcedure = useCallback((id: string | null) => {
    setShowAddProcedure(id)
  }, [])

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

          {filtered.map(p => (
            <PatientCard
              key={p.id}
              patient={p}
              isExpanded={expandedPatients.has(p.id)}
              showAddProcedure={showAddProcedure === p.id}
              procedures={procedures}
              onToggleExpanded={toggleExpanded}
              onToggleAddProcedure={handleToggleAddProcedure}
              onWhatsApp={handleWhatsApp}
              onAddProcedure={handleAddProcedure}
              onUpdateProcedureStatus={handleUpdateProcedureStatus}
              onRemoveProcedure={handleRemoveProcedure}
            />
          ))}
        </div>
      )}
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
