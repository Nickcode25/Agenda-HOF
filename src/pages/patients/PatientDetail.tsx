import { FormEvent, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { autoRegisterCashMovement } from '@/store/cash'
import { PlannedProcedure } from '@/types/patient'
import { formatCurrency } from '@/utils/currency'
import { Edit, Trash2, Plus, CheckCircle, Circle, Clock, ArrowLeft, AlertTriangle, Package, FileText, X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export default function PatientDetail() {
  const { id } = useParams()
  const patient = usePatients(s => s.patients.find(p => p.id === id))
  const update = usePatients(s => s.update)
  const remove = usePatients(s => s.remove)
  const { procedures, fetchAll: fetchProcedures } = useProcedures()
  const { items: stockItems, fetchItems } = useStock()
  const { show: showToast } = useToast()

  // Carregar procedimentos e estoque ao montar o componente
  useEffect(() => {
    fetchProcedures()
    fetchItems()
  }, [])

  const [showProcedureModal, setShowProcedureModal] = useState(false)
  const [selectedProcedure, setSelectedProcedure] = useState('')
  const [procedureNotes, setProcedureNotes] = useState('')
  const [procedureQuantity, setProcedureQuantity] = useState(1)
  const [paymentType, setPaymentType] = useState<'default' | 'cash' | 'card'>('default')

  // Modal de conclusão de procedimento
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingProcedure, setCompletingProcedure] = useState<PlannedProcedure | null>(null)
  const [selectedProductId, setSelectedProductId] = useState('')

  // Modal de edição de valor
  const [showEditValueModal, setShowEditValueModal] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<PlannedProcedure | null>(null)
  const [editedValue, setEditedValue] = useState('')
  const [editedDescription, setEditedDescription] = useState('')

  // Obter categoria e produtos disponíveis do procedimento selecionado
  const selectedProcedureData = procedures.find(p => p.name === selectedProcedure)
  const availableProducts = selectedProcedureData?.category
    ? stockItems.filter(item => item.category === selectedProcedureData.category)
    : []

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja remover ${patient?.name}?`)) {
      remove(id!)
      window.location.href = '/app/pacientes'
    }
  }

  const handleAddProcedure = () => {
    if (!selectedProcedure || !patient) return

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

    // Limpar e fechar modal
    setSelectedProcedure('')
    setProcedureNotes('')
    setProcedureQuantity(1)
    setPaymentType('default')
    setShowProcedureModal(false)
  }

  const handleUpdateProcedureStatus = (procId: string, status: PlannedProcedure['status']) => {
    if (!patient) return

    const procedure = patient.plannedProcedures?.find(p => p.id === procId)
    if (!procedure) return

    // Se está marcando como concluído, abrir modal de seleção de produto
    if (status === 'completed' && procedure.status !== 'completed') {
      setCompletingProcedure(procedure)
      setShowCompleteModal(true)
      return
    }

    // Para outros status, atualizar diretamente
    const updated = (patient.plannedProcedures || []).map(p =>
      p.id === procId ? { ...p, status, completedAt: status === 'completed' ? new Date().toISOString() : p.completedAt } : p
    )

    update(patient.id, { plannedProcedures: updated })
  }

  const handleCompleteProcedure = async () => {
    if (!patient || !completingProcedure || !selectedProductId) return

    // Buscar o produto selecionado
    const product = stockItems.find(item => item.id === selectedProductId)
    if (!product) {
      showToast('Produto não encontrado', 'error')
      return
    }

    // Verificar se há estoque suficiente
    if (product.quantity < completingProcedure.quantity) {
      showToast(`Estoque insuficiente de ${product.name}. Disponível: ${product.quantity} ${product.unit}`, 'error')
      return
    }

    // Consumir do estoque usando a função removeStock do store
    const { removeStock, fetchItems } = useStock.getState()

    console.log('🔄 Consumindo estoque:', {
      productId: selectedProductId,
      productName: product.name,
      quantity: completingProcedure.quantity,
      currentStock: product.quantity
    })

    const success = await removeStock(
      selectedProductId,
      completingProcedure.quantity,
      `Procedimento: ${completingProcedure.procedureName} - Paciente: ${patient.name}`,
      completingProcedure.id,
      patient.id
    )

    if (!success) {
      showToast('Erro ao atualizar estoque. Tente novamente.', 'error')
      return
    }

    // Forçar atualização do estoque
    console.log('✅ Estoque consumido com sucesso, atualizando...')
    await fetchItems(true)

    // Atualizar procedimento como concluído
    const updated = (patient.plannedProcedures || []).map(p =>
      p.id === completingProcedure.id ? {
        ...p,
        status: 'completed' as PlannedProcedure['status'],
        completedAt: new Date().toISOString(),
        usedProductId: selectedProductId,
        usedProductName: product.name
      } : p
    )

    update(patient.id, { plannedProcedures: updated })

    // Registrar movimentação de caixa automaticamente
    // Mapear paymentType para paymentMethod
    const paymentMethodMap: Record<string, 'cash' | 'card' | 'pix' | 'transfer' | 'check'> = {
      'default': 'pix',
      'cash': 'cash',
      'card': 'card'
    }

    await autoRegisterCashMovement({
      type: 'income',
      category: 'procedure',
      amount: completingProcedure.totalValue,
      paymentMethod: paymentMethodMap[completingProcedure.paymentType] || 'pix',
      referenceId: completingProcedure.id,
      description: `Procedimento: ${completingProcedure.procedureName} - Paciente: ${patient.name}`
    })

    // Fechar modal e limpar
    setShowCompleteModal(false)
    setCompletingProcedure(null)
    setSelectedProductId('')

    showToast('Procedimento concluído e estoque atualizado!', 'success')
  }
  const handleRemoveProcedure = (procId: string) => {
    if (!patient) return
    if (!confirm('Remover este procedimento do planejamento?')) return

    const updated = (patient.plannedProcedures || []).filter(p => p.id !== procId)
    update(patient.id, { plannedProcedures: updated })
  }

  const handleOpenEditValue = (proc: PlannedProcedure) => {
    setEditingProcedure(proc)
    setEditedValue(formatCurrency(proc.totalValue))
    setEditedDescription(proc.notes || '')
    setShowEditValueModal(true)
  }

  const handleSaveEditedValue = () => {
    if (!patient || !editingProcedure) return

    // Parse do valor editado
    const parsedValue = parseFloat(editedValue.replace(/[^\d,]/g, '').replace(',', '.'))

    if (isNaN(parsedValue) || parsedValue < 0) {
      alert('Por favor, insira um valor válido')
      return
    }

    const updated = (patient.plannedProcedures || []).map(p =>
      p.id === editingProcedure.id ? {
        ...p,
        totalValue: parsedValue,
        unitValue: parsedValue / p.quantity, // Recalcular valor unitário
        notes: editedDescription
      } : p
    )

    update(patient.id, { plannedProcedures: updated })

    setShowEditValueModal(false)
    setEditingProcedure(null)
    setEditedValue('')
    setEditedDescription('')

    showToast('Valor atualizado com sucesso!', 'success')
  }

  if (!patient) return (
    <div>
      <p className="text-gray-400">Paciente não encontrado.</p>
      <Link to="/app/pacientes" className="text-orange-500 hover:text-orange-400 hover:underline">Voltar</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/pacientes" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
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

        {/* Actions */}
        <div className="mt-6 pt-6 border-t border-gray-700 flex flex-wrap gap-3">
          <Link
            to={`/app/pacientes/${id}/prontuario`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all"
          >
            <FileText size={18} />
            Prontuário Eletrônico
          </Link>
          <button
            onClick={() => setShowProcedureModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all"
          >
            <Plus size={18} />
            Adicionar Procedimento
          </button>
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
          <div className="mb-4">
            <h3 className="font-medium text-orange-500">Planejamento de Procedimentos</h3>
          </div>

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
                        onClick={() => handleOpenEditValue(proc)}
                        className="px-3 py-1 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <Edit size={14} />
                        Editar
                      </button>

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
            to={`/app/pacientes/${patient.id}/editar`}
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

      {/* Modal Adicionar Procedimento */}
      {showProcedureModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowProcedureModal(false)}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Adicionar Procedimento</h2>
              <button
                onClick={() => setShowProcedureModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento *</label>
                    <select
                      value={selectedProcedure}
                      onChange={(e) => setSelectedProcedure(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    >
                      <option value="">Selecione um procedimento</option>
                      {procedures.filter(p => p.isActive).map(proc => (
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
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Forma de Pagamento</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as 'default' | 'cash' | 'card')}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    >
                      <option value="default">Valor à Vista</option>
                      <option value="cash">Desconto Adicional</option>
                      <option value="card">Valor Parcelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Valor Total</label>
                    <div className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-green-400 font-bold text-lg">
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

                {/* Mostrar categoria e produtos disponíveis */}
                {selectedProcedureData && (
                  <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2 mb-3">
                      <Package size={18} className="text-orange-500" />
                      <h4 className="font-medium text-white">
                        Categoria: {selectedProcedureData.category || 'Não definida'}
                      </h4>
                    </div>

                    {selectedProcedureData.category ? (
                      availableProducts.length > 0 ? (
                        <div>
                          <p className="text-sm text-gray-400 mb-3">
                            Produtos disponíveis nesta categoria:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {availableProducts.map(product => (
                              <div
                                key={product.id}
                                className="flex items-center justify-between p-3 bg-gray-600/50 rounded-lg border border-gray-500"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Estoque: {product.quantity} {product.unit}
                                  </p>
                                </div>
                                <div
                                  className={`ml-2 w-2 h-2 rounded-full ${
                                    product.quantity > product.minQuantity
                                      ? 'bg-green-500'
                                      : product.quantity > 0
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  title={
                                    product.quantity > product.minQuantity
                                      ? 'Em estoque'
                                      : product.quantity > 0
                                      ? 'Estoque baixo'
                                      : 'Sem estoque'
                                  }
                                />
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-3">
                            💡 O produto específico será escolhido automaticamente no momento da realização do procedimento
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <AlertTriangle size={16} className="text-yellow-500" />
                          <p className="text-sm text-yellow-500">
                            Nenhum produto cadastrado na categoria "{selectedProcedureData.category}".{' '}
                            <Link to="/app/estoque/novo" className="underline hover:text-yellow-400">
                              Cadastrar produto
                            </Link>
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <AlertTriangle size={16} className="text-blue-400" />
                        <p className="text-sm text-blue-400">
                          Este procedimento não possui categoria definida.{' '}
                          <Link
                            to={`/app/procedimentos/${selectedProcedureData.id}/editar`}
                            className="underline hover:text-blue-300"
                          >
                            Editar procedimento
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Observações (opcional)</label>
                  <textarea
                    value={procedureNotes}
                    onChange={(e) => setProcedureNotes(e.target.value)}
                    placeholder="Ex: região frontal, aplicação suave..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setShowProcedureModal(false)
                  setSelectedProcedure('')
                  setProcedureNotes('')
                  setProcedureQuantity(1)
                  setPaymentType('default')
                }}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProcedure}
                disabled={!selectedProcedure}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40"
              >
                Adicionar Procedimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Concluir Procedimento - Selecionar Produto */}
      {showCompleteModal && completingProcedure && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCompleteModal(false)}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white">Concluir Procedimento</h2>
                <p className="text-gray-400 mt-1">{completingProcedure.procedureName} - {completingProcedure.quantity}x</p>
              </div>
              <button
                onClick={() => {
                  setShowCompleteModal(false)
                  setCompletingProcedure(null)
                  setSelectedProductId('')
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Selecione o produto utilizado *
                  </label>

                  {(() => {
                    // Obter categoria do procedimento
                    const procedureData = procedures.find(p => p.name === completingProcedure.procedureName)
                    const categoryProducts = procedureData?.category
                      ? stockItems.filter(item => item.category === procedureData.category)
                      : []

                    if (categoryProducts.length === 0) {
                      return (
                        <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <AlertTriangle size={20} className="text-yellow-500" />
                          <p className="text-sm text-yellow-500">
                            Nenhum produto encontrado na categoria "{procedureData?.category}".
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div className="grid grid-cols-1 gap-3">
                        {categoryProducts.map(product => (
                          <label
                            key={product.id}
                            className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                              selectedProductId === product.id
                                ? 'border-orange-500 bg-orange-500/10'
                                : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="radio"
                                name="product"
                                value={product.id}
                                checked={selectedProductId === product.id}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-white">{product.name}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <p className="text-sm text-gray-400">
                                    Estoque: {product.quantity} {product.unit}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    Necessário: {completingProcedure.quantity} {product.unit}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  product.quantity >= completingProcedure.quantity
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                                }`}
                                title={
                                  product.quantity >= completingProcedure.quantity
                                    ? 'Estoque suficiente'
                                    : 'Estoque insuficiente'
                                }
                              />
                            </div>
                          </label>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                {selectedProductId && (() => {
                  const product = stockItems.find(item => item.id === selectedProductId)
                  if (product && product.quantity < completingProcedure.quantity) {
                    return (
                      <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <AlertTriangle size={20} className="text-red-500" />
                        <p className="text-sm text-red-500">
                          Estoque insuficiente. Disponível: {product.quantity} {product.unit}
                        </p>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setShowCompleteModal(false)
                  setCompletingProcedure(null)
                  setSelectedProductId('')
                }}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteProcedure}
                disabled={!selectedProductId || (() => {
                  const product = stockItems.find(item => item.id === selectedProductId)
                  return product ? product.quantity < completingProcedure.quantity : true
                })()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/40"
              >
                Concluir Procedimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Valor */}
      {showEditValueModal && editingProcedure && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">Editar Valor do Procedimento</h3>
              <button
                onClick={() => {
                  setShowEditValueModal(false)
                  setEditingProcedure(null)
                  setEditedValue('')
                  setEditedDescription('')
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <p className="text-sm text-gray-400 mb-2">Procedimento</p>
                <p className="text-white font-medium">{editingProcedure.procedureName}</p>
                <p className="text-sm text-gray-400 mt-1">Quantidade: {editingProcedure.quantity}x</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor Total (R$) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editedValue}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    const formatted = (parseInt(value || '0') / 100).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })
                    setEditedValue(formatted)
                  }}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="0,00"
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Digite apenas números. Ex: digite "10000" para R$ 100,00
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição / Observação
                </label>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  placeholder="Ex: Pagamento antecipado de R$ 100,00 para reserva da consulta"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use este campo para registrar detalhes do pagamento
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setShowEditValueModal(false)
                  setEditingProcedure(null)
                  setEditedValue('')
                  setEditedDescription('')
                }}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedValue}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
