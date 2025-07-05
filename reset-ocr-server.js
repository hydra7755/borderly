#!/usr/bin/env node

/**
 * Reset OCR Server Script
 * This script kills any existing OCR server processes and starts a fresh one
 */

import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Resetting OCR Server');
console.log('===========================');

// Windows command for finding and killing processes on port 5175
const findCommand = 'netstat -ano | findstr :5175';
const killProcess = (pid) => `taskkill /F /PID ${pid}`;

// Find and kill any processes using port 5175
const killExistingProcesses = () => {
  return new Promise((resolve) => {
    console.log('Checking for processes on port 5175...');
    
    exec(findCommand, (error, stdout, stderr) => {
      if (error || stderr) {
        console.log('No existing processes found or error checking ports.');
        resolve();
        return;
      }
      
      // Process output to find PIDs
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[4];
          pids.add(pid);
        }
      }
      
      if (pids.size === 0) {
        console.log('No processes found using port 5175');
        resolve();
        return;
      }
      
      console.log(`Found ${pids.size} process(es) using port 5175`);
      
      // Kill each process
      const killPromises = Array.from(pids).map(pid => {
        return new Promise((resolve) => {
          console.log(`Killing process ${pid}...`);
          exec(killProcess(pid), (error) => {
            if (error) {
              console.log(`Failed to kill process ${pid}: ${error.message}`);
            } else {
              console.log(`Successfully killed process ${pid}`);
            }
            resolve();
          });
        });
      });
      
      Promise.all(killPromises).then(() => {
        console.log('Finished killing processes');
        // Wait a moment to ensure ports are released
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    });
  });
};

// Start the OCR server
const startServer = () => {
  const serverPath = path.join(__dirname, 'src', 'server', 'passport-ocr-server.cjs');
  
  if (!fs.existsSync(serverPath)) {
    console.error(`❌ OCR server file not found at: ${serverPath}`);
    process.exit(1);
  }
  
  console.log('Starting OCR server...');
  const server = spawn('node', [serverPath], {
    detached: true,
    stdio: 'inherit',
    env: { ...process.env, PORT: 5175 }
  });
  
  server.on('error', (error) => {
    console.error(`❌ Failed to start OCR server: ${error.message}`);
    process.exit(1);
  });
  
  console.log('✅ OCR server started');
  console.log('You can now use the OCR service at:');
  console.log('- Health check: http://localhost:5175/api/health');
  console.log('- OCR endpoint: http://localhost:5175/api/passport-ocr');
  
  // Detach the child process
  server.unref();
};

// Main execution
killExistingProcesses()
  .then(() => {
    console.log('Creating uploads directory if needed...');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    startServer();
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }); 