import { v2 as cloudinary } from 'cloudinary';

// Configuration from index.js
cloudinary.config({ 
  cloud_name: 'drdpxs3je', 
  api_key: '479125649733174', 
  api_secret: 'i1JrD6qfTl_87WEx1OvJQ_DL3zg'
});

/**
 * Upload an image to Cloudinary with proper folder structure
 * 
 * @param {string} imagePath - Local path or URL of the image to upload
 * @param {string} countryCode - Two-letter country code
 * @param {string} [type='main'] - Type of image (main, scenic, cultural, etc)
 * @returns {Promise<string>} - The Cloudinary URL of the uploaded image
 */
export const uploadCountryImage = async (imagePath, countryCode, type = 'main') => {
  try {
    const code = countryCode.toLowerCase();
    const uploadResult = await cloudinary.uploader.upload(imagePath, {
      public_id: `countries/${code}/${code}_${type}`,
      folder: `countries/${code}`,
      overwrite: true,
      resource_type: 'image'
    });
    
    return uploadResult.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload a country flag to Cloudinary
 * 
 * @param {string} imagePath - Local path or URL of the flag image
 * @param {string} countryCode - Two-letter country code
 * @returns {Promise<string>} - The Cloudinary URL of the uploaded flag
 */
export const uploadCountryFlag = async (imagePath, countryCode) => {
  try {
    const code = countryCode.toLowerCase();
    const uploadResult = await cloudinary.uploader.upload(imagePath, {
      public_id: `flags/${code}`,
      folder: 'flags',
      overwrite: true,
      resource_type: 'image'
    });
    
    return uploadResult.secure_url;
  } catch (error) {
    console.error('Error uploading flag to Cloudinary:', error);
    throw error;
  }
};

/**
 * Generate proper URLs for Cloudinary images
 * 
 * @param {string} countryCode - Two-letter country code
 * @param {string} cloudName - Cloudinary cloud name
 * @returns {string[]} Array of properly formatted Cloudinary image URLs
 */
export const generateOptimizedUrls = (countryCode, cloudName = 'drdpxs3je') => {
  const code = countryCode.toUpperCase();
  
  // Get URLs with transformation parameters for optimization
  return [
    `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/flags/${code.toLowerCase()}.png`,
    `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/countries/${code.toLowerCase()}/${code.toLowerCase()}_main.jpg`,
    `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/countries/${code.toLowerCase()}/${code.toLowerCase()}_scenic.jpg`,
    `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/countries/${code.toLowerCase()}/${code.toLowerCase()}_cultural.jpg`,
    `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/sample` // Fallback
  ];
};

export default {
  uploadCountryImage,
  uploadCountryFlag,
  generateOptimizedUrls
}; 