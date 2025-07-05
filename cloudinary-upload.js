import { v2 as cloudinary } from 'cloudinary';

// Configuration from index.js
cloudinary.config({ 
  cloud_name: 'drdpxs3je', 
  api_key: '479125649733174', 
  api_secret: 'i1JrD6qfTl_87WEx1OvJQ_DL3zg'
});

// List of popular countries to create sample images for
const COUNTRIES = [
  { code: 'us', name: 'United States' },
  { code: 'ca', name: 'Canada' },
  { code: 'in', name: 'India' },
  { code: 'pk', name: 'Pakistan' },
  { code: 'ng', name: 'Nigeria' },
  { code: 'jp', name: 'Japan' },
  { code: 'cn', name: 'China' },
  { code: 'fr', name: 'France' },
  { code: 'de', name: 'Germany' },
  { code: 'it', name: 'Italy' }
];

// Sample Cloudinary images to use
const SAMPLE_IMAGES = [
  'https://res.cloudinary.com/demo/image/upload/sample',
  'https://res.cloudinary.com/demo/image/upload/shoes',
  'https://res.cloudinary.com/demo/image/upload/v1629388619/samples/landscapes/architecture-signs.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1629388598/samples/food/dessert.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1629388561/samples/landscapes/beach-boat.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1629388559/samples/animals/three-dogs.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1629388574/samples/landscapes/nature-mountains.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1629388573/samples/people/kitchen-bar.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1629388566/samples/landscapes/girl-urban-view.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1629388580/samples/ecommerce/leather-bag-gray.jpg'
];

/**
 * Upload country images to Cloudinary
 */
async function uploadCountryImages(countryCode, countryName) {
  try {
    // Use different sample images for variety
    const flagImage = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
    const mainImage = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
    const scenicImage = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
    const culturalImage = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
    
    console.log(`\n------ Processing ${countryName} (${countryCode}) ------`);
    
    // Upload a sample flag
    console.log(`Uploading flag for ${countryCode}...`);
    const flagUpload = await cloudinary.uploader.upload(flagImage, {
      public_id: `flags/${countryCode}`,
      overwrite: true,
    });
    console.log('Flag uploaded:', flagUpload.secure_url);
    
    // Upload main country image
    console.log(`Uploading main image for ${countryCode}...`);
    const mainImageUpload = await cloudinary.uploader.upload(mainImage, {
      public_id: `countries/${countryCode}/${countryCode}_main`,
      overwrite: true,
    });
    console.log('Main image uploaded:', mainImageUpload.secure_url);
    
    // Upload scenic country image
    console.log(`Uploading scenic image for ${countryCode}...`);
    const scenicImageUpload = await cloudinary.uploader.upload(scenicImage, {
      public_id: `countries/${countryCode}/${countryCode}_scenic`,
      overwrite: true,
    });
    console.log('Scenic image uploaded:', scenicImageUpload.secure_url);
    
    // Upload cultural country image
    console.log(`Uploading cultural image for ${countryCode}...`);
    const culturalImageUpload = await cloudinary.uploader.upload(culturalImage, {
      public_id: `countries/${countryCode}/${countryCode}_cultural`,
      overwrite: true,
    });
    console.log('Cultural image uploaded:', culturalImageUpload.secure_url);
    
    return {
      flag: flagUpload.secure_url,
      main: mainImageUpload.secure_url,
      scenic: scenicImageUpload.secure_url,
      cultural: culturalImageUpload.secure_url
    };
  } catch (error) {
    console.error(`Error uploading images for ${countryCode}:`, error);
    return null;
  }
}

/**
 * Upload images for all countries
 */
async function uploadAllCountryImages() {
  console.log('Starting to upload country images to Cloudinary...');
  
  const results = {};
  
  for (const country of COUNTRIES) {
    const result = await uploadCountryImages(country.code, country.name);
    if (result) {
      results[country.code] = result;
    }
  }
  
  console.log('\n===== Upload Summary =====');
  console.log(`Successfully uploaded images for ${Object.keys(results).length} countries`);
  console.log('All images uploaded successfully!');
}

// Run the function
uploadAllCountryImages(); 