import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown, X } from 'lucide-react'

interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  className = '',
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filtrar opções baseado no termo de busca
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Encontrar label da opção selecionada
  const selectedOption = options.find(opt => opt.value === value)
  const selectedLabel = selectedOption?.label || ''

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Verificar se o clique foi no container ou no dropdown
      const clickedContainer = containerRef.current?.contains(target)
      const clickedDropdown = (target as Element).closest('[data-searchable-dropdown]')

      if (!clickedContainer && !clickedDropdown) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    // Usar timeout para garantir que o handler seja registrado após o dropdown ser renderizado
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Focar no input quando abrir e calcular posição
  useEffect(() => {
    if (isOpen && inputRef.current && containerRef.current) {
      inputRef.current.focus()

      // Calcular posição do dropdown
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  // Atualizar posição ao fazer scroll
  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        })
      }
    }

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    console.log('🔍 handleSelect chamado com:', optionValue)
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  const dropdownContent = isOpen && (
    <div
      data-searchable-dropdown="true"
      style={{
        position: 'absolute',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        zIndex: 99999
      }}
      className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Search Input */}
      <div className="p-3 border-b border-gray-700 bg-gray-800/95 backdrop-blur-sm sticky top-0">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
      </div>

      {/* Options List */}
      <div className="max-h-64 overflow-y-auto">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!option.disabled) {
                  handleSelect(option.value)
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault()
              }}
              disabled={option.disabled}
              className={`w-full text-left px-4 py-3 transition-colors ${
                option.value === value
                  ? 'bg-orange-600 text-white font-medium'
                  : option.disabled
                  ? 'bg-gray-750 text-gray-500 cursor-not-allowed'
                  : 'text-gray-200 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-gray-400">
            <Search size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum resultado encontrado</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div ref={containerRef} className={className}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full bg-gray-700/50 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-left flex items-center justify-between ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-500'
          }`}
        >
          <span className={selectedLabel ? 'text-white' : 'text-gray-400'}>
            {selectedLabel || placeholder}
          </span>
          <div className="flex items-center gap-2">
            {value && !disabled && (
              <X
                size={16}
                className="text-gray-400 hover:text-white transition-colors"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
      </div>

      {/* Dropdown renderizado via Portal */}
      {isOpen && createPortal(dropdownContent, document.body)}
    </>
  )
}
