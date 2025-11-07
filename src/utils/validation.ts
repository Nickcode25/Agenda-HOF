/**
 * Valida força de senha
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  message: string
} {
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
 */
export function validateEmail(email: string): {
  isValid: boolean
  message: string
} {
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
 * Valida telefone brasileiro
 */
export function validatePhone(phone: string): {
  isValid: boolean
  message: string
} {
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

  // Valida DDD
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

  return { isValid: true, message: 'Telefone válido' }
}
