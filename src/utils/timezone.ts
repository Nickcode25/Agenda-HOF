/**
 * Utilitários centralizados para manipulação de timezone
 * Configurado para usar o fuso horário de São Paulo (America/Sao_Paulo)
 */

import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

// Fuso horário padrão do sistema
export const TIMEZONE = 'America/Sao_Paulo'

/**
 * Retorna a data/hora atual no fuso horário de São Paulo
 */
export function nowInSaoPaulo(): Date {
  return toZonedTime(new Date(), TIMEZONE)
}

/**
 * Formata uma data para o fuso horário de São Paulo
 * @param date - Data a ser formatada (pode ser Date, string ISO, ou timestamp)
 * @param formatStr - String de formato (padrão date-fns)
 */
export function formatInSaoPaulo(date: Date | string | number, formatStr: string): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return formatInTimeZone(dateObj, TIMEZONE, formatStr, { locale: ptBR })
}

/**
 * Converte uma data UTC para o horário de São Paulo
 * @param date - Data em UTC
 */
export function toSaoPauloTime(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return toZonedTime(dateObj, TIMEZONE)
}

/**
 * Converte uma data no horário de São Paulo para UTC
 * Útil para salvar no banco de dados
 * @param date - Data no horário de São Paulo
 */
export function fromSaoPauloTime(date: Date): Date {
  return fromZonedTime(date, TIMEZONE)
}

/**
 * Retorna a data de hoje em São Paulo no formato YYYY-MM-DD
 */
export function getTodayInSaoPaulo(): string {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd')
}

/**
 * Retorna a hora atual em São Paulo no formato HH:mm
 */
export function getCurrentTimeInSaoPaulo(): string {
  return formatInTimeZone(new Date(), TIMEZONE, 'HH:mm')
}

/**
 * Formata uma data para exibição no formato brasileiro
 * @param date - Data a ser formatada
 * @param includeTime - Se deve incluir a hora (padrão: false)
 */
export function formatDateTimeBR(date: Date | string | number, includeTime: boolean = false): string {
  const formatStr = includeTime ? "dd/MM/yyyy 'às' HH:mm" : 'dd/MM/yyyy'
  return formatInSaoPaulo(date, formatStr)
}

/**
 * Formata uma data no formato YYYY-MM-DD para DD/MM/YYYY
 * Esta função não faz conversão de timezone, apenas reformata a string
 * Útil para datas que vêm do banco de dados sem componente de hora
 * @param dateStr - Data no formato YYYY-MM-DD
 */
export function formatDateOnlyBR(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/**
 * Formata apenas a hora no formato brasileiro
 * @param date - Data/hora a ser formatada
 */
export function formatTimeBR(date: Date | string | number): string {
  return formatInSaoPaulo(date, 'HH:mm')
}

/**
 * Cria uma data ISO a partir de data e hora no formato brasileiro
 * @param dateStr - Data no formato DD/MM/YYYY ou YYYY-MM-DD
 * @param timeStr - Hora no formato HH:mm
 * @returns String ISO para salvar no banco
 */
export function createISOFromDateTimeBR(dateStr: string, timeStr: string): string {
  let year: string, month: string, day: string

  if (dateStr.includes('/')) {
    // Formato DD/MM/YYYY
    const parts = dateStr.split('/')
    day = parts[0]
    month = parts[1]
    year = parts[2]
  } else {
    // Formato YYYY-MM-DD
    const parts = dateStr.split('-')
    year = parts[0]
    month = parts[1]
    day = parts[2]
  }

  // Cria a data no fuso horário de São Paulo
  const dateTimeStr = `${year}-${month}-${day}T${timeStr}:00`
  const localDate = new Date(dateTimeStr)

  // Converte de São Paulo para UTC
  const utcDate = fromSaoPauloTime(localDate)

  return utcDate.toISOString()
}

/**
 * Formata uma data para exibição completa (dia da semana, data por extenso)
 * @param date - Data a ser formatada
 */
export function formatFullDateBR(date: Date | string | number): string {
  return formatInSaoPaulo(date, "EEEE, d 'de' MMMM 'de' yyyy")
}

/**
 * Formata mês e ano
 * @param date - Data a ser formatada
 */
export function formatMonthYearBR(date: Date | string | number): string {
  return formatInSaoPaulo(date, 'MMMM yyyy')
}

/**
 * Verifica se duas datas são o mesmo dia no fuso horário de São Paulo
 */
export function isSameDayInSaoPaulo(date1: Date | string | number, date2: Date | string | number): boolean {
  const d1 = formatInSaoPaulo(date1, 'yyyy-MM-dd')
  const d2 = formatInSaoPaulo(date2, 'yyyy-MM-dd')
  return d1 === d2
}

/**
 * Retorna o início do dia em São Paulo (00:00:00)
 */
export function startOfDayInSaoPaulo(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const zonedDate = toZonedTime(dateObj, TIMEZONE)
  zonedDate.setHours(0, 0, 0, 0)
  return fromSaoPauloTime(zonedDate)
}

/**
 * Retorna o fim do dia em São Paulo (23:59:59)
 */
export function endOfDayInSaoPaulo(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const zonedDate = toZonedTime(dateObj, TIMEZONE)
  zonedDate.setHours(23, 59, 59, 999)
  return fromSaoPauloTime(zonedDate)
}
