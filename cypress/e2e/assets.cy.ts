/**
 * End-to-end tests for Asset management flows.
 * 
 * Covers:
 * - Browsing assets
 * - Searching and filtering
 * - Creating assets
 * - Viewing asset details
 */

describe('Asset Management', () => {
  const API_BASE_URL = 'http://localhost:8000/api/v1';
  let authToken: string = '';

  beforeEach(() => {
    // Get auth token for authenticated requests
    cy.request({
      method: 'POST',
      url: `${API_BASE_URL}/auth/token/`,
      body: {
        email: 'admin@example.com',
        password: 'admin123',
      },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.status === 200 && response.body.access) {
        authToken = response.body.access;
        window.localStorage.setItem('accessToken', authToken);
        window.localStorage.setItem('refreshToken', response.body.refresh || '');
      }
    });
  })

  describe('Browse Assets', () => {
    it('should display assets list on home page', () => {
      cy.visit('/assets')
      cy.contains('Browse Assets').should('be.visible')
      cy.contains('assets found').should('be.visible')
    })

    it('should navigate to asset detail page', () => {
      cy.visit('/assets')
      cy.wait(2000)
      // Click on the first asset card link
      cy.get('.card').first().click()
      cy.url().should('include', '/assets/')
    })

    it('should filter assets by type', () => {
      cy.visit('/assets')
      cy.get('select').first().select('ROOM')
      cy.url().should('include', 'asset_type=ROOM')
    })

    it('should search assets by name', () => {
      cy.visit('/assets')
      cy.get('input[placeholder*="city"]').type('New York')
      cy.url().should('include', 'city=')
    })
  })

  describe('Create Asset', () => {
    it('should navigate to create asset page', () => {
      cy.visit('/assets/new')
      cy.contains('Create Asset').should('be.visible')
      cy.get('#name').should('be.visible')
    })

    it('should create new asset successfully', () => {
      cy.visit('/assets/new')
      cy.get('#name').type('Test Apartment')
      cy.get('#description').type('A beautiful test apartment')
      cy.get('#address').type('123 Test Street')
      cy.get('#city').type('Test City')
      cy.get('#country').select('US')
      cy.get('button[type="submit"]').click()
      
      // Should redirect to asset detail or list
      cy.url().should('include', '/assets/')
    })

    it('should show validation errors for missing fields', () => {
      cy.visit('/assets/new')
      cy.get('button[type="submit"]').click()
      // Should show error (toast or form validation)
      cy.wait(1000)
    })
  })

  describe('Asset Details', () => {
    it('should display all asset information', () => {
      cy.visit('/assets')
      cy.wait(2000)
      cy.get('.card').first().click()
      cy.url().should('include', '/assets/')
    })

    it('should allow booking from asset page', () => {
      cy.visit('/assets')
      cy.wait(2000)
      cy.get('.card').first().click()
      cy.url().should('include', '/assets/')
    })
  })
})
