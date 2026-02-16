/**
 * End-to-end tests for authentication flows.
 * 
 * Covers:
 * - User registration
 * - User login
 * - Protected route access
 * - Logout functionality
 */

describe('Authentication Flows', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Registration', () => {
    it('should display registration form', () => {
      cy.contains('Sign Up').click()
      cy.url().should('include', '/register')
      cy.get('[name="email"]').should('be.visible')
      cy.get('[name="password"]').should('be.visible')
      cy.get('[name="password_confirm"]').should('be.visible')
    })

    it('should register new user successfully', () => {
      const testEmail = `test_${Date.now()}@example.com`
      
      cy.visit('/register')
      cy.get('[name="email"]').type(testEmail)
      cy.get('[name="password"]').type('SecurePass123!')
      cy.get('[name="password_confirm"]').type('SecurePass123!')
      cy.get('[name="first_name"]').type('Test')
      cy.get('[name="last_name"]').type('User')
      cy.get('button[type="submit"]').click()
      
      // Should redirect to home or dashboard
      cy.url().should('not.include', '/register')
    })

    it('should show error for mismatched passwords', () => {
      cy.visit('/register')
      cy.get('[name="email"]').type('test@example.com')
      cy.get('[name="password"]').type('Password123!')
      cy.get('[name="password_confirm"]').type('DifferentPass123!')
      cy.get('button[type="submit"]').click()
      
      cy.contains('Passwords do not match').should('be.visible')
    })

    it('should show error for existing email', () => {
      cy.visit('/register')
      cy.get('[name="email"]').type('existing@example.com')
      cy.get('[name="password"]').type('Password123!')
      cy.get('[name="password_confirm"]').type('Password123!')
      cy.get('button[type="submit"]').click()
      
      cy.contains('Email already exists').should('be.visible')
    })
  })

  describe('Login', () => {
    beforeEach(() => {
      // Create test user via API
      cy.request('POST', `${Cypress.env('API_URL')}/auth/register/`, {
        email: 'testuser@example.com',
        password: 'testpass123',
        password_confirm: 'testpass123',
        first_name: 'Test',
        last_name: 'User',
      })
    })

    it('should display login form', () => {
      cy.contains('Sign In').click()
      cy.url().should('include', '/login')
      cy.get('[name="email"]').should('be.visible')
      cy.get('[name="password"]').should('be.visible')
    })

    it('should login successfully with valid credentials', () => {
      cy.visit('/login')
      cy.get('[name="email"]').type('testuser@example.com')
      cy.get('[name="password"]').type('testpass123')
      cy.get('button[type="submit"]').click()
      
      cy.url().should('not.include', '/login')
      cy.contains('Test User').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      cy.get('[name="email"]').type('testuser@example.com')
      cy.get('[name="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      cy.contains('Invalid credentials').should('be.visible')
    })

    it('should redirect unauthenticated user from protected routes', () => {
      cy.visit('/profile')
      cy.url().should('include', '/login')
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      // Login before test
      cy.login('testuser@example.com', 'testpass123')
    })

    it('should logout user successfully', () => {
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      cy.url().should('include', '/login')
      cy.contains('Sign In').should('be.visible')
    })
  })
})
