/**
 * Comandos customizados do Cypress
 *
 * Comandos que podem ser usados em todos os testes.
 */

// Declaracao de tipos para comandos customizados
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Faz login na aplicacao
       * @param email - Email do usuario
       * @param password - Senha do usuario
       */
      login(email: string, password: string): Chainable<void>

      /**
       * Faz logout da aplicacao
       */
      logout(): Chainable<void>

      /**
       * Aguarda o carregamento da pagina (sem spinners)
       */
      waitForPageLoad(): Chainable<void>

      /**
       * Preenche um campo de formulario
       * @param selector - Seletor do campo
       * @param value - Valor a ser preenchido
       */
      fillInput(selector: string, value: string): Chainable<void>

      /**
       * Verifica se um toast/notificacao apareceu
       * @param message - Mensagem esperada (parcial)
       */
      checkToast(message: string): Chainable<void>
    }
  }
}

// ============================================
// COMANDOS DE AUTENTICACAO
// ============================================

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.waitForPageLoad()
})

Cypress.Commands.add('logout', () => {
  // Clicar no menu do usuario e depois em sair
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

// ============================================
// COMANDOS DE UTILIDADE
// ============================================

Cypress.Commands.add('waitForPageLoad', () => {
  // Aguardar que nenhum spinner esteja visivel
  cy.get('[data-testid="loading-spinner"]', { timeout: 10000 }).should('not.exist')
  // Aguardar que a pagina esteja estavel
  cy.wait(500)
})

Cypress.Commands.add('fillInput', (selector: string, value: string) => {
  cy.get(selector).clear().type(value)
})

Cypress.Commands.add('checkToast', (message: string) => {
  cy.get('[data-testid="toast"]', { timeout: 5000 })
    .should('be.visible')
    .and('contain.text', message)
})

export {}
