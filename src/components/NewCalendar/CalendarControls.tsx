import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ViewMode = 'day' | 'week' | 'month'

interface CalendarControlsProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  currentDate: Date
  onDateChange: (date: Date) => void
  onToday: () => void
}

export default function CalendarControls({
  viewMode,
  onViewModeChange,
  currentDate,
  onDateChange,
  onToday
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

  return (
    <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      {/* View Selector */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
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

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
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
          onClick={handleNext}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          title="Próximo"
        >
          <ChevronRight size={20} />
        </button>

        <button
          onClick={onToday}
          className="px-4 py-2 text-orange-500 border-2 border-orange-500 rounded-lg font-medium hover:bg-orange-50 transition-all"
        >
          Hoje
        </button>
      </div>
    </div>
  )
}
