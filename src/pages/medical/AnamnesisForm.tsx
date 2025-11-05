import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useMedicalRecords } from '@/store/medicalRecords'
import { ArrowLeft, Save, FileText, Upload, X } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useConfirm } from '@/hooks/useConfirm'
import HealthInfoSection from './components/HealthInfoSection'
import LifestyleSection from './components/LifestyleSection'

export default function AnamnesisForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { patients } = usePatients()
  const { anamnesis, fetchAnamnesisByPatient, createOrUpdateAnamnesis } = useMedicalRecords()
  const { show } = useToast()

  const patient = patients.find(p => p.id === id)
  const currentAnamnesis = anamnesis[0]

  // 1. Identificação (auto-preenchido)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')

  // 2. Motivação
  const [chiefComplaint, setChiefComplaint] = useState('')

  // 3. Procedimentos estéticos anteriores
  const [previousAestheticProcedures, setPreviousAestheticProcedures] = useState('')

  // 4. Informações de saúde
  const [healthConditions, setHealthConditions] = useState('')
  const [medications, setMedications] = useState('')
  const [allergies, setAllergies] = useState('')
  const [familyHistory, setFamilyHistory] = useState('')
  const [pregnancy, setPregnancy] = useState('nao')

  // 5. Análise facial
  const [skinType, setSkinType] = useState('')
  const [facialConcerns, setFacialConcerns] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  // 6. Hábitos e estilo de vida
  const [smoking, setSmoking] = useState(false)
  const [alcoholConsumption, setAlcoholConsumption] = useState(false)
  const [sunExposure, setSunExposure] = useState('moderada')

  // 7. Escala de incômodo
  const [discomfortScale, setDiscomfortScale] = useState(3)

  // 8. Observações
  const [observations, setObservations] = useState('')

  // 9. Consentimento
  const [consentGiven, setConsentGiven] = useState(false)

  const [saving, setSaving] = useState(false)
  const { confirm, ConfirmDialog } = useConfirm()

  // Carregar dados do paciente
  useEffect(() => {
    if (patient) {
      setName(patient.name)
      setBirthDate(patient.birth_date || '')
      setPhone(patient.phone || '')
    }
  }, [patient])

  // Carregar anamnese existente
  useEffect(() => {
    if (id) {
      fetchAnamnesisByPatient(id)
    }
  }, [id])

  useEffect(() => {
    if (currentAnamnesis) {
      setChiefComplaint(currentAnamnesis.chief_complaint || '')
      setPreviousAestheticProcedures(currentAnamnesis.previous_aesthetic_procedures || '')
      setHealthConditions(currentAnamnesis.previous_illnesses || '')
      setMedications(currentAnamnesis.medications || '')
      setAllergies(currentAnamnesis.allergies || '')
      setFamilyHistory(currentAnamnesis.family_history || '')
      setSkinType(currentAnamnesis.skin_type || '')
      setFacialConcerns(currentAnamnesis.skin_concerns || '')
      setSmoking(currentAnamnesis.smoking || false)
      setAlcoholConsumption(currentAnamnesis.alcohol_consumption || false)
      setObservations(currentAnamnesis.current_illness_history || '')
    }
  }, [currentAnamnesis])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 6) {
      show('Máximo de 6 fotos permitidas', 'warning')
      return
    }

    setPhotos([...photos, ...files])

    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = async (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!consentGiven) {
      show('Você precisa concordar com o termo de consentimento', 'warning')
      return
    }

    if (!id) return

    setSaving(true)
    try {
      await createOrUpdateAnamnesis(id, {
        chief_complaint: chiefComplaint,
        previous_aesthetic_procedures: previousAestheticProcedures,
        previous_illnesses: healthConditions,
        medications,
        allergies,
        family_history: familyHistory,
        skin_type: skinType,
        skin_concerns: facialConcerns,
        smoking,
        alcohol_consumption: alcoholConsumption,
        physical_activity: sunExposure,
        current_illness_history: observations,
        expectations: `Escala de incômodo: ${discomfortScale}/5 | Gestação: ${pregnancy} | Exposição solar: ${sunExposure}`
      })

      show('Anamnese salva com sucesso!', 'success')
      navigate(`/app/pacientes/${id}/prontuario`)
    } catch (error) {
      show('Erro ao salvar anamnese. Tente novamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    if (await confirm({ title: 'Confirmação', message: 'Deseja realmente cancelar? Todas as alterações não salvas serão perdidas.' })) {
      navigate(`/app/pacientes/${id}/prontuario`)
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
    <>
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/app/pacientes/${id}/prontuario`}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileText className="text-orange-400" size={24} />
            <h1 className="text-2xl font-bold text-white">Anamnese</h1>
          </div>
          <p className="text-gray-400 mt-1">{patient.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Identificação */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold">1</span>
            Identificação
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
              <input
                type="text"
                value={name}
                disabled
                className="w-full bg-gray-700/50 border border-gray-600 text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data de Nascimento</label>
              <input
                type="date"
                value={birthDate}
                disabled
                className="w-full bg-gray-700/50 border border-gray-600 text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Telefone / WhatsApp</label>
              <input
                type="text"
                value={phone}
                disabled
                className="w-full bg-gray-700/50 border border-gray-600 text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* 2. Motivação */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold">2</span>
            Motivação para o Tratamento
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              O que você gostaria de melhorar? *
            </label>
            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={4}
              required
              placeholder="Ex: Suavizar linhas de expressão, aumentar volume labial, harmonizar o rosto..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* 3. Procedimentos Estéticos Anteriores */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold">3</span>
            Procedimentos Estéticos Anteriores
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Procedimentos realizados
            </label>
            <textarea
              value={previousAestheticProcedures}
              onChange={(e) => setPreviousAestheticProcedures(e.target.value)}
              rows={3}
              placeholder="Ex: Botox há 6 meses, preenchimento labial em 2023, harmonização facial..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Descreva procedimentos anteriores e quando foram realizados</p>
          </div>
        </div>

        {/* 4. Informações de Saúde */}
        <HealthInfoSection
          healthConditions={healthConditions}
          medications={medications}
          allergies={allergies}
          familyHistory={familyHistory}
          pregnancy={pregnancy}
          loading={saving}
          onHealthConditionsChange={setHealthConditions}
          onMedicationsChange={setMedications}
          onAllergiesChange={setAllergies}
          onFamilyHistoryChange={setFamilyHistory}
          onPregnancyChange={setPregnancy}
        />

        {/* 5. Análise Facial */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold">5</span>
            Análise Facial
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Pele</label>
              <select
                value={skinType}
                onChange={(e) => setSkinType(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              >
                <option value="">Selecione...</option>
                <option value="oleosa">Oleosa</option>
                <option value="seca">Seca</option>
                <option value="mista">Mista</option>
                <option value="normal">Normal</option>
                <option value="sensivel">Sensível</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Principais Queixas Faciais
              </label>
              <textarea
                value={facialConcerns}
                onChange={(e) => setFacialConcerns(e.target.value)}
                rows={3}
                placeholder="Ex: Manchas, rugas, flacidez, olheiras, assimetrias..."
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fotos (até 6)
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="anamnesis-photos"
                  disabled={photos.length >= 6}
                />
                <label
                  htmlFor="anamnesis-photos"
                  className={`inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors border border-gray-600 cursor-pointer ${photos.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload size={18} />
                  Adicionar Fotos ({photos.length}/6)
                </label>
                <p className="text-xs text-gray-500">Fotos faciais de diferentes ângulos</p>

                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border-2 border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 6. Hábitos e Estilo de Vida */}
        <LifestyleSection
          smoking={smoking}
          alcoholConsumption={alcoholConsumption}
          sunExposure={sunExposure}
          loading={saving}
          onSmokingChange={setSmoking}
          onAlcoholConsumptionChange={setAlcoholConsumption}
          onSunExposureChange={setSunExposure}
        />

        {/* 7. Escala de Incômodo */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold">7</span>
            Escala de Incômodo
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              O quanto essa questão te incomoda? (1 = pouco, 5 = muito)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                value={discomfortScale}
                onChange={(e) => setDiscomfortScale(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/20 border-2 border-orange-500 text-orange-400 font-bold text-lg">
                {discomfortScale}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Pouco</span>
              <span>Moderado</span>
              <span>Muito</span>
            </div>
          </div>
        </div>

        {/* 8. Observações */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 text-sm font-bold">8</span>
            Observações Gerais
          </h2>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={4}
            placeholder="Informações adicionais que considere importantes..."
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
          />
        </div>

        {/* 9. Consentimento */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="consent"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              required
              className="w-5 h-5 mt-0.5 bg-gray-700 border-gray-600 rounded focus:ring-orange-500 focus:ring-2 text-orange-500"
            />
            <label htmlFor="consent" className="text-sm text-gray-300 cursor-pointer">
              <span className="text-red-400">*</span> Declaro que as informações acima são verdadeiras e estou ciente de que a omissão ou falsidade de informações pode comprometer o resultado do tratamento e minha segurança.
            </label>
          </div>
        </div>

        {/* 10. Botões */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || !consentGiven}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={20} />
                Salvar Anamnese
              </>
            )}
          </button>
        </div>
      </form>
    </div>

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
