/**
 * Testes para funcoes de validacao
 */

import { describe, it, expect } from 'vitest'
import {
  validatePasswordStrength,
  validateEmail,
  validatePhone,
  validateCPF,
  formatCPF,
  validateCEP,
  formatCEP,
} from './validation'

// ============================================
// TESTES DE VALIDACAO DE SENHA
// ============================================

describe('validatePasswordStrength', () => {
  it('deve rejeitar senha com menos de 8 caracteres', () => {
    const result = validatePasswordStrength('Abc123!')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('8 caracteres')
  })

  it('deve rejeitar senha fraca (sem variedade)', () => {
    const result = validatePasswordStrength('abcdefgh')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('fraca')
  })

  it('deve aceitar senha forte com maiusculas, minusculas e numeros', () => {
    const result = validatePasswordStrength('Abc12345')
    expect(result.isValid).toBe(true)
  })

  it('deve aceitar senha forte com caracteres especiais', () => {
    const result = validatePasswordStrength('Abc123!@')
    expect(result.isValid).toBe(true)
    expect(result.message).toContain('forte')
  })

  it('deve aceitar senha com apenas 3 tipos de caracteres', () => {
    const result = validatePasswordStrength('abcABC12')
    expect(result.isValid).toBe(true)
  })
})

// ============================================
// TESTES DE VALIDACAO DE EMAIL
// ============================================

describe('validateEmail', () => {
  it('deve rejeitar email vazio', () => {
    const result = validateEmail('')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('obrigatorio')
  })

  it('deve rejeitar email sem @', () => {
    const result = validateEmail('emailinvalido.com')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('invalido')
  })

  it('deve rejeitar email sem dominio', () => {
    const result = validateEmail('email@')
    expect(result.isValid).toBe(false)
  })

  it('deve rejeitar email sem extensao', () => {
    const result = validateEmail('email@dominio')
    expect(result.isValid).toBe(false)
  })

  it('deve aceitar email valido', () => {
    const result = validateEmail('usuario@exemplo.com')
    expect(result.isValid).toBe(true)
  })

  it('deve aceitar email com subdominio', () => {
    const result = validateEmail('usuario@sub.dominio.com')
    expect(result.isValid).toBe(true)
  })

  it('deve sugerir correcao para typos comuns - gmial', () => {
    const result = validateEmail('usuario@gmial.com')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('gmail.com')
  })

  it('deve sugerir correcao para typos comuns - hotmial', () => {
    const result = validateEmail('usuario@hotmial.com')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('hotmail.com')
  })

  it('deve sugerir correcao para typos comuns - outlok', () => {
    const result = validateEmail('usuario@outlok.com')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('outlook.com')
  })
})

// ============================================
// TESTES DE VALIDACAO DE TELEFONE
// ============================================

describe('validatePhone', () => {
  it('deve rejeitar telefone vazio', () => {
    const result = validatePhone('')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('obrigatorio')
  })

  it('deve rejeitar telefone incompleto', () => {
    const result = validatePhone('1199999')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('incompleto')
  })

  it('deve rejeitar telefone muito longo', () => {
    const result = validatePhone('119999999999')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('invalido')
  })

  it('deve rejeitar DDD invalido', () => {
    const result = validatePhone('0099999999')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('DDD')
  })

  it('deve rejeitar celular sem 9 inicial', () => {
    const result = validatePhone('11899999999')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('comecar com 9')
  })

  it('deve rejeitar sequencias repetidas', () => {
    const result = validatePhone('11999999999')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('invalido')
  })

  it('deve aceitar telefone fixo valido (10 digitos)', () => {
    const result = validatePhone('1133334444')
    expect(result.isValid).toBe(true)
  })

  it('deve aceitar celular valido (11 digitos)', () => {
    const result = validatePhone('11912345678')
    expect(result.isValid).toBe(true)
  })

  it('deve aceitar telefone com formatacao', () => {
    const result = validatePhone('(11) 91234-5678')
    expect(result.isValid).toBe(true)
  })

  it('deve aceitar DDDs de diferentes estados', () => {
    const ddds = ['21', '31', '41', '51', '61', '71', '81', '91']
    ddds.forEach(ddd => {
      const result = validatePhone(`${ddd}912345678`)
      expect(result.isValid).toBe(true)
    })
  })
})

// ============================================
// TESTES DE VALIDACAO DE CPF
// ============================================

describe('validateCPF', () => {
  it('deve rejeitar CPF vazio', () => {
    const result = validateCPF('')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('obrigatorio')
  })

  it('deve rejeitar CPF com menos de 11 digitos', () => {
    const result = validateCPF('1234567890')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('11 digitos')
  })

  it('deve rejeitar CPF com digitos repetidos', () => {
    const cpfsInvalidos = [
      '00000000000',
      '11111111111',
      '22222222222',
      '99999999999',
    ]
    cpfsInvalidos.forEach(cpf => {
      const result = validateCPF(cpf)
      expect(result.isValid).toBe(false)
    })
  })

  it('deve rejeitar CPF com digito verificador invalido', () => {
    const result = validateCPF('12345678901')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('invalido')
  })

  it('deve aceitar CPF valido sem formatacao', () => {
    const result = validateCPF('52998224725')
    expect(result.isValid).toBe(true)
  })

  it('deve aceitar CPF valido com formatacao', () => {
    const result = validateCPF('529.982.247-25')
    expect(result.isValid).toBe(true)
  })

  it('deve aceitar outros CPFs validos', () => {
    const cpfsValidos = [
      '11144477735',
      '86522644420',
      '58794456091',
    ]
    cpfsValidos.forEach(cpf => {
      const result = validateCPF(cpf)
      expect(result.isValid).toBe(true)
    })
  })
})

describe('formatCPF', () => {
  it('deve formatar CPF sem formatacao', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25')
  })

  it('deve retornar original se CPF invalido', () => {
    expect(formatCPF('123')).toBe('123')
  })

  it('deve lidar com CPF ja formatado', () => {
    const cpf = '529.982.247-25'
    expect(formatCPF(cpf)).toBe(cpf)
  })
})

// ============================================
// TESTES DE VALIDACAO DE CEP
// ============================================

describe('validateCEP', () => {
  it('deve rejeitar CEP vazio', () => {
    const result = validateCEP('')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('obrigatorio')
  })

  it('deve rejeitar CEP com menos de 8 digitos', () => {
    const result = validateCEP('1234567')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('8 digitos')
  })

  it('deve rejeitar CEP com digitos repetidos', () => {
    const result = validateCEP('00000000')
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('invalido')
  })

  it('deve aceitar CEP valido sem formatacao', () => {
    const result = validateCEP('01310100')
    expect(result.isValid).toBe(true)
  })

  it('deve aceitar CEP valido com formatacao', () => {
    const result = validateCEP('01310-100')
    expect(result.isValid).toBe(true)
  })
})

describe('formatCEP', () => {
  it('deve formatar CEP sem formatacao', () => {
    expect(formatCEP('01310100')).toBe('01310-100')
  })

  it('deve retornar original se CEP invalido', () => {
    expect(formatCEP('123')).toBe('123')
  })
})
