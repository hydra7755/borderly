import { ALL_COUNTRIES } from './countries';
import { VisaProduct, generateStandardFAQs, generateCloudinaryUrls } from '../types/visaProduct';
import { getCountryNameFromCode } from '../lib/api/visaRequirements';
import { getVisaFeeForCountry } from '../data/visaFees';

/**
 * Generate visa product data for a specific country
 */
export const generateVisaProductForCountry = (
  countryCode: string,
  cloudName: string = 'drdpxs3je'
): VisaProduct | null => {
  // Get country name from code
  const countryName = getCountryNameFromCode(countryCode);
  if (!countryName) return null;

  // Find country in our database
  const country = ALL_COUNTRIES.find(c => c.name === countryName);
  if (!country) return null;

  // Determine visa type based on country (in a real app, this would come from your visa requirements database)
  // This is a simplified example - you would replace this with actual data from your database
  const visaTypes: Record<string, VisaProduct['visaType']> = {
    // Visa-free examples
    'United States': 'visa-free',
    'Canada': 'visa-free',
    'United Kingdom': 'visa-free',
    'Japan': 'visa-free',
    'Singapore': 'visa-free',
    'New Zealand': 'visa-free',
    
    // eVisa examples
    'India': 'evisa',
    'Turkey': 'evisa',
    'Egypt': 'evisa',
    'Vietnam': 'evisa',
    'Cambodia': 'evisa',
    'Myanmar': 'evisa',
    
    // Visa on arrival examples
    'Thailand': 'visa-on-arrival',
    'Nepal': 'visa-on-arrival',
    'Indonesia': 'visa-on-arrival',
    'Laos': 'visa-on-arrival',
    
    // ETA examples
    'Sri Lanka': 'eta',
    'Australia': 'eta', // Note: Australia uses ETA
    
    // Visa required examples
    'China': 'visa-required',
    'Russia': 'visa-required',
    'Brazil': 'visa-required',
    'South Africa': 'visa-required'
  };

  // Assign visa types to all countries
  for (const c of ALL_COUNTRIES) {
    if (!visaTypes[c.name]) {
      visaTypes[c.name] = 'visa-required';
    }
  }

  // Default visa type if not specified in the map above
  let visaType: VisaProduct['visaType'] = visaTypes[country.name] || 'visa-required';
  
  // Determine length of stay based on visa type
  let lengthOfStay = '';
  switch (visaType) {
    case 'visa-free':
      lengthOfStay = '90 days';
      break;
    case 'evisa':
      lengthOfStay = '30 days';
      break;
    case 'visa-on-arrival':
      lengthOfStay = '15 days';
      break;
    case 'eta':
      lengthOfStay = '90 days';
      break;
    case 'visa-required':
      lengthOfStay = 'Varies';
      break;
  }

  // Determine visa validity based on visa type
  let visaValidity = '';
  switch (visaType) {
    case 'visa-free':
      visaValidity = '6 months from entry';
      break;
    case 'evisa':
      visaValidity = '90 days from issue';
      break;
    case 'visa-on-arrival':
      visaValidity = '15 days from entry';
      break;
    case 'eta':
      visaValidity = '1 year from issue';
      break;
    case 'visa-required':
      visaValidity = '90 days from issue';
      break;
    default:
      visaValidity = 'Varies';
      break;
  }

  // Determine entry type based on visa type
  let entryType: VisaProduct['entryType'] = 'single';
  if (['visa-free', 'eta'].includes(visaType)) {
    entryType = 'multiple';
  }

  // Generate processing time based on visa type
  const processingTime = {
    normal: visaType === 'visa-required' ? '10-15 business days' : 
            visaType === 'evisa' ? '3-5 business days' : 
            visaType === 'eta' ? '24-48 hours' : 'Immediate',
    express: visaType !== 'visa-free' ? '1-2 business days' : undefined
  };

  // Generate FAQs based on country and visa type
  const faqs = generateStandardFAQs(country.name, visaType, lengthOfStay);
  
  // Add country-specific FAQs
  switch (country.name) {
    case 'Japan':
      faqs.push(
        {
          question: 'Do I need to show proof of funds when entering Japan?',
          answer: 'While not always checked, it\'s recommended to have proof of sufficient funds for your stay in Japan, such as cash, credit cards, or bank statements.'
        },
        {
          question: 'Can I use my foreign driver\'s license in Japan?',
          answer: 'Most visitors cannot use their foreign driver\'s license in Japan. You\'ll need an International Driving Permit (IDP) issued in your home country before arrival.'
        }
      );
      break;
    case 'Australia':
      faqs.push(
        {
          question: 'Is travel insurance mandatory for Australia?',
          answer: 'While not legally required, travel insurance is strongly recommended for all visitors to Australia to cover medical emergencies and other unexpected events.'
        },
        {
          question: 'Can I bring food items into Australia?',
          answer: 'Australia has strict biosecurity laws. Most food items are either prohibited or must be declared upon arrival. Failure to declare can result in heavy fines.'
        }
      );
      break;
  }

  const visaPrice = getVisaFeeForCountry(country.name);

  // Generate a product object with all required properties
  const product: VisaProduct = {
    countryCode: country.code,
    countryName: country.name,
    visaType: visaType,
    visaValidity: visaValidity,
    lengthOfStay: lengthOfStay,
    entryType: entryType,
    processingTime: processingTime,
    faqs: faqs,
    images: generateCloudinaryUrls(country.code, cloudName)
  };

  // Add any additional properties needed for the UI
  return {
    ...product,
    id: `visa-${country.code}`,
    name: `${country.name} Visa`,
    price: visaPrice,
    currency: 'GBP', // Changed to GBP to match the service fee
    requirements: [
      'Valid passport with at least 6 months validity',
      'Completed application form',
      visaType !== 'visa-free' ? 'Passport-sized photograph' : '',
      visaType === 'visa-required' ? 'Proof of accommodation' : '',
      visaType === 'visa-required' ? 'Proof of sufficient funds' : '',
      visaType === 'visa-required' ? 'Return ticket' : '',
      visaType === 'visa-required' ? 'Travel insurance' : '',
    ].filter(Boolean),
    documents: [
      'Passport',
      visaType !== 'visa-free' ? 'Passport-sized photograph' : '',
      visaType === 'visa-required' ? 'Travel itinerary' : '',
      visaType === 'visa-required' ? 'Hotel reservations' : '',
      visaType === 'visa-required' ? 'Bank statements' : '',
      visaType === 'visa-required' ? 'Travel insurance certificate' : '',
    ].filter(Boolean)
  } as VisaProduct;
};

/**
 * Generate visa product data for all countries
 */
export const generateAllVisaProducts = (
  cloudName: string = 'drdpxs3je'
): VisaProduct[] => {
  const products: VisaProduct[] = [];
  
  // Generate a visa product for each country in the ALL_COUNTRIES list
  ALL_COUNTRIES.forEach(country => {
    const product = generateVisaProductForCountry(country.code, cloudName);
    if (product) {
      products.push(product);
    }
  });
  
  return products;
};

/**
 * Get a list of all visa product paths
 */
export const getAllVisaProductPaths = (): string[] => {
  return ALL_COUNTRIES.map(country => `/visa/${country.code}`);
};
