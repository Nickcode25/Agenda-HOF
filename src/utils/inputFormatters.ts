/**
 * Formata string de tempo para formato HH:MM
 * Aceita entrada numérica e adiciona os dois pontos automaticamente
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
 * Aceita entrada numérica e adiciona as barras automaticamente
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
