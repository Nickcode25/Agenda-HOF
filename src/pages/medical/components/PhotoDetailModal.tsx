import { X, Stethoscope, MapPin, Calendar, FileText, Clock } from 'lucide-react'
import { MedicalPhoto } from '@/types/medicalRecords'

interface PhotoDetailModalProps {
  photo: MedicalPhoto | null
  onClose: () => void
}

export default function PhotoDetailModal({ photo, onClose }: PhotoDetailModalProps) {
  if (!photo) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Detalhes da Foto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Foto */}
            <div>
              <img
                src={photo.photo_url}
                alt={photo.description || 'Foto médica'}
                className="w-full rounded-xl border-2 border-gray-700"
              />
              <div className="mt-4">
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-lg ${
                  photo.photo_type === 'before' ? 'bg-blue-500 text-white' :
                  photo.photo_type === 'after' ? 'bg-green-500 text-white' :
                  photo.photo_type === 'during' ? 'bg-yellow-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  {photo.photo_type === 'before' ? 'Antes' :
                   photo.photo_type === 'after' ? 'Depois' :
                   photo.photo_type === 'during' ? 'Durante' :
                   'Complicação'}
                </span>
              </div>
            </div>

            {/* Informações */}
            <div className="space-y-4">
              {photo.procedure_name && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope size={18} className="text-orange-400" />
                    <h3 className="text-sm font-medium text-gray-400">Procedimento</h3>
                  </div>
                  <p className="text-white font-medium">{photo.procedure_name}</p>
                </div>
              )}

              {photo.body_area && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={18} className="text-orange-400" />
                    <h3 className="text-sm font-medium text-gray-400">Área do Corpo</h3>
                  </div>
                  <p className="text-white font-medium">{photo.body_area}</p>
                </div>
              )}

              {photo.taken_at && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-orange-400" />
                    <h3 className="text-sm font-medium text-gray-400">Data da Foto</h3>
                  </div>
                  <p className="text-white font-medium">
                    {new Date(photo.taken_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {photo.description && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={18} className="text-orange-400" />
                    <h3 className="text-sm font-medium text-gray-400">Descrição</h3>
                  </div>
                  <p className="text-white whitespace-pre-wrap">{photo.description}</p>
                </div>
              )}

              {photo.created_at && (
                <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-orange-400" />
                    <h3 className="text-sm font-medium text-gray-400">Cadastrado em</h3>
                  </div>
                  <p className="text-white text-sm">
                    {new Date(photo.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
