/**
 * Testes para funcoes de formatacao de input
 */

import { describe, it, expect } from 'vitest'
import { formatTimeInput, formatDateInput } from './inputFormatters'

describe('formatTimeInput', () => {
  it('deve retornar vazio para string vazia', () => {
    expect(formatTimeInput('')).toBe('')
  })

  it('deve manter digitos simples', () => {
    expect(formatTimeInput('1')).toBe('1')
    expect(formatTimeInput('12')).toBe('12')
  })

  it('deve adicionar dois pontos apos 2 digitos', () => {
    expect(formatTimeInput('123')).toBe('12:3')
    expect(formatTimeInput('1234')).toBe('12:34')
  })

  it('deve limitar a 4 digitos', () => {
    expect(formatTimeInput('12345')).toBe('12:34')
    expect(formatTimeInput('123456')).toBe('12:34')
  })

  it('deve remover caracteres nao numericos', () => {
    expect(formatTimeInput('12:34')).toBe('12:34')
    expect(formatTimeInput('12a34')).toBe('12:34')
    expect(formatTimeInput('ab:cd')).toBe('')
  })

  it('deve formatar corretamente horarios validos', () => {
    expect(formatTimeInput('0900')).toBe('09:00')
    expect(formatTimeInput('2359')).toBe('23:59')
    expect(formatTimeInput('0001')).toBe('00:01')
  })
})

describe('formatDateInput', () => {
  it('deve retornar vazio para string vazia', () => {
    expect(formatDateInput('')).toBe('')
  })

  it('deve manter digitos simples', () => {
    expect(formatDateInput('1')).toBe('1')
    expect(formatDateInput('12')).toBe('12')
  })

  it('deve adicionar primeira barra apos 2 digitos', () => {
    expect(formatDateInput('123')).toBe('12/3')
    expect(formatDateInput('1234')).toBe('12/34')
  })

  it('deve adicionar segunda barra apos 4 digitos', () => {
    expect(formatDateInput('12345')).toBe('12/34/5')
    expect(formatDateInput('12345678')).toBe('12/34/5678')
  })

  it('deve limitar a 8 digitos', () => {
    expect(formatDateInput('123456789')).toBe('12/34/5678')
    expect(formatDateInput('1234567890')).toBe('12/34/5678')
  })

  it('deve remover caracteres nao numericos', () => {
    expect(formatDateInput('12/03/2024')).toBe('12/03/2024')
    expect(formatDateInput('12a03b2024')).toBe('12/03/2024')
    expect(formatDateInput('ab/cd/efgh')).toBe('')
  })

  it('deve formatar corretamente datas validas', () => {
    expect(formatDateInput('01012024')).toBe('01/01/2024')
    expect(formatDateInput('31122024')).toBe('31/12/2024')
    expect(formatDateInput('15062023')).toBe('15/06/2023')
  })
})
