# KIBOSS E2E Testing Guide

## Overview

This document describes the End-to-End (E2E) testing setup for KIBOSS that verifies **real data flows from the Django database to the React frontend UI**.

## ⚠️ Critical Requirements

1. **NO MOCKS ALLOWED** - All tests must use real Django database
2. **Real Backend Required** - Django server must be running
3. **Real Frontend Required** - React dev server must be running
4. **Tests MUST FAIL** if:
   - Backend is down
   - API returns data but UI doesn't render it
   - Frontend uses mock data instead of real API data

## Test Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KIBOSS E2E Test Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    HTTP     ┌──────────────┐    Redux       │
│  │   Cypress    │────────────▶│  Django API  │──────────────▶│
│  │   Browser    │   (Real)    │  (Real DB)   │   Actions     │
│  └──────────────┘             └──────────────┘               │
│        ▲                           │                           │
│        │                           ▼                           │
│        │                    ┌──────────────┐                  │
│        │                    │ SQLite/DB    │                  │
│        │                    │ (Test Data)  │                  │
│        │                    └──────────────┘                  │
│        │                           │                           │
│        ▼                           ▼                           │
│  ┌──────────────┐             ┌──────────────┐               │
│  │  React UI    │◀────────────│  Redux Store │               │
│  │  (Real App)  │   (State)   │  (Real Data) │               │
│  └──────────────┘             └──────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### 1. Install Cypress Dependencies

```bash
# Navigate to Cypress directory
cd frontend/cypress

# Install dependencies
npm install
```

### 2. Start Backend Server

```bash
# From backend directory
cd backend
python manage.py runserver 8000

# Or use the test runner which starts it automatically
cd frontend/cypress
./e2e-test-runner.sh
```

### 3. Start Frontend Server

```bash
# From frontend directory
cd frontend
npm run dev
```

## Running E2E Tests

### Option 1: Full Automated Setup (Recommended)

```bash
cd frontend/cypress

# Run full setup (starts both servers + runs tests)
./e2e-test-runner.sh

# Run with headed browser (visible browser)
./e2e-test-runner.sh --headed
```

### Option 2: Manual Server Startup

```bash
# Terminal 1: Start backend
cd backend
python manage.py runserver 8000

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Run tests
cd frontend/cypress
./e2e-test-runner.sh --test-only
```

### Option 3: Direct Cypress Commands

```bash
cd frontend/cypress

# Open Cypress Test Runner (interactive)
npm run e2e:open

# Run all tests (headless)
npm run e2e:run

# Run with headed browser
npm run e2e:run:headed
```

## Test Scenarios

### A. Backend → Frontend Data Flow

**Purpose**: Verify data created via Django API appears in React UI

**Test Steps**:
1. Create asset/ride via POST request to Django API
2. Verify data exists in database
3. Navigate to frontend page
4. Assert database values appear in UI:
   - Asset names/titles
   - Asset IDs
   - City/country
   - Status labels
   - Ratings

**Expected Result**: ✅ Asset/Ride visible in UI with exact database values

### B. Frontend → Backend → Frontend Persistence

**Purpose**: Verify data persists after page refresh (re-fetched from backend)

**Test Steps**:
1. Create asset/ride via API
2. Navigate to frontend
3. Verify data appears
4. Refresh page
5. Assert data still appears (re-fetched from API)

**Expected Result**: ✅ Data persists after refresh

### C. Empty Database State

**Purpose**: Verify UI shows correct empty state when no data exists

**Test Steps**:
1. Clear all test data from database
2. Navigate to frontend page
3. Assert empty state message appears
4. Assert count shows 0
5. No error messages displayed

**Expected Result**: ✅ Empty state shown correctly

### D. Contract Enforcement

**Purpose**: Fail if API returns data but UI doesn't render it

**Test Steps**:
1. Create asset/ride via API
2. Verify API returns data
3. Navigate to frontend
4. Assert data appears in UI
5. If data missing → TEST FAILS

