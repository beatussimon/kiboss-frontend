/**
 * KIBOSS E2E Integration Tests
 * 
 * These tests verify real data flows from Django database to React frontend.
 * NO MOCKS are allowed - all tests use real backend API and database.
 * 
 * Prerequisites:
 * 1. Django server must be running on http://localhost:8000
 * 2. React frontend must be running on http://localhost:5173
 * 3. Test database must be populated with real data
 */

describe('KIBOSS E2E Integration Tests', () => {
  const API_URL = 'http://localhost:8000/api/v1';
  const FRONTEND_URL = 'http://localhost:5173';

  beforeEach(() => {
    // Verify backend is running - FAIL if not
    cy.request({
      url: `${API_URL}/`,
      failOnStatusCode: false,
    }).should((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.status).to.eq('ok');
    });
  });

  describe('Backend → Frontend Data Flow', () => {
    it('should display created asset in Assets page', () => {
      // Step 1: Create asset via API (real database operation)
      const testAsset = {
        name: `E2E Test Asset ${Date.now()}`,
        description: 'Created via E2E test to verify DB→UI flow',
        asset_type: 'ROOM',
        owner: 1,
        address: '123 E2E Street',
        city: 'E2E City',
        state: 'EC',
        country: 'US',
        postal_code: '12345',
        verification_status: 'VERIFIED',
        is_active: true,
        is_listed: true,
        average_rating: 4.8,
        total_reviews: 15,
      };

      cy.request('POST', `${API_URL}/assets/`, testAsset).then((createResponse) => {
        expect(createResponse.status).to.eq(201);
        const assetId = createResponse.body.id;
        
        // Step 2: Verify asset exists in database
        cy.request(`${API_URL}/assets/${assetId}/`).should((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body.name).to.eq(testAsset.name);
          expect(getResponse.body.city).to.eq(testAsset.city);
        });

        // Step 3: Navigate to frontend and verify asset appears
        cy.visit(`${FRONTEND_URL}/assets`);
        cy.wait(3000); // Wait for React to load and fetch data

        // Step 4: Verify asset name and city appear in UI
        cy.contains(testAsset.name).should('exist');
        cy.contains(testAsset.city).should('exist');
        
        // Step 5: Verify no mock data indicators
        cy.checkNoMockData();
      });
    });

    it('should display created ride in Rides page', () => {
      // Step 1: Create ride via API (real database operation)
      const testRide = {
        driver: 1,
        vehicle_asset: 1,
        status: 'SCHEDULED',
        route_name: `E2E Test Route ${Date.now()}`,
        origin: 'E2E Origin',
        destination: 'E2E Destination',
        departure_time: new Date(Date.now() + 86400000).toISOString(),
        total_seats: 4,
        seat_price: 35.00,
        currency: 'USD',
        reserved_seats: 0,
        confirmed_seats: 0,
        vehicle_description: 'E2E Test Vehicle',
      };

      cy.request('POST', `${API_URL}/rides/`, testRide).then((createResponse) => {
        expect(createResponse.status).to.eq(201);
        const rideId = createResponse.body.id;
        
        // Step 2: Verify ride exists in database
        cy.request(`${API_URL}/rides/${rideId}/`).should((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body.route_name).to.eq(testRide.route_name);
          expect(getResponse.body.origin).to.eq(testRide.origin);
          expect(getResponse.body.destination).to.eq(testRide.destination);
        });

        // Step 3: Navigate to frontend and verify ride appears
        cy.visit(`${FRONTEND_URL}/rides`);
        cy.wait(3000); // Wait for React to load and fetch data

        // Step 4: Verify ride route, origin and destination appear in UI
        cy.contains(testRide.route_name).should('exist');
        cy.contains(testRide.origin).should('exist');
        cy.contains(testRide.destination).should('exist');
        
        // Step 5: Verify no mock data indicators
        cy.checkNoMockData();
      });
    });
  });

  describe('Frontend → Backend → Frontend Persistence', () => {
    it('should persist asset data after page refresh', () => {
      const testAsset = {
        name: `Persistence Test Asset ${Date.now()}`,
        description: 'Testing data persistence from UI',
        asset_type: 'TOOL',
        owner: 1,
        city: 'Persistence City',
        country: 'US',
        verification_status: 'VERIFIED',
        is_active: true,
        is_listed: true,
      };

      // Step 1: Create asset via API
      cy.request('POST', `${API_URL}/assets/`, testAsset).then((createResponse) => {
        expect(createResponse.status).to.eq(201);
        
        // Step 2: Navigate to frontend
        cy.visit(`${FRONTEND_URL}/assets`);
        cy.wait(3000);

        // Step 3: Verify asset is visible
        cy.contains(testAsset.name).should('exist');

        // Step 4: Refresh page and verify data persists (re-fetched from backend)
        cy.reloadAndVerify(() => {
          cy.contains(testAsset.name).should('exist');
          cy.contains(testAsset.city).should('exist');
        });
      });
    });

    it('should persist ride data after page refresh', () => {
      const testRide = {
        driver: 1,
        vehicle_asset: 1,
        status: 'OPEN',
        route_name: `Persistence Test Ride ${Date.now()}`,
        origin: 'Persistence Origin',
        destination: 'Persistence Destination',
        departure_time: new Date(Date.now() + 172800000).toISOString(),
        total_seats: 3,
        seat_price: 45.00,
        currency: 'USD',
      };

      // Step 1: Create ride via API
      cy.request('POST', `${API_URL}/rides/`, testRide).then((createResponse) => {
        expect(createResponse.status).to.eq(201);
        
        // Step 2: Navigate to frontend
        cy.visit(`${FRONTEND_URL}/rides`);
        cy.wait(3000);

        // Step 3: Verify ride is visible
        cy.contains(testRide.route_name).should('exist');

        // Step 4: Refresh page and verify data persists
        cy.reloadAndVerify(() => {
          cy.contains(testRide.route_name).should('exist');
          cy.contains(testRide.origin).should('exist');
          cy.contains(testRide.destination).should('exist');
        });
      });
    });
  });

  describe('Empty Database State', () => {
    it('should show correct empty state when no assets exist', () => {
      // This test assumes a clean database or deletes existing assets
      // In a real scenario, you'd want to isolate this test
      
      cy.visit(`${FRONTEND_URL}/assets`);
      cy.wait(3000);

      // Verify empty state is shown (not an error)
      cy.contains('No assets available').should('exist');
      
      // Verify count shows 0
      cy.contains('assets found').parent().should('contain', '0');
    });

    it('should show correct empty state when no rides exist', () => {
      cy.visit(`${FRONTEND_URL}/rides`);
      cy.wait(3000);

      // Verify empty state is shown (not an error)
      cy.contains('No rides available').should('exist');
    });
  });

  describe('Contract Enforcement', () => {
    it('should fail if API returns data but UI does not render it', () => {
      const testAsset = {
        name: `Contract Test ${Date.now()}`,
        asset_type: 'ROOM',
        owner: 1,
        city: 'Contract City',
        country: 'US',
        verification_status: 'VERIFIED',
        is_active: true,
        is_listed: true,
      };

      // Create asset
      cy.request('POST', `${API_URL}/assets/`, testAsset).then((createResponse) => {
        expect(createResponse.status).to.eq(201);

        // Verify API returns the data
        cy.request(`${API_URL}/assets/`).should((listResponse) => {
          expect(listResponse.status).to.eq(200);
          const assetInApi = listResponse.body.results.find(
            (a) => a.name === testAsset.name
          );
          expect(assetInApi).to.not.be.undefined;
        });

        // Navigate to frontend
        cy.visit(`${FRONTEND_URL}/assets`);
        cy.wait(3000);

        // CRITICAL: This assertion MUST FAIL if UI doesn't render the data
        // If data exists in API but not in UI, this test fails
        cy.contains(testAsset.name).should(
          'exist',
          'FAIL: Data exists in API but NOT rendered in UI!'
        );
      });
    });

    it('should fail if ride API data does not appear in UI', () => {
      const testRide = {
        driver: 1,
        vehicle_asset: 1,
        status: 'SCHEDULED',
        route_name: `Contract Ride Test ${Date.now()}`,
        origin: 'Contract Origin',
        destination: 'Contract Destination',
        departure_time: new Date(Date.now() + 259200000).toISOString(),
        total_seats: 2,
        seat_price: 55.00,
        currency: 'USD',
      };

      // Create ride
      cy.request('POST', `${API_URL}/rides/`, testRide).then((createResponse) => {
        expect(createResponse.status).to.eq(201);

        // Verify API returns the data
        cy.request(`${API_URL}/rides/`).should((listResponse) => {
          expect(listResponse.status).to.eq(200);
          const rideInApi = listResponse.body.results.find(
            (r) => r.route_name === testRide.route_name
          );
          expect(rideInApi).to.not.be.undefined;
        });

        // Navigate to frontend
        cy.visit(`${FRONTEND_URL}/rides`);
        cy.wait(3000);

        // CRITICAL: This assertion MUST FAIL if UI doesn't render the data
        cy.contains(testRide.route_name).should(
          'exist',
          'FAIL: Ride data exists in API but NOT rendered in UI!'
        );
      });
    });
  });

  describe('Backend Availability Verification', () => {
    it('should FAIL if backend API is not responding', () => {
      // This test intentionally tries to access a non-running backend
      // and should FAIL (not pass silently)
      
      cy.request({
        url: `${API_URL}/assets/`,
        failOnStatusCode: false,
      }).should((response) => {
        // If this fails, it means backend is down - TEST SHOULD FAIL
        expect(response.status).to.not.eq(500);
        expect(response.status).to.not.eq(0);
      });
    });
  });
});

