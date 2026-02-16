#!/usr/bin/env node

/**
 * KIBOSS E2E Test Runner
 * 
 * This script orchestrates the complete E2E test workflow:
 * 1. Starts Django backend server with real database
 * 2. Starts React frontend development server
 * 3. Runs Cypress E2E tests against real backend
 * 4. Reports results
 * 
 * Usage: node e2e-test-runner.js [--headed]
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BACKEND_PORT = 8000;
const FRONTEND_PORT = 5173;
const API_URL = `http://localhost:${BACKEND_PORT}/api/v1`;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;

let backendProcess = null;
let frontendProcess = null;

console.log('🚀 KIBOSS E2E Test Runner Starting...\n');

// Helper to wait for server to be ready
async function waitForServer(url, maxAttempts = 30, interval = 1000) {
  console.log(`⏳ Waiting for server at ${url}...`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const http = require('http');
      const response = await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      if (response.status === 200) {
        console.log(`✅ Server at ${url} is ready!\n`);
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
    process.stdout.write('.');
  }
  
  console.log(`\n❌ Server at ${url} failed to start\n`);
  return false;
}

// Cleanup function
function cleanup() {
  console.log('\n🧹 Cleaning up processes...');
  
  if (backendProcess && backendProcess.kill) {
    backendProcess.kill('SIGTERM');
    console.log('✅ Backend server stopped');
  }
  
  if (frontendProcess && frontendProcess.kill) {
    frontendProcess.kill('SIGTERM');
    console.log('✅ Frontend server stopped');
  }
  
  process.exit(0);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const headed = args.includes('--headed');
  
  console.log('📋 Configuration:');
  console.log(`   Backend URL: ${API_URL}`);
  console.log(`   Frontend URL: ${FRONTEND_URL}`);
  console.log(`   Mode: ${headed ? 'Headed' : 'Headless'}\n`);
  
  // Set up cleanup handlers
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  try {
    // Step 1: Start Django backend
    console.log('📦 Step 1: Starting Django backend server...');
    const backendDir = path.join(__dirname, '../../backend');
    
    backendProcess = spawn('python', ['manage.py', 'runserver', `${BACKEND_PORT}`], {
      cwd: backendDir,
      stdio: 'pipe',
      env: { ...process.env, DJANGO_SETTINGS_MODULE: 'kiboss.settings' }
    });
    
    backendProcess.stdout.on('data', (data) => {
      process.stdout.write(`[Backend] ${data}`);
    });
    
    backendProcess.stderr.on('data', (data) => {
      process.stderr.write(`[Backend Error] ${data}`);
    });
    
    // Wait for backend to be ready
    const backendReady = await waitForServer(`${API_URL.replace('/api/v1', '')}`);
    if (!backendReady) {
      throw new Error('Backend server failed to start');
    }
    
    // Step 2: Start React frontend
    console.log('📦 Step 2: Starting React frontend server...');
    const frontendDir = path.join(__dirname, '../..');
    
    frontendProcess = spawn('npm', ['run', 'dev', '--', '--port', FRONTEND_PORT], {
      cwd: frontendDir,
      stdio: 'pipe',
      env: { ...process.env }
    });
    
    frontendProcess.stdout.on('data', (data) => {
      process.stdout.write(`[Frontend] ${data}`);
    });
    
    frontendProcess.stderr.on('data', (data) => {
      process.stderr.write(`[Frontend] ${data}`);
    });
    
    // Wait for frontend to be ready
    const frontendReady = await waitForServer(FRONTEND_URL);
    if (!frontendReady) {
      throw new Error('Frontend server failed to start');
    }
    
    // Step 3: Verify backend health
    console.log('🏥 Step 3: Verifying backend health...');
    const healthCheck = await waitForServer(API_URL);
    if (!healthCheck) {
      throw new Error('Backend API health check failed');
    }
    console.log('✅ Backend is healthy\n');
    
    // Step 4: Run Cypress tests
    console.log('🧪 Step 4: Running Cypress E2E tests...\n');
    
    const cypressArgs = headed 
      ? ['run', '--headed', '--config', `baseUrl=${FRONTEND_URL}`]
      : ['run', '--config', `baseUrl=${FRONTEND_URL}`];
    
    const cypressProcess = spawn('npx', ['cypress', ...cypressArgs], {
      cwd: __dirname,
      stdio: 'inherit',
      env: { 
        ...process.env, 
        CYPRESS_apiBaseUrl: API_URL,
        CYPRESS_backendUrl: API_URL,
        CYPRESS_frontendUrl: FRONTEND_URL
      }
    });
    
    cypressProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ All E2E tests PASSED!');
      } else {
        console.log(`\n❌ E2E tests FAILED with exit code ${code}`);
      }
      cleanup();
    });
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    cleanup();
    process.exit(1);
  }
}

// Alternative: Run just the Cypress tests (assuming servers are already running)
async function runTestsOnly() {
  console.log('🧪 Running Cypress E2E tests only...\n');
  
  const args = process.argv.slice(2);
  const headed = args.includes('--headed');
  
  const cypressArgs = headed 
    ? ['run', '--headed']
    : ['run'];
  
  const cypressProcess = spawn('npx', ['cypress', ...cypressArgs], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { 
      ...process.env, 
      CYPRESS_apiBaseUrl: API_URL,
      CYPRESS_backendUrl: API_URL,
      CYPRESS_frontendUrl: FRONTEND_URL
    }
  });
  
  cypressProcess.on('close', (code) => {
    process.exit(code);
  });
}

// Run
if (require.main === module) {
  const mode = process.argv[2];
  
  if (mode === '--test-only') {
    runTestsOnly();
  } else {
    main();
  }
}

module.exports = { main, runTestsOnly };
