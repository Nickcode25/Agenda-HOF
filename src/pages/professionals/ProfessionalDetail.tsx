import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProfessionals } from '@/store/professionals'
import { Stethoscope, Award, Phone, Mail, ArrowLeft, Trash2, FileText, MapPin, Edit, User } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Profissional não encontrado.</p>
        <Link to="/app/profissionais" className="text-orange-500 hover:text-orange-600 hover:underline">Voltar para lista</Link>
      </div>
    </div>
  )

  const handleDelete = async () => {
    if (await confirm({ title: 'Confirmação', message: `Tem certeza que deseja remover ${professional.name}?` })) {
      await remove(professional.id)
      navigate('/app/profissionais')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 -m-8 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/app/profissionais" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes do Profissional</h1>
            <p className="text-sm text-gray-500">Visualize as informações do profissional</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Header com foto */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Photo */}
              {professional.photoUrl ? (
                <img
                  src={professional.photoUrl}
                  className="h-28 w-28 rounded-xl object-cover border-4 border-white shadow-lg"
                  alt={professional.name}
                />
              ) : (
                <div className="h-28 w-28 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border-4 border-white/30">
                  <span className="text-white font-bold text-3xl">{getInitials(professional.name)}</span>
                </div>
              )}

              {/* Name and Status */}
              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{professional.name}</h2>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    professional.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {professional.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-white/80">{professional.specialty}</p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Especialidade */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Award size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Especialidade</p>
                  <p className="text-gray-900 font-medium">{professional.specialty}</p>
                </div>
              </div>

              {/* Registro */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Award size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Registro</p>
                  <p className="text-gray-900 font-medium">{professional.registrationNumber}</p>
                </div>
              </div>

              {/* CPF */}
              {professional.cpf && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <FileText size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">CPF</p>
                    <p className="text-gray-900 font-medium">{professional.cpf}</p>
                  </div>
                </div>
              )}

              {/* Telefone */}
              {professional.phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Phone size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Telefone</p>
                    <p className="text-gray-900 font-medium">{professional.phone}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              {professional.email && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Mail size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">E-mail</p>
                    <p className="text-gray-900 font-medium">{professional.email}</p>
                  </div>
                </div>
              )}

              {/* Endereço */}
              {(professional.street || professional.cep) && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <MapPin size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Endereço</p>
                    <p className="text-gray-900 font-medium">
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

          {/* Actions */}
          <div className="flex flex-wrap gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <Link
              to={`/app/profissionais/${professional.id}/editar`}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all"
            >
              <Edit size={18} />
              Editar
            </Link>
            <button
              onClick={() => toggleActive(professional.id)}
              className={`px-5 py-2.5 rounded-lg font-medium transition-colors border ${
                professional.active
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
              }`}
            >
              {professional.active ? 'Desativar' : 'Ativar'}
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors border border-red-200"
            >
              <Trash2 size={18} />
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog />
    </>
  )
}
