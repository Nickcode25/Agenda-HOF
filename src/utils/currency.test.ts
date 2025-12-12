/**
 * Testes para funcoes de formatacao de moeda
 */

import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCurrency } from './currency'

describe('formatCurrency', () => {
  it('deve formatar valor inteiro', () => {
    const result = formatCurrency(100)
    expect(result).toBe('R$ 100,00')
  })

  it('deve formatar valor com centavos', () => {
    const result = formatCurrency(99.90)
    expect(result).toBe('R$ 99,90')
  })

  it('deve formatar valores grandes com separador de milhar', () => {
    const result = formatCurrency(1234.56)
    expect(result).toBe('R$ 1.234,56')
  })

  it('deve formatar valores muito grandes', () => {
    const result = formatCurrency(1234567.89)
    expect(result).toBe('R$ 1.234.567,89')
  })

  it('deve formatar zero', () => {
    const result = formatCurrency(0)
    expect(result).toBe('R$ 0,00')
  })

  it('deve formatar valores negativos', () => {
    const result = formatCurrency(-100)
    expect(result).toContain('100,00')
  })

  it('deve arredondar valores com mais de 2 casas decimais', () => {
    const result = formatCurrency(10.999)
    expect(result).toBe('R$ 11,00')
  })

  it('deve formatar valores pequenos corretamente', () => {
    const result = formatCurrency(0.01)
    expect(result).toBe('R$ 0,01')
  })
})

describe('parseCurrency', () => {
  it('deve converter string formatada para numero', () => {
    const result = parseCurrency('R$ 100,00')
    expect(result).toBe(100)
  })

  it('deve converter valor com centavos', () => {
    const result = parseCurrency('R$ 99,90')
    expect(result).toBe(99.9)
  })

  it('deve converter valor com milhar', () => {
    const result = parseCurrency('R$ 1.234,56')
    expect(result).toBe(1234.56)
  })

  it('deve converter valor sem simbolo de moeda', () => {
    const result = parseCurrency('100,00')
    expect(result).toBe(100)
  })

  it('deve retornar 0 para string vazia', () => {
    const result = parseCurrency('')
    expect(result).toBe(0)
  })

  it('deve retornar 0 para string invalida', () => {
    const result = parseCurrency('invalido')
    expect(result).toBe(0)
  })

  it('deve converter valores muito grandes', () => {
    const result = parseCurrency('R$ 1.234.567,89')
    expect(result).toBe(1234567.89)
  })

  it('deve lidar com espacos extras', () => {
    const result = parseCurrency('  R$   100,00  ')
    expect(result).toBe(100)
  })
})

describe('formatCurrency e parseCurrency sao inversos', () => {
  it('deve converter e reconverter corretamente', () => {
    const valores = [0, 1, 10.5, 99.99, 1000, 12345.67]

    valores.forEach(valor => {
      const formatado = formatCurrency(valor)
      const parseado = parseCurrency(formatado)
      expect(parseado).toBeCloseTo(valor, 2)
    })
  })
})
