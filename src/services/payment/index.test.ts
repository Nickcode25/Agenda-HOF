/**
 * Testes para o servico de pagamento
 */

import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  calculateDiscountedPrice,
  isValidPaymentAmount
} from './index'

describe('formatCurrency', () => {
  it('deve formatar valor em BRL por padrao', () => {
    const result = formatCurrency(100)
    expect(result).toBe('R$ 100,00')
  })

  it('deve formatar valor com centavos', () => {
    const result = formatCurrency(99.90)
    expect(result).toBe('R$ 99,90')
  })

  it('deve formatar valores grandes', () => {
    const result = formatCurrency(1234.56)
    expect(result).toBe('R$ 1.234,56')
  })

  it('deve aceitar outras moedas', () => {
    const result = formatCurrency(100, 'USD')
    expect(result).toContain('100')
    expect(result).toContain('US$')
  })

  it('deve lidar com moeda em minusculas', () => {
    const result = formatCurrency(100, 'brl')
    expect(result).toBe('R$ 100,00')
  })
})

describe('calculateDiscountedPrice', () => {
  it('deve calcular desconto percentual', () => {
    expect(calculateDiscountedPrice(100, 10)).toBe(90)
    expect(calculateDiscountedPrice(100, 50)).toBe(50)
    expect(calculateDiscountedPrice(100, 25)).toBe(75)
  })

  it('deve retornar preco original para desconto 0', () => {
    expect(calculateDiscountedPrice(100, 0)).toBe(100)
  })

  it('deve retornar preco original para desconto negativo', () => {
    expect(calculateDiscountedPrice(100, -10)).toBe(100)
  })

  it('deve retornar preco original para desconto maior que 100', () => {
    expect(calculateDiscountedPrice(100, 150)).toBe(100)
  })

  it('deve lidar com desconto de 100%', () => {
    expect(calculateDiscountedPrice(100, 100)).toBe(0)
  })

  it('deve arredondar para 2 casas decimais', () => {
    expect(calculateDiscountedPrice(99.99, 33)).toBe(66.99)
    expect(calculateDiscountedPrice(10, 33)).toBe(6.70)
  })

  it('deve funcionar com valores pequenos', () => {
    expect(calculateDiscountedPrice(1, 50)).toBe(0.5)
    expect(calculateDiscountedPrice(0.10, 10)).toBe(0.09)
  })
})

describe('isValidPaymentAmount', () => {
  it('deve aceitar valores positivos', () => {
    expect(isValidPaymentAmount(1)).toBe(true)
    expect(isValidPaymentAmount(100)).toBe(true)
    expect(isValidPaymentAmount(99.99)).toBe(true)
  })

  it('deve rejeitar zero', () => {
    expect(isValidPaymentAmount(0)).toBe(false)
  })

  it('deve rejeitar valores negativos', () => {
    expect(isValidPaymentAmount(-1)).toBe(false)
    expect(isValidPaymentAmount(-100)).toBe(false)
  })

  it('deve rejeitar valores muito grandes', () => {
    expect(isValidPaymentAmount(1000000)).toBe(false)
    expect(isValidPaymentAmount(999999.99)).toBe(true)
  })

  it('deve rejeitar Infinity', () => {
    expect(isValidPaymentAmount(Infinity)).toBe(false)
    expect(isValidPaymentAmount(-Infinity)).toBe(false)
  })

  it('deve rejeitar NaN', () => {
    expect(isValidPaymentAmount(NaN)).toBe(false)
  })

  it('deve aceitar valores decimais pequenos', () => {
    expect(isValidPaymentAmount(0.01)).toBe(true)
    expect(isValidPaymentAmount(0.50)).toBe(true)
  })
})
