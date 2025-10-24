import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProfessionals } from '@/store/professionals'
import { Stethoscope, Award, Phone, Mail, ArrowLeft, Trash2, FileText, MapPin, Edit } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { useEffect } from 'react'

export default function ProfessionalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { professionals, remove, toggleActive } = useProfessionals(s => ({
    professionals: s.professionals,
    remove: s.remove,
    toggleActive: s.toggleActive
  }))
  const { confirm, ConfirmDialog } = useConfirm()
  const professional = professionals.find(p => p.id === id)

  // Listener para tecla ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/app/profissionais')
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [navigate])

  if (!professional) return (
    <div>
      <p className="text-gray-400">Profissional não encontrado.</p>
      <Link to="/app/profissionais" className="text-orange-500 hover:text-orange-400 hover:underline">Voltar</Link>
    </div>
  )

  const handleDelete = async () => {
    if (await confirm({ title: 'Confirmação', message: `Tem certeza que deseja remover ${professional.name}?` })) {
      await remove(professional.id)
      navigate('/app/profissionais')
    }
  }

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/profissionais" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Photo */}
          {professional.photoUrl ? (
            <img src={professional.photoUrl} className="h-32 w-32 rounded-xl object-cover border-2 border-orange-500" alt={professional.name} />
          ) : (
            <div className="h-32 w-32 rounded-xl bg-gray-700 flex items-center justify-center border-2 border-gray-700">
              <Stethoscope size={48} className="text-gray-500" />
            </div>
          )}
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{professional.name}</h2>
              <span className={`text-xs px-3 py-1 rounded-lg border ${professional.active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {professional.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <Award size={18} className="text-orange-500" />
                <div>
                  <p className="text-xs text-gray-400">Especialidade</p>
                  <p className="text-white font-medium">{professional.specialty}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Award size={18} className="text-orange-500" />
                <div>
                  <p className="text-xs text-gray-400">Registro</p>
                  <p className="text-white font-medium">{professional.registrationNumber}</p>
                </div>
              </div>
              
              {professional.cpf && (
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-400">CPF</p>
                    <p className="text-white font-medium">{professional.cpf}</p>
                  </div>
                </div>
              )}
              
              {professional.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-400">Telefone</p>
                    <p className="text-white font-medium">{professional.phone}</p>
                  </div>
                </div>
              )}
              
              {professional.email && (
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-400">E-mail</p>
                    <p className="text-white font-medium">{professional.email}</p>
                  </div>
                </div>
              )}
              
              {(professional.street || professional.cep) && (
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-400">Endereço</p>
                    <p className="text-white font-medium">
                      {[
                        professional.street,
                        professional.number,
                        professional.complement,
                        professional.neighborhood,
                        professional.city,
                        professional.state,
                        professional.cep
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
          <Link
            to={`/app/profissionais/${professional.id}/editar`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40"
          >
            <Edit size={18} />
            Editar
          </Link>
          <button
            onClick={() => toggleActive(professional.id)}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${professional.active ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'}`}
          >
            {professional.active ? 'Desativar' : 'Ativar'}
          </button>
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

    {/* Modal de Confirmação */}
    <ConfirmDialog />
    </>
  )
}
