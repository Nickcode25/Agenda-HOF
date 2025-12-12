import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { logger } from '@/utils/logger'

interface Props {
  children: ReactNode
  /** Fallback customizado para renderizar em caso de erro */
  fallback?: ReactNode
  /** Callback chamado quando ocorre um erro */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Se deve mostrar detalhes do erro (apenas em dev) */
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary para capturar erros de renderizacao React
 *
 * Uso:
 * <ErrorBoundary>
 *   <ComponenteQuePoderFalhar />
 * </ErrorBoundary>
 *
 * Com fallback customizado:
 * <ErrorBoundary fallback={<MeuComponenteDeErro />}>
 *   <ComponenteQuePoderFalhar />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro
    logger.error('ErrorBoundary capturou erro:', error)
    logger.error('Component stack:', errorInfo.componentStack)

    // Atualizar estado com informacoes do erro
    this.setState({ errorInfo })

    // Callback customizado
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Em producao, poderia enviar para servico de monitoramento
    // Ex: Sentry, LogRocket, etc.
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/app'
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isDev = import.meta.env.DEV
      const showDetails = this.props.showDetails ?? isDev

      // Fallback padrao
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-lg font-semibold">Ops! Algo deu errado</h2>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Ocorreu um erro inesperado ao carregar esta secao.
                Voce pode tentar recarregar a pagina ou voltar para o inicio.
              </p>

              {/* Detalhes do erro (apenas em dev) */}
              {showDetails && this.state.error && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-700 mb-2">
                    <Bug className="w-4 h-4" />
                    <span className="text-sm font-medium">Detalhes do erro:</span>
                  </div>
                  <pre className="text-xs text-red-600 overflow-x-auto whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-3">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        Ver stack trace
                      </summary>
                      <pre className="mt-2 text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Acoes */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar novamente
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <Home className="w-4 h-4" />
                  Voltar ao inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC para envolver componentes com Error Boundary
 *
 * Uso:
 * const SafeComponent = withErrorBoundary(MeuComponente)
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}

/**
 * Error Boundary especifico para paginas
 * Mostra UI mais completa com opcao de recarregar
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-lg w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pagina nao pode ser carregada
            </h1>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro ao carregar esta pagina.
              Por favor, tente recarregar ou volte para a pagina inicial.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Recarregar pagina
              </button>
              <button
                onClick={() => window.location.href = '/app'}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                <Home className="w-5 h-5" />
                Ir para inicio
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * Error Boundary compacto para componentes menores
 * Mostra mensagem simples com botao de retry
 */
export function CompactErrorBoundary({
  children,
  message = 'Erro ao carregar'
}: {
  children: ReactNode
  message?: string
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 text-sm mb-2">{message}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
