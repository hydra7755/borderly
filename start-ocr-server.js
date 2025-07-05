#!/usr/bin/env node

/**
 * Start OCR Server Script
 * This script ensures the OCR server is started correctly with proper configuration
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔍 TravelScore OCR Server Launcher');
console.log('=================================');

// Check if uploads directory exists, create if not
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Check if OCR server file exists
const serverPath = path.join(__dirname, 'src', 'server', 'passport-ocr-server.cjs');
if (!fs.existsSync(serverPath)) {
  console.error('❌ OCR server file not found at:', serverPath);
  console.error('Please ensure the file exists before starting the server.');
  process.exit(1);
}

// Check current port status
const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use, possible reasons:`);
        console.log('1. The OCR server is already running');
        console.log('2. Another application is using the port');
        resolve(false);
      } else {
        console.error('Error checking port:', err.message);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
};

// Test the API endpoints to make sure they're working
const testApiEndpoints = async (port) => {
  const http = require('http');
  
  console.log('Testing API endpoints...');
  
  const testEndpoint = (path) => {
    return new Promise((resolve) => {
      const url = `http://localhost:${port}${path}`;
      console.log(`Testing endpoint: ${url}`);
      
      http.get(url, (res) => {
        const { statusCode } = res;
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          console.log(`Endpoint ${url} - Status: ${statusCode}`);
          if (statusCode === 200) {
            try {
              const data = JSON.parse(body);
              console.log(`Response data: ${JSON.stringify(data, null, 2)}`);
              resolve(true);
            } catch (error) {
              console.log(`Response body: ${body.substring(0, 100)}...`);
              resolve(false);
            }
          } else {
            console.log(`Response body: ${body}`);
            resolve(false);
          }
        });
      }).on('error', (err) => {
        console.error(`Error testing ${url}: ${err.message}`);
        resolve(false);
      });
    });
  };
  
  const root = await testEndpoint('/');
  const health = await testEndpoint('/api/health');
  
  if (health) {
    console.log('✅ OCR server API is working properly');
  } else {
    console.log('⚠️ OCR server API health check failed');
    if (root) {
      console.log('The server is running but the /api/health endpoint is not responding as expected');
      console.log('This might indicate an issue with the API routes');
    } else {
      console.log('The server does not appear to be responding on any endpoint');
    }
  }
  
  console.log('\nTo test manually, try the following curl commands:');
  console.log(`curl http://localhost:${port}/api/health`);
  console.log(`curl -X POST -F "file=@./path/to/passport.jpg" http://localhost:${port}/api/passport-ocr`);
};

// Start the server
const startServer = async () => {
  const port = process.env.PORT || 5175;
  
  // Check if port is available
  const portAvailable = await checkPort(port);
  if (!portAvailable) {
    console.log('Trying to reach existing server...');
    // Try to connect to any existing server
    try {
      const req = http.get(`http://localhost:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ OCR server is already running on port ${port}`);
          console.log(`Health check: http://localhost:${port}/api/health`);
          console.log(`Passport OCR endpoint: http://localhost:${port}/api/passport-ocr`);
          process.exit(0);
        } else {
          console.log(`Existing service on port ${port} is not the OCR server. Status: ${res.statusCode}`);
          console.log('Please stop the other service and try again.');
          process.exit(1);
        }
      });
      
      req.on('error', () => {
        console.log(`Port ${port} appears to be in use but not responding.`);
        console.log('Please check if another process is using this port and try again.');
        process.exit(1);
      });
      
      req.end();
    } catch (error) {
      console.error('Error checking existing server:', error.message);
      process.exit(1);
    }
    return;
  }
  
  console.log(`Starting OCR server on port ${port}...`);
  
  // Start the OCR server
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: { ...process.env, PORT: port }
  });
  
  server.on('error', (error) => {
    console.error('❌ Failed to start OCR server:', error.message);
    process.exit(1);
  });
  
  // Handle termination
  process.on('SIGINT', () => {
    console.log('\nShutting down OCR server...');
    server.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\nShutting down OCR server...');
    server.kill();
    process.exit(0);
  });
  
  // Wait a moment for the server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test the API endpoints
  await testApiEndpoints(port);
  
  // Detach the child process
  server.unref();
};

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
}); 