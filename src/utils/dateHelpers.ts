/**
 * Utilitários para manipulação de datas sem problemas de fuso horário
 */

/**
 * Normaliza uma string de data (YYYY-MM-DD) para ISO string
 * Evita problemas de fuso horário ao criar a data no meio-dia local
 * @param dateString - String no formato YYYY-MM-DD
 * @returns String ISO (YYYY-MM-DD)
 */
export function normalizeDateString(dateString: string): string {
  if (!dateString) return ''

  // Cria a data no meio-dia local para evitar problemas de fuso horário
  const [year, month, day] = dateString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)
  return date.toISOString().split('T')[0]
}

/**
 * Formata uma string de data (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY)
 * Evita problemas de fuso horário ao criar a data localmente
 * @param dateString - String no formato YYYY-MM-DD
 * @returns String formatada no padrão brasileiro
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return ''

  const [year, month, day] = dateString.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString('pt-BR')
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD
 * @returns String no formato YYYY-MM-DD
 */
export function getTodayString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
