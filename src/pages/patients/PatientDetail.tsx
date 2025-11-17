import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { autoRegisterCashMovement, removeCashMovementByReference, useCash } from '@/store/cash'
import { PlannedProcedure, ProcedurePhoto } from '@/types/patient'
import { formatCurrency } from '@/utils/currency'
import { Edit, Trash2, Plus, CheckCircle, Circle, Clock, FileText, Image as ImageIcon, Phone, Calendar, Link as LinkIcon, MoreHorizontal } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import AddProcedureModal from './components/AddProcedureModal'
import CompleteProcedureModal from './components/CompleteProcedureModal'
import EditValueModal from './components/EditValueModal'
import PhotoGalleryModal from './components/PhotoGalleryModal'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patient = usePatients(s => s.patients.find(p => p.id === id))
  const update = usePatients(s => s.update)
  const remove = usePatients(s => s.remove)
  const { procedures, fetchAll: fetchProcedures } = useProcedures()
  const { items: stockItems, fetchItems } = useStock()
  const { movements, updateMovement, fetchMovements } = useCash()
  const { show: showToast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [showProcedureModal, setShowProcedureModal] = useState(false)
  const [selectedProcedure, setSelectedProcedure] = useState('')
  const [procedureNotes, setProcedureNotes] = useState('')
  const [procedureQuantity, setProcedureQuantity] = useState(1)
  const [quantityInput, setQuantityInput] = useState('1')
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'card'>('cash')
  const [installments, setInstallments] = useState(1)
  const [customValue, setCustomValue] = useState('')
  const [isEditingValue, setIsEditingValue] = useState(false)

  useEffect(() => {
    fetchProcedures()
    fetchItems()
  }, [])

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/app/pacientes')
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate])

  useEffect(() => {
    if (isEditingValue) {
      setIsEditingValue(false)
      setCustomValue('')
    }
  }, [procedureQuantity, selectedProcedure, paymentType, paymentMethod, installments])

  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingProcedure, setCompletingProcedure] = useState<PlannedProcedure | null>(null)
  const [selectedProductId, setSelectedProductId] = useState('')

  const [beforePhotos, setBeforePhotos] = useState<string[]>([])
  const [afterPhotos, setAfterPhotos] = useState<string[]>([])
  const [photoNotes, setPhotoNotes] = useState('')

  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [selectedProcedurePhotos, setSelectedProcedurePhotos] = useState<PlannedProcedure | null>(null)

  const [showEditValueModal, setShowEditValueModal] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<PlannedProcedure | null>(null)
  const [editedValue, setEditedValue] = useState('')
  const [editedDescription, setEditedDescription] = useState('')

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Remover Paciente',
      message: `Tem certeza que deseja remover ${patient?.name}? Esta ação não pode ser desfeita.`,
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    })

    if (confirmed && id) {
      try {
        await remove(id)
        showToast('Paciente removido com sucesso!', 'success')
        navigate('/app/pacientes', { replace: true })
      } catch (error) {
        console.error('Erro ao remover paciente:', error)
        showToast('Erro ao remover paciente. Tente novamente.', 'error')
      }
    }
  }

  const resetProcedureModal = () => {
    setSelectedProcedure('')
    setProcedureNotes('')
    setProcedureQuantity(1)
    setQuantityInput('1')
    setPaymentType('cash')
    setPaymentMethod('cash')
    setInstallments(1)
    setCustomValue('')
    setIsEditingValue(false)
    setShowProcedureModal(false)
  }

  const handleAddProcedure = () => {
    if (!selectedProcedure || !patient) return

    const selectedProc = procedures.find(p => p.name === selectedProcedure)
    let unitValue = selectedProc?.price || 0

    let totalValue: number
    if (customValue) {
      const cleanValue = customValue.replace(/[R$\s.]/g, '').replace(',', '.')
      totalValue = parseFloat(cleanValue) || (procedureQuantity * unitValue)
    } else {
      totalValue = procedureQuantity * unitValue
    }

    const newPlannedProcedure: PlannedProcedure = {
      id: crypto.randomUUID(),
      procedureName: selectedProcedure,
      quantity: procedureQuantity,
      unitValue,
      totalValue,
      paymentType,
      paymentMethod,
      installments,
      status: 'pending',
      notes: procedureNotes,
      createdAt: new Date().toISOString()
    }

    const currentPlanned = patient.plannedProcedures || []
    update(patient.id, {
      plannedProcedures: [...currentPlanned, newPlannedProcedure]
    })

    resetProcedureModal()
  }

  const handleUpdateProcedureStatus = (procId: string, status: PlannedProcedure['status']) => {
    if (!patient) return

    const procedure = patient.plannedProcedures?.find(p => p.id === procId)
    if (!procedure) return

    if (status === 'completed' && procedure.status !== 'completed') {
      setCompletingProcedure(procedure)
      setShowCompleteModal(true)
      return
    }

    const updated = (patient.plannedProcedures || []).map(p =>
      p.id === procId ? { ...p, status, completedAt: status === 'completed' ? new Date().toISOString() : p.completedAt } : p
    )

    update(patient.id, { plannedProcedures: updated })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const photoUrl = String(reader.result)
        if (type === 'before') {
          setBeforePhotos(prev => [...prev, photoUrl])
        } else {
          setAfterPhotos(prev => [...prev, photoUrl])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemovePhoto = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforePhotos(prev => prev.filter((_, i) => i !== index))
    } else {
      setAfterPhotos(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleCompleteProcedure = async () => {
    if (!patient || !completingProcedure) return

    let product = null

    if (selectedProductId) {
      product = stockItems.find(item => item.id === selectedProductId)
      if (!product) {
        showToast('Produto não encontrado', 'error')
        return
      }

      if (product.quantity < completingProcedure.quantity) {
        showToast(`Estoque insuficiente de ${product.name}. Disponível: ${product.quantity} ${product.unit}`, 'error')
        return
      }

      const { removeStock, fetchItems } = useStock.getState()

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

      await fetchItems(true)
    }

    const photos: ProcedurePhoto[] = []
    const uploadedAt = new Date().toISOString()

    beforePhotos.forEach(url => {
      photos.push({
        id: crypto.randomUUID(),
        url,
        type: 'before',
        uploadedAt,
        notes: photoNotes
      })
    })

    afterPhotos.forEach(url => {
      photos.push({
        id: crypto.randomUUID(),
        url,
        type: 'after',
        uploadedAt,
        notes: photoNotes
      })
    })

    const updated = (patient.plannedProcedures || []).map(p =>
      p.id === completingProcedure.id ? {
        ...p,
        status: 'completed' as PlannedProcedure['status'],
        completedAt: new Date().toISOString(),
        usedProductId: product ? selectedProductId : undefined,
        usedProductName: product ? product.name : undefined,
        photos: photos.length > 0 ? photos : undefined
      } : p
    )

    update(patient.id, { plannedProcedures: updated })

    let paymentInfo = ''
    if (completingProcedure.paymentMethod === 'cash') {
      paymentInfo = 'Dinheiro'
    } else if (completingProcedure.paymentMethod === 'pix') {
      paymentInfo = 'PIX'
    } else if (completingProcedure.paymentMethod === 'card') {
      if (completingProcedure.installments > 1) {
        paymentInfo = `Cartão de Crédito ${completingProcedure.installments}x`
      } else {
        paymentInfo = 'Cartão de Crédito à vista'
      }
    }

    await autoRegisterCashMovement({
      type: 'income',
      category: 'procedure',
      amount: completingProcedure.totalValue,
      paymentMethod: completingProcedure.paymentMethod,
      referenceId: completingProcedure.id,
      description: `Procedimento: ${completingProcedure.procedureName} - Paciente: ${patient.name} - ${paymentInfo}`
    })

    setShowCompleteModal(false)
    setCompletingProcedure(null)
    setSelectedProductId('')
    setBeforePhotos([])
    setAfterPhotos([])
    setPhotoNotes('')

    showToast('Procedimento concluído com sucesso!', 'success')
  }

  const handleRemoveProcedure = async (procId: string) => {
    if (!patient) return

    const procedure = patient.plannedProcedures?.find(p => p.id === procId)
    if (!procedure) return

    const confirmed = await confirm({
      title: 'Remover Procedimento',
      message: procedure.status === 'completed'
        ? 'Remover este procedimento realizado? O produto usado será devolvido ao estoque.'
        : 'Remover este procedimento do planejamento?',
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    })

    if (!confirmed) return

    if (procedure.status === 'completed' && procedure.usedProductId) {
      const { addStock, fetchItems } = useStock.getState()

      await addStock(
        procedure.usedProductId,
        procedure.quantity,
        `Devolução - Procedimento excluído: ${procedure.procedureName} - Paciente: ${patient.name}`
      )

      await fetchItems(true)
    }

    if (procedure.status === 'completed') {
      await removeCashMovementByReference(procedure.id)
      const { fetchMovements } = useCash.getState()
      await fetchMovements()
    }

    const updated = (patient.plannedProcedures || []).filter(p => p.id !== procId)
    update(patient.id, { plannedProcedures: updated })

    showToast(procedure.status === 'completed' ? 'Procedimento removido e produto devolvido ao estoque!' : 'Procedimento removido!', 'success')
  }

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setIsEditingValue(true)

    const numbers = value.replace(/\D/g, '')

    if (!numbers) {
      setCustomValue('R$ 0,00')
      return
    }

    const cents = Number(numbers) / 100
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents)

    setCustomValue(formatted)
  }

  const handleOpenEditValue = (proc: PlannedProcedure) => {
    setEditingProcedure(proc)
    setEditedValue(formatCurrency(proc.totalValue))
    setEditedDescription(proc.notes || '')
    setShowEditValueModal(true)
  }

  const handleSaveEditedValue = async () => {
    if (!patient || !editingProcedure) return

    const parsedValue = parseFloat(editedValue.replace(/[^\d,]/g, '').replace(',', '.'))

    if (isNaN(parsedValue) || parsedValue < 0) {
      alert('Por favor, insira um valor válido')
      return
    }

    const updated = (patient.plannedProcedures || []).map(p =>
      p.id === editingProcedure.id ? {
        ...p,
        totalValue: parsedValue,
        unitValue: parsedValue / p.quantity,
        notes: editedDescription
      } : p
    )

    update(patient.id, { plannedProcedures: updated })

    if (editingProcedure.status === 'completed') {
      const relatedMovement = movements.find(mov =>
        mov.referenceId === editingProcedure.id &&
        mov.category === 'procedure'
      )

      if (relatedMovement) {
        await updateMovement(relatedMovement.id, {
          amount: parsedValue
        })

        await fetchMovements()
      }
    }

    setShowEditValueModal(false)
    setEditingProcedure(null)
    setEditedValue('')
    setEditedDescription('')

    showToast('Valor atualizado com sucesso!', 'success')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  if (!patient) return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Paciente não encontrado.</p>
        <Link to="/app/pacientes" className="text-orange-500 hover:text-orange-600 font-medium">
          Voltar para lista
        </Link>
      </div>
    </div>
  )

  const plannedProcedures = patient.plannedProcedures?.filter(proc => proc.status !== 'completed') || []
  const completedProcedures = patient.plannedProcedures?.filter(proc => proc.status === 'completed') || []

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500">
          <Link to="/app" className="hover:text-orange-500">Início</Link>
          <span className="mx-2">&gt;</span>
          <Link to="/app/pacientes" className="hover:text-orange-500">Pacientes</Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900 font-medium">{patient.name}</span>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            {patient.photoUrl ? (
              <img src={patient.photoUrl} className="h-16 w-16 rounded-xl object-cover border border-gray-200" alt={patient.name} />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">{getInitials(patient.name)}</span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{patient.name}</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  <span className="text-gray-600">CPF:</span>
                  <span className="text-gray-900 font-medium">{patient.cpf}</span>
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-gray-600">Telefone:</span>
                    <span className="text-gray-900 font-medium">{patient.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Ativo</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span>Total de procedimentos: {completedProcedures.length}</span>
                {completedProcedures.length > 0 && (
                  <span>Último: {new Date(completedProcedures[0]?.completedAt || '').toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                to={`/app/pacientes/${id}/editar`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors text-sm font-medium"
              >
                <Edit size={16} />
                Editar
              </Link>
              <button
                onClick={() => {}}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors text-sm font-medium"
              >
                <LinkIcon size={16} />
                Enviar Link
              </button>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                title="Remover paciente"
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowProcedureModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-sm transition-colors"
          >
            <Plus size={18} />
            Adicionar Procedimento
          </button>
          <Link
            to={`/app/pacientes/${id}/evolucao`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium shadow-sm transition-colors"
          >
            <FileText size={18} />
            Evolução do Paciente
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Planning (30%) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-orange-500" />
                Planejamento de Procedimentos
              </h3>

              {plannedProcedures.length > 0 ? (
                <div className="space-y-3">
                  {plannedProcedures.map(proc => (
                    <div key={proc.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {proc.status === 'in_progress' && <Clock size={16} className="text-blue-500" />}
                            {proc.status === 'pending' && <Circle size={16} className="text-gray-400" />}
                            <span className="font-medium text-gray-900">{proc.procedureName}</span>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">
                              {proc.quantity}x
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-gray-500 mb-2">
                            <div>Unitário: {formatCurrency(proc.unitValue)}</div>
                            <div className="text-green-600 font-medium">Total: {formatCurrency(proc.totalValue)}</div>
                          </div>

                          {proc.notes && (
                            <p className="text-xs text-gray-500 mb-2">{proc.notes}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <select
                            value={proc.status}
                            onChange={(e) => handleUpdateProcedureStatus(proc.id, e.target.value as PlannedProcedure['status'])}
                            className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-gray-900 focus:outline-none focus:border-orange-500"
                          >
                            <option value="pending">Pendente</option>
                            <option value="in_progress">Em Andamento</option>
                            <option value="completed">Concluído</option>
                          </select>

                          <button
                            onClick={() => handleOpenEditValue(proc)}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => handleRemoveProcedure(proc.id)}
                            className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total:</span>
                      <span className="text-base font-bold text-green-600">
                        {formatCurrency(plannedProcedures.reduce((sum, proc) => sum + proc.totalValue, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">Nenhum procedimento planejado ainda.</p>
                  <button
                    onClick={() => setShowProcedureModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus size={16} />
                    Planejar Procedimento
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Completed Procedures (70%) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" />
                Procedimentos Realizados
              </h3>

              {completedProcedures.length > 0 ? (
                <div className="space-y-4">
                  {completedProcedures
                    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
                    .map(proc => (
                    <div key={proc.id} className="bg-gray-50 rounded-lg border-l-4 border-green-500 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span className="font-semibold text-gray-900">{proc.procedureName}</span>
                            <span className="text-sm text-blue-600 font-medium">[{proc.quantity}x]</span>
                          </div>

                          <div className="space-y-1 mb-3">
                            <div className="text-sm">
                              <span className="text-gray-500">Valor da Sessão:</span>
                              <span className="text-green-600 font-medium ml-2">{formatCurrency(proc.unitValue)}</span>
                              <span className="text-gray-400 mx-3">|</span>
                              <span className="text-gray-500">Total:</span>
                              <span className="text-green-600 font-semibold ml-2">{formatCurrency(proc.totalValue)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {proc.paymentMethod && (
                              <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
                                {proc.paymentMethod === 'cash' ? 'Dinheiro' :
                                 proc.paymentMethod === 'pix' ? 'PIX' :
                                 proc.installments > 1 ? `Cartão ${proc.installments}x` : 'Cartão à Vista'}
                              </span>
                            )}
                            <span>Realizado em: {new Date(proc.completedAt || proc.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>

                          {proc.photos && proc.photos.length > 0 && (
                            <div className="mt-2">
                              <button
                                onClick={() => {
                                  setSelectedProcedurePhotos(proc)
                                  setShowPhotoGallery(true)
                                }}
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                              >
                                <ImageIcon size={14} />
                                {proc.photos.length} foto(s) - Ver galeria
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditValue(proc)}
                            className="px-3 py-1.5 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => {}}
                            className="px-3 py-1.5 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors"
                          >
                            Compartilhar
                          </button>
                          <button
                            onClick={() => handleRemoveProcedure(proc.id)}
                            className="px-3 py-1.5 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-200 transition-colors"
                          >
                            Mais
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Total dos Procedimentos Realizados</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(completedProcedures.reduce((sum, proc) => sum + proc.totalValue, 0))}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <CheckCircle size={40} className="text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Nenhum procedimento realizado</h4>
                  <p className="text-sm text-gray-500">Os procedimentos concluídos aparecerão aqui automaticamente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddProcedureModal
        isOpen={showProcedureModal}
        selectedProcedure={selectedProcedure}
        procedureNotes={procedureNotes}
        procedureQuantity={procedureQuantity}
        quantityInput={quantityInput}
        paymentType={paymentType}
        paymentMethod={paymentMethod}
        installments={installments}
        customValue={customValue}
        isEditingValue={isEditingValue}
        procedures={procedures}
        stockItems={stockItems}
        onProcedureChange={setSelectedProcedure}
        onNotesChange={setProcedureNotes}
        onQuantityChange={(val) => {
          if (val === '' || /^\d+$/.test(val)) {
            setQuantityInput(val)
            const num = parseInt(val)
            if (!isNaN(num) && num >= 1) {
              setProcedureQuantity(num)
            }
          }
        }}
        onQuantityBlur={() => {
          if (quantityInput === '' || parseInt(quantityInput) < 1) {
            setQuantityInput('1')
            setProcedureQuantity(1)
          }
        }}
        onPaymentTypeChange={(newType) => {
          setPaymentType(newType)
          if (newType === 'cash') {
            setPaymentMethod('cash')
            setInstallments(1)
          } else {
            setPaymentMethod('card')
          }
        }}
        onPaymentMethodChange={setPaymentMethod}
        onInstallmentsChange={setInstallments}
        onCustomValueFocus={() => {
          if (!isEditingValue) {
            const selectedProc = procedures.find(p => p.name === selectedProcedure)
            let unitValue = selectedProc?.price || 0
            setCustomValue(formatCurrency(procedureQuantity * unitValue))
            setIsEditingValue(true)
          }
        }}
        onCustomValueChange={handleCustomValueChange}
        onClose={resetProcedureModal}
        onAdd={handleAddProcedure}
      />

      <CompleteProcedureModal
        isOpen={showCompleteModal}
        procedure={completingProcedure}
        selectedProductId={selectedProductId}
        beforePhotos={beforePhotos}
        afterPhotos={afterPhotos}
        photoNotes={photoNotes}
        procedures={procedures}
        stockItems={stockItems}
        onProductSelect={setSelectedProductId}
        onPhotoUpload={handlePhotoUpload}
        onRemovePhoto={handleRemovePhoto}
        onPhotoNotesChange={setPhotoNotes}
        onClose={() => {
          setShowCompleteModal(false)
          setCompletingProcedure(null)
          setSelectedProductId('')
        }}
        onComplete={handleCompleteProcedure}
      />

      <EditValueModal
        isOpen={showEditValueModal}
        procedure={editingProcedure}
        editedValue={editedValue}
        editedDescription={editedDescription}
        onValueChange={(value) => {
          const numbersOnly = value.replace(/\D/g, '')
          const formatted = (parseInt(numbersOnly || '0') / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
          setEditedValue(formatted)
        }}
        onDescriptionChange={setEditedDescription}
        onSave={handleSaveEditedValue}
        onClose={() => {
          setShowEditValueModal(false)
          setEditingProcedure(null)
          setEditedValue('')
          setEditedDescription('')
        }}
      />

      <PhotoGalleryModal
        isOpen={showPhotoGallery}
        procedure={selectedProcedurePhotos}
        patientName={patient?.name || ''}
        onClose={() => {
          setShowPhotoGallery(false)
          setSelectedProcedurePhotos(null)
        }}
      />

      <ConfirmDialog />
    </div>
  )
}
