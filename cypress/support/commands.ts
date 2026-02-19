// ***********************************************************
// Custom Cypress Commands for KIBOSS E2E Testing
// These commands verify real data flowing from Django DB to React Frontend
// ***********************************************************

// Command to get JWT token for authenticated requests
Cypress.Commands.add('getAuthToken', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/users/token/`,
    body: {
      email,
      password,
    },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.access) {
      return response.body.access;
    }
    return null;
  });
});

// Command to set auth token in localStorage and window
Cypress.Commands.add('setAuthToken', (token) => {
  if (token) {
    window.localStorage.setItem('accessToken', token);
    window.localStorage.setItem('refreshToken', '');
  }
});

// Command to check if backend API is running
Cypress.Commands.add('checkBackendHealth', () => {
  cy.request({
    url: `${Cypress.env('apiBaseUrl')}/`,
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('status', 'ok');
  });
});

// Command to create test data via Django API (with authentication)
Cypress.Commands.add('createAssetViaApi', (assetData, token) => {
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
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/assets/`,
    body: finalAsset,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
  });
});

// Command to create test ride via Django API (with authentication)
Cypress.Commands.add('createRideViaApi', (rideData, token) => {
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
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/rides/`,
    body: finalRide,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
    },
  });
});

// Command to clear all test data
Cypress.Commands.add('clearTestData', (token) => {
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiBaseUrl')}/assets/`,
    failOnStatusCode: false,
    headers: authHeader,
  });

  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiBaseUrl')}/rides/`,
    failOnStatusCode: false,
    headers: authHeader,
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
    // UI shows "No assets found" not "No assets available"
    cy.contains('No assets found').should('exist');
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

// Command to login user via API
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/users/token/`,
    body: {
      email,
      password,
    },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      // Store tokens in localStorage to match frontend behavior
      const accessToken = response.body.access;
      const refreshToken = response.body.refresh;
      if (accessToken) {
        window.localStorage.setItem('accessToken', accessToken);
        window.localStorage.setItem('refreshToken', refreshToken);
        window.localStorage.setItem('token', accessToken);
        
        // Store user info if available
        if (response.body.user) {
          window.localStorage.setItem('user', JSON.stringify(response.body.user));
        }
      }
    }
    return response;
  });
});

// Command to register a new user
Cypress.Commands.add('register', (userData) => {
  const defaultUser = {
    email: 'testuser@example.com',
    password: 'testpass123',
    password_confirm: 'testpass123',
    first_name: 'Test',
    last_name: 'User',
  };

  const finalUser = { ...defaultUser, ...userData };

  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/users/register/`,
    body: finalUser,
    failOnStatusCode: false,
  });
});
