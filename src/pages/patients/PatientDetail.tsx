import { FormEvent, useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useProcedures } from '@/store/procedures'
import { useStock } from '@/store/stock'
import { autoRegisterCashMovement, useCash } from '@/store/cash'
import { PlannedProcedure, ProcedurePhoto } from '@/types/patient'
import { formatCurrency } from '@/utils/currency'
import { Edit, Trash2, Plus, CheckCircle, Circle, Clock, ArrowLeft, AlertTriangle, Package, FileText, X, Camera, Upload, Image as ImageIcon, Phone, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import BeforeAfterGallery from '@/components/BeforeAfterGallery'

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
  const [paymentType, setPaymentType] = useState<'default' | 'cash' | 'card'>('default')
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
  }, [procedureQuantity, selectedProcedure, paymentType])

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
    setQuantityInput('1')
    setPaymentType('default')
    setCustomValue('')
    setIsEditingValue(false)
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
                      type="text"
                      inputMode="numeric"
                      value={quantityInput}
                      onChange={(e) => {
                        const val = e.target.value
                        // Permitir apenas números
                        if (val === '' || /^\d+$/.test(val)) {
                          setQuantityInput(val)
                          const num = parseInt(val)
                          if (!isNaN(num) && num >= 1) {
                            setProcedureQuantity(num)
                          }
                        }
                      }}
                      onBlur={() => {
                        if (quantityInput === '' || parseInt(quantityInput) < 1) {
                          setQuantityInput('1')
                          setProcedureQuantity(1)
                        }
                      }}
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
                    <input
                      type="text"
                      value={isEditingValue ? customValue : (() => {
                        const selectedProc = procedures.find(p => p.name === selectedProcedure)
                        let unitValue = selectedProc?.price || 0

                        if (paymentType === 'cash' && selectedProc?.cashValue) {
                          unitValue = selectedProc.cashValue
                        } else if (paymentType === 'card' && selectedProc?.cardValue) {
                          unitValue = selectedProc.cardValue
                        }

                        return formatCurrency(procedureQuantity * unitValue)
                      })()}
                      onFocus={() => {
                        if (!isEditingValue) {
                          const selectedProc = procedures.find(p => p.name === selectedProcedure)
                          let unitValue = selectedProc?.price || 0

                          if (paymentType === 'cash' && selectedProc?.cashValue) {
                            unitValue = selectedProc.cashValue
                          } else if (paymentType === 'card' && selectedProc?.cardValue) {
                            unitValue = selectedProc.cardValue
                          }

                          setCustomValue(formatCurrency(procedureQuantity * unitValue))
                          setIsEditingValue(true)
                        }
                      }}
                      onChange={handleCustomValueChange}
                      placeholder="R$ 0,00"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-green-400 font-bold text-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">Edite para aplicar desconto ou ajuste manual</p>
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
                  {(() => {
                    // Obter categoria do procedimento
                    const procedureData = procedures.find(p => p.name === completingProcedure.procedureName)
                    const hasCategory = !!procedureData?.category
                    const categoryProducts = procedureData?.category
                      ? stockItems.filter(item => item.category === procedureData.category)
                      : []

                    // Se não tem categoria, mostrar aviso e pular seleção de produto
                    if (!hasCategory) {
                      return (
                        <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <AlertTriangle size={20} className="text-blue-400" />
                          <p className="text-sm text-blue-400">
                            Este procedimento não está vinculado a nenhuma categoria de produto. Você pode concluir sem selecionar produto.
                          </p>
                        </div>
                      )
                    }

                    // Se tem categoria mas não tem produtos
                    if (categoryProducts.length === 0) {
                      return (
                        <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <AlertTriangle size={20} className="text-blue-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-400 mb-1">
                              Categoria: {procedureData?.category}
                            </p>
                            <p className="text-sm text-blue-300">
                              Nenhum produto cadastrado na categoria "{procedureData?.category}". Você pode concluir o procedimento sem vincular produto ou <Link to="/app/estoque/novo" className="underline hover:text-blue-200">cadastrar um produto</Link>.
                            </p>
                          </div>
                        </div>
                      )
                    }

                    // Se tem categoria e produtos, mostrar seleção
                    return (
                      <>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Selecione o produto utilizado (opcional)
                        </label>
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
                      </>
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

                {/* Upload de Fotos Antes/Depois */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Camera size={20} className="text-blue-400" />
                    Fotos Antes/Depois (Opcional)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fotos Antes */}
                    <div>
                      <label className="block text-sm font-medium text-blue-400 mb-2">
                        📷 Fotos ANTES
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePhotoUpload(e, 'before')}
                        className="hidden"
                        id="before-photos"
                      />
                      <label
                        htmlFor="before-photos"
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl cursor-pointer transition-colors"
                      >
                        <Upload size={20} className="text-blue-400" />
                        <span className="text-sm text-blue-400">Adicionar fotos</span>
                      </label>

                      {beforePhotos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {beforePhotos.map((photo, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-blue-500/30">
                              <img src={photo} alt={`Antes ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(index, 'before')}
                                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                              >
                                <X size={14} className="text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fotos Depois */}
                    <div>
                      <label className="block text-sm font-medium text-green-400 mb-2">
                        📷 Fotos DEPOIS
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePhotoUpload(e, 'after')}
                        className="hidden"
                        id="after-photos"
                      />
                      <label
                        htmlFor="after-photos"
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-green-500/30 bg-green-500/5 hover:bg-green-500/10 rounded-xl cursor-pointer transition-colors"
                      >
                        <Upload size={20} className="text-green-400" />
                        <span className="text-sm text-green-400">Adicionar fotos</span>
                      </label>

                      {afterPhotos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {afterPhotos.map((photo, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-green-500/30">
                              <img src={photo} alt={`Depois ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(index, 'after')}
                                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                              >
                                <X size={14} className="text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Observações sobre as fotos
                      </label>
                      <textarea
                        value={photoNotes}
                        onChange={(e) => setPhotoNotes(e.target.value)}
                        placeholder="Ex: Primeira sessão, aplicação em testa e glabela..."
                        className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
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
                disabled={(() => {
                  // Só desabilitar se selecionou produto mas estoque é insuficiente
                  if (!selectedProductId) return false

                  const product = stockItems.find(item => item.id === selectedProductId)
                  return product ? product.quantity < completingProcedure.quantity : false
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
                  Observações do Procedimento (opcional)
                </label>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  placeholder="Ex: Pagamento antecipado de R$ 100,00 para reserva da consulta"
                />
                <p className="text-xs text-gray-400 mt-1">
                  💡 Esta observação é salva apenas no procedimento. A descrição no caixa não será alterada.
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

      {/* Modal de Galeria de Fotos */}
      {showPhotoGallery && selectedProcedurePhotos && selectedProcedurePhotos.photos && (
        <div
          className="fixed inset-0 bg-black/95 z-50 p-4 overflow-y-auto"
          onClick={() => {
            setShowPhotoGallery(false)
            setSelectedProcedurePhotos(null)
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedProcedurePhotos.procedureName}</h2>
                  <p className="text-gray-400">
                    {selectedProcedurePhotos.completedAt &&
                      `Realizado em ${new Date(selectedProcedurePhotos.completedAt).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPhotoGallery(false)
                    setSelectedProcedurePhotos(null)
                  }}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>

              <BeforeAfterGallery
                photos={selectedProcedurePhotos.photos}
                procedureName={selectedProcedurePhotos.procedureName}
                procedureDate={selectedProcedurePhotos.completedAt}
                onShare={(photo) => {
                  // Compartilhar via WhatsApp
                  const message = `Olá! Veja o resultado do procedimento ${selectedProcedurePhotos.procedureName} realizado em ${patient?.name}.`
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
                  window.open(whatsappUrl, '_blank')
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </div>
  )
}
