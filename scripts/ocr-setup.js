#!/usr/bin/env node

/**
 * OCR Setup Script
 * This script ensures all required packages for OCR functionality are correctly installed.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 Borderly OCR Setup Script');
console.log('==============================');

// Function to check if a package is installed
function isPackageInstalled(packageName) {
  try {
    // Check node_modules directly
    const packagePath = path.join(projectRoot, 'node_modules', packageName);
    return fs.existsSync(packagePath);
  } catch (error) {
    return false;
  }
}

// List of required packages for OCR functionality
const requiredPackages = [
  { name: 'tesseract.js', dev: false },
  { name: '@types/tesseract.js', dev: true },
  { name: 'express', dev: false },
  { name: 'cors', dev: false },
  { name: 'multer', dev: false },
  { name: '@google-cloud/vision', dev: false }
];

// Check and install missing packages
let hasErrors = false;
const missingProdPackages = [];
const missingDevPackages = [];

console.log('Checking for required OCR packages...');

requiredPackages.forEach(pkg => {
  if (!isPackageInstalled(pkg.name)) {
    if (pkg.dev) {
      missingDevPackages.push(pkg.name);
    } else {
      missingProdPackages.push(pkg.name);
    }
  }
});

// Install missing production packages
if (missingProdPackages.length > 0) {
  console.log(`Installing missing production packages: ${missingProdPackages.join(', ')}`);
  try {
    execSync(`npm install ${missingProdPackages.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Successfully installed missing production packages');
  } catch (error) {
    console.error('❌ Failed to install production packages:', error.message);
    hasErrors = true;
  }
}

// Install missing dev packages
if (missingDevPackages.length > 0) {
  console.log(`Installing missing dev packages: ${missingDevPackages.join(', ')}`);
  try {
    execSync(`npm install --save-dev ${missingDevPackages.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Successfully installed missing dev packages');
  } catch (error) {
    console.error('❌ Failed to install dev packages:', error.message);
    hasErrors = true;
  }
}

if (missingProdPackages.length === 0 && missingDevPackages.length === 0) {
  console.log('✅ All required OCR packages are already installed');
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(projectRoot, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
  } catch (error) {
    console.error('❌ Failed to create uploads directory:', error.message);
    hasErrors = true;
  }
}

// Check for environment variables
const envFile = path.join(projectRoot, '.env.local');
if (!fs.existsSync(envFile)) {
  console.log('Creating .env.local file with default OCR configuration...');
  try {
    const envContent = `# Google Cloud Vision API Configuration
REACT_APP_GOOGLE_CLOUD_VISION_ENABLED=true
REACT_APP_GOOGLE_CLOUD_VISION_API_KEY=
VITE_GOOGLE_CLOUD_VISION_ENABLED=true
VITE_GOOGLE_CLOUD_VISION_API_KEY=

# API Base URL - Local OCR server endpoint
REACT_APP_API_BASE_URL=http://localhost:5175/api
VITE_API_BASE_URL=http://localhost:5175/api
VITE_OCR_API_URL=http://localhost:5175/api

# Port for local OCR server
PORT=5175
`;
    fs.writeFileSync(envFile, envContent);
    console.log('✅ Created .env.local file');
  } catch (error) {
    console.error('❌ Failed to create .env.local file:', error.message);
    hasErrors = true;
  }
}

// Final message
if (hasErrors) {
  console.log('\n⚠️ Setup completed with some errors. Please check the messages above.');
  console.log('For more information, see docs/OCR_SETUP_GUIDE.md');
} else {
  console.log('\n✅ OCR setup completed successfully!');
  console.log('To start the OCR server: npm run ocr-server');
  console.log('To start the application: npm run dev');
  console.log('For detailed instructions, see docs/OCR_SETUP_GUIDE.md');
} 