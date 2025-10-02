import { useParams, Link } from 'react-router-dom'
import { usePatients } from '@/store/patients'
import { Edit, Trash2, ArrowLeft } from 'lucide-react'

export default function PatientDetail() {
  const { id } = useParams()
  const patient = usePatients(s => s.patients.find(p => p.id === id))

  const remove = usePatients(s => s.remove)

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja remover ${patient?.name}?`)) {
      remove(id!)
      window.location.href = '/pacientes'
    }
  }

  if (!patient) return (
    <div>
      <p className="text-gray-400">Paciente não encontrado.</p>
      <Link to="/pacientes" className="text-orange-500 hover:text-orange-400 hover:underline">Voltar</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/pacientes" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-1">Detalhes do Paciente</h1>
          <p className="text-gray-400">Informações cadastrais</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Photo */}
          {patient.photoUrl ? (
            <img src={patient.photoUrl} className="h-32 w-32 rounded-xl object-cover border-2 border-orange-500" alt={patient.name} />
          ) : (
            <div className="h-32 w-32 rounded-xl bg-gray-700 flex items-center justify-center border-2 border-gray-700">
              <span className="text-gray-500 text-4xl">👤</span>
            </div>
          )}
          
          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{patient.name}</h2>
            
            <div className="space-y-2 text-sm">
              <p className="text-gray-400"><span className="font-medium">CPF:</span> {patient.cpf}</p>
              {patient.phone && <p className="text-gray-400"><span className="font-medium">Telefone:</span> {patient.phone}</p>}
              {patient.address && <p className="text-gray-400"><span className="font-medium">Endereço:</span> {patient.address}</p>}
            </div>
          </div>
        </div>

        {/* Clinical Data */}
        <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
          <div>
            <h3 className="font-medium mb-2 text-orange-500">Histórico Médico</h3>
            <p className="text-gray-300">{patient.medicalHistory || 'Nenhum histórico registrado'}</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2 text-orange-500">Alergias</h3>
            <p className="text-gray-300">{patient.allergies || 'Nenhuma alergia registrada'}</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2 text-orange-500">Observações</h3>
            <p className="text-gray-300">{patient.notes || 'Nenhuma observação'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
          <Link
            to={`/pacientes/${patient.id}/editar`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
          >
            <Edit size={18} />
            Editar Paciente
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors border border-red-500/30"
          >
            <Trash2 size={18} />
            Remover
          </button>
        </div>
      </div>
    </div>
  )
}
