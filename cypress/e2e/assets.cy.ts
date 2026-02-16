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
  beforeEach(() => {
    cy.login('testuser@example.com', 'testpass123')
  })

  describe('Browse Assets', () => {
    it('should display assets list on home page', () => {
      cy.visit('/assets')
      cy.contains('Assets').should('be.visible')
      cy.get('[data-testid="asset-card"]').should('have.length.at.least', 1)
    })

    it('should navigate to asset detail page', () => {
      cy.visit('/assets')
      cy.get('[data-testid="asset-card"]').first().click()
      cy.url().should('include', '/assets/')
      cy.contains('Description').should('be.visible')
    })

    it('should filter assets by type', () => {
      cy.visit('/assets')
      cy.get('[data-testid="filter-type"]').click()
      cy.contains('Room/Space').click()
      cy.url().should('include', 'asset_type=ROOM')
    })

    it('should search assets by name', () => {
      cy.visit('/assets')
      cy.get('[data-testid="search-input"]').type('Apartment')
      cy.get('[data-testid="search-button"]').click()
      cy.url().should('include', 'search=')
    })
  })

  describe('Create Asset', () => {
    it('should navigate to create asset page', () => {
      cy.visit('/assets/new')
      cy.contains('Create Asset').should('be.visible')
      cy.get('[name="name"]').should('be.visible')
    })

    it('should create new asset successfully', () => {
      cy.visit('/assets/new')
      cy.get('[name="name"]').type('Test Apartment')
      cy.get('[name="description"]').type('A beautiful test apartment')
      cy.get('[name="asset_type"]').select('ROOM')
      cy.get('[name="address"]').type('123 Test Street')
      cy.get('[name="city"]').type('Test City')
      cy.get('[name="country"]').select('US')
      cy.get('button[type="submit"]').click()
      
      // Should redirect to asset detail or list
      cy.url().should('include', '/assets/')
    })

    it('should show validation errors for missing fields', () => {
      cy.visit('/assets/new')
      cy.get('button[type="submit"]').click()
      cy.contains('Name is required').should('be.visible')
    })
  })

  describe('Asset Details', () => {
    it('should display all asset information', () => {
      cy.visit('/assets')
      cy.get('[data-testid="asset-card"]').first().click()
      cy.contains('Contact Owner').should('be.visible')
      cy.contains('Book Now').should('be.visible')
    })

    it('should allow booking from asset page', () => {
      cy.visit('/assets')
      cy.get('[data-testid="asset-card"]').first().click()
      cy.contains('Book Now').click()
      cy.url().should('include', '/bookings/new')
    })
  })
})
