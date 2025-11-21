import { X } from 'lucide-react'
import { PlannedProcedure, ProcedurePhoto } from '@/types/patient'
import BeforeAfterGallery from '@/components/BeforeAfterGallery'
import { formatDateTimeBRSafe } from '@/utils/dateHelpers'

interface PhotoGalleryModalProps {
  isOpen: boolean
  procedure: PlannedProcedure | null
  patientName: string
  onClose: () => void
}

export default function PhotoGalleryModal({
  isOpen,
  procedure,
  patientName,
  onClose
}: PhotoGalleryModalProps) {
  if (!isOpen || !procedure || !procedure.photos) return null

  const handleShare = (photo: ProcedurePhoto) => {
    const message = `Olá! Veja o resultado do procedimento ${procedure.procedureName} realizado em ${patientName}.`
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{procedure.procedureName}</h2>
              <p className="text-gray-400">
                {procedure.completedAt &&
                  `Realizado em ${formatDateTimeBRSafe(procedure.completedAt)}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>

          <BeforeAfterGallery
            photos={procedure.photos}
            procedureName={procedure.procedureName}
            procedureDate={procedure.completedAt}
            onShare={handleShare}
          />
        </div>
      </div>
    </div>
  )
}
