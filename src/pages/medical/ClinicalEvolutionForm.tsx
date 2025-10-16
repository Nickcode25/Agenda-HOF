import { useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useMedicalRecords } from '@/store/medicalRecords'
import { useProfessionals } from '@/store/professionals'
import { ArrowLeft, Save, Activity } from 'lucide-react'
import type { EvolutionType } from '@/types/medicalRecords'

export default function ClinicalEvolutionForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { patients } = usePatients()
  const { professionals } = useProfessionals()
  const { createClinicalEvolution } = useMedicalRecords()

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

      alert('✅ Evolução clínica salva com sucesso!')
      navigate(`/app/pacientes/${id}/prontuario`)
    } catch (error) {
      alert('❌ Erro ao salvar evolução. Tente novamente.')
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/app/pacientes/${id}/prontuario`} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Activity className="text-orange-400" size={24} />
            <h1 className="text-2xl font-bold text-white">Nova Evolução Clínica</h1>
          </div>
          <p className="text-gray-400 mt-1">{patient.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Básica */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Informações do Atendimento</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hora *</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo *</label>
              <select
                value={evolutionType}
                onChange={(e) => setEvolutionType(e.target.value as EvolutionType)}
                required
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Profissional *</label>
            <select
              value={professionalName}
              onChange={(e) => setProfessionalName(e.target.value)}
              required
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Selecione o profissional...</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.name}>{prof.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SOAP */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Evolução (Método SOAP)</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subjetivo (S) - O que o paciente relata
            </label>
            <textarea
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              rows={3}
              placeholder="Sintomas, queixas, sensações relatadas pelo paciente..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Objetivo (O) - O que o profissional observa
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              placeholder="Sinais clínicos, exame físico, dados objetivos..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Avaliação (A) - Diagnóstico
            </label>
            <textarea
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              rows={2}
              placeholder="Interpretação, diagnóstico, análise..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Plano (P) - Conduta
            </label>
            <textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={2}
              placeholder="Plano de tratamento, orientações, prescrições..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Procedimento */}
        {evolutionType === 'procedure' && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Detalhes do Procedimento</h2>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento Realizado</label>
              <input
                type="text"
                value={procedurePerformed}
                onChange={(e) => setProcedurePerformed(e.target.value)}
                placeholder="Ex: Aplicação de Toxina Botulínica"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Produtos Utilizados</label>
                <input
                  type="text"
                  value={productsUsed}
                  onChange={(e) => setProductsUsed(e.target.value)}
                  placeholder="Ex: Botox"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Dosagem</label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="Ex: 50U"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Áreas de Aplicação</label>
              <input
                type="text"
                value={applicationAreas}
                onChange={(e) => setApplicationAreas(e.target.value)}
                placeholder="Ex: Glabela, testa, pés de galinha"
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Observações Adicionais</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={2}
              placeholder="Observações gerais..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Complicações</label>
            <textarea
              value={complications}
              onChange={(e) => setComplications(e.target.value)}
              rows={2}
              placeholder="Registre qualquer complicação ou evento adverso..."
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Próxima Consulta</label>
            <input
              type="date"
              value={nextAppointmentDate}
              onChange={(e) => setNextAppointmentDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
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
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Evolução'}
          </button>
        </div>
      </form>
    </div>
  )
}
