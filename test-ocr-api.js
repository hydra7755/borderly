#!/usr/bin/env node

/**
 * Test OCR API
 * A simple script to test if the OCR API endpoints are working
 */

const http = require('http');
const fetch = require('node-fetch');

// Configuration
const PORT = process.env.PORT || 5175;
const BASE_URL = `http://localhost:${PORT}`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}OCR API Tester${colors.reset}`);
console.log('===================================');
console.log(`Testing OCR API at ${BASE_URL}`);

// Test function for GET endpoints
const testGetEndpoint = async (path) => {
  const url = `${BASE_URL}${path}`;
  console.log(`\n${colors.blue}Testing GET ${url}${colors.reset}`);
  
  try {
    const response = await fetch(url);
    const status = response.status;
    console.log(`Status: ${status === 200 ? colors.green : colors.red}${status}${colors.reset}`);
    
    try {
      const data = await response.json();
      console.log('Response:', data);
      return { success: status === 200, data };
    } catch (error) {
      const text = await response.text();
      console.log(`Response is not JSON: ${text.substring(0, 100)}...`);
      return { success: false, error: 'Response is not JSON' };
    }
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    return { success: false, error: error.message };
  }
};

// Run all tests
const runTests = async () => {
  console.log(`\n${colors.blue}Starting API Tests${colors.reset}`);
  
  // Test root endpoint
  const rootResult = await testGetEndpoint('/');
  
  // Test health endpoint
  const healthResult = await testGetEndpoint('/api/health');
  
  // Test other paths to see if there's a routing issue
  console.log('\nTesting alternative paths to check routing:');
  await testGetEndpoint('/health');
  await testGetEndpoint('/passport-ocr');
  
  // Additional tests with trailing slash
  await testGetEndpoint('/api/health/');
  await testGetEndpoint('/api/passport-ocr/');
  
  // Summary
  console.log(`\n${colors.blue}Test Summary${colors.reset}`);
  console.log('===================================');
  console.log(`Root endpoint: ${rootResult.success ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`Health endpoint: ${healthResult.success ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  
  if (!rootResult.success && !healthResult.success) {
    console.log(`\n${colors.red}Both endpoints failed. The OCR server might not be running.${colors.reset}`);
    console.log('Try starting the server with: npm run reset-ocr');
  } else if (!healthResult.success) {
    console.log(`\n${colors.yellow}Health endpoint failed but root is working.${colors.reset}`);
    console.log('This might indicate an issue with the API routes configuration.');
  } else {
    console.log(`\n${colors.green}API appears to be working correctly.${colors.reset}`);
    console.log('To test file upload, use curl or the web interface.');
  }
  
  // Print manual test command
  console.log('\nTo test the OCR endpoint manually with curl:');
  console.log(`curl -X POST -F "file=@./path/to/passport.jpg" ${BASE_URL}/api/passport-ocr`);
};

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
}); 