import { formatDateInput } from '@/utils/inputFormatters'

interface DateInputProps {
  value: string // Formato YYYY-MM-DD (interno) ou DD/MM/YYYY (exibição)
  onChange: (value: string) => void // Retorna formato YYYY-MM-DD
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
  min?: string
  max?: string
}

/**
 * Converte data de formato ISO (YYYY-MM-DD) para formato BR (DD/MM/YYYY)
 */
function isoToBR(isoDate: string): string {
  if (!isoDate) return ''
  // Se já está no formato BR (contém /), retorna como está
  if (isoDate.includes('/')) return isoDate
  // Se está no formato ISO (YYYY-MM-DD)
  const parts = isoDate.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return isoDate
}

/**
 * Converte data de formato BR (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
 */
function brToISO(brDate: string): string {
  if (!brDate) return ''
  // Se já está no formato ISO, retorna como está
  if (brDate.includes('-') && !brDate.includes('/')) return brDate
  // Remove formatação e verifica se tem 8 dígitos
  const numbers = brDate.replace(/\D/g, '')
  if (numbers.length === 8) {
    const day = numbers.slice(0, 2)
    const month = numbers.slice(2, 4)
    const year = numbers.slice(4, 8)
    return `${year}-${month}-${day}`
  }
  return ''
}

/**
 * Componente de input de data com formatação automática DD/MM/YYYY
 * Recebe e retorna valores no formato ISO (YYYY-MM-DD) para compatibilidade com o sistema
 */
export default function DateInput({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  required = false,
  className = '',
  disabled = false,
}: DateInputProps) {
  // Converte valor ISO para exibição BR
  const displayValue = isoToBR(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value)

    // Se a data está completa (8 dígitos), converte para ISO e envia
    const numbers = formatted.replace(/\D/g, '')
    if (numbers.length === 8) {
      const isoValue = brToISO(formatted)
      onChange(isoValue)
    } else {
      // Durante a digitação, mantém o valor formatado BR
      // mas envia string vazia se incompleto
      onChange(numbers.length > 0 ? `__BR__${formatted}` : '')
    }
  }

  // Se o valor começa com __BR__, é um valor temporário durante digitação
  const actualDisplayValue = value.startsWith('__BR__')
    ? value.replace('__BR__', '')
    : displayValue

  return (
    <input
      type="text"
      inputMode="numeric"
      value={actualDisplayValue}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      maxLength={10}
      className={className}
    />
  )
}
