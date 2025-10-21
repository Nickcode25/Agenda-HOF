import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useMedicalRecords } from '@/store/medicalRecords'
import {
  ArrowLeft,
  FileText,
  Image,
  Clock,
  User,
  AlertCircle,
  Plus,
  Calendar,
  Activity,
  Pill,
  Heart,
  Stethoscope,
  FileSignature,
  X,
  MapPin,
  Edit,
  Trash2
} from 'lucide-react'
import { MedicalPhoto } from '@/types/medicalRecords'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'

export default function MedicalRecordPage() {
  const { id } = useParams<{ id: string }>()
  const { patients } = usePatients()
  const {
    anamnesis,
    clinicalEvolutions,
    medicalPhotos,
    informedConsents,
    fetchAnamnesisByPatient,
    fetchClinicalEvolutionsByPatient,
    fetchMedicalPhotosByPatient,
    fetchInformedConsentsByPatient,
    deleteMedicalPhoto,
  } = useMedicalRecords()
  const { show } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const [activeTab, setActiveTab] = useState<'anamnesis' | 'photos' | 'consents'>('anamnesis')
  const [selectedPhoto, setSelectedPhoto] = useState<MedicalPhoto | null>(null)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)

  const patient = patients.find(p => p.id === id)

  const handleDeletePhoto = async (photoId: string, photoUrl: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!(await confirm({ title: 'Confirmação', message: 'Tem certeza que deseja excluir esta foto?' }))) return

    setDeletingPhotoId(photoId)
    try {
      await deleteMedicalPhoto(photoId, photoUrl)
      show('Foto excluída com sucesso!', 'success')
    } catch (error) {
      show('Erro ao excluir foto. Tente novamente.', 'error')
    } finally {
      setDeletingPhotoId(null)
    }
  }

  useEffect(() => {
    if (id) {
      fetchAnamnesisByPatient(id)
      fetchClinicalEvolutionsByPatient(id)
      fetchMedicalPhotosByPatient(id)
      fetchInformedConsentsByPatient(id)
    }
  }, [id])

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/app/pacientes" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 text-center">
          <AlertCircle size={48} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">Paciente não encontrado.</p>
        </div>
      </div>
    )
  }

  const currentAnamnesis = anamnesis[0]
  const hasAnamnesis = Boolean(currentAnamnesis)

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/app/pacientes/${id}`} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Stethoscope className="text-orange-400" size={24} />
            <h1 className="text-2xl font-bold text-white">Prontuário Eletrônico</h1>
          </div>
          <p className="text-gray-400 mt-1">{patient.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-1 flex gap-2">
        <button
          onClick={() => setActiveTab('anamnesis')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'anamnesis'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <FileText size={18} />
          Anamnese
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'photos'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Image size={18} />
          Fotos
        </button>
        <button
          onClick={() => setActiveTab('consents')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'consents'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <FileSignature size={18} />
          Consentimentos
        </button>
      </div>

      {/* Content */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        {activeTab === 'anamnesis' && (
          <div>
            {hasAnamnesis ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Anamnese Completa</h2>
                  <Link
                    to={`/app/pacientes/${id}/prontuario/anamnese`}
                    className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                    Editar
                  </Link>
                </div>

                {/* Motivação */}
                {currentAnamnesis.chief_complaint && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                      <Heart size={16} />
                      Queixa Principal
                    </h3>
                    <p className="text-white whitespace-pre-wrap">{currentAnamnesis.chief_complaint}</p>
                  </div>
                )}

                {/* Procedimentos Estéticos Anteriores */}
                {currentAnamnesis.previous_aesthetic_procedures && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                      <Stethoscope size={16} />
                      Procedimentos Estéticos Anteriores
                    </h3>
                    <p className="text-white whitespace-pre-wrap">{currentAnamnesis.previous_aesthetic_procedures}</p>
                  </div>
                )}

                {/* Informações de Saúde */}
                {(currentAnamnesis.previous_illnesses || currentAnamnesis.medications || currentAnamnesis.allergies || currentAnamnesis.family_history) && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-orange-400 mb-4 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Informações de Saúde
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {currentAnamnesis.previous_illnesses && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Condições de Saúde</h4>
                          <p className="text-white whitespace-pre-wrap">{currentAnamnesis.previous_illnesses}</p>
                        </div>
                      )}

                      {currentAnamnesis.medications && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Medicações em Uso</h4>
                          <p className="text-white whitespace-pre-wrap">{currentAnamnesis.medications}</p>
                        </div>
                      )}

                      {currentAnamnesis.allergies && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Alergias</h4>
                          <p className="text-white whitespace-pre-wrap">{currentAnamnesis.allergies}</p>
                        </div>
                      )}

                      {currentAnamnesis.family_history && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Histórico Familiar</h4>
                          <p className="text-white whitespace-pre-wrap">{currentAnamnesis.family_history}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Análise Facial */}
                {(currentAnamnesis.skin_type || currentAnamnesis.skin_concerns) && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-orange-400 mb-4 flex items-center gap-2">
                      <User size={16} />
                      Análise Facial
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      {currentAnamnesis.skin_type && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Tipo de Pele</h4>
                          <p className="text-white capitalize">{currentAnamnesis.skin_type}</p>
                        </div>
                      )}

                      {currentAnamnesis.skin_concerns && (
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Principais Queixas Faciais</h4>
                          <p className="text-white whitespace-pre-wrap">{currentAnamnesis.skin_concerns}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hábitos e Estilo de Vida */}
                {(currentAnamnesis.smoking !== undefined || currentAnamnesis.alcohol_consumption !== undefined) && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-orange-400 mb-4 flex items-center gap-2">
                      <Activity size={16} />
                      Hábitos e Estilo de Vida
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {currentAnamnesis.smoking !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${currentAnamnesis.smoking ? 'bg-red-500' : 'bg-green-500'}`} />
                          <span className="text-gray-300">{currentAnamnesis.smoking ? 'Fumante' : 'Não Fumante'}</span>
                        </div>
                      )}
                      {currentAnamnesis.alcohol_consumption !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${currentAnamnesis.alcohol_consumption ? 'bg-yellow-500' : 'bg-green-500'}`} />
                          <span className="text-gray-300">{currentAnamnesis.alcohol_consumption ? 'Consome Álcool' : 'Não Consome Álcool'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Observações e Expectativas */}
                {(currentAnamnesis.current_illness_history || currentAnamnesis.expectations) && (
                  <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-orange-400 mb-4 flex items-center gap-2">
                      <FileText size={16} />
                      Observações e Informações Adicionais
                    </h3>
                    <div className="space-y-4">
                      {currentAnamnesis.current_illness_history && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Observações Gerais</h4>
                          <p className="text-white whitespace-pre-wrap">{currentAnamnesis.current_illness_history}</p>
                        </div>
                      )}
                      {currentAnamnesis.expectations && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Informações Complementares</h4>
                          <p className="text-white whitespace-pre-wrap">{currentAnamnesis.expectations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Nenhuma anamnese cadastrada</h3>
                <p className="text-gray-400 mb-6">Preencha a anamnese do paciente para iniciar o acompanhamento</p>
                <Link
                  to={`/app/pacientes/${id}/prontuario/anamnese`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all"
                >
                  <Plus size={20} />
                  Preencher Anamnese
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Galeria de Fotos</h2>
              <Link
                to={`/app/pacientes/${id}/prontuario/fotos/upload`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={18} />
                Adicionar Fotos
              </Link>
            </div>

            {medicalPhotos.length === 0 ? (
              <div className="text-center py-12">
                <Image size={48} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Nenhuma foto cadastrada</h3>
                <p className="text-gray-400">Adicione fotos antes/depois dos procedimentos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {medicalPhotos.map(photo => (
                  <div
                    key={photo.id}
                    className="relative group"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={photo.photo_url}
                        alt={photo.description || 'Foto médica'}
                        className="w-full aspect-square object-cover rounded-xl border-2 border-gray-700 group-hover:border-orange-500 transition-all"
                      />
                    </div>

                    {/* Badge de tipo */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                        photo.photo_type === 'before' ? 'bg-blue-500 text-white' :
                        photo.photo_type === 'after' ? 'bg-green-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {photo.photo_type === 'before' ? 'Antes' : photo.photo_type === 'after' ? 'Depois' : 'Durante'}
                      </span>
                    </div>

                    {/* Botões de ação (aparecem no hover) */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Link
                        to={`/app/pacientes/${id}/prontuario/fotos/${photo.id}/editar`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg shadow-lg transition-colors"
                        title="Editar foto"
                      >
                        <Edit size={16} className="text-white" />
                      </Link>
                      <button
                        onClick={(e) => handleDeletePhoto(photo.id, photo.photo_url, e)}
                        disabled={deletingPhotoId === photo.id}
                        className="p-2 bg-red-500 hover:bg-red-600 rounded-lg shadow-lg transition-colors disabled:opacity-50"
                        title="Excluir foto"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>

                    {/* Nome do procedimento */}
                    {photo.procedure_name && (
                      <p className="text-xs text-gray-400 mt-2">{photo.procedure_name}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'consents' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Consentimentos Informados</h2>
              <Link
                to={`/app/pacientes/${id}/prontuario/consentimento/novo`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={18} />
                Novo Consentimento
              </Link>
            </div>

            {informedConsents.length === 0 ? (
              <div className="text-center py-12">
                <FileSignature size={48} className="mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum consentimento registrado</h3>
                <p className="text-gray-400">Os consentimentos informados aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {informedConsents.map(consent => (
                  <div
                    key={consent.id}
                    className="bg-gray-700/50 border border-gray-600 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-white">{consent.procedure_name}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(consent.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-lg ${
                        consent.status === 'signed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        consent.status === 'declined' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {consent.status === 'signed' ? 'Assinado' : consent.status === 'declined' ? 'Recusado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Foto */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Detalhes da Foto</h2>
              <button
                onClick={() => setSelectedPhoto(null)}
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
                    src={selectedPhoto.photo_url}
                    alt={selectedPhoto.description || 'Foto médica'}
                    className="w-full rounded-xl border-2 border-gray-700"
                  />
                  <div className="mt-4">
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-lg ${
                      selectedPhoto.photo_type === 'before' ? 'bg-blue-500 text-white' :
                      selectedPhoto.photo_type === 'after' ? 'bg-green-500 text-white' :
                      selectedPhoto.photo_type === 'during' ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {selectedPhoto.photo_type === 'before' ? 'Antes' :
                       selectedPhoto.photo_type === 'after' ? 'Depois' :
                       selectedPhoto.photo_type === 'during' ? 'Durante' :
                       'Complicação'}
                    </span>
                  </div>
                </div>

                {/* Informações */}
                <div className="space-y-4">
                  {selectedPhoto.procedure_name && (
                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope size={18} className="text-orange-400" />
                        <h3 className="text-sm font-medium text-gray-400">Procedimento</h3>
                      </div>
                      <p className="text-white font-medium">{selectedPhoto.procedure_name}</p>
                    </div>
                  )}

                  {selectedPhoto.body_area && (
                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={18} className="text-orange-400" />
                        <h3 className="text-sm font-medium text-gray-400">Área do Corpo</h3>
                      </div>
                      <p className="text-white font-medium">{selectedPhoto.body_area}</p>
                    </div>
                  )}

                  {selectedPhoto.taken_at && (
                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={18} className="text-orange-400" />
                        <h3 className="text-sm font-medium text-gray-400">Data da Foto</h3>
                      </div>
                      <p className="text-white font-medium">
                        {new Date(selectedPhoto.taken_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {selectedPhoto.description && (
                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={18} className="text-orange-400" />
                        <h3 className="text-sm font-medium text-gray-400">Descrição</h3>
                      </div>
                      <p className="text-white whitespace-pre-wrap">{selectedPhoto.description}</p>
                    </div>
                  )}

                  {selectedPhoto.created_at && (
                    <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={18} className="text-orange-400" />
                        <h3 className="text-sm font-medium text-gray-400">Cadastrado em</h3>
                      </div>
                      <p className="text-white text-sm">
                        {new Date(selectedPhoto.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
