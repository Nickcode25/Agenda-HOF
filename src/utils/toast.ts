import { useToast } from '@/hooks/useToast'

// Helper para usar toast sem hook (para uso em funções fora de componentes)
export const toast = {
  success: (message: string) => {
    useToast.getState().show(message, 'success')
  },
  error: (message: string) => {
    useToast.getState().show(message, 'error')
  },
  warning: (message: string) => {
    useToast.getState().show(message, 'warning')
  },
  info: (message: string) => {
    useToast.getState().show(message, 'info')
  }
}
