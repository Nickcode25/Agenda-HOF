/**
 * Utilitários para manipulação de datas sem problemas de fuso horário
 * Usa o fuso horário de São Paulo (America/Sao_Paulo)
 */

import { getTodayInSaoPaulo, formatInSaoPaulo } from './timezone'

/**
 * Normaliza uma string de data (YYYY-MM-DD) para ISO string
 * Evita problemas de fuso horário usando o timezone de São Paulo
 * @param dateString - String no formato YYYY-MM-DD
 * @returns String ISO (YYYY-MM-DD)
 */
export function normalizeDateString(dateString: string): string {
  if (!dateString) return ''

  // Retorna a string de data diretamente, já normalizada
  const [year, month, day] = dateString.split('-')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

/**
 * Formata uma string de data (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY)
 * Evita problemas de fuso horário usando o timezone de São Paulo
 * @param dateString - String no formato YYYY-MM-DD
 * @returns String formatada no padrão brasileiro
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return ''

  const [year, month, day] = dateString.split('-')
  // Cria data ao meio-dia em São Paulo para evitar problemas de timezone
  const date = new Date(`${year}-${month}-${day}T12:00:00`)
  return formatInSaoPaulo(date, 'dd/MM/yyyy')
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD
 * Usa o fuso horário de São Paulo
 * @returns String no formato YYYY-MM-DD
 */
export function getTodayString(): string {
  return getTodayInSaoPaulo()
}
