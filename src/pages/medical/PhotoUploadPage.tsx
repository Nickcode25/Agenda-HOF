import { useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useMedicalRecords } from '@/store/medicalRecords'
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react'
import type { PhotoType } from '@/types/medicalRecords'
import { useToast } from '@/hooks/useToast'

export default function PhotoUploadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { patients } = usePatients()
  const { uploadMedicalPhoto } = useMedicalRecords()
  const { show } = useToast()

  const patient = patients.find(p => p.id === id)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [photoType, setPhotoType] = useState<PhotoType>('before')
  const [procedureName, setProcedureName] = useState('')
  const [bodyArea, setBodyArea] = useState('')
  const [description, setDescription] = useState('')
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0])

  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!id || !file) return

    setUploading(true)
    try {
      await uploadMedicalPhoto(id, file, {
        photo_type: photoType,
        procedure_name: procedureName || undefined,
        body_area: bodyArea || undefined,
        description: description || undefined,
        taken_at: `${takenAt}T00:00:00`,
      })

      show('Foto enviada com sucesso!', 'success')
      navigate(`/app/pacientes/${id}/prontuario`)
    } catch (error) {
      show('Erro ao enviar foto. Tente novamente.', 'error')
    } finally {
      setUploading(false)
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/app/pacientes/${id}/prontuario`} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <ImageIcon className="text-orange-400" size={24} />
            <h1 className="text-2xl font-bold text-white">Adicionar Foto</h1>
          </div>
          <p className="text-gray-400 mt-1">{patient.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <label className="block cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="hidden"
            />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg border-2 border-gray-600 group-hover:border-orange-500 transition-all" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Upload size={32} className="mx-auto mb-2 text-white" />
                    <p className="text-white font-medium">Clique para alterar</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center group-hover:border-orange-500 group-hover:bg-gray-750 transition-all">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gray-700 rounded-full group-hover:bg-orange-500/20 transition-all">
                    <Upload size={32} className="text-gray-400 group-hover:text-orange-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Clique para selecionar uma foto</p>
                    <p className="text-sm text-gray-400">ou arraste e solte aqui</p>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-gray-700 group-hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors border border-gray-600">
                    <Upload size={18} />
                    Selecionar Arquivo
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG até 10MB</p>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Informações da Foto</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo *</label>
              <select
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value as PhotoType)}
                required
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="before">Antes</option>
                <option value="after">Depois</option>
                <option value="during">Durante</option>
                <option value="complication">Complicação</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data</label>
              <input
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento</label>
            <input
              type="text"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="Ex: Toxina Botulínica"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Área do Corpo</label>
            <input
              type="text"
              value={bodyArea}
              onChange={(e) => setBodyArea(e.target.value)}
              placeholder="Ex: Face, Glabela"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Observações sobre a foto..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to={`/app/pacientes/${id}/prontuario`}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={uploading || !file}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50"
          >
            <Upload size={20} />
            {uploading ? 'Enviando...' : 'Enviar Foto'}
          </button>
        </div>
      </form>
    </div>
  )
}
