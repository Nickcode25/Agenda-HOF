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
 * Evita problemas de fuso horário convertendo diretamente a string
 * @param dateString - String no formato YYYY-MM-DD
 * @returns String formatada no padrão brasileiro
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return ''

  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Formata uma string de data ISO ou timestamp para o formato brasileiro (DD/MM/YYYY)
 * Usa o fuso horário de São Paulo para evitar problemas de timezone
 * @param dateInput - Data em qualquer formato (ISO string, timestamp, Date)
 * @returns String formatada no padrão brasileiro
 */
export function formatDateTimeBRSafe(dateInput: string | number | Date): string {
  if (!dateInput) return ''
  return formatInSaoPaulo(dateInput, 'dd/MM/yyyy')
}

/**
 * Formata uma string de data ISO ou timestamp para o formato brasileiro com hora
 * Usa o fuso horário de São Paulo para evitar problemas de timezone
 * @param dateInput - Data em qualquer formato (ISO string, timestamp, Date)
 * @returns String formatada no padrão brasileiro com hora
 */
export function formatDateTimeWithHourBRSafe(dateInput: string | number | Date): string {
  if (!dateInput) return ''
  return formatInSaoPaulo(dateInput, "dd/MM/yyyy 'às' HH:mm")
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD
 * Usa o fuso horário de São Paulo
 * @returns String no formato YYYY-MM-DD
 */
export function getTodayString(): string {
  return getTodayInSaoPaulo()
}

/**
 * Converte string YYYY-MM-DD para Date com hora ao meio-dia (evita problemas de timezone)
 * @param dateString - String no formato YYYY-MM-DD
 * @returns Date object
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date()
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0)
}
