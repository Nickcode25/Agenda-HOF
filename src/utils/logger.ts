/**
 * Servico de Logging centralizado
 *
 * Recursos:
 * - Niveis de log (debug, info, warn, error)
 * - Prefixos por modulo
 * - Timestamps opcionais
 * - Desativado em producao (exceto warn/error)
 * - Formatacao consistente
 * - Suporte a objetos e erros
 */

const isDev = import.meta.env.DEV

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  prefix?: string
  data?: unknown
  error?: Error
}

export interface LoggerConfig {
  /** Prefixo para identificar o modulo */
  prefix?: string
  /** Incluir timestamp nos logs */
  includeTimestamp?: boolean
  /** Nivel minimo de log (logs abaixo deste nivel sao ignorados) */
  minLevel?: LogLevel
  /** Callback para processar logs (ex: enviar para servico externo) */
  onLog?: (entry: LogEntry) => void
}

export interface Logger {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  /** Log com nivel customizado */
  log: (level: LogLevel, ...args: unknown[]) => void
  /** Cria um logger filho com prefixo adicional */
  child: (prefix: string) => Logger
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

const LOG_LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'color: #6b7280',
  info: 'color: #3b82f6',
  warn: 'color: #f59e0b',
  error: 'color: #ef4444; font-weight: bold'
}

const LOG_LEVEL_ICONS: Record<LogLevel, string> = {
  debug: '[DEBUG]',
  info: '[INFO]',
  warn: '[WARN]',
  error: '[ERROR]'
}

function shouldLog(level: LogLevel, minLevel: LogLevel = 'debug'): boolean {
  // Em producao, apenas warn e error
  if (!isDev && level !== 'warn' && level !== 'error') {
    return false
  }
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel]
}

function formatTimestamp(): string {
  const now = new Date()
  const time = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const ms = now.getMilliseconds().toString().padStart(3, '0')
  return `${time}.${ms}`
}

function formatArgs(args: unknown[]): unknown[] {
  return args.map(arg => {
    if (arg instanceof Error) {
      return {
        name: arg.name,
        message: arg.message,
        stack: arg.stack
      }
    }
    return arg
  })
}

function createLogger(config: LoggerConfig = {}): Logger {
  const {
    prefix,
    includeTimestamp = isDev,
    minLevel = 'debug',
    onLog
  } = config

  const log = (level: LogLevel, ...args: unknown[]) => {
    if (!shouldLog(level, minLevel)) return

    const formattedArgs = formatArgs(args)
    const parts: string[] = []

    if (includeTimestamp) {
      parts.push(formatTimestamp())
    }

    parts.push(LOG_LEVEL_ICONS[level])

    if (prefix) {
      parts.push(`[${prefix}]`)
    }

    const logPrefix = parts.join(' ')

    // Console output
    const consoleFn = level === 'error' ? console.error
      : level === 'warn' ? console.warn
      : level === 'info' ? console.info
      : console.log

    if (isDev && typeof window !== 'undefined') {
      // Em dev no browser, usar estilos
      consoleFn(`%c${logPrefix}`, LOG_LEVEL_STYLES[level], ...formattedArgs)
    } else {
      // Em producao ou Node, log simples
      consoleFn(logPrefix, ...formattedArgs)
    }

    // Callback para processamento externo
    if (onLog) {
      const entry: LogEntry = {
        level,
        message: args.map(a => String(a)).join(' '),
        timestamp: new Date(),
        prefix,
        data: args.length > 1 ? args : args[0],
        error: args.find(a => a instanceof Error) as Error | undefined
      }
      onLog(entry)
    }
  }

  return {
    debug: (...args: unknown[]) => log('debug', ...args),
    info: (...args: unknown[]) => log('info', ...args),
    warn: (...args: unknown[]) => log('warn', ...args),
    error: (...args: unknown[]) => log('error', ...args),
    log,
    child: (childPrefix: string) => createLogger({
      ...config,
      prefix: prefix ? `${prefix}:${childPrefix}` : childPrefix
    })
  }
}

// ============================================
// EXPORTS
// ============================================

/** Logger padrao da aplicacao */
export const logger = createLogger()

/** Factory para criar loggers com configuracao customizada */
export const createPrefixedLogger = (prefix: string, config?: Omit<LoggerConfig, 'prefix'>): Logger =>
  createLogger({ ...config, prefix })

// Loggers especificos por modulo
export const authLogger = createLogger({ prefix: 'AUTH' })
export const subscriptionLogger = createLogger({ prefix: 'SUBSCRIPTION' })
export const cashLogger = createLogger({ prefix: 'CASH' })
export const checkoutLogger = createLogger({ prefix: 'CHECKOUT' })
export const paymentLogger = createLogger({ prefix: 'PAYMENT' })
export const apiLogger = createLogger({ prefix: 'API' })
export const uiLogger = createLogger({ prefix: 'UI' })

/**
 * Logger para erros criticos que devem ser reportados
 * Em producao, poderia enviar para Sentry/LogRocket/etc
 */
export const criticalLogger = createLogger({
  prefix: 'CRITICAL',
  minLevel: 'error',
  onLog: (entry) => {
    // TODO: Integrar com servico de monitoramento em producao
    // Ex: Sentry.captureException(entry.error || new Error(entry.message))
    if (!isDev && entry.error) {
      // Em producao, poderia enviar para servico externo
      console.error('Critical error:', entry)
    }
  }
})
