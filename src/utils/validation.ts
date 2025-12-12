/**
 * @fileoverview Funcoes de validacao para dados de formularios brasileiros
 * @module utils/validation
 *
 * @description
 * Este modulo contem funcoes para validar dados comuns em formularios brasileiros,
 * incluindo CPF, email, telefone, CEP e senhas. Todas as funcoes retornam um objeto
 * padronizado com `isValid` (boolean) e `message` (string).
 *
 * @example
 * import { validateCPF, validateEmail, validatePhone } from '@/utils/validation'
 *
 * const cpfResult = validateCPF('123.456.789-09')
 * const emailResult = validateEmail('usuario@gmail.com')
 * const phoneResult = validatePhone('(11) 99999-9999')
 */

/**
 * Resultado padrao de uma validacao
 */
export interface ValidationResult {
  /** Indica se a validacao passou */
  isValid: boolean
  /** Mensagem descritiva do resultado */
  message: string
}

/**
 * Valida a forca de uma senha
 *
 * @description
 * Criterios de validacao:
 * - Minimo 8 caracteres
 * - Deve atender pelo menos 3 dos 4 requisitos:
 *   - Letra maiuscula (A-Z)
 *   - Letra minuscula (a-z)
 *   - Numero (0-9)
 *   - Caractere especial (!@#$%^&*(),.?":{}|<>)
 *
 * @param {string} password - Senha a ser validada
 * @returns {ValidationResult} Resultado da validacao
 *
 * @example
 * validatePasswordStrength('Abc123!@')
 * // { isValid: true, message: 'Senha forte' }
 *
 * @example
 * validatePasswordStrength('abc')
 * // { isValid: false, message: 'Senha deve ter no mínimo 8 caracteres' }
 */
export function validatePasswordStrength(password: string): ValidationResult {
  if (password.length < 8) {
    return { isValid: false, message: 'Senha deve ter no mínimo 8 caracteres' }
  }

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const metRequirements = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length

  if (metRequirements < 3) {
    return {
      isValid: false,
      message: 'Senha fraca. Use letras maiúsculas, minúsculas, números e caracteres especiais'
    }
  }

  return { isValid: true, message: 'Senha forte' }
}

/**
 * Valida formato de email
 *
 * @description
 * Verifica se o email possui formato valido (RFC 5322 simplificado)
 * e detecta erros de digitacao em dominios comuns (gmail, hotmail, outlook).
 *
 * @param {string} email - Email a ser validado
 * @returns {ValidationResult} Resultado da validacao
 *
 * @example
 * validateEmail('usuario@gmail.com')
 * // { isValid: true, message: 'Email válido' }
 *
 * @example
 * validateEmail('usuario@gmial.com')
 * // { isValid: false, message: 'Você quis dizer @gmail.com?' }
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, message: 'Email é obrigatório' }
  }

  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Email inválido' }
  }

  // Verifica domínios comuns com erro de digitação
  const commonTypos: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'hotmial.com': 'hotmail.com',
    'hotnail.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
  }

  const domain = email.split('@')[1]?.toLowerCase()

  if (domain && commonTypos[domain]) {
    return {
      isValid: false,
      message: `Você quis dizer @${commonTypos[domain]}?`
    }
  }

  return { isValid: true, message: 'Email válido' }
}

/**
 * Valida telefone brasileiro (fixo ou celular)
 *
 * @description
 * Validacoes realizadas:
 * - Deve ter 10 digitos (fixo) ou 11 digitos (celular)
 * - DDD deve ser valido (lista de DDDs brasileiros)
 * - Celular deve comecar com 9
 * - Nao permite sequencias repetidas (ex: 999999999)
 *
 * @param {string} phone - Telefone a ser validado (pode conter formatacao)
 * @returns {ValidationResult} Resultado da validacao
 *
 * @example
 * validatePhone('(11) 99999-9999')
 * // { isValid: true, message: 'Telefone válido' }
 *
 * @example
 * validatePhone('(00) 99999-9999')
 * // { isValid: false, message: 'DDD inválido' }
 */
