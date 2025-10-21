import { useState } from 'react'
import { ProcedurePhoto } from '@/types/patient'
import { ZoomIn, Download, Share2, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface BeforeAfterGalleryProps {
  photos: ProcedurePhoto[]
  procedureName: string
  procedureDate?: string
  onShare?: (photo: ProcedurePhoto) => void
}

export default function BeforeAfterGallery({
  photos,
  procedureName,
  procedureDate,
  onShare
}: BeforeAfterGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ProcedurePhoto | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const beforePhotos = photos.filter(p => p.type === 'before')
  const afterPhotos = photos.filter(p => p.type === 'after')

  const handleDownload = async (photo: ProcedurePhoto) => {
    try {
      const response = await fetch(photo.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${procedureName}_${photo.type}_${new Date(photo.uploadedAt).toLocaleDateString()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar foto:', error)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-800/50 rounded-2xl border border-gray-700/50">
        <p className="text-gray-400">Nenhuma foto disponível para este procedimento</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comparação Lado a Lado */}
      {beforePhotos.length > 0 && afterPhotos.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📸 Comparação Antes/Depois
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Antes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">
                  Antes
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(beforePhotos[0].uploadedAt).toLocaleDateString()}
                </span>
              </div>
              <div
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-blue-500/30 cursor-pointer group"
                onClick={() => setSelectedPhoto(beforePhotos[0])}
              >
                <img
                  src={beforePhotos[0].url}
                  alt="Antes"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                </div>
              </div>
              {beforePhotos[0].notes && (
                <p className="text-xs text-gray-400 italic">{beforePhotos[0].notes}</p>
              )}
            </div>

            {/* Depois */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-400 bg-green-500/20 px-3 py-1 rounded-full">
                  Depois
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(afterPhotos[0].uploadedAt).toLocaleDateString()}
                </span>
              </div>
              <div
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-green-500/30 cursor-pointer group"
                onClick={() => setSelectedPhoto(afterPhotos[0])}
              >
                <img
                  src={afterPhotos[0].url}
                  alt="Depois"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                </div>
              </div>
              {afterPhotos[0].notes && (
                <p className="text-xs text-gray-400 italic">{afterPhotos[0].notes}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Todas as Fotos em Grid */}
      {photos.length > 2 && (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-6">
          <h3 className="text-xl font-bold text-white mb-4">📁 Todas as Fotos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-xl overflow-hidden border border-gray-700 cursor-pointer group"
                onClick={() => {
                  setSelectedPhoto(photo)
                  setCurrentIndex(index)
                }}
              >
                <img
                  src={photo.url}
                  alt={`${photo.type} - ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                </div>
                <div className="absolute top-2 left-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    photo.type === 'before'
                      ? 'bg-blue-500/80 text-white'
                      : 'bg-green-500/80 text-white'
                  }`}>
                    {photo.type === 'before' ? 'Antes' : 'Depois'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Visualização em Tela Cheia */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full transition-colors z-10"
          >
            <X size={24} className="text-white" />
          </button>

          {/* Navegação */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-gray-800/80 hover:bg-gray-700 rounded-full transition-colors z-10"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gray-800/80 hover:bg-gray-700 rounded-full transition-colors z-10"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            </>
          )}

          <div className="max-w-6xl w-full h-full flex flex-col">
            {/* Info */}
            <div className="flex items-center justify-between mb-4 bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4">
              <div>
                <h3 className="text-white font-bold">{procedureName}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                  <span className={`px-3 py-1 rounded-full ${
                    selectedPhoto.type === 'before'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {selectedPhoto.type === 'before' ? 'Antes' : 'Depois'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
                  </span>
                  <span className="text-gray-500">
                    {currentIndex + 1} / {photos.length}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(selectedPhoto)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Baixar foto"
                >
                  <Download size={20} className="text-white" />
                </button>
                {onShare && (
                  <button
                    onClick={() => onShare(selectedPhoto)}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    title="Compartilhar via WhatsApp"
                  >
                    <Share2 size={20} className="text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Imagem */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={photos[currentIndex].url}
                alt={`${photos[currentIndex].type}`}
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
            </div>

            {/* Notas */}
            {photos[currentIndex].notes && (
              <div className="mt-4 bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-gray-300 text-center italic">"{photos[currentIndex].notes}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
