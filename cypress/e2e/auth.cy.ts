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
  const API_BASE_URL = 'http://localhost:8000/api/v1';
  const FRONTEND_URL = 'http://localhost:5173';

  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear()
      win.localStorage.setItem('locationModalDismissed', 'true')
    })
  })

  describe('Registration', () => {
    it('should display registration form', () => {
      cy.visit('/register')
      cy.url().should('include', '/register')
      cy.get('#first_name', { timeout: 10000 }).should('be.visible')
      cy.get('#email').should('be.visible')
      cy.get('#password').should('be.visible')
    })

    it('should register new user successfully', () => {
      const testEmail = `test_${Date.now()}@example.com`
      
      cy.visit('/register')
      cy.get('#first_name', { timeout: 10000 }).should('be.visible').type('Test')
      cy.get('#last_name').type('User')
      cy.get('#email').type(testEmail)
      cy.get('#password').type('SecurePass123!')
      cy.get('#password_confirm').type('SecurePass123!')
      cy.get('#terms').check()
      cy.get('button[type="submit"]').click()
      
      // Should redirect to login after successful registration
      cy.url().should('include', '/login')
    })

    it('should show error for mismatched passwords', () => {
      cy.visit('/register')
      cy.get('#first_name', { timeout: 10000 }).should('be.visible').type('Test')
      cy.get('#last_name').type('User')
      cy.get('#email').type('test@example.com')
      cy.get('#password').type('Password123!')
      cy.get('#password_confirm').type('DifferentPass123!')
      cy.get('#terms').check()
      cy.get('button[type="submit"]').click()
      
      cy.contains('Passwords do not match', { timeout: 10000 }).should('be.visible')
    })

    it('should show error for existing email', () => {
      const existingEmail = `existing_${Date.now()}@example.com`
      // First create a user via API
      cy.request({
        method: 'POST',
        url: `${API_BASE_URL}/users/register/`,
        body: {
          email: existingEmail,
          password: 'testpass123',
          password_confirm: 'testpass123',
          first_name: 'Test',
          last_name: 'User',
        },
        failOnStatusCode: false,
      })
      
      cy.visit('/register')
      cy.get('#first_name', { timeout: 10000 }).should('be.visible').type('Test')
      cy.get('#last_name').type('User')
      cy.get('#email').type(existingEmail)
      cy.get('#password').type('Password123!')
      cy.get('#password_confirm').type('Password123!')
      cy.get('#terms').check()
      cy.get('button[type="submit"]').click()
      
      // Check for error message
      cy.get('body').should((body) => {
        const text = body.text().toLowerCase();
        const hasError = text.includes('exists') || 
                         text.includes('failed') || 
                         text.includes('error') ||
                         text.includes('already');
        expect(hasError, 'Body should contain an error message for existing email').to.be.true;
      });
    })
  })

  describe('Login', () => {
    beforeEach(() => {
      // Create test user via API using the correct register endpoint
      cy.request({
        method: 'POST',
        url: `${API_BASE_URL}/users/register/`,
        body: {
          email: 'testuser@example.com',
          password: 'testpass123',
          password_confirm: 'testpass123',
          first_name: 'Test',
          last_name: 'User',
        },
        failOnStatusCode: false,
      })
    })

    it('should display login form', () => {
      cy.visit('/login')
      cy.url().should('include', '/login')
      cy.get('#email', { timeout: 10000 }).should('be.visible')
      cy.get('#password').should('be.visible')
    })

    it('should login successfully with valid credentials', () => {
      cy.visit('/login')
      cy.get('#email', { timeout: 10000 }).should('be.visible').type('testuser@example.com')
      cy.get('#password').type('testpass123')
      cy.get('button[type="submit"]').click()
      
      // Wait for redirect after login
      cy.url({ timeout: 15000 }).should('not.include', '/login')
      cy.contains('Test').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      cy.get('#email', { timeout: 10000 }).should('be.visible').type('testuser@example.com')
      cy.get('#password').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      // Wait for error message to appear in the UI
      cy.get('body', { timeout: 10000 }).should((body) => {
        const text = body.text().toLowerCase();
        const hasError = text.includes('invalid') || 
                         text.includes('failed') || 
                         text.includes('error') || 
                         text.includes('credentials') ||
                         text.includes('no active account');
        expect(hasError, 'Body should contain an error message').to.be.true;
      });
    })

    it('should redirect unauthenticated user from protected routes', () => {
      cy.visit('/profile')
      cy.url().should('include', '/login')
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      // Login via the UI
      cy.visit('/login')
      cy.get('#email', { timeout: 10000 }).should('be.visible').type('testuser@example.com')
      cy.get('#password').type('testpass123')
      cy.get('button[type="submit"]').click()
      cy.url({ timeout: 15000 }).should('not.include', '/login')
    })

    it('should logout user successfully', () => {
      // Open user menu
      cy.get('[data-testid="user-menu-button"]', { timeout: 10000 }).should('be.visible').click()
      
      // Click logout button
      cy.get('button[title="Logout"]').should('be.visible').click()
      
      cy.url().should('include', '/login')
      cy.contains('Welcome to KIBOSS').should('be.visible')
    })
  })
})
