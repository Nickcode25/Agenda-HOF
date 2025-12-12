/**
 * @fileoverview Funcoes para formatacao de entrada em tempo real
 * @module utils/inputFormatters
 *
 * @description
 * Este modulo contem funcoes para formatar entradas de texto enquanto
 * o usuario digita. Util para campos de formularios que exigem
 * formatacao especifica (hora, data, telefone, etc).
 *
 * @example
 * import { formatTimeInput, formatDateInput } from '@/utils/inputFormatters'
 *
 * // Em um input controlado
 * const handleTimeChange = (e) => {
 *   setTime(formatTimeInput(e.target.value))
 * }
 */

/**
 * Formata string de tempo para formato HH:MM
 *
 * @description
 * Aceita entrada numerica e adiciona os dois pontos automaticamente.
 * Remove qualquer caractere nao numerico da entrada.
 * Limita a entrada a 4 digitos (HHMM).
 *
 * @param {string} value - Valor digitado pelo usuario
 * @returns {string} Valor formatado no padrao HH:MM
 *
 * @example
 * formatTimeInput('1')     // '1'
 * formatTimeInput('14')    // '14'
 * formatTimeInput('143')   // '14:3'
 * formatTimeInput('1430')  // '14:30'
 * formatTimeInput('14:30') // '14:30' (mantem se ja formatado)
 */
export function formatTimeInput(value: string): string {
  const numbers = value.replace(/\D/g, '')
  const limited = numbers.slice(0, 4)

  if (limited.length >= 3) {
    return `${limited.slice(0, 2)}:${limited.slice(2)}`
  } else if (limited.length >= 1) {
    return limited
  }

  return ''
}

/**
 * Formata string de data para formato DD/MM/YYYY
 *
 * @description
 * Aceita entrada numerica e adiciona as barras automaticamente.
 * Remove qualquer caractere nao numerico da entrada.
 * Limita a entrada a 8 digitos (DDMMYYYY).
 *
 * @param {string} value - Valor digitado pelo usuario
 * @returns {string} Valor formatado no padrao DD/MM/YYYY
 *
 * @example
 * formatDateInput('1')        // '1'
 * formatDateInput('12')       // '12'
 * formatDateInput('121')      // '12/1'
 * formatDateInput('1212')     // '12/12'
 * formatDateInput('12122')    // '12/12/2'
 * formatDateInput('12122024') // '12/12/2024'
 */
export function formatDateInput(value: string): string {
  const numbers = value.replace(/\D/g, '')
  const limited = numbers.slice(0, 8)

  if (limited.length >= 5) {
    return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`
  } else if (limited.length >= 3) {
    return `${limited.slice(0, 2)}/${limited.slice(2)}`
  } else if (limited.length >= 1) {
    return limited
  }

  return ''
}

/**
 * Formata string de telefone para formato brasileiro
 *
 * @description
 * Aceita entrada numerica e adiciona a formatacao automaticamente.
 * Suporta telefones fixos (10 digitos) e celulares (11 digitos).
 *
 * @param {string} value - Valor digitado pelo usuario
 * @returns {string} Valor formatado no padrao (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 *
 * @example
 * formatPhoneInput('11')           // '(11)'
 * formatPhoneInput('1199999')      // '(11) 99999'
 * formatPhoneInput('11999999999')  // '(11) 99999-9999'
 * formatPhoneInput('1133334444')   // '(11) 3333-4444'
 */
export function formatPhoneInput(value: string): string {
  const numbers = value.replace(/\D/g, '')
  const limited = numbers.slice(0, 11)

  if (limited.length === 0) return ''

  // Formata DDD
  if (limited.length <= 2) {
    return `(${limited}`
  }

  // Formata numero com DDD
  const ddd = limited.slice(0, 2)
  const number = limited.slice(2)

  if (number.length <= 4) {
    return `(${ddd}) ${number}`
  }

  // Decide se é celular (9 digitos) ou fixo (8 digitos)
  if (limited.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
  }

  // Fixo ou celular incompleto: (XX) XXXX-XXXX
  if (number.length <= 8) {
    if (number.length <= 4) {
      return `(${ddd}) ${number}`
    }
    return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`
  }

  // Celular: (XX) XXXXX-XXXX
  return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`
}

/**
 * Formata string de CPF para formato brasileiro
 *
 * @description
 * Aceita entrada numerica e adiciona a formatacao automaticamente.
 * Limita a entrada a 11 digitos.
 *
 * @param {string} value - Valor digitado pelo usuario
 * @returns {string} Valor formatado no padrao XXX.XXX.XXX-XX
 *
 * @example
 * formatCPFInput('123')        // '123'
 * formatCPFInput('12345')      // '123.45'
 * formatCPFInput('12345678')   // '123.456.78'
 * formatCPFInput('12345678901') // '123.456.789-01'
 */
export function formatCPFInput(value: string): string {
  const numbers = value.replace(/\D/g, '')
  const limited = numbers.slice(0, 11)

  if (limited.length <= 3) return limited
  if (limited.length <= 6) return `${limited.slice(0, 3)}.${limited.slice(3)}`
  if (limited.length <= 9) return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
  return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
}

/**
 * Formata string de CEP para formato brasileiro
 *
 * @description
 * Aceita entrada numerica e adiciona o hifen automaticamente.
 * Limita a entrada a 8 digitos.
 *
 * @param {string} value - Valor digitado pelo usuario
 * @returns {string} Valor formatado no padrao XXXXX-XXX
 *
 * @example
 * formatCEPInput('01310')    // '01310'
 * formatCEPInput('01310100') // '01310-100'
 */
export function formatCEPInput(value: string): string {
  const numbers = value.replace(/\D/g, '')
  const limited = numbers.slice(0, 8)

  if (limited.length <= 5) return limited
  return `${limited.slice(0, 5)}-${limited.slice(5)}`
}

/**
 * Formata string de valor monetario para formato brasileiro
 *
 * @description
 * Aceita entrada numerica e formata como moeda brasileira.
 * Adiciona separador de milhar e decimal automaticamente.
 *
 * @param {string} value - Valor digitado pelo usuario
 * @returns {string} Valor formatado no padrao R$ X.XXX,XX
 *
 * @example
 * formatCurrencyInput('1')      // 'R$ 0,01'
 * formatCurrencyInput('100')    // 'R$ 1,00'
 * formatCurrencyInput('10000')  // 'R$ 100,00'
 * formatCurrencyInput('1234567') // 'R$ 12.345,67'
 */
export function formatCurrencyInput(value: string): string {
  const numbers = value.replace(/\D/g, '')

  if (!numbers) return ''

  // Converte para centavos
  const cents = parseInt(numbers, 10)
  const reais = cents / 100

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(reais)
}
