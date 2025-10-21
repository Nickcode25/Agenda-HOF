import { Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useProcedures } from '@/store/procedures'
import { PlannedProcedure } from '@/types/patient'
import { formatCurrency } from '@/utils/currency'
import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, User, Phone, MapPin, Calendar, CheckCircle, Circle, Clock, ChevronDown, ChevronUp, UserPlus, Users, FileText, MessageCircle } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'

export default function PatientsList() {
  const patients = usePatients(s => s.patients)
  const update = usePatients(s => s.update)
  const fetchPatients = usePatients(s => s.fetchAll)
  const procedures = useProcedures(s => s.procedures)
  const fetchProcedures = useProcedures(s => s.fetchAll)

  useEffect(() => {
    fetchPatients()
    fetchProcedures()
  }, [])
  const [q, setQ] = useState('')
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set())
  const [showAddProcedure, setShowAddProcedure] = useState<string | null>(null)
  const [selectedProcedure, setSelectedProcedure] = useState('')
  const [procedureNotes, setProcedureNotes] = useState('')
  const [procedureQuantity, setProcedureQuantity] = useState(1)
  const [paymentType, setPaymentType] = useState<'default' | 'cash' | 'card'>('default')

  // Função para remover acentos
  const { confirm, ConfirmDialog } = useConfirm()

  const removeAccents = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()

    // Primeiro, ordenar todos os pacientes alfabeticamente
    const sortedPatients = [...patients].sort((a, b) => {
      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    })

    if (!query) {
      return sortedPatients
    }

    const normalizedQuery = removeAccents(query)

    const result = sortedPatients.filter(p => {
      const normalizedName = removeAccents(p.name.toLowerCase())

      // Dividir o nome em palavras para buscar no início de cada palavra
      const nameWords = normalizedName.split(' ')
      const matchesNameWord = nameWords.some(word => word.startsWith(normalizedQuery))
      const matchName = matchesNameWord || normalizedName.startsWith(normalizedQuery)

      // Só busca no CPF/telefone se a query tiver números
      const normalizedQueryCpf = query.replace(/\D/g, '')
      let matchCpf = false
      let matchPhone = false

      if (normalizedQueryCpf.length > 0) {
        const normalizedCpf = p.cpf.replace(/\D/g, '')
        matchCpf = normalizedCpf.includes(normalizedQueryCpf)
        matchPhone = p.phone ? p.phone.replace(/\D/g, '').includes(normalizedQueryCpf) : false
      }

      return matchName || matchCpf || matchPhone
    })

    return result
  }, [q, patients])

  const toggleExpanded = async (patientId: string) => {
    const newExpanded = new Set(expandedPatients)
    if (newExpanded.has(patientId)) {
      newExpanded.delete(patientId)
    } else {
      newExpanded.add(patientId)
    }
    setExpandedPatients(newExpanded)
  }

  const handleAddProcedure = async (patientId: string) => {
    if (!selectedProcedure) return

    const patient = patients.find(p => p.id === patientId)
    if (!patient) return

    // Encontrar o procedimento selecionado para obter o valor
    const selectedProc = procedures.find(p => p.name === selectedProcedure)
    let unitValue = selectedProc?.price || 0

    // Ajustar valor baseado no tipo de pagamento
    if (paymentType === 'cash' && selectedProc?.cashValue) {
      unitValue = selectedProc.cashValue
    } else if (paymentType === 'card' && selectedProc?.cardValue) {
      unitValue = selectedProc.cardValue
    }
    
    const totalValue = procedureQuantity * unitValue

    const newPlannedProcedure: PlannedProcedure = {
      id: crypto.randomUUID(),
      procedureName: selectedProcedure,
      quantity: procedureQuantity,
      unitValue,
      totalValue,
      paymentType,
      status: 'pending',
      notes: procedureNotes,
      createdAt: new Date().toISOString()
    }

    const currentPlanned = patient.plannedProcedures || []
    update(patient.id, {
      plannedProcedures: [...currentPlanned, newPlannedProcedure]
    })

    setSelectedProcedure('')
    setProcedureNotes('')
    setProcedureQuantity(1)
    setPaymentType('default')
    setShowAddProcedure(null)
  }

  const handleUpdateProcedureStatus = async (patientId: string, procId: string, status: PlannedProcedure['status']) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return

    const updated = (patient.plannedProcedures || []).map(p =>
      p.id === procId
        ? { ...p, status, completedAt: status === 'completed' ? new Date().toISOString() : undefined }
        : p
    )

    update(patient.id, { plannedProcedures: updated })
  }

  const handleRemoveProcedure = async (patientId: string, procId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return
    if (!(await confirm({ title: 'Confirmação', message: 'Remover este procedimento do planejamento?' }))) return

    const updated = (patient.plannedProcedures || []).filter(p => p.id !== procId)
    update(patient.id, { plannedProcedures: updated })
  }

  const handleWhatsApp = (patientName: string, patientPhone?: string) => {
    if (!patientPhone) {
      alert('Paciente não possui telefone cadastrado')
      return
    }

    const message = `Olá ${patientName}! Tudo bem?\n\nEstamos entrando em contato para saber como você está. Qualquer dúvida, estamos à disposição!`

    const cleanPhone = patientPhone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`

    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Users size={32} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Pacientes</h1>
                <p className="text-gray-400">Gerencie seus pacientes e planejamentos</p>
              </div>
            </div>
            <Link
              to="/app/pacientes/novo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 whitespace-nowrap"
            >
              <UserPlus size={20} />
              Novo Paciente
            </Link>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Buscar por nome ou CPF..."
              className="w-full bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      {filtered.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-12 text-center">
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <Users size={40} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhum paciente encontrado</h3>
            <p className="text-gray-400 mb-6">Tente ajustar sua busca ou cadastre um novo paciente</p>
            <Link
              to="/app/pacientes/novo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
            >
              <UserPlus size={18} />
              Cadastrar Paciente
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(p => {
            const isExpanded = expandedPatients.has(p.id)
            const plannedCount = p.plannedProcedures?.filter(proc => proc.status !== 'completed').length || 0
            const pendingCount = p.plannedProcedures?.filter(proc => proc.status === 'pending').length || 0
            const inProgressCount = p.plannedProcedures?.filter(proc => proc.status === 'in_progress').length || 0
            const completedCount = p.plannedProcedures?.filter(proc => proc.status === 'completed').length || 0

            return (
              <div key={p.id} className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden hover:border-gray-600/80 transition-all duration-300">
                {/* Main Card */}
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Photo */}
                    {p.photoUrl ? (
                      <img src={p.photoUrl} className="h-16 w-16 rounded-xl object-cover border-2 border-gray-700" alt={p.name} />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gray-700 flex items-center justify-center border-2 border-gray-700">
                        <Users size={28} className="text-gray-500" />
                      </div>
                    )}
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Link to={`/app/pacientes/${p.id}`} className="text-lg font-semibold text-white hover:text-orange-400 transition-colors">
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-2 text-xs">
                          {plannedCount > 0 && (
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full">
                              {plannedCount} planejado{plannedCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {pendingCount > 0 && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {inProgressCount > 0 && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                              {inProgressCount} em andamento
                            </span>
                          )}
                          {completedCount > 0 && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                              {completedCount} realizado{completedCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
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
                    <div className="flex items-center gap-2">
                      {p.phone && (
                        <button
                          onClick={() => handleWhatsApp(p.name, p.phone)}
                          className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-green-500/30"
                          title="Enviar mensagem no WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </button>
                      )}

                      <button
                        onClick={() => setShowAddProcedure(showAddProcedure === p.id ? null : p.id)}
                        className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors border border-orange-500/30"
                        title="Adicionar procedimento"
                      >
                        <Plus size={18} />
                      </button>

                      <button
                        onClick={() => toggleExpanded(p.id)}
                        className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                        title={isExpanded ? "Recolher planejamento" : "Expandir planejamento"}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      <Link
                        to={`/app/pacientes/${p.id}`}
                        className="p-2 hover:bg-gray-700 text-gray-400 hover:text-orange-400 rounded-lg transition-colors"
                        title="Ver ficha completa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Add Procedure Form */}
                {showAddProcedure === p.id && (
                  <div className="px-6 pb-4">
                    <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento</label>
                          <select
                            value={selectedProcedure}
                            onChange={(e) => setSelectedProcedure(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                          >
                            <option value="">Selecione um procedimento</option>
                            {procedures.filter(proc => proc.isActive).map(proc => (
                              <option key={proc.id} value={proc.name}>
                                {proc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade</label>
                          <input
                            type="number"
                            min="1"
                            value={procedureQuantity}
                            onChange={(e) => setProcedureQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
                          <select
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value as 'default' | 'cash' | 'card')}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                          >
                            <option value="default">Valor à Vista</option>
                            <option value="cash">Desconto Adicional</option>
                            <option value="card">Valor Parcelado</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Valor Total</label>
                          <div className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-green-400 text-sm font-medium">
                            {(() => {
                              const selectedProc = procedures.find(p => p.name === selectedProcedure)
                              let unitValue = selectedProc?.price || 0

                              if (paymentType === 'cash' && selectedProc?.cashValue) {
                                unitValue = selectedProc.cashValue
                              } else if (paymentType === 'card' && selectedProc?.cardValue) {
                                unitValue = selectedProc.cardValue
                              }

                              return formatCurrency(procedureQuantity * unitValue)
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                        <input
                          type="text"
                          value={procedureNotes}
                          onChange={(e) => setProcedureNotes(e.target.value)}
                          placeholder="Ex: região frontal, aplicação suave..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddProcedure(p.id)}
                          disabled={!selectedProcedure}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Adicionar
                        </button>
                        <button
                          onClick={() => {
                            setShowAddProcedure(null)
                            setSelectedProcedure('')
                            setProcedureNotes('')
                            setProcedureQuantity(1)
                            setPaymentType('default')
                          }}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expanded Planning Section */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-700">
                    <div className="pt-4">
                      <h4 className="text-sm font-medium text-orange-400 mb-3">Planejamento de Procedimentos</h4>
                      
                      {p.plannedProcedures && p.plannedProcedures.filter(proc => proc.status !== 'completed').length > 0 ? (
                        <div className="space-y-3">
                          {p.plannedProcedures
                            .filter(proc => proc.status !== 'completed')
                            .map(proc => (
                            <div key={proc.id} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                  {proc.status === 'in_progress' && <Clock size={16} className="text-yellow-400 mt-0.5" />}
                                  {proc.status === 'pending' && <Circle size={16} className="text-gray-400 mt-0.5" />}
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium text-white">{proc.procedureName}</p>
                                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                                        {proc.quantity}x
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-1">
                                      <span>Unit: {formatCurrency(proc.unitValue)}</span>
                                      <span className="text-green-400 font-medium">Total: {formatCurrency(proc.totalValue)}</span>
                                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                                        {proc.paymentType === 'cash' ? 'Desconto' : 
                                         proc.paymentType === 'card' ? 'Parcelado' : 'À Vista'}
                                      </span>
                                    </div>
                                    
                                    {proc.notes && (
                                      <p className="text-xs text-gray-400">{proc.notes}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <select
                                    value={proc.status}
                                    onChange={(e) => handleUpdateProcedureStatus(p.id, proc.id, e.target.value as PlannedProcedure['status'])}
                                    className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                                  >
                                    <option value="pending">Pendente</option>
                                    <option value="in_progress">Em Andamento</option>
                                    <option value="completed">Concluído</option>
                                  </select>
                                  
                                  <button
                                    onClick={() => handleRemoveProcedure(p.id, proc.id)}
                                    className="px-2 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/30 transition-colors"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Total do Planejamento */}
                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-300">Total do Planejamento:</span>
                              <span className="text-lg font-bold text-green-400">
                                {formatCurrency(
                                  p.plannedProcedures
                                    .filter(proc => proc.status !== 'completed')
                                    .reduce((sum, proc) => sum + proc.totalValue, 0)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">Nenhum procedimento planejado</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
