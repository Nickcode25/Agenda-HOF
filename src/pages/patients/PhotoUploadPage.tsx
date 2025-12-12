import { useState, FormEvent, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useMedicalRecords } from '@/store/medicalRecords'
import { ArrowLeft, Upload, Image as ImageIcon, Calendar, FileText } from 'lucide-react'
import type { PhotoType } from '@/types/medicalRecords'
import { useToast } from '@/hooks/useToast'
import DateInput from '@/components/DateInput'
import { getTodayInSaoPaulo } from '@/utils/timezone'

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
  const [takenAt, setTakenAt] = useState(getTodayInSaoPaulo())

  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate(`/app/pacientes/${id}/prontuario`)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate, id])

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

  return (
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={`/app/pacientes/${id}/prontuario`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <ImageIcon size={20} className="text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Adicionar Foto</h1>
                <p className="text-sm text-gray-500">{patient.name}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Upload size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Upload da Foto</h3>
                <p className="text-xs text-gray-500">Selecione uma imagem do procedimento</p>
              </div>
            </div>

            <div className="p-6">
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
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg border-2 border-gray-200 group-hover:border-orange-500 transition-all" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Upload size={32} className="mx-auto mb-2 text-white" />
                        <p className="text-white font-medium">Clique para alterar</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center group-hover:border-orange-500 group-hover:bg-orange-50/50 transition-all">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-gray-100 rounded-full group-hover:bg-orange-100 transition-all">
                        <Upload size={32} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium mb-1">Clique para selecionar uma foto</p>
                        <p className="text-sm text-gray-500">ou arraste e solte aqui</p>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-white group-hover:bg-orange-500 text-gray-700 group-hover:text-white px-6 py-2.5 rounded-lg font-medium transition-colors border border-gray-200 group-hover:border-orange-500">
                        <Upload size={18} />
                        Selecionar Arquivo
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG até 10MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-green-50 rounded-lg">
                <FileText size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informações da Foto</h3>
                <p className="text-xs text-gray-500">Detalhes sobre a imagem</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={photoType}
                    onChange={(e) => setPhotoType(e.target.value as PhotoType)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  >
                    <option value="before">Antes</option>
                    <option value="after">Depois</option>
                    <option value="during">Durante</option>
                    <option value="complication">Complicação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <DateInput
                    value={takenAt}
                    onChange={setTakenAt}
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
                  placeholder="Ex: Toxina Botulínica"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área do Corpo</label>
                <input
                  type="text"
                  value={bodyArea}
                  onChange={(e) => setBodyArea(e.target.value)}
                  placeholder="Ex: Face, Glabela"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Observações sobre a foto..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              {uploading ? 'Enviando...' : 'Enviar Foto'}
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
