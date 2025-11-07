import { useState, FormEvent, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useMedicalRecords } from '@/store/medicalRecords'
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react'
import type { PhotoType } from '@/types/medicalRecords'
import { useToast } from '@/hooks/useToast'

export default function PhotoEditPage() {
  const { id, photoId } = useParams<{ id: string; photoId: string }>()
  const navigate = useNavigate()
  const { patients } = usePatients()
  const { medicalPhotos, updateMedicalPhoto, fetchMedicalPhotosByPatient } = useMedicalRecords()
  const { show } = useToast()

  const patient = patients.find(p => p.id === id)
  const photo = medicalPhotos.find(p => p.id === photoId)

  const [photoType, setPhotoType] = useState<PhotoType>('before')
  const [procedureName, setProcedureName] = useState('')
  const [bodyArea, setBodyArea] = useState('')
  const [description, setDescription] = useState('')
  const [takenAt, setTakenAt] = useState('')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) {
      fetchMedicalPhotosByPatient(id)
    }
  }, [id])

  useEffect(() => {
    if (photo) {
      setPhotoType(photo.photo_type)
      setProcedureName(photo.procedure_name || '')
      setBodyArea(photo.body_area || '')
      setDescription(photo.description || '')
      setTakenAt(photo.taken_at ? new Date(photo.taken_at).toISOString().split('T')[0] : '')
    }
  }, [photo])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!photoId) return

    setSaving(true)
    try {
      await updateMedicalPhoto(photoId, {
        photo_type: photoType,
        procedure_name: procedureName || undefined,
        body_area: bodyArea || undefined,
        description: description || undefined,
        taken_at: takenAt ? `${takenAt}T00:00:00` : undefined,
      })

      show('Foto atualizada com sucesso!', 'success')
      navigate(`/app/pacientes/${id}/prontuario`)
    } catch (error) {
      show('Erro ao atualizar foto. Tente novamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center">
          <p className="text-gray-400">Paciente não encontrado.</p>
        </div>
      </div>
    )
  }

  if (!photo) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center">
          <p className="text-gray-400">Foto não encontrada.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/app/pacientes/${id}/prontuario`}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Foto</h1>
          <p className="text-gray-400 text-sm mt-1">{patient.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-6">
        {/* Preview da Foto */}
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={photo.photo_url}
              alt={description || 'Foto médica'}
              className="w-64 h-64 object-cover rounded-xl border-2 border-gray-700"
            />
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                photoType === 'before' ? 'bg-blue-500 text-white' :
                photoType === 'after' ? 'bg-green-500 text-white' :
                photoType === 'during' ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {photoType === 'before' ? 'Antes' :
                 photoType === 'after' ? 'Depois' :
                 photoType === 'during' ? 'Durante' :
                 'Complicação'}
              </span>
            </div>
          </div>
        </div>

        {/* Informações da Foto */}
        <div className="grid gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo *
              </label>
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value as PhotoType)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="before">Antes</option>
                <option value="after">Depois</option>
                <option value="during">Durante</option>
                <option value="complication">Complicação</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data
              </label>
              <input
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Procedimento
            </label>
            <input
              type="text"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="Ex: Preenchimento de mandíbula e queixo"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Área do Corpo
            </label>
            <input
              type="text"
              value={bodyArea}
              onChange={(e) => setBodyArea(e.target.value)}
              placeholder="Ex: Face, Glabela, Lábios..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Observações sobre a foto..."
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 justify-end pt-4 border-t border-gray-700">
          <Link
            to={`/app/pacientes/${id}/prontuario`}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={20} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
