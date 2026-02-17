import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    setupNodeEvents(on, config) {
      // Disable electron sandbox for compatibility
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'electron') {
          launchOptions.preferences['browser'] = {
            sandbox: false,
          };
          return launchOptions;
        }
      });
    },
    env: {
      apiBaseUrl: 'http://localhost:8000',
      backendUrl: 'http://localhost:8000',
      frontendUrl: 'http://localhost:5173',
      apiVersion: 'v1',
    },
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
  experimentalCspAllowList: [
    'http://localhost:*',
    'https://localhost:*',
  ],
});
