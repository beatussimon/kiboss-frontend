// ***********************************************************
// Custom Cypress Commands for KIBOSS E2E Testing
// These commands verify real data flowing from Django DB to React Frontend
// ***********************************************************

// Command to check if backend API is running
Cypress.Commands.add('checkBackendHealth', () => {
  cy.request({
    url: `${Cypress.env('apiBaseUrl')}/api/v1/`,
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('status', 'ok');
  });
});

// Command to create test data via Django API
Cypress.Commands.add('createAssetViaApi', (assetData) => {
  const defaultAsset = {
    name: 'Cypress Test Asset',
    description: 'Created via Cypress E2E test',
    asset_type: 'ROOM',
    owner: 1,
    address: '123 Cypress Street',
    city: 'Test City',
    state: 'TS',
    country: 'US',
    postal_code: '12345',
    verification_status: 'VERIFIED',
    is_active: true,
    is_listed: true,
    average_rating: 4.5,
    total_reviews: 10,
  };

  const finalAsset = { ...defaultAsset, ...assetData };

  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/api/v1/assets/`,
    body: finalAsset,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

// Command to create test ride via Django API
Cypress.Commands.add('createRideViaApi', (rideData) => {
  const defaultRide = {
    driver: 1,
    vehicle_asset: 1,
    status: 'SCHEDULED',
    route_name: 'Cypress Test Route',
    origin: 'Test Origin',
    destination: 'Test Destination',
    departure_time: new Date(Date.now() + 86400000).toISOString(),
    total_seats: 4,
    seat_price: 25.00,
    currency: 'USD',
    reserved_seats: 0,
    confirmed_seats: 0,
    vehicle_description: 'Test Vehicle',
  };

  const finalRide = { ...defaultRide, ...rideData };

  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/api/v1/rides/`,
    body: finalRide,
    headers: {
      'Content-Type': 'application/json',
    },
  });
});

// Command to clear all test data
Cypress.Commands.add('clearTestData', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiBaseUrl')}/api/v1/assets/`,
    failOnStatusCode: false,
  });

  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiBaseUrl')}/api/v1/rides/`,
    failOnStatusCode: false,
  });
});

// Command to wait for API data to load on page
Cypress.Commands.add('waitForApiData', (apiUrl) => {
  cy.intercept('GET', apiUrl).as('apiRequest');
  cy.wait('@apiRequest', { timeout: 10000 });
});

// Command to verify asset appears in UI
Cypress.Commands.add('verifyAssetInUi', (assetName, city) => {
  cy.contains(assetName).should('exist');
  cy.contains(city).should('exist');
});

// Command to verify ride appears in UI
Cypress.Commands.add('verifyRideInUi', (routeName, origin, destination) => {
  cy.contains(routeName).should('exist');
  cy.contains(origin).should('exist');
  cy.contains(destination).should('exist');
});

// Command to check page has no mock data indicators
Cypress.Commands.add('checkNoMockData', () => {
  cy.get('body').then(($body) => {
    const mockIndicators = ['mock data', 'sample data', 'placeholder', 'todo'];
    mockIndicators.forEach((indicator) => {
      expect($body.text().toLowerCase()).not.to.include(indicator);
    });
  });
});

// Command to verify empty state
Cypress.Commands.add('verifyEmptyState', (pageType) => {
  if (pageType === 'assets') {
    cy.contains('No assets available').should('exist');
    cy.contains('assets found').parent().should('contain', '0');
  } else {
    cy.contains('No rides available').should('exist');
  }
});

// Command to reload page and verify data persists
Cypress.Commands.add('reloadAndVerify', (verificationFn) => {
  cy.reload();
  cy.wait(2000);
  verificationFn();
});
