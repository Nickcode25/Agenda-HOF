/**
 * Arquivo de suporte para testes E2E do Cypress
 *
 * Este arquivo é carregado automaticamente antes dos testes E2E.
 * Comandos customizados e configuracoes globais devem ser definidos aqui.
 */

// Importar comandos customizados
import './commands'

// Desabilitar erros nao capturados que podem causar falhas falsas
Cypress.on('uncaught:exception', (err) => {
  // Ignorar erros de rede/hydration que nao afetam os testes
  if (
    err.message.includes('ResizeObserver') ||
    err.message.includes('Network Error') ||
    err.message.includes('hydrat')
  ) {
    return false
  }
  // Permitir que outros erros falhem o teste
  return true
})

// Configuracao antes de cada teste
beforeEach(() => {
  // Limpar localStorage e sessionStorage entre testes
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
})
