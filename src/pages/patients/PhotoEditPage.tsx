import { useState, FormEvent, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useMedicalRecords } from '@/store/medicalRecords'
import { ArrowLeft, Save, Image as ImageIcon, FileText } from 'lucide-react'
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

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate(`/app/pacientes/${id}/prontuario`)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate, id])

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Paciente não encontrado.</p>
          <Link to="/app/pacientes" className="text-orange-500 hover:text-orange-600 hover:underline">
            Voltar para lista
          </Link>
        </div>
      </div>
    )
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Foto não encontrada.</p>
          <Link to={`/app/pacientes/${id}/prontuario`} className="text-orange-500 hover:text-orange-600 hover:underline">
            Voltar para prontuário
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={`/app/pacientes/${id}/prontuario`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Foto</h1>
            <p className="text-sm text-gray-500">{patient.name}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview da Foto */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-orange-50 rounded-lg">
                <ImageIcon size={18} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Preview da Foto</h3>
                <p className="text-xs text-gray-500">Visualização da imagem atual</p>
              </div>
            </div>

            <div className="p-6 flex justify-center">
              <div className="relative">
                <img
                  src={photo.photo_url}
                  alt={description || 'Foto médica'}
                  className="w-64 h-64 object-cover rounded-xl border-2 border-gray-200"
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
          </div>

          {/* Informações da Foto */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informações da Foto</h3>
                <p className="text-xs text-gray-500">Detalhes e metadados</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={photoType}
                    onChange={(e) => setPhotoType(e.target.value as PhotoType)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    required
                  >
                    <option value="before">Antes</option>
                    <option value="after">Depois</option>
                    <option value="during">Durante</option>
                    <option value="complication">Complicação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={takenAt}
                    onChange={(e) => setTakenAt(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedimento</label>
                <input
                  type="text"
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  placeholder="Ex: Preenchimento de mandíbula e queixo"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área do Corpo</label>
                <input
                  type="text"
                  value={bodyArea}
                  onChange={(e) => setBodyArea(e.target.value)}
                  placeholder="Ex: Face, Glabela, Lábios..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Observações sobre a foto..."
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Salvar Alterações
                </>
              )}
            </button>
            <Link
              to={`/app/pacientes/${id}/prontuario`}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
