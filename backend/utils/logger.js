/**
 * Utilitario de logging para o backend
 * Respeita ambiente de producao/desenvolvimento
 */

const isDev = process.env.NODE_ENV !== 'production'

const logger = {
  /**
   * Log informativo - apenas em desenvolvimento
   */
  info: (...args) => {
    if (isDev) {
      console.log('[INFO]', ...args)
    }
  },

  /**
   * Log de sucesso - apenas em desenvolvimento
   */
  success: (...args) => {
    if (isDev) {
      console.log('[OK]', ...args)
    }
  },

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (...args) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  /**
   * Log de aviso - sempre exibido
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args)
  },

  /**
   * Log de erro - sempre exibido
   */
  error: (...args) => {
    console.error('[ERROR]', ...args)
  },

  /**
   * Log de webhook - apenas em desenvolvimento
   */
  webhook: (eventType, ...args) => {
    if (isDev) {
      console.log(`[WEBHOOK:${eventType}]`, ...args)
    }
  },

  /**
   * Log de pagamento - apenas em desenvolvimento
   */
  payment: (...args) => {
    if (isDev) {
      console.log('[PAYMENT]', ...args)
    }
  },

  /**
   * Log de startup - sempre exibido
   */
  startup: (...args) => {
    console.log(...args)
  }
}

module.exports = logger
