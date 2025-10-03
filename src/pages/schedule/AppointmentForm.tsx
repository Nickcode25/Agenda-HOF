import { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { useSchedule } from '@/store/schedule'
import { useProfessionals } from '@/store/professionals'
import { useProfessionalContext } from '@/contexts/ProfessionalContext'
import type { ProcedureType } from '@/types/schedule'
import { Save, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const procedures: ProcedureType[] = ['Avaliação','Botox','Preenchimento','Bioestimulador']

export default function AppointmentForm() {
  const patients = usePatients(s => s.patients)
  const professionals = useProfessionals(s => s.professionals.filter(p => p.active))
  const { selectedProfessional } = useProfessionalContext()
  const add = useSchedule(s => s.addAppointment)
  const navigate = useNavigate()
  
  // Obter nome do profissional selecionado
  const selectedProfessionalName = selectedProfessional 
    ? professionals.find(p => p.id === selectedProfessional)?.name || ''
    : ''

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    add({
      patientId: String(data.get('patientId')||''),
      patientName: patients.find(p=>p.id===data.get('patientId'))?.name || '',
      procedure: data.get('procedure') as ProcedureType,
      professional: String(data.get('professional')||''),
      room: String(data.get('room')||''),
      start: String(data.get('start')||''),
      end: String(data.get('end')||''),
      notes: String(data.get('notes')||''),
      status: 'scheduled'
    })
    navigate('/')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Novo Agendamento</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-400">Preencha os dados do agendamento</p>
            {selectedProfessionalName && (
              <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30">
                <span>Agenda: {selectedProfessionalName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Paciente *</label>
            <select name="patientId" required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all">
              <option value="">Selecione um paciente</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Procedimento *</label>
            <select name="procedure" required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all">
              {procedures.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profissional *</label>
            <select 
              name="professional" 
              required 
              defaultValue={selectedProfessionalName}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="">Selecione um profissional</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.name}>{prof.name} - {prof.specialty}</option>
              ))}
            </select>
            {professionals.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                Nenhum profissional cadastrado. <Link to="/profissionais/novo" className="underline">Cadastre aqui</Link>
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sala</label>
            <input name="room" placeholder="Número da sala" className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data e Hora de Início *</label>
            <input type="datetime-local" name="start" required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Data e Hora de Término *</label>
            <input type="datetime-local" name="end" required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
          <textarea name="notes" placeholder="Adicione observações sobre o agendamento..." className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all" rows={4}></textarea>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40">
            <Save size={20} />
            Salvar Agendamento
          </button>
          <Link to="/" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
