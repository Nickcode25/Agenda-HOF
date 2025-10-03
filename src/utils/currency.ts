/**
 * Formata um valor numérico para o padrão brasileiro de moeda
 * @param value - Valor numérico a ser formatado
 * @returns String formatada no padrão R$ 1.234,56
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Converte uma string de moeda formatada para número
 * @param value - String no formato "R$ 1.234,56" ou similar
 * @returns Número decimal
 */
export function parseCurrency(value: string): number {
  // Remove R$, pontos e espaços, substitui vírgula por ponto
  const numbers = value.replace(/[R$\s.]/g, '').replace(',', '.')
  return Number(numbers) || 0
}
