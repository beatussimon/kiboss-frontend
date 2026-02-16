/// <reference types="cypress" />

// ***********************************************************
// KIBOSS E2E Test Setup
// ***********************************************************

import './commands';

// Run before each test
beforeEach(() => {
  // Log test name for debugging
  cy.log(`Running test: ${Cypress.currentTest.title}`);
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  // on uncaught exceptions (like React hydration warnings)
  if (err.message.includes('Hydration') || err.message.includes('hydration')) {
    return false;
  }
  return true;
});

// Take screenshot on failure
Cypress.Screenshot.defaults({
  screenshotOnRunFailure: true,
  capture: 'runner',
});

// Configure request/response timeout
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 30000);
Cypress.config('defaultCommandTimeout', 10000);
