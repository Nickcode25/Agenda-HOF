import { FormEvent, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useProcedures } from '@/store/procedures'
import { PlannedProcedure } from '@/types/patient'
import { formatCurrency } from '@/utils/currency'
import { consumeStockForProcedure, checkStockAvailability } from '@/utils/stock-integration'
import { Edit, Trash2, Plus, CheckCircle, Circle, Clock, ArrowLeft, AlertTriangle } from 'lucide-react'

export default function PatientDetail() {
  const { id } = useParams()
  const patient = usePatients(s => s.patients.find(p => p.id === id))
  const update = usePatients(s => s.update)
  const remove = usePatients(s => s.remove)
  const procedures = useProcedures(s => s.procedures)

  const [showAddProcedure, setShowAddProcedure] = useState(false)
  const [selectedProcedure, setSelectedProcedure] = useState('')
  const [procedureNotes, setProcedureNotes] = useState('')
  const [procedureQuantity, setProcedureQuantity] = useState(1)
  const [paymentType, setPaymentType] = useState<'default' | 'cash' | 'card'>('default')

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja remover ${patient?.name}?`)) {
      remove(id!)
      window.location.href = '/pacientes'
    }
  }

  const handleAddProcedure = () => {
    if (!selectedProcedure || !patient) return

    // Encontrar o procedimento selecionado para obter o valor
    const selectedProc = procedures.find(p => p.name === selectedProcedure)
    let unitValue = selectedProc?.value || 0
    
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
  }

  const handleUpdateProcedureStatus = (procId: string, status: PlannedProcedure['status']) => {
    if (!patient) return

    const procedure = patient.plannedProcedures?.find(p => p.id === procId)
    if (!procedure) return

    // Se está marcando como concluído, verificar e consumir estoque
    if (status === 'completed' && procedure.status !== 'completed') {
      // Verificar disponibilidade de estoque
      const stockCheck = checkStockAvailability(procedure.procedureName, procedure.quantity)
      
      if (!stockCheck.available) {
        const missingItems = stockCheck.missing.join('\n• ')
        alert(
          `⚠️ Estoque insuficiente para realizar este procedimento:\n\n• ${missingItems}\n\n` +
          'Verifique o estoque antes de marcar como concluído.'
        )
        return
      }

      // Consumir do estoque
      const stockResult = consumeStockForProcedure(
        procedure.procedureName,
        procedure.quantity,
        procedure.id,
        patient.id
      )

      if (!stockResult.success) {
        const errors = stockResult.errors.join('\n• ')
        alert(
          `❌ Erro ao consumir estoque:\n\n• ${errors}\n\n` +
          'O procedimento não foi marcado como concluído.'
        )
        return
      }

      // Se chegou até aqui, o estoque foi consumido com sucesso
      if (stockResult.errors.length === 0) {
        alert('✅ Procedimento concluído e estoque atualizado automaticamente!')
      }
    }

    const updated = (patient.plannedProcedures || []).map(p =>
      p.id === procId ? { ...p, status, completedAt: status === 'completed' ? new Date().toISOString() : p.completedAt } : p
    )

    update(patient.id, { plannedProcedures: updated })
  }
  const handleRemoveProcedure = (procId: string) => {
    if (!patient) return
    if (!confirm('Remover este procedimento do planejamento?')) return

    const updated = (patient.plannedProcedures || []).filter(p => p.id !== procId)
    update(patient.id, { plannedProcedures: updated })
  }

  if (!patient) return (
    <div>
      <p className="text-gray-400">Paciente não encontrado.</p>
      <Link to="/pacientes" className="text-orange-500 hover:text-orange-400 hover:underline">Voltar</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/pacientes" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-1">Detalhes do Paciente</h1>
          <p className="text-gray-400">Informações cadastrais</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Photo */}
          {patient.photoUrl ? (
            <img src={patient.photoUrl} className="h-32 w-32 rounded-xl object-cover border-2 border-orange-500" alt={patient.name} />
          ) : (
            <div className="h-32 w-32 rounded-xl bg-gray-700 flex items-center justify-center border-2 border-gray-700">
              <span className="text-gray-500 text-4xl">👤</span>
            </div>
          )}
          
          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{patient.name}</h2>
            
            <div className="space-y-2 text-sm">
              <p className="text-gray-400"><span className="font-medium">CPF:</span> {patient.cpf}</p>
              {patient.phone && <p className="text-gray-400"><span className="font-medium">Telefone:</span> {patient.phone}</p>}
              {(patient.street || patient.cep) && (
                <div className="text-gray-400">
                  <span className="font-medium">Endereço:</span>
                  <div className="ml-4 mt-1">
                    {patient.street && patient.number && (
                      <p>{patient.street}, {patient.number}{patient.complement ? `, ${patient.complement}` : ''}</p>
                    )}
                    {patient.neighborhood && <p>{patient.neighborhood}</p>}
                    {patient.city && patient.state && <p>{patient.city} - {patient.state}</p>}
                    {patient.cep && <p>CEP: {patient.cep}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clinical Data */}
        <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
          <div>
            <h3 className="font-medium mb-2 text-orange-500">Informações Clínicas</h3>
            <p className="text-gray-300">{patient.clinicalInfo || 'Nenhuma informação clínica registrada'}</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2 text-orange-500">Observações</h3>
            <p className="text-gray-300">{patient.notes || 'Nenhuma observação'}</p>
          </div>
        </div>

        {/* Planned Procedures */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-orange-500">Planejamento de Procedimentos</h3>
            <button
              onClick={() => setShowAddProcedure(!showAddProcedure)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg font-medium transition-colors border border-orange-500/30"
            >
              <Plus size={18} />
              Adicionar Procedimento
            </button>
          </div>

          {/* Add Procedure Form */}
          {showAddProcedure && (
            <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento</label>
                  <select
                    value={selectedProcedure}
                    onChange={(e) => setSelectedProcedure(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Selecione um procedimento</option>
                    {procedures.filter(p => p.active).map(proc => (
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
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as 'default' | 'cash' | 'card')}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="default">Valor à Vista</option>
                    <option value="cash">Desconto Adicional</option>
                    <option value="card">Valor Parcelado</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valor Total</label>
                  <div className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-green-400 font-medium">
                    {(() => {
                      const selectedProc = procedures.find(p => p.name === selectedProcedure)
                      let unitValue = selectedProc?.value || 0
                      
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Observações (opcional)</label>
                <textarea
                  value={procedureNotes}
                  onChange={(e) => setProcedureNotes(e.target.value)}
                  placeholder="Ex: região frontal, aplicação suave..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddProcedure}
                  disabled={!selectedProcedure}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowAddProcedure(false)
                    setSelectedProcedure('')
                    setProcedureNotes('')
                    setProcedureQuantity(1)
                    setPaymentType('default')
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Procedures List */}
          {patient.plannedProcedures && patient.plannedProcedures.filter(proc => proc.status !== 'completed').length > 0 ? (
            <div className="space-y-3">
              {patient.plannedProcedures
                .filter(proc => proc.status !== 'completed')
                .map(proc => (
                <div key={proc.id} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {proc.status === 'completed' && <CheckCircle size={20} className="text-green-400" />}
                        {proc.status === 'in_progress' && <Clock size={20} className="text-yellow-400" />}
                        {proc.status === 'pending' && <Circle size={20} className="text-gray-400" />}
                        <h4 className="font-medium text-white">{proc.procedureName}</h4>
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full">
                          {proc.quantity}x
                        </span>
                        {/* Indicador de estoque */}
                        {(() => {
                          const stockCheck = checkStockAvailability(proc.procedureName, proc.quantity)
                          if (!stockCheck.available && proc.status !== 'completed') {
                            return (
                              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                                <AlertTriangle size={12} />
                                <span>Estoque insuficiente</span>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                      
                      <div className="flex items-center gap-6 ml-8 mb-2">
                        <span className="text-sm text-gray-400">Unitário: {formatCurrency(proc.unitValue)}</span>
                        <span className="text-sm font-medium text-green-400">Total: {formatCurrency(proc.totalValue)}</span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {proc.paymentType === 'cash' ? 'Desconto' : 
                           proc.paymentType === 'card' ? 'Parcelado' : 'À Vista'}
                        </span>
                      </div>
                      
                      {proc.notes && (
                        <p className="text-sm text-gray-400 ml-8 mb-2">{proc.notes}</p>
                      )}
                      
                      <div className="flex items-center gap-4 ml-8 text-xs text-gray-500">
                        <span>Adicionado em {new Date(proc.createdAt).toLocaleDateString('pt-BR')}</span>
                        {proc.completedAt && (
                          <span>• Concluído em {new Date(proc.completedAt).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <select
                        value={proc.status}
                        onChange={(e) => handleUpdateProcedureStatus(proc.id, e.target.value as PlannedProcedure['status'])}
                        className="px-3 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="pending">Pendente</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="completed">Concluído</option>
                      </select>
                      
                      <button
                        onClick={() => handleRemoveProcedure(proc.id)}
                        className="px-3 py-1 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/30 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Total do Planejamento */}
              <div className="mt-4 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-300">Total do Planejamento:</span>
                  <span className="text-2xl font-bold text-green-400">
                    {formatCurrency(
                      patient.plannedProcedures
                        .filter(proc => proc.status !== 'completed')
                        .reduce((sum, proc) => sum + proc.totalValue, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Nenhum procedimento planejado ainda</p>
          )}
        </div>

        {/* Procedimentos Realizados */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Procedimentos Realizados</h3>
          </div>

          {patient.plannedProcedures && patient.plannedProcedures.filter(proc => proc.status === 'completed').length > 0 ? (
            <div className="space-y-4">
              {patient.plannedProcedures
                .filter(proc => proc.status === 'completed')
                .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
                .map(proc => (
                <div key={proc.id} className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-lg border border-green-500/30">
                      <CheckCircle size={20} className="text-green-400" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-white">{proc.procedureName}</h4>
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full">
                          {proc.quantity}x
                        </span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {proc.paymentType === 'cash' ? 'Desconto' :
                           proc.paymentType === 'card' ? 'Parcelado' : 'À Vista'}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 mb-2">
                        <span className="text-sm text-gray-400">Unitário: {formatCurrency(proc.unitValue)}</span>
                        <span className="text-sm font-medium text-green-400">Total: {formatCurrency(proc.totalValue)}</span>
                      </div>

                      {proc.notes && (
                        <p className="text-sm text-gray-400 mb-2">{proc.notes}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Planejado em {new Date(proc.createdAt).toLocaleDateString('pt-BR')}</span>
                        {proc.completedAt && (
                          <span className="text-green-400">• Realizado em {new Date(proc.completedAt).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveProcedure(proc.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors"
                      title="Excluir procedimento realizado"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Total dos Procedimentos Realizados */}
              <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-300">Total dos Procedimentos Realizados:</span>
                  <span className="text-2xl font-bold text-green-400">
                    {formatCurrency(
                      patient.plannedProcedures
                        .filter(proc => proc.status === 'completed')
                        .reduce((sum, proc) => sum + proc.totalValue, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-gray-500" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">Nenhum procedimento realizado</h4>
              <p className="text-gray-400">Os procedimentos concluídos aparecerão aqui automaticamente</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
          <Link
            to={`/pacientes/${patient.id}/editar`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
          >
            <Edit size={18} />
            Editar Paciente
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors border border-red-500/30"
          >
            <Trash2 size={18} />
            Remover
          </button>
        </div>
      </div>
    </div>
  )
}
