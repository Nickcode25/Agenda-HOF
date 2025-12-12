/**
 * Testes E2E para navegacao da aplicacao
 */

describe('Navegacao', () => {
  // Simular usuario autenticado
  beforeEach(() => {
    // Injetar token de autenticacao mock para testes
    cy.window().then((win) => {
      win.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: {
            id: 'test-user-id',
            email: 'teste@exemplo.com',
          },
          adminUser: null,
        },
      }))
    })
  })

  describe('Menu Principal', () => {
    beforeEach(() => {
      cy.visit('/')
    })

    it('deve exibir menu de navegacao', () => {
      // Verificar se o menu lateral ou header existe
      cy.get('nav, [data-testid="sidebar"], [data-testid="navigation"]')
        .should('be.visible')
    })

    it('deve navegar para Agenda', () => {
      cy.contains('Agenda').click()
      cy.url().should('include', '/agenda').or('include', '/schedule')
    })

    it('deve navegar para Pacientes', () => {
      cy.contains('Pacientes').click()
      cy.url().should('include', '/pacientes').or('include', '/patients')
    })

    it('deve navegar para Financeiro', () => {
      cy.contains('Financeiro').or('Caixa').click()
      cy.url().should('include', '/financeiro').or('include', '/cash')
    })
  })

  describe('Responsividade', () => {
    it('deve funcionar em tela mobile', () => {
      cy.viewport('iphone-x')
      cy.visit('/')

      // Menu mobile deve existir (hamburger ou bottom nav)
      cy.get('[data-testid="mobile-menu"], button[aria-label*="menu"]')
        .should('be.visible')
    })

    it('deve funcionar em tablet', () => {
      cy.viewport('ipad-2')
      cy.visit('/')

      // Navegacao deve estar visivel
      cy.get('nav, [data-testid="navigation"]').should('be.visible')
    })

    it('deve funcionar em desktop', () => {
      cy.viewport(1920, 1080)
      cy.visit('/')

      // Sidebar deve estar expandida em desktop
      cy.get('[data-testid="sidebar"]').should('be.visible')
    })
  })
})