export function validatePhone(phone: string): ValidationResult {
  // Remove caracteres não numéricos
  const numbers = phone.replace(/\D/g, '')

  if (!numbers) {
    return { isValid: false, message: 'Telefone é obrigatório' }
  }

  if (numbers.length < 10) {
    return { isValid: false, message: 'Telefone incompleto' }
  }

  if (numbers.length > 11) {
    return { isValid: false, message: 'Telefone inválido' }
  }

  // Valida DDD - Lista completa de DDDs brasileiros
  const ddd = parseInt(numbers.substring(0, 2))
  const validDDDs = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24, // RJ
    27, 28, // ES
    31, 32, 33, 34, 35, 37, 38, // MG
    41, 42, 43, 44, 45, 46, // PR
    47, 48, 49, // SC
    51, 53, 54, 55, // RS
    61, // DF
    62, 64, // GO
    63, // TO
    65, 66, // MT
    67, // MS
    68, // AC
    69, // RO
    71, 73, 74, 75, 77, // BA
    79, // SE
    81, 87, // PE
    82, // AL
    83, // PB
    84, // RN
    85, 88, // CE
    86, 89, // PI
    91, 93, 94, // PA
    92, 97, // AM
    95, // RR
    96, // AP
    98, 99, // MA
  ]

  if (!validDDDs.includes(ddd)) {
    return { isValid: false, message: 'DDD inválido' }
  }

  // Validar se telefone celular começa com 9
  if (numbers.length === 11) {
    const firstDigit = numbers.charAt(2)
    if (firstDigit !== '9') {
      return { isValid: false, message: 'Celular deve começar com 9' }
    }
  }

  // Verificar sequências inválidas (ex: 999999999)
  const phoneNumber = numbers.substring(2)
  if (/^(\d)\1+$/.test(phoneNumber)) {
    return { isValid: false, message: 'Telefone inválido' }
  }

  return { isValid: true, message: 'Telefone válido' }
}

/**
 * Valida CPF brasileiro
 *
 * @description
 * Realiza validacao completa do CPF incluindo:
 * - Verificacao de tamanho (11 digitos)
 * - Rejeita sequencias repetidas (ex: 111.111.111-11)
 * - Calculo dos digitos verificadores (algoritmo oficial)
 *
 * @param {string} cpf - CPF a ser validado (pode conter formatacao)
 * @returns {ValidationResult} Resultado da validacao
 *
 * @example
 * validateCPF('123.456.789-09')
 * // { isValid: false, message: 'CPF inválido' }
 *
 * @example
 * validateCPF('529.982.247-25')
 * // { isValid: true, message: 'CPF válido' }
 */
export function validateCPF(cpf: string): ValidationResult {
  // Remove caracteres não numéricos
  const numbers = cpf.replace(/\D/g, '')

  if (!numbers) {
    return { isValid: false, message: 'CPF é obrigatório' }
  }

  if (numbers.length !== 11) {
    return { isValid: false, message: 'CPF deve ter 11 dígitos' }
  }

  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(numbers)) {
    return { isValid: false, message: 'CPF inválido' }
  }

  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numbers.charAt(9))) {
    return { isValid: false, message: 'CPF inválido' }
  }

  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numbers.charAt(10))) {
    return { isValid: false, message: 'CPF inválido' }
  }

  return { isValid: true, message: 'CPF válido' }
}

/**
 * Formata CPF para exibicao no padrao brasileiro
 *
 * @param {string} cpf - CPF a ser formatado (com ou sem formatacao)
 * @returns {string} CPF formatado (XXX.XXX.XXX-XX) ou valor original se invalido
 *
 * @example
 * formatCPF('52998224725')
 * // '529.982.247-25'
 *
 * @example
 * formatCPF('123')
 * // '123' (retorna original se nao tiver 11 digitos)
 */
export function formatCPF(cpf: string): string {
  const numbers = cpf.replace(/\D/g, '')
  if (numbers.length !== 11) return cpf
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Valida CEP brasileiro
 *
 * @description
 * Validacoes realizadas:
 * - Deve ter exatamente 8 digitos
 * - Nao permite sequencias repetidas
 * - Verifica faixa valida (01000-000 a 99999-999)
 *
 * @param {string} cep - CEP a ser validado (pode conter formatacao)
 * @returns {ValidationResult} Resultado da validacao
 *
 * @example
 * validateCEP('01310-100')
 * // { isValid: true, message: 'CEP válido' }
 *
 * @example
 * validateCEP('00000-000')
 * // { isValid: false, message: 'CEP inválido' }
 */
export function validateCEP(cep: string): ValidationResult {
  // Remove caracteres não numéricos
  const numbers = cep.replace(/\D/g, '')

  if (!numbers) {
    return { isValid: false, message: 'CEP é obrigatório' }
  }

  if (numbers.length !== 8) {
    return { isValid: false, message: 'CEP deve ter 8 dígitos' }
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) {
    return { isValid: false, message: 'CEP inválido' }
  }

  // CEPs válidos começam entre 01000-000 e 99999-999
  const cepNumber = parseInt(numbers)
  if (cepNumber < 1000000 || cepNumber > 99999999) {
    return { isValid: false, message: 'CEP inválido' }
  }

  return { isValid: true, message: 'CEP válido' }
}

/**
 * Formata CEP para exibicao no padrao brasileiro
 *
 * @param {string} cep - CEP a ser formatado (com ou sem formatacao)
 * @returns {string} CEP formatado (XXXXX-XXX) ou valor original se invalido
 *
 * @example
 * formatCEP('01310100')
 * // '01310-100'
 *
 * @example
 * formatCEP('123')
 * // '123' (retorna original se nao tiver 8 digitos)
 */
export function formatCEP(cep: string): string {
  const numbers = cep.replace(/\D/g, '')
  if (numbers.length !== 8) return cep
  return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
}
