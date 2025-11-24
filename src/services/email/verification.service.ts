/**
 * Serviço para gerenciar códigos de verificação de email
 */

interface VerificationCode {
  code: string
  email: string
  expiresAt: Date
  createdAt: Date
}

// Armazena códigos em memória (em produção, usar banco de dados)
const verificationCodes = new Map<string, VerificationCode>()

/**
 * Gera um código de 6 dígitos
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Salva um código de verificação para um email
 * @param email Email do usuário
 * @param code Código de verificação (opcional, será gerado se não fornecido)
 * @param expiresInMinutes Tempo de expiração em minutos (padrão: 15)
 */
export function saveVerificationCode(
  email: string,
  code?: string,
  expiresInMinutes: number = 15
): string {
  const verificationCode = code || generateVerificationCode()
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes)

  verificationCodes.set(email, {
    code: verificationCode,
    email,
    expiresAt,
    createdAt: new Date()
  })

  // Remove códigos expirados após 1 hora
  setTimeout(() => {
    if (verificationCodes.has(email)) {
      const stored = verificationCodes.get(email)
      if (stored && new Date() > stored.expiresAt) {
        verificationCodes.delete(email)
      }
    }
  }, 60 * 60 * 1000)

  return verificationCode
}

/**
 * Verifica se um código é válido para o email
 * @param email Email do usuário
 * @param code Código fornecido pelo usuário
 * @returns true se o código é válido, false caso contrário
 */
export function verifyCode(email: string, code: string): boolean {
  const stored = verificationCodes.get(email)

  if (!stored) {
    return false
  }

  // Verifica se o código expirou
  if (new Date() > stored.expiresAt) {
    verificationCodes.delete(email)
    return false
  }

  // Verifica se o código está correto
  if (stored.code !== code) {
    return false
  }

  // Código válido - remove da memória
  verificationCodes.delete(email)
  return true
}

/**
 * Remove um código de verificação
 * @param email Email do usuário
 */
export function deleteVerificationCode(email: string): void {
  verificationCodes.delete(email)
}

/**
 * Obtém informações sobre um código de verificação (sem revelar o código)
 * @param email Email do usuário
 */
export function getVerificationInfo(email: string): {
  exists: boolean
  isExpired: boolean
  expiresAt?: Date
} {
  const stored = verificationCodes.get(email)

  if (!stored) {
    return { exists: false, isExpired: false }
  }

  const isExpired = new Date() > stored.expiresAt

  return {
    exists: true,
    isExpired,
    expiresAt: stored.expiresAt
  }
}
