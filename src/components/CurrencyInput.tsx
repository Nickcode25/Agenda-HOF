import { forwardRef } from 'react'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onValueChange?: (numericValue: number) => void
}

/**
 * Componente de input para valores monetários (R$)
 * - Formata automaticamente durante a digitação
 * - Aceita apenas números
 * - Exibe no formato: R$ 1.234,56
 */
const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onValueChange, className = '', ...props }, ref) => {

    const formatCurrency = (inputValue: string): string => {
      // Remove tudo que não é número
      const numbers = inputValue.replace(/\D/g, '')

      // Se vazio, retorna formatação vazia
      if (!numbers) {
        onValueChange?.(0)
        return 'R$ 0,00'
      }

      // Converte para número com centavos
      const amount = Number(numbers) / 100

      // Chama callback com valor numérico se fornecido
      onValueChange?.(amount)

      // Formata como moeda brasileira
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCurrency(e.target.value)
      onChange(formatted)
    }

    const defaultClassName = "w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        className={className || defaultClassName}
        {...props}
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export default CurrencyInput