// Custom commands for seeding and cleanup
Cypress.Commands.add('seedTestData', (apiUrl) => {
  const assets = [
    { name: 'Seed Asset 1', asset_type: 'ROOM', owner: 1, city: 'Seed City 1', country: 'US' },
    { name: 'Seed Asset 2', asset_type: 'VEHICLE', owner: 1, city: 'Seed City 2', country: 'US' },
  ];

  const rides = [
    { 
      driver: 1, 
      vehicle_asset: 1, 
      status: 'SCHEDULED',
      route_name: 'Seed Route 1',
      origin: 'Seed Origin 1',
      destination: 'Seed Destination 1',
      departure_time: new Date(Date.now() + 86400000).toISOString(),
      total_seats: 4,
      seat_price: 30.00,
      currency: 'USD',
    },
  ];

  // Create seed data
  return cy.wrap(null).then(() => {
    assets.forEach((asset) => {
      cy.request('POST', `${apiUrl}/assets/`, asset);
    });
    rides.forEach((ride) => {
      cy.request('POST', `${apiUrl}/rides/`, ride);
    });
  });
});

Cypress.Commands.add('cleanupTestData', (apiUrl) => {
  // Clean up test data from database
  return cy.wrap(null).then(() => {
    cy.request('DELETE', `${apiUrl}/assets/`);
    cy.request('DELETE', `${apiUrl}/rides/`);
  });
});
