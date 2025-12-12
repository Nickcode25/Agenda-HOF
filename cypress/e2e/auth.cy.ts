/**
 * Testes E2E para fluxo de autenticacao
 */

describe('Autenticacao', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  describe('Pagina de Login', () => {
    it('deve exibir o formulario de login', () => {
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
    })

    it('deve exibir erro para credenciais invalidas', () => {
      cy.get('input[type="email"]').type('usuario@invalido.com')
      cy.get('input[type="password"]').type('senhaerrada')
      cy.get('button[type="submit"]').click()

      // Aguardar mensagem de erro
      cy.contains('Email ou senha', { timeout: 10000 }).should('be.visible')
    })

    it('deve exibir erro para email vazio', () => {
      cy.get('input[type="password"]').type('senha123')
      cy.get('button[type="submit"]').click()

      // Campo email deve indicar erro ou formulario nao deve ser enviado
      cy.get('input[type="email"]').should('have.focus')
    })

    it('deve ter link para recuperacao de senha', () => {
      cy.contains('Esqueceu').should('be.visible')
    })

    it('deve ter link para criar conta', () => {
      cy.contains('Criar conta').should('be.visible')
    })
  })

  describe('Pagina de Cadastro', () => {
    beforeEach(() => {
      cy.contains('Criar conta').click()
    })

    it('deve exibir formulario de cadastro', () => {
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
      cy.get('input[name="fullName"], input[placeholder*="nome"]').should('be.visible')
    })

    it('deve validar email invalido', () => {
      cy.get('input[type="email"]').type('emailinvalido')
      cy.get('input[type="email"]').blur()

      // Verificar se ha indicacao de erro
      cy.get('input[type="email"]').should('have.attr', 'aria-invalid', 'true')
        .or('have.class', 'border-red')
        .or('parent').find('[class*="error"]')
    })

    it('deve validar senha fraca', () => {
      cy.get('input[type="password"]').type('123')
      cy.get('input[type="password"]').blur()

      // Deve indicar que a senha e fraca
      cy.contains('8 caracteres').or('fraca').should('be.visible')
    })
  })

  describe('Recuperacao de Senha', () => {
    beforeEach(() => {
      cy.contains('Esqueceu').click()
    })

    it('deve exibir formulario de recuperacao', () => {
      cy.get('input[type="email"]').should('be.visible')
      cy.contains('Enviar').or('Recuperar').should('be.visible')
    })

    it('deve enviar email de recuperacao', () => {
      cy.get('input[type="email"]').type('usuario@teste.com')
      cy.contains('Enviar').or('Recuperar').click()

      // Deve mostrar mensagem de sucesso
      cy.contains('email').or('enviado').should('be.visible')
    })
  })
})

describe('Usuario Autenticado', () => {
  // Usar credenciais de teste
  const testEmail = Cypress.env('TEST_EMAIL') || 'teste@exemplo.com'
  const testPassword = Cypress.env('TEST_PASSWORD') || 'Senha123!'

  beforeEach(() => {
    // Simular login (usar cy.login se tiver credenciais reais)
    cy.visit('/')
  })

  it('deve redirecionar usuario nao autenticado para login', () => {
    // Se nao estiver autenticado, deve ir para login
    cy.url().should('include', '/login')
  })
})
