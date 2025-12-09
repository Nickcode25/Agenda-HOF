import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'

export type ViewMode = 'day' | 'week' | 'month'

interface CalendarControlsProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  currentDate: Date
  onDateChange: (date: Date) => void
  onToday: () => void
  appointmentsToday?: number
  compact?: boolean // Versão compacta para header
}

export default function CalendarControls({
  viewMode,
  onViewModeChange,
  currentDate,
  onDateChange,
  onToday,
  appointmentsToday = 0,
  compact = false
}: CalendarControlsProps) {
  // Formatar texto de data baseado no modo de visualização
  const getDateRangeText = () => {
    if (viewMode === 'day') {
      return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    }
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: ptBR })
      const weekEnd = endOfWeek(currentDate, { locale: ptBR })
      return `${format(weekStart, "d 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`
    }
    // month
    return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
  }

  // Navegação
  const handlePrevious = () => {
    if (viewMode === 'day') {
      onDateChange(subDays(currentDate, 1))
    } else if (viewMode === 'week') {
      onDateChange(subWeeks(currentDate, 1))
    } else {
      onDateChange(subMonths(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'day') {
      onDateChange(addDays(currentDate, 1))
    } else if (viewMode === 'week') {
      onDateChange(addWeeks(currentDate, 1))
    } else {
      onDateChange(addMonths(currentDate, 1))
    }
  }

  // Versão compacta para o header
  if (compact) {
    return (
      <div className="flex items-center gap-2 xl:gap-6 flex-wrap xl:flex-nowrap">
        {/* View Selector */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('day')}
            className={`px-2 xl:px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'day'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            Dia
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={`px-2 xl:px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={`px-2 xl:px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'month'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            Mês
          </button>
        </div>

        {/* Separador - oculto em telas menores */}
        <div className="hidden xl:block w-px h-7 bg-gray-200" />

        {/* Stats do dia - oculto em telas menores */}
        <div className="hidden xl:flex items-center gap-2 text-gray-600">
          <Calendar size={16} className="text-orange-500" />
          <span className="text-sm whitespace-nowrap">
            <span className="font-semibold text-gray-900">{appointmentsToday}</span>
            {' '}agendamentos hoje
          </span>
        </div>

        {/* Separador - oculto em telas menores */}
        <div className="hidden xl:block w-px h-7 bg-gray-200" />

        {/* Botão Novo Agendamento */}
        <Link
          to="/app/agenda/nova"
          className="inline-flex items-center gap-1 xl:gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 xl:px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow-md whitespace-nowrap"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Novo Agendamento</span>
          <span className="sm:hidden">Novo</span>
        </Link>

        {/* Separador */}
        <div className="w-px h-7 bg-gray-200" />

        {/* Navigation */}
        <div className="flex items-center gap-0.5 xl:gap-1">
          <button
            type="button"
            onClick={handlePrevious}
            className="p-1 xl:p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            title="Anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-gray-900 font-medium text-xs xl:text-sm min-w-[120px] xl:min-w-[180px] text-center whitespace-nowrap">
            {getDateRangeText()}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="p-1 xl:p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            title="Próximo"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Botão Hoje */}
        <button
          type="button"
          onClick={onToday}
          className="px-2 xl:px-3 py-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-sm font-medium transition-all"
        >
          Hoje
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      {/* Left side: View Selector + Stats + New Button */}
      <div className="flex items-center gap-4">
        {/* View Selector */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('day')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'day'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            Dia
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'month'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            Mês
          </button>
        </div>

        {/* Separador */}
        <div className="w-px h-8 bg-gray-200" />

        {/* Stats do dia */}
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={18} className="text-orange-500" />
          <span className="text-sm">
            <span className="font-bold text-gray-900">{appointmentsToday}</span>
            {' '}agendamentos hoje
          </span>
        </div>

        {/* Separador */}
        <div className="w-px h-8 bg-gray-200" />

        {/* Botão Novo Agendamento */}
        <Link
          to="/app/agenda/nova"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all hover:shadow-md"
        >
          <Plus size={18} />
          Novo Agendamento
        </Link>
      </div>

      {/* Right side: Navigation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePrevious}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          title="Anterior"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-gray-900 font-medium min-w-[250px] text-center">
          {getDateRangeText()}
        </span>

        <button
          type="button"
          onClick={handleNext}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          title="Próximo"
        >
          <ChevronRight size={20} />
        </button>

        <button
          type="button"
          onClick={onToday}
          className="px-4 py-2 text-orange-500 border-2 border-orange-500 rounded-lg font-medium hover:bg-orange-50 transition-all"
        >
          Hoje
        </button>
      </div>
    </div>
  )
}
