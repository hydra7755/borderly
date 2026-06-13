// This script generates env-config.js file with environment variables for the browser
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define variables that should be available in the browser
const environmentVars = {
  // API Configuration - support both naming conventions
  REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:5175/api',
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5175/api',
  
  // Google Cloud Vision Configuration - support both naming conventions
  REACT_APP_GOOGLE_CLOUD_VISION_ENABLED: process.env.REACT_APP_GOOGLE_CLOUD_VISION_ENABLED || process.env.VITE_GOOGLE_CLOUD_VISION_ENABLED || 'true',
  REACT_APP_GOOGLE_CLOUD_VISION_API_KEY: process.env.REACT_APP_GOOGLE_CLOUD_VISION_API_KEY || process.env.VITE_GOOGLE_CLOUD_VISION_API_KEY || '',
  VITE_GOOGLE_CLOUD_VISION_ENABLED: process.env.VITE_GOOGLE_CLOUD_VISION_ENABLED || process.env.REACT_APP_GOOGLE_CLOUD_VISION_ENABLED || 'true',
  VITE_GOOGLE_CLOUD_VISION_API_KEY: process.env.VITE_GOOGLE_CLOUD_VISION_API_KEY || process.env.REACT_APP_GOOGLE_CLOUD_VISION_API_KEY || '',
  
  // OCR API URL
  VITE_OCR_API_URL: process.env.VITE_OCR_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5175/api',
  
  // Supabase Configuration - must be set via environment variables
  REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '',
  
  // Other environment variables can be added here
};

// Create the window._env_ content
const content = `// Generated environment configuration
window._env_ = ${JSON.stringify(environmentVars, null, 2)};
`;

// Write to the public folder where it will be served
const targetPath = path.resolve(__dirname, '../public/env-config.js');
fs.writeFileSync(targetPath, content);

console.log(`Environment configuration written to ${targetPath}`);
