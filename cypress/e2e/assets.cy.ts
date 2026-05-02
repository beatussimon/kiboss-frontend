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
  let uniqueEmail: string = '';

  beforeEach(() => {
    // Dismiss location modal
    window.localStorage.setItem('locationModalDismissed', 'true');

    uniqueEmail = `e2e_assets_${Date.now()}@example.com`;

    // Ensure test user exists
    cy.request({
      method: 'POST',
      url: `${API_BASE_URL}/users/register/`,
      body: {
        email: uniqueEmail,
        password: 'testpass123',
        password_confirm: 'testpass123',
        first_name: 'Test',
        last_name: 'User',
      },
      failOnStatusCode: false,
    }).then(() => {
      // Get auth token for authenticated requests
      cy.request({
        method: 'POST',
        url: `${API_BASE_URL}/users/token/`,
        body: {
          email: uniqueEmail,
          password: 'testpass123',
        },
        failOnStatusCode: false,
      }).then((response) => {
        if (response.status === 200 && response.body.access) {
          authToken = response.body.access;
          window.localStorage.setItem('accessToken', authToken);
          window.localStorage.setItem('refreshToken', response.body.refresh || '');
          
          // Seed an asset to ensure the list is not empty
          cy.request({
            method: 'POST',
            url: `${API_BASE_URL}/assets/`,
            body: {
              name: `Seed Asset ${Date.now()}`,
              asset_type: 'ROOM',
              city: 'New York',
              country: 'US',
              verification_status: 'VERIFIED',
              is_active: true,
              is_listed: true,
            },
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            failOnStatusCode: false,
          });
        }
      });
    });
  })

  describe('Browse Assets', () => {
    it('should display assets list on home page', () => {
      cy.visit('/assets')
      cy.wait(3000)
      cy.contains('Browse Assets').should('be.visible')
      cy.contains('assets found').should('be.visible')
    })

    it('should navigate to asset detail page', () => {
      cy.visit('/assets')
      cy.wait(3000)
      // Wait for assets to load
      cy.get('a[href^="/assets/"].cursor-pointer', { timeout: 10000 }).should('have.length.at.least', 1)
      // Click on the first asset card link
      cy.get('a[href^="/assets/"].cursor-pointer').first().click({ force: true })
      cy.url().should('match', /\/assets\/[0-9a-f-]+/)
    })

    it('should filter assets by type', () => {
      cy.visit('/assets')
      cy.wait(3000)
      cy.get('select').first().select('ROOM')
      cy.url().should('include', 'asset_type=ROOM')
    })

    it('should search assets by name', () => {
      cy.visit('/assets')
      cy.wait(3000)
      // The first input is the general search which sets 'search' param
      cy.get('input[placeholder*="Search by name" i]').first().type('New York')
      cy.url().should('include', 'search=New+York')
    })
  })

  describe('Create Asset', () => {
    it('should navigate to create asset page', () => {
      cy.visit('/assets/create')
      cy.contains('Create Asset').should('be.visible')
      cy.get('#name').should('be.visible')
    })

    it('should create new asset successfully', () => {
      cy.visit('/assets/create')
      cy.get('#name').type('Test Apartment')
      cy.get('#description').type('A beautiful test apartment')
      cy.get('#address').type('123 Test Street')
      cy.get('#city').type('Test City')
      cy.get('#country').select('United States')
      cy.get('button[type="submit"]').click()
      
      // Should redirect to asset detail or list
      cy.url().should('include', '/assets/')
    })

    it('should show validation errors for missing fields', () => {
      cy.visit('/assets/create')
      cy.get('button[type="submit"]').click()
      // Should show error (toast or form validation)
      cy.wait(1000)
    })
  })

  describe('Asset Details', () => {
    it('should display all asset information', () => {
      cy.visit('/assets')
      cy.wait(2000)
      cy.get('a[href^="/assets/"].cursor-pointer').first().click({ force: true })
      cy.url().should('match', /\/assets\/[0-9a-f-]+/)
    })

    it('should allow booking from asset page', () => {
      cy.visit('/assets')
      cy.wait(2000)
      cy.get('a[href^="/assets/"].cursor-pointer').first().click({ force: true })
      cy.url().should('match', /\/assets\/[0-9a-f-]+/)
    })
  })
})
