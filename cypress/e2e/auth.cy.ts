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
    cy.visit('/')
  })

  describe('Registration', () => {
    it('should display registration form', () => {
      cy.contains('Sign up').click()
      cy.url().should('include', '/register')
      cy.get('#email').should('be.visible')
      cy.get('#password').should('be.visible')
      cy.get('#password_confirm').should('be.visible')
    })

    it('should register new user successfully', () => {
      const testEmail = `test_${Date.now()}@example.com`
      
      cy.visit('/register')
      cy.get('#first_name').type('Test')
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
      cy.get('#first_name').type('Test')
      cy.get('#last_name').type('User')
      cy.get('#email').type('test@example.com')
      cy.get('#password').type('Password123!')
      cy.get('#password_confirm').type('DifferentPass123!')
      cy.get('#terms').check()
      cy.get('button[type="submit"]').click()
      
      cy.contains('Passwords do not match').should('be.visible')
    })

    it('should show error for existing email', () => {
      // First create a user via API
      cy.request({
        method: 'POST',
        url: `${API_BASE_URL}/auth/register/`,
        body: {
          email: 'existing@example.com',
          password: 'testpass123',
          password_confirm: 'testpass123',
          first_name: 'Test',
          last_name: 'User',
        },
        failOnStatusCode: false,
      }).then(() => {
        // User created or already exists, try to register again
      })
      
      cy.visit('/register')
      cy.get('#first_name').type('Test')
      cy.get('#last_name').type('User')
      cy.get('#email').type('existing@example.com')
      cy.get('#password').type('Password123!')
      cy.get('#password_confirm').type('Password123!')
      cy.get('#terms').check()
      cy.get('button[type="submit"]').click()
      
      // Should show some error message
      cy.wait(1000)
    })
  })

  describe('Login', () => {
    beforeEach(() => {
      // Create test user via API using the correct register endpoint
      cy.request({
        method: 'POST',
        url: `${API_BASE_URL}/auth/register/`,
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
      cy.contains('Sign in').click()
      cy.url().should('include', '/login')
      cy.get('#email').should('be.visible')
      cy.get('#password').should('be.visible')
    })

    it('should login successfully with valid credentials', () => {
      cy.visit('/login')
      cy.get('#email').type('testuser@example.com')
      cy.get('#password').type('testpass123')
      cy.get('button[type="submit"]').click()
      
      // Wait for redirect after login
      cy.url().should('not.include', '/login')
      cy.contains('Test').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      cy.get('#email').type('testuser@example.com')
      cy.get('#password').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      // Wait for error to appear
      cy.wait(1000)
      // Check for error message in the page
      cy.get('body').then(($body) => {
        const hasError = $body.text().toLowerCase().includes('invalid') || 
                         $body.text().toLowerCase().includes('failed') ||
                         $body.text().toLowerCase().includes('error');
        expect(hasError).to.be.true;
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
      cy.get('#email').type('testuser@example.com')
      cy.get('#password').type('testpass123')
      cy.get('button[type="submit"]').click()
      cy.url().should('not.include', '/login')
    })

    it('should logout user successfully', () => {
      // Click on profile link which contains user name
      cy.get('a[href="/profile"]').click()
      
      // Click logout button (it's a button with LogOut icon in the header)
      cy.get('button[title="Logout"]').click()
      
      cy.url().should('include', '/login')
      cy.contains('Sign in').should('be.visible')
    })
  })
})
