import { v2 as cloudinary } from 'cloudinary';
import { ALL_COUNTRIES } from './src/utils/countries.js';

// Configuration from index.js
cloudinary.config({ 
  cloud_name: 'drdpxs3je', 
  api_key: '479125649733174', 
  api_secret: 'i1JrD6qfTl_87WEx1OvJQ_DL3zg'
});

/**
 * Check if a specific image exists on Cloudinary
 */
async function checkImageExists(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId, { type: 'upload' });
    return true;
  } catch (error) {
    if (error.error && error.error.http_code === 404) {
      return false;
    }
    console.error(`Error checking image ${publicId}:`, error);
    return false;
  }
}

/**
 * Check all country-specific images and report missing ones
 */
async function checkCountryImages() {
  console.log('Checking country-specific images on Cloudinary...');
  
  const missing = [];
  const existing = [];
  
  for (const country of ALL_COUNTRIES) {
    const code = country.code.toLowerCase();
    
    // Check the 4 expected images for each country
    for (let i = 1; i <= 4; i++) {
      const publicId = `countries/${code}/${code}_image_${i}`;
      const exists = await checkImageExists(publicId);
      
      if (exists) {
        existing.push(publicId);
      } else {
        missing.push(publicId);
      }
    }
    
    // Log progress after each country check
    console.log(`Checked images for ${country.name} (${code})`);
  }
  
  // Summary report
  console.log('\n===== Image Verification Summary =====');
  console.log(`Found ${existing.length} images`);
  console.log(`Missing ${missing.length} images`);
  
  if (missing.length > 0) {
    console.log('\nMissing images:');
    missing.forEach(image => console.log(`- ${image}`));
  }
}

// Run the function
checkCountryImages(); 