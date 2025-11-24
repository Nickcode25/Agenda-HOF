import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { ArrowLeft, Upload, X, Camera, Trash2, Calendar, Image as ImageIcon, Plus, Sparkles, Clock, FileText } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'

interface EvolutionPhoto {
  id: string
  url: string
  date: string
  notes: string
  procedureName?: string
}

export default function PatientEvolution() {
  const { id } = useParams()
  const navigate = useNavigate()
  const patient = usePatients(s => s.patients.find(p => p.id === id))
  const update = usePatients(s => s.update)
  const { show: showToast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [photoNotes, setPhotoNotes] = useState('')
  const [photoDate, setPhotoDate] = useState('')
  const [photoProcedure, setPhotoProcedure] = useState('')
  const [selectedPhotoView, setSelectedPhotoView] = useState<EvolutionPhoto | null>(null)

  // Listener para tecla ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedPhotoView) {
          setSelectedPhotoView(null)
        } else if (showAddPhotoModal) {
          handleCloseModal()
        } else {
          navigate(`/app/pacientes/${id}`)
        }
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate, id, showAddPhotoModal, selectedPhotoView])

  // Inicializar data com hoje
  useEffect(() => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    setPhotoDate(`${day}/${month}/${year}`)
  }, [])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const photoUrl = String(reader.result)
        setSelectedPhotos(prev => [...prev, photoUrl])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleCloseModal = () => {
    setShowAddPhotoModal(false)
    setSelectedPhotos([])
    setPhotoNotes('')
    setPhotoProcedure('')
    // Resetar data para hoje
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    setPhotoDate(`${day}/${month}/${year}`)
  }

  const formatDateInput = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    const limited = numbers.slice(0, 8)

    if (limited.length >= 5) {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`
    } else if (limited.length >= 3) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`
    } else if (limited.length >= 1) {
      return limited
    }
    return ''
  }

  const handleDateChange = (value: string) => {
    const formatted = formatDateInput(value)
    setPhotoDate(formatted)
  }

  const handleSavePhotos = () => {
    if (!patient) return
    if (selectedPhotos.length === 0) {
      showToast('Adicione pelo menos uma foto', 'error')
      return
    }

    const newPhotos: EvolutionPhoto[] = selectedPhotos.map(url => ({
      id: crypto.randomUUID(),
      url,
      date: photoDate,
      notes: photoNotes,
      procedureName: photoProcedure || undefined
    }))

    const currentEvolutionPhotos = (patient as any).evolutionPhotos || []
    update(patient.id, {
      evolutionPhotos: [...currentEvolutionPhotos, ...newPhotos]
    } as any)

    showToast('Fotos adicionadas com sucesso!', 'success')
    handleCloseModal()
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!patient) return

    const confirmed = await confirm({
      title: 'Remover Foto',
      message: 'Tem certeza que deseja remover esta foto da evolução?',
      confirmText: 'Remover',
      cancelText: 'Cancelar'
    })

    if (!confirmed) return

    const currentEvolutionPhotos = (patient as any).evolutionPhotos || []
    const updatedPhotos = currentEvolutionPhotos.filter((photo: EvolutionPhoto) => photo.id !== photoId)

    update(patient.id, {
      evolutionPhotos: updatedPhotos
    } as any)

    showToast('Foto removida com sucesso!', 'success')
    setSelectedPhotoView(null)
  }

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-gray-600">Paciente não encontrado.</p>
        <Link to="/app/pacientes" className="text-orange-600 hover:text-orange-500 hover:underline">
          Voltar
        </Link>
      </div>
    )
  }

  const evolutionPhotos: EvolutionPhoto[] = (patient as any).evolutionPhotos || []

  // Agrupar fotos por data
  const photosByDate = evolutionPhotos.reduce((acc, photo) => {
    if (!acc[photo.date]) {
      acc[photo.date] = []
    }
    acc[photo.date].push(photo)
    return acc
  }, {} as Record<string, EvolutionPhoto[]>)

  const sortedDates = Object.keys(photosByDate).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number)
    const [dayB, monthB, yearB] = b.split('/').map(Number)
    const dateA = new Date(yearA, monthA - 1, dayA)
    const dateB = new Date(yearB, monthB - 1, dayB)
    return dateB.getTime() - dateA.getTime()
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header Principal */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Barra superior com gradiente sutil */}
        <div className="h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/app/pacientes/${id}`}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors group"
                title="Voltar para detalhes do paciente"
              >
                <ArrowLeft size={20} className="text-gray-500 group-hover:text-gray-700" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-orange-500" />
                  <h1 className="text-2xl font-bold text-gray-900">Evolução do Paciente</h1>
                </div>
                <p className="text-gray-500 mt-0.5">{patient.name}</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddPhotoModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium shadow-sm transition-all"
            >
              <Plus size={18} />
              Nova Foto
            </button>
          </div>

          {/* Estatísticas */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ImageIcon size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{evolutionPhotos.length}</p>
                  <p className="text-sm text-gray-500">Fotos registradas</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{sortedDates.length}</p>
                  <p className="text-sm text-gray-500">Datas diferentes</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {sortedDates.length > 0 ? sortedDates[0] : '-'}
                  </p>
                  <p className="text-sm text-gray-500">Último registro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline de Fotos */}
      {sortedDates.length > 0 ? (
        <div className="space-y-4">
          {sortedDates.map((date, dateIndex) => (
            <div
              key={date}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Header da Data */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <Calendar size={16} className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{date}</h3>
                      <p className="text-sm text-gray-500">
                        {photosByDate[date].length} foto{photosByDate[date].length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {dateIndex === 0 && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      Mais recente
                    </span>
                  )}
                </div>
              </div>

              {/* Grid de Fotos */}
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {photosByDate[date].map(photo => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhotoView(photo)}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                    >
                      <img
                        src={photo.url}
                        alt={photo.procedureName || 'Foto'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          {photo.procedureName ? (
                            <p className="text-xs text-white font-medium truncate">
                              {photo.procedureName}
                            </p>
                          ) : (
                            <p className="text-xs text-white/70 font-medium">
                              Clique para ver
                            </p>
                          )}
                        </div>
                      </div>
                      {photo.notes && (
                        <div className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <FileText size={14} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Estado Vazio */
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
              <Camera size={36} className="text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma foto registrada ainda
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Comece a documentar a evolução do paciente adicionando fotos dos procedimentos realizados.
              Acompanhe os resultados ao longo do tempo!
            </p>
            <button
              onClick={() => setShowAddPhotoModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium shadow-sm transition-all"
            >
              <Camera size={18} />
              Adicionar Primeira Foto
            </button>
          </div>
        </div>
      )}

      {/* Modal Adicionar Fotos */}
      {showAddPhotoModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Camera size={20} className="text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Adicionar Fotos</h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Upload de Fotos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotos *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="evolution-photos"
                />
                <label
                  htmlFor="evolution-photos"
                  className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-orange-300 bg-orange-50 hover:bg-orange-100 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Upload size={24} className="text-orange-600" />
                  </div>
                  <div className="text-center">
                    <span className="text-orange-600 font-medium">Clique para adicionar fotos</span>
                    <p className="text-sm text-gray-500 mt-1">ou arraste e solte aqui</p>
                  </div>
                </label>

                {selectedPhotos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {selectedPhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-orange-200 shadow-sm">
                        <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Foto *
                </label>
                <input
                  type="text"
                  value={photoDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1.5">Digite apenas números (ex: 05112025 para 05/11/2025)</p>
              </div>

              {/* Procedimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Procedimento (opcional)
                </label>
                <input
                  type="text"
                  value={photoProcedure}
                  onChange={(e) => setPhotoProcedure(e.target.value)}
                  placeholder="Ex: Preenchimento labial, Botox testa..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  placeholder="Ex: Segunda sessão, paciente respondeu bem ao tratamento..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePhotos}
                disabled={selectedPhotos.length === 0}
                className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
              >
                Salvar Fotos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar Foto */}
      {selectedPhotoView && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoView(null)}
        >
          <div
            className="max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-white">
                <h3 className="text-xl font-bold">{selectedPhotoView.procedureName || 'Foto da Evolução'}</h3>
                <p className="text-gray-300 text-sm flex items-center gap-2 mt-1">
                  <Calendar size={14} />
                  {selectedPhotoView.date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await handleDeletePhoto(selectedPhotoView.id)
                  }}
                  className="p-2.5 bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                  title="Remover foto"
                >
                  <Trash2 size={18} className="text-white" />
                </button>
                <button
                  onClick={() => setSelectedPhotoView(null)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            <div className="bg-black/50 rounded-2xl overflow-hidden border border-white/10">
              <img
                src={selectedPhotoView.url}
                alt={selectedPhotoView.procedureName || 'Foto'}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            {selectedPhotoView.notes && (
              <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                <p className="text-sm font-medium text-white/70 mb-1 flex items-center gap-2">
                  <FileText size={14} />
                  Observações
                </p>
                <p className="text-white">{selectedPhotoView.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      <ConfirmDialog />
    </div>
  )
}
