import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { ArrowLeft, Upload, X, Camera, Trash2, Calendar, Image as ImageIcon } from 'lucide-react'
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
        <p className="text-gray-400">Paciente não encontrado.</p>
        <Link to="/app/pacientes" className="text-orange-500 hover:text-orange-400 hover:underline">
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to={`/app/pacientes/${id}`}
              className="p-3 hover:bg-gray-700/50 rounded-xl transition-colors border border-gray-600/50 hover:border-blue-500/50"
              title="Voltar para detalhes do paciente"
            >
              <ArrowLeft size={24} className="text-gray-400 hover:text-blue-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Evolução do Paciente</h1>
              <p className="text-gray-400 mt-1">{patient.name}</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddPhotoModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all"
          >
            <Camera size={18} />
            Adicionar Fotos
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-blue-400" />
            <span>{evolutionPhotos.length} foto{evolutionPhotos.length !== 1 ? 's' : ''} registrada{evolutionPhotos.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Timeline de Fotos */}
      {sortedDates.length > 0 ? (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-blue-400" />
                <h3 className="text-lg font-semibold text-white">{date}</h3>
                <span className="text-sm text-gray-400">
                  ({photosByDate[date].length} foto{photosByDate[date].length !== 1 ? 's' : ''})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photosByDate[date].map(photo => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhotoView(photo)}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-700 hover:border-blue-500 transition-all cursor-pointer group"
                  >
                    <img
                      src={photo.url}
                      alt={photo.procedureName || 'Foto'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {photo.procedureName && (
                          <p className="text-xs text-white font-medium truncate">
                            {photo.procedureName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center">
          <Camera size={48} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhuma foto registrada</h3>
          <p className="text-gray-400 mb-6">
            Comece a documentar a evolução do paciente adicionando fotos dos procedimentos realizados
          </p>
          <button
            onClick={() => setShowAddPhotoModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all"
          >
            <Camera size={18} />
            Adicionar Primeira Foto
          </button>
        </div>
      )}

      {/* Modal Adicionar Fotos */}
      {showAddPhotoModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Adicionar Fotos da Evolução</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Upload de Fotos */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <div className="flex items-center gap-2">
                    <Camera size={16} className="text-blue-400" />
                    <span>Fotos *</span>
                  </div>
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
                  className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl cursor-pointer transition-colors"
                >
                  <Upload size={24} className="text-blue-400" />
                  <span className="text-blue-400 font-medium">Clique para adicionar fotos</span>
                </label>

                {selectedPhotos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedPhotos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-blue-500/30">
                        <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data da Foto *
                </label>
                <input
                  type="text"
                  value={photoDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  maxLength={10}
                  placeholder="DD/MM/AAAA"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">Digite apenas números (ex: 05112025 para 05/11/2025)</p>
              </div>

              {/* Procedimento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Procedimento (opcional)
                </label>
                <input
                  type="text"
                  value={photoProcedure}
                  onChange={(e) => setPhotoProcedure(e.target.value)}
                  placeholder="Ex: Preenchimento labial, Botox testa..."
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  placeholder="Ex: Segunda sessão, paciente respondeu bem ao tratamento..."
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-700">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePhotos}
                disabled={selectedPhotos.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
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
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoView(null)}
        >
          <div
            className="max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-white">
                <h3 className="text-xl font-bold">{selectedPhotoView.procedureName || 'Foto da Evolução'}</h3>
                <p className="text-gray-400 text-sm">{selectedPhotoView.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await handleDeletePhoto(selectedPhotoView.id)
                  }}
                  className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  <Trash2 size={20} className="text-white" />
                </button>
                <button
                  onClick={() => setSelectedPhotoView(null)}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-white" />
                </button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
              <img
                src={selectedPhotoView.url}
                alt={selectedPhotoView.procedureName || 'Foto'}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            {selectedPhotoView.notes && (
              <div className="mt-4 bg-gray-800 border border-gray-700 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-300 mb-1">Observações:</p>
                <p className="text-gray-400">{selectedPhotoView.notes}</p>
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
