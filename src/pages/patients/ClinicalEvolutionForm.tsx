import { useState, FormEvent, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useMedicalRecords } from '@/store/medicalRecords'
import { useProfessionals } from '@/store/professionals'
import { ArrowLeft, Save, Activity, Calendar, User, FileText, Stethoscope, AlertCircle } from 'lucide-react'
import type { EvolutionType } from '@/types/medicalRecords'
import { useToast } from '@/hooks/useToast'

export default function ClinicalEvolutionForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { patients } = usePatients()
  const { professionals } = useProfessionals()
  const { createClinicalEvolution } = useMedicalRecords()
  const { show } = useToast()

  const patient = patients.find(p => p.id === id)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [professionalName, setProfessionalName] = useState('')
  const [evolutionType, setEvolutionType] = useState<EvolutionType>('consultation')
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [procedurePerformed, setProcedurePerformed] = useState('')
  const [productsUsed, setProductsUsed] = useState('')
  const [dosage, setDosage] = useState('')
  const [applicationAreas, setApplicationAreas] = useState('')
  const [observations, setObservations] = useState('')
  const [complications, setComplications] = useState('')
  const [nextAppointmentDate, setNextAppointmentDate] = useState('')

  const [saving, setSaving] = useState(false)

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
    if (!id || !professionalName) return

    setSaving(true)
    try {
      const datetime = `${date}T${time}:00`

      await createClinicalEvolution(id, {
        date: datetime,
        professional_name: professionalName,
        evolution_type: evolutionType,
        subjective: subjective || undefined,
        objective: objective || undefined,
        assessment: assessment || undefined,
        plan: plan || undefined,
        procedure_performed: procedurePerformed || undefined,
        products_used: productsUsed || undefined,
        dosage: dosage || undefined,
        application_areas: applicationAreas || undefined,
        observations: observations || undefined,
        complications: complications || undefined,
        next_appointment_date: nextAppointmentDate || undefined,
      })

      show('Evolução clínica salva com sucesso!', 'success')
      navigate(`/app/pacientes/${id}/prontuario`)
    } catch (error) {
      show('Erro ao salvar evolução. Tente novamente.', 'error')
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
                <Activity size={20} className="text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nova Evolução Clínica</h1>
                <p className="text-sm text-gray-500">{patient.name}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Básica */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Informações do Atendimento</h3>
                <p className="text-xs text-gray-500">Data, hora e tipo de atendimento</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={evolutionType}
                    onChange={(e) => setEvolutionType(e.target.value as EvolutionType)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  >
                    <option value="consultation">Consulta</option>
                    <option value="procedure">Procedimento</option>
                    <option value="follow_up">Retorno</option>
                    <option value="complication">Complicação</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profissional *</label>
                <select
                  value={professionalName}
                  onChange={(e) => setProfessionalName(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                >
                  <option value="">Selecione o profissional...</option>
                  {professionals.map(prof => (
                    <option key={prof.id} value={prof.name}>{prof.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SOAP */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-green-50 rounded-lg">
                <FileText size={18} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Evolução (Método SOAP)</h3>
                <p className="text-xs text-gray-500">Registro estruturado do atendimento</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjetivo (S) - O que o paciente relata
                </label>
                <textarea
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  rows={3}
                  placeholder="Sintomas, queixas, sensações relatadas pelo paciente..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objetivo (O) - O que o profissional observa
                </label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={3}
                  placeholder="Sinais clínicos, exame físico, dados objetivos..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avaliação (A) - Diagnóstico
                </label>
                <textarea
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  rows={2}
                  placeholder="Interpretação, diagnóstico, análise..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plano (P) - Conduta
                </label>
                <textarea
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  rows={2}
                  placeholder="Plano de tratamento, orientações, prescrições..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Procedimento */}
          {evolutionType === 'procedure' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Stethoscope size={18} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Detalhes do Procedimento</h3>
                  <p className="text-xs text-gray-500">Informações técnicas do procedimento realizado</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procedimento Realizado</label>
                  <input
                    type="text"
                    value={procedurePerformed}
                    onChange={(e) => setProcedurePerformed(e.target.value)}
                    placeholder="Ex: Aplicação de Toxina Botulínica"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produtos Utilizados</label>
                    <input
                      type="text"
                      value={productsUsed}
                      onChange={(e) => setProductsUsed(e.target.value)}
                      placeholder="Ex: Botox"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosagem</label>
                    <input
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="Ex: 50U"
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Áreas de Aplicação</label>
                  <input
                    type="text"
                    value={applicationAreas}
                    onChange={(e) => setApplicationAreas(e.target.value)}
                    placeholder="Ex: Glabela, testa, pés de galinha"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertCircle size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Observações Adicionais</h3>
                <p className="text-xs text-gray-500">Notas complementares e agendamento</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={2}
                  placeholder="Observações gerais..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complicações</label>
                <textarea
                  value={complications}
                  onChange={(e) => setComplications(e.target.value)}
                  rows={2}
                  placeholder="Registre qualquer complicação ou evento adverso..."
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Próxima Consulta</label>
                <input
                  type="date"
                  value={nextAppointmentDate}
                  onChange={(e) => setNextAppointmentDate(e.target.value)}
                  className="w-full max-w-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
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
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar Evolução'}
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
