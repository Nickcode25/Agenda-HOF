/**
 * Utilitarios para testes
 */

import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

/**
 * Wrapper com providers para testes
 */
function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

/**
 * Render customizado com providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-exportar tudo do testing-library
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'

// Exportar render customizado como padrao
export { customRender as render }

/**
 * Helper para aguardar um tempo especifico
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Helper para criar mock de evento de input
 */
export const createInputEvent = (value: string) => ({
  target: { value },
  currentTarget: { value },
})

/**
 * Helper para criar mock de formulario
 */
export const createFormEvent = () => ({
  preventDefault: () => {},
  stopPropagation: () => {},
})
