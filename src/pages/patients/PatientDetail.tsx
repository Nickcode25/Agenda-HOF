import { FormEvent, useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { autoRegisterCashMovement, removeCashMovementByReference, useCash } from '@/store/cash'
import { PlannedProcedure, ProcedurePhoto } from '@/types/patient'
import { formatCurrency } from '@/utils/currency'
import { Edit, Trash2, Plus, CheckCircle, Circle, Clock, ArrowLeft, AlertTriangle, Package, FileText, X, Camera, Upload, Image as ImageIcon, Phone, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import BeforeAfterGallery from '@/components/BeforeAfterGallery'
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

  // Carregar procedimentos e estoque ao montar o componente
  useEffect(() => {
    fetchProcedures()
    fetchItems()
  }, [])

  // Listener para tecla ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/app/pacientes')
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate])

  // Resetar valor customizado quando quantidade, procedimento ou forma de pagamento mudar
  useEffect(() => {
    if (isEditingValue) {
      setIsEditingValue(false)
      setCustomValue('')
    }
  }, [procedureQuantity, selectedProcedure, paymentType, paymentMethod, installments])

  // Modal de conclusão de procedimento
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingProcedure, setCompletingProcedure] = useState<PlannedProcedure | null>(null)
  const [selectedProductId, setSelectedProductId] = useState('')

  // Upload de fotos antes/depois
  const [beforePhotos, setBeforePhotos] = useState<string[]>([])
  const [afterPhotos, setAfterPhotos] = useState<string[]>([])
  const [photoNotes, setPhotoNotes] = useState('')

  // Modal de galeria de fotos
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [selectedProcedurePhotos, setSelectedProcedurePhotos] = useState<PlannedProcedure | null>(null)

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
        // Usar replace para evitar voltar para página deletada
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

    // Encontrar o procedimento selecionado para obter o valor
    const selectedProc = procedures.find(p => p.name === selectedProcedure)
    let unitValue = selectedProc?.price || 0

    // Usar valor customizado se fornecido, senão calcular automaticamente
    let totalValue: number
    if (customValue) {
      // Remover "R$", espaços, e converter vírgula em ponto
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

    // Limpar e fechar modal
    resetProcedureModal()
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

    // Produto é sempre opcional - estoque é apenas um recurso adicional
    // O usuário pode concluir o procedimento com ou sem vincular produto

    let product = null

    // Se tem produto selecionado, processar o estoque
    if (selectedProductId) {
      // Buscar o produto selecionado
      product = stockItems.find(item => item.id === selectedProductId)
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
      await fetchItems(true)
    }

    // Preparar fotos
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

    // Atualizar procedimento como concluído
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

    // Registrar movimentação de caixa automaticamente
    // Criar descrição com informação de pagamento
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

    // Fechar modal e limpar
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

    // Se o procedimento foi concluído, devolver o produto ao estoque
    if (procedure.status === 'completed' && procedure.usedProductId) {
      const { addStock, fetchItems } = useStock.getState()

      await addStock(
        procedure.usedProductId,
        procedure.quantity,
        `Devolução - Procedimento excluído: ${procedure.procedureName} - Paciente: ${patient.name}`
      )

      // Atualizar lista de estoque
      await fetchItems(true)
    }

    // Se o procedimento foi concluído, remover a movimentação de caixa
    if (procedure.status === 'completed') {
      await removeCashMovementByReference(procedure.id)
      // Atualizar lista de movimentações
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

    // Remover tudo que não é número
    const numbers = value.replace(/\D/g, '')

    if (!numbers) {
      setCustomValue('R$ 0,00')
      return
    }

    // Converter para centavos e formatar
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

    // Se o procedimento já foi concluído, atualizar também a movimentação de caixa
    if (editingProcedure.status === 'completed') {
      // Buscar movimentação relacionada a este procedimento
      const relatedMovement = movements.find(mov =>
        mov.referenceId === editingProcedure.id &&
        mov.category === 'procedure'
      )

      if (relatedMovement) {
        // Atualizar apenas o valor da movimentação, mantendo a descrição original
        await updateMovement(relatedMovement.id, {
          amount: parsedValue
        })

        // Recarregar movimentações para refletir mudanças
        await fetchMovements()
      }
    }

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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Card - Header Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
            {/* Back Button + Photo */}
            <div className="flex items-center gap-4">
              <Link
                to="/app/pacientes"
                className="p-3 hover:bg-gray-700/50 rounded-xl transition-colors border border-gray-600/50 hover:border-orange-500/50"
                title="Voltar para lista de pacientes"
              >
                <ArrowLeft size={24} className="text-gray-400 hover:text-orange-400" />
              </Link>

              {patient.photoUrl ? (
                <img src={patient.photoUrl} className="h-32 w-32 rounded-xl object-cover border-2 border-orange-500 shadow-lg" alt={patient.name} />
              ) : (
                <div className="h-32 w-32 rounded-xl bg-gray-700 flex items-center justify-center border-2 border-gray-700">
                  <span className="text-gray-500 text-4xl">👤</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-3">{patient.name}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-orange-400" />
                  <span className="text-gray-300"><span className="font-medium">CPF:</span> {patient.cpf}</span>
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-orange-400" />
                    <span className="text-gray-300">{patient.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions - Aligned to right */}
            <div className="flex flex-col gap-3">
              <Link
                to={`/app/pacientes/${id}/editar`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-medium border border-blue-500/30 transition-all"
              >
                <Edit size={18} />
                Editar
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium border border-red-500/30 transition-all"
              >
                <Trash2 size={18} />
                Remover
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowProcedureModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all"
            >
              <Plus size={18} />
              Adicionar Procedimento
            </button>
            <Link
              to={`/app/pacientes/${id}/evolucao`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all"
            >
              <FileText size={18} />
              Evolução do Paciente
            </Link>
          </div>
        </div>
      </div>

      {/* Layout em 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: Planejamento */}
        <div className="space-y-6">
          {/* Planned Procedures */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-orange-400 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Planejamento de Procedimentos
            </h3>

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
                    <span className="text-sm font-medium text-gray-300">Total do Planejamento:</span>
                    <span className="text-xl font-bold text-green-400">
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
        </div>

        {/* Coluna Direita: Procedimentos Realizados */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
              <CheckCircle size={20} />
              Procedimentos Realizados
            </h3>

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
                      </div>

                      <div className="flex items-center gap-6 mb-2">
                        <span className="text-sm text-gray-400">Unitário: {formatCurrency(proc.unitValue)}</span>
                        <span className="text-sm font-medium text-green-400">Total: {formatCurrency(proc.totalValue)}</span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
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
                        <p className="text-sm text-gray-400 mb-2">{proc.notes}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Planejado em {new Date(proc.createdAt).toLocaleDateString('pt-BR')}</span>
                        {proc.completedAt && (
                          <span className="text-green-400">• Realizado em {new Date(proc.completedAt).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>

                      {/* Mostrar fotos se existirem */}
                      {proc.photos && proc.photos.length > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                          <ImageIcon size={16} className="text-blue-400" />
                          <span className="text-sm text-blue-400">{proc.photos.length} foto(s)</span>
                          <button
                            onClick={() => {
                              setSelectedProcedurePhotos(proc)
                              setShowPhotoGallery(true)
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                          >
                            Ver galeria
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {proc.photos && proc.photos.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedProcedurePhotos(proc)
                            setShowPhotoGallery(true)
                          }}
                          className="px-3 py-2 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors inline-flex items-center justify-center gap-1"
                        >
                          <ImageIcon size={14} />
                          Fotos
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEditValue(proc)}
                        className="px-3 py-2 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <Edit size={14} />
                        Editar
                      </button>

                      <button
                        onClick={() => handleRemoveProcedure(proc.id)}
                        className="px-3 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors"
                        title="Excluir procedimento realizado"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total dos Procedimentos Realizados */}
              <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-300">Total dos Procedimentos Realizados:</span>
                  <span className="text-xl font-bold text-green-400">
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
        </div>
      </div>

      {/* Modal Adicionar Procedimento */}
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
          // Permitir apenas números
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

      {/* Modal Concluir Procedimento - Selecionar Produto */}
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

      {/* Modal de Edição de Valor */}
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

      {/* Modal de Galeria de Fotos */}
      <PhotoGalleryModal
        isOpen={showPhotoGallery}
        procedure={selectedProcedurePhotos}
        patientName={patient?.name || ''}
        onClose={() => {
          setShowPhotoGallery(false)
          setSelectedProcedurePhotos(null)
        }}
      />

      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </div>
  )
}