**Expected Result**: ✅ Tests fail if data exists in API but not UI

### E. Backend Availability

**Purpose**: Fail if backend API is not responding

**Test Steps**:
1. Each test first verifies backend health
2. If backend down → test fails immediately

**Expected Result**: ✅ Tests fail fast if backend unavailable

## Test Files Structure

```
frontend/cypress/
├── cypress.config.js          # Cypress configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json             # TypeScript config for Cypress
├── e2e-test-runner.sh        # Linux/macOS test runner
├── e2e-test-runner.js        # Node.js test runner
├── E2E_TEST_README.md        # This file
├── support/
│   ├── commands.ts           # Custom Cypress commands
│   └── e2e.ts              # Global test setup
└── e2e/
    ├── integration-database.cy.ts  # Main E2E tests
    └── assets.cy.ts                # Asset-specific tests
```

## Custom Cypress Commands

### API Commands

```typescript
// Check if backend is running
cy.checkBackendHealth()

// Create asset via API
cy.createAssetViaApi({
  name: 'Test Asset',
  city: 'Test City',
  asset_type: 'ROOM'
})

// Create ride via API
cy.createRideViaApi({
  route_name: 'Test Route',
  origin: 'Origin',
  destination: 'Destination'
})

// Clear all test data
cy.clearTestData()

// Wait for API data to load
cy.waitForApiData('/api/v1/assets/')
```

### UI Verification Commands

```typescript
// Verify asset appears in UI
cy.verifyAssetInUi('Asset Name', 'City Name')

// Verify ride appears in UI
cy.verifyRideInUi('Route Name', 'Origin', 'Destination')

// Check no mock data indicators
cy.checkNoMockData()

// Verify empty state
cy.verifyEmptyState('assets')
cy.verifyEmptyState('rides')

// Reload and verify persistence
cy.reloadAndVerify(() => {
  cy.contains('Expected Text').should('exist')
})
```

## Troubleshooting

### Backend Won't Start

```bash
# Check if port is in use
lsof -i :8000

# Kill process using port
kill -9 <PID>

# Or use a different port
python manage.py runserver 8001
```

### Frontend Won't Start

```bash
# Check node_modules
cd frontend
npm install

# Clear cache
npm run dev -- --clearCache
```

### Tests Fail - Backend Down

```bash
# Verify backend is running
curl http://localhost:8000/api/v1/

# Check backend logs
cd backend
python manage.py runserver 8000
```

### Tests Fail - UI Doesn't Match Database

1. Check Redux devtools to see if data is being fetched
2. Verify API endpoint returns correct data
3. Check browser console for errors
4. Verify serializer fields match frontend expectations

### Tests Fail - CORS Errors

Ensure Django CORS settings allow requests from frontend origin:

```python
# In backend/kiboss/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm install
          cd cypress
          npm install
      
      - name: Run E2E tests
        run: |
          cd frontend/cypress
          chmod +x e2e-test-runner.sh
          ./e2e-test-runner.sh
```

## Performance Considerations

1. **Test Isolation**: Each test creates and cleans up its own data
2. **Database Reset**: Use test database, not production
3. **Parallelization**: Cypress supports parallel test execution
4. **Headless Mode**: Faster for CI/CD, use headed for debugging

## Best Practices

1. **Always clean up test data** after tests complete
2. **Use unique names** for test data to avoid conflicts
3. **Wait for API responses** before making assertions
4. **Check for no mock data** to ensure tests are real
5. **Use assertions that FAIL** when data doesn't match, not pass silently

## Reporting

Test results are automatically saved to:
- `cypress/videos/` - Video recordings of test runs
- `cypress/screenshots/` - Screenshots on failure

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend logs for API errors
3. Use `cy.log()` to debug test execution
4. Run tests with `--headed --verbose` for more details
