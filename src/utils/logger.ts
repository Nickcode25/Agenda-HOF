// Logger utilitário que pode ser desativado em produção
const isDev = import.meta.env.DEV

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

function createLogger(prefix?: string): Logger {
  const formatMessage = (level: LogLevel, args: unknown[]) => {
    if (prefix) {
      return [`[${prefix}]`, ...args]
    }
    return args
  }

  return {
    debug: (...args: unknown[]) => {
      if (isDev) {
        console.log(...formatMessage('debug', args))
      }
    },
    info: (...args: unknown[]) => {
      if (isDev) {
        console.info(...formatMessage('info', args))
      }
    },
    warn: (...args: unknown[]) => {
      // Warnings são exibidos em produção também
      console.warn(...formatMessage('warn', args))
    },
    error: (...args: unknown[]) => {
      // Errors são sempre exibidos
      console.error(...formatMessage('error', args))
    }
  }
}

// Logger padrão
export const logger = createLogger()

// Factory para criar loggers com prefixo
export const createPrefixedLogger = (prefix: string): Logger => createLogger(prefix)

// Loggers específicos por módulo
export const authLogger = createLogger('AUTH')
export const subscriptionLogger = createLogger('SUBSCRIPTION')
export const cashLogger = createLogger('CASH')
export const checkoutLogger = createLogger('CHECKOUT')
