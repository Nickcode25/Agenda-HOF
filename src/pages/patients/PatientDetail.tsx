import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { PlannedProcedure, ProcedurePhoto } from '@/types/patient'
import { formatCurrency } from '@/utils/currency'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'
import { Edit, Trash2, Plus, CheckCircle, Circle, Clock, FileText, Image as ImageIcon, Phone, Calendar, Link as LinkIcon, MoreHorizontal } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import AddProcedureModal from './components/AddProcedureModal'
import PhotoGalleryModal from './components/PhotoGalleryModal'

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patient = usePatients(s => s.patients.find(p => p.id === id))
  const update = usePatients(s => s.update)
  const remove = usePatients(s => s.remove)
  const { procedures, fetchAll: fetchProcedures } = useProcedures()
  const { items: stockItems, fetchItems } = useStock()
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
  }, [fetchProcedures, fetchItems])

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

  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [selectedProcedurePhotos, setSelectedProcedurePhotos] = useState<PlannedProcedure | null>(null)

  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null)

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
    setIsEditMode(false)
    setEditingProcedureId(null)
  }

  const handleAddProcedure = (paymentSplits?: import('@/types/patient').PaymentSplit[]) => {
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

    // Modo de edição - atualizar procedimento existente
    if (isEditMode && editingProcedureId) {
      const updated = (patient.plannedProcedures || []).map(p =>
        p.id === editingProcedureId ? {
          ...p,
          procedureName: selectedProcedure,
          quantity: procedureQuantity,
          unitValue,
          totalValue,
          paymentType,
          paymentMethod,
          installments,
          paymentSplits: paymentSplits || p.paymentSplits,
          notes: procedureNotes
        } : p
      )

      update(patient.id, { plannedProcedures: updated })
      showToast('Procedimento atualizado com sucesso!', 'success')
      resetProcedureModal()
      return
    }

    // Modo de adição - criar novo procedimento
    const newPlannedProcedure: PlannedProcedure = {
      id: crypto.randomUUID(),
      procedureName: selectedProcedure,
      quantity: procedureQuantity,
      unitValue,
      totalValue,
      paymentType,
      paymentMethod,
      installments,
      paymentSplits, // Adicionar os pagamentos múltiplos se fornecidos
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

    const updated = (patient.plannedProcedures || []).map(p =>
      p.id === procId ? {
        ...p,
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : p.completedAt
      } : p
    )

    update(patient.id, { plannedProcedures: updated })

    if (status === 'completed' && procedure.status !== 'completed') {
      showToast('Procedimento concluído com sucesso!', 'success')
    }
  }

  const handleRemoveProcedure = async (procId: string) => {
    if (!patient) return

    const procedure = patient.plannedProcedures?.find(p => p.id === procId)
    if (!procedure) return

    const confirmed = await confirm({
      title: 'Remover Procedimento',
      message: procedure.status === 'completed'
        ? 'Remover este procedimento realizado?'
        : 'Remover este procedimento do planejamento?',
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    })

    if (!confirmed) return

    const updated = (patient.plannedProcedures || []).filter(p => p.id !== procId)
    update(patient.id, { plannedProcedures: updated })

    showToast('Procedimento removido!', 'success')
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
    // Preencher o modal com os dados do procedimento existente
    setSelectedProcedure(proc.procedureName)
    setProcedureNotes(proc.notes || '')
    setProcedureQuantity(proc.quantity)
    setQuantityInput(proc.quantity.toString())
    setPaymentType(proc.paymentType || 'cash')
    setPaymentMethod(proc.paymentMethod || 'cash')
    setInstallments(proc.installments || 1)
    setCustomValue(formatCurrency(proc.totalValue))
    setIsEditingValue(true)
    setEditingProcedureId(proc.id)
    setIsEditMode(true)
    setShowProcedureModal(true)
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
    <div className="min-h-screen bg-gray-50 -m-4 p-4 sm:-m-8 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Patient Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            {/* Avatar + Name (mobile) */}
            <div className="flex items-center gap-4 sm:block">
              {patient.photoUrl ? (
                <img src={patient.photoUrl} className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border border-gray-200 flex-shrink-0" alt={patient.name} />
              ) : (
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg sm:text-xl">{getInitials(patient.name)}</span>
                </div>
              )}
              {/* Name visible only on mobile */}
              <h1 className="text-xl font-bold text-gray-900 sm:hidden">{patient.name}</h1>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name visible only on desktop */}
              <h1 className="hidden sm:block text-2xl font-bold text-gray-900 mb-3">{patient.name}</h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">CPF:</span>
                  <span className="text-gray-900 font-medium truncate">{patient.cpf}</span>
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600">Telefone:</span>
                    <span className="text-gray-900 font-medium truncate">{patient.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0" />
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Ativo</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4 text-xs text-gray-500">
                <span>Total de procedimentos: {completedProcedures.length}</span>
                {completedProcedures.length > 0 && (
                  <span>Último: {formatDateTimeBRSafe(completedProcedures[0]?.completedAt || '')}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
              <Link
                to={`/app/pacientes/${id}/editar`}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors text-sm font-medium"
              >
                <Edit size={16} />
                <span className="hidden xs:inline">Editar</span>
              </Link>
              <button
                onClick={() => {}}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors text-sm font-medium"
              >
                <LinkIcon size={16} />
                <span className="hidden xs:inline">Enviar Link</span>
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
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setShowProcedureModal(true)}
            className="inline-flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-sm transition-colors text-sm sm:text-base"
          >
            <Plus size={18} />
            <span className="hidden xs:inline">Adicionar</span> Procedimento
          </button>
          <Link
            to={`/app/pacientes/${id}/evolucao`}
            className="inline-flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium shadow-sm transition-colors text-sm sm:text-base"
          >
            <FileText size={18} />
            Evolução
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Planning (30%) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-orange-500 flex-shrink-0" />
                <span className="truncate">Planejamento de Procedimentos</span>
              </h3>

              {plannedProcedures.length > 0 ? (
                <div className="space-y-3">
                  {plannedProcedures.map(proc => (
                    <div key={proc.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {proc.status === 'in_progress' && <Clock size={16} className="text-blue-500 flex-shrink-0" />}
                            {proc.status === 'pending' && <Circle size={16} className="text-gray-400 flex-shrink-0" />}
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

                        <div className="flex flex-row sm:flex-col flex-wrap gap-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
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
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                <span className="truncate">Procedimentos Realizados</span>
              </h3>

              {completedProcedures.length > 0 ? (
                <div className="space-y-4">
                  {completedProcedures
                    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
                    .map(proc => (
                    <div key={proc.id} className="bg-gray-50 rounded-lg border-l-4 border-green-500 p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                            <span className="font-semibold text-gray-900">{proc.procedureName}</span>
                            <span className="text-sm text-blue-600 font-medium">[{proc.quantity}x]</span>
                          </div>

                          <div className="space-y-1 mb-3">
                            <div className="text-sm flex flex-wrap gap-x-3 gap-y-1">
                              <span>
                                <span className="text-gray-500">Sessão:</span>
                                <span className="text-green-600 font-medium ml-1">{formatCurrency(proc.unitValue)}</span>
                              </span>
                              <span>
                                <span className="text-gray-500">Total:</span>
                                <span className="text-green-600 font-semibold ml-1">{formatCurrency(proc.totalValue)}</span>
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-600 font-medium">Forma de pagamento:</span>
                            </div>
                            {proc.paymentSplits && proc.paymentSplits.length > 0 ? (
                              <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                                {proc.paymentSplits.map((split, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded font-medium text-xs">
                                    {formatCurrency(split.amount)} {
                                      split.method === 'cash' ? 'Dinheiro' :
                                      split.method === 'pix' ? 'PIX' :
                                      split.installments && split.installments > 1 ? `Cartão ${split.installments}x` : 'Cartão à Vista'
                                    }
                                  </span>
                                ))}
                              </div>
                            ) : proc.paymentMethod ? (
                              <div className="mb-2">
                                <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded font-medium text-xs">
                                  {proc.paymentMethod === 'cash' ? 'Dinheiro' :
                                   proc.paymentMethod === 'pix' ? 'PIX' :
                                   proc.installments > 1 ? `Cartão ${proc.installments}x` : 'Cartão à Vista'}
                                </span>
                              </div>
                            ) : null}
                            <span>Realizado em: {formatDateTimeBRSafe(proc.completedAt || proc.createdAt)}</span>
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

                        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
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
                            className="px-3 py-1.5 text-xs bg-white hover:bg-red-50 text-red-600 rounded border border-gray-200 hover:border-red-200 transition-colors"
                          >
                            Excluir
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
        isEditMode={isEditMode}
        editingProcedureId={editingProcedureId || undefined}
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
