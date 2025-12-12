import { Search, X, Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback, memo } from 'react'
import { SEARCH_DEBOUNCE_MS } from '@/constants'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Tempo de debounce em ms (0 = sem debounce) */
  debounceMs?: number
  /** Mostra indicador de loading durante debounce */
  showLoadingIndicator?: boolean
}

function SearchInputComponent({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
  debounceMs = SEARCH_DEBOUNCE_MS,
  showLoadingIndicator = true
}: SearchInputProps) {
  // Estado local para valor imediato (UI responsiva)
  const [localValue, setLocalValue] = useState(value)
  const [isDebouncing, setIsDebouncing] = useState(false)

  // Sincronizar valor externo com local
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Debounce da chamada onChange
  useEffect(() => {
    // Se nao tem debounce, chamar imediatamente
    if (debounceMs === 0) {
      if (localValue !== value) {
        onChange(localValue)
      }
      return
    }

    // Se valor local eh diferente do externo, esta em debounce
    if (localValue !== value) {
      setIsDebouncing(true)
    }

    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
      setIsDebouncing(false)
    }, debounceMs)

    return () => {
      clearTimeout(timer)
    }
  }, [localValue, value, debounceMs, onChange])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }, [])

  const handleClear = useCallback(() => {
    setLocalValue('')
    onChange('')
    setIsDebouncing(false)
  }, [onChange])

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {showLoadingIndicator && isDebouncing && (
          <Loader2 size={14} className="text-gray-400 animate-spin" />
        )}
        {localValue && (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            type="button"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

// Memoizar para evitar re-renders desnecessarios
const SearchInput = memo(SearchInputComponent)

export default SearchInput
