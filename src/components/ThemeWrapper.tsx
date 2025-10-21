import { ReactNode } from 'react'

interface ThemeWrapperProps {
  children: ReactNode
}

/**
 * Componente wrapper que garante que as classes de tema sejam aplicadas
 * Não precisa fazer nada especial, apenas renderiza os children
 * O tema é controlado pela classe 'dark' ou 'light' no <html>
 */
export default function ThemeWrapper({ children }: ThemeWrapperProps) {
  return <>{children}</>
}
