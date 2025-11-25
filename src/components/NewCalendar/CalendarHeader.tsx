import { Plus, Repeat } from 'lucide-react'
import { Link } from 'react-router-dom'

interface CalendarHeaderProps {
  userName: string
  userPlan: string
  appointmentsToday: number
}

export default function CalendarHeader({
  userName,
  userPlan,
  appointmentsToday
}: CalendarHeaderProps) {
  // Gerar iniciais do nome
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* Lado esquerdo - Info do usuário */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {getInitials(userName)}
        </div>

        {/* Nome e Plano */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{userName}</h1>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-yellow-500">⭐</span>
            <span className="text-orange-500 font-medium">Plano {userPlan}</span>
          </div>
        </div>

        {/* Separador */}
        <div className="w-px h-10 bg-gray-200 mx-2" />

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{appointmentsToday}</div>
            <div className="text-xs text-gray-500">Agendamentos hoje</div>
          </div>
        </div>
      </div>

      {/* Lado direito - Botões */}
      <div className="flex items-center gap-3">
        <Link
          to="/app/agenda/recorrentes"
          className="inline-flex items-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-600 px-4 py-3 rounded-xl font-medium border border-sky-200 transition-all hover:border-sky-300"
          title="Bloqueios Recorrentes"
        >
          <Repeat size={18} />
          <span className="hidden sm:inline">Recorrentes</span>
        </Link>
        <Link
          to="/app/agenda/nova"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:scale-105"
        >
          <Plus size={20} />
          Novo Agendamento
        </Link>
      </div>
    </div>
  )
}
