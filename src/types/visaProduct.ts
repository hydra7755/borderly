/**
 * Interface for visa product catalog data
 */
export interface VisaProduct {
  id?: string; // Unique identifier for the visa product
  name?: string; // Display name for the visa product
  countryName: string;
  countryCode: string;
  visaType: 'visa-free' | 'evisa' | 'visa-required' | 'visa-on-arrival' | 'eta' | 'not-applicable';
  visaValidity: string; // e.g., "90 days", "1 year", etc.
  lengthOfStay: string; // e.g., "30 days", "90 days", etc.
  entryType: 'single' | 'multiple' | 'not-applicable';
  processingTime: {
    express?: string;
    normal: string;
  };
  price?: number; // Cost of the visa in the specified currency
  currency?: string; // Currency code (e.g., USD, EUR)
  requirements?: string[]; // List of requirements for the visa
  documents?: string[]; // List of required documents
  documentsRequired?: Array<{
    name: string;
    description: string;
  }>; // Structured documents with name and description
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  images: string[]; // Cloudinary URLs
}

/**
 * Generate a standard set of FAQs based on visa type
 */
export const generateStandardFAQs = (
  countryName: string, 
  visaType: VisaProduct['visaType'],
  lengthOfStay: string
): VisaProduct['faqs'] => {
  const baseQuestions: VisaProduct['faqs'] = [];

  // Common questions for all visa types
  baseQuestions.push({
    question: `What documents do I need to enter ${countryName}?`,
    answer: `Requirements vary based on your nationality, but generally you'll need a valid passport with at least 6 months validity beyond your planned stay, proof of accommodation, return/onward ticket, and sufficient funds for your stay.`
  });

  // Visa type specific questions
  switch (visaType) {
    case 'visa-free':
      baseQuestions.push(
        {
          question: `Do I need a visa to visit ${countryName}?`,
          answer: `Depending on your nationality, you may be able to enter ${countryName} visa-free for tourism purposes for up to ${lengthOfStay}.`
        },
        {
          question: `How long can I stay in ${countryName} without a visa?`,
          answer: `Eligible travelers can stay in ${countryName} for up to ${lengthOfStay} without a visa.`
        },
        {
          question: `Can I extend my stay in ${countryName} beyond the visa-free period?`,
          answer: `In most cases, you would need to leave the country and re-enter, or apply for a visa extension at the local immigration office before your visa-free period expires.`
        },
        {
          question: `Do I need a return ticket to enter ${countryName} visa-free?`,
          answer: `Yes, immigration officials typically require proof of onward travel, such as a return or onward ticket, when entering ${countryName} visa-free.`
        }
      );
      break;
    
    case 'evisa':
      baseQuestions.push(
        {
          question: `How do I apply for an eVisa to ${countryName}?`,
          answer: `You can apply for an eVisa to ${countryName} through our online platform. The process typically requires your passport details, travel itinerary, and payment of the visa fee.`
        },
        {
          question: `How long does it take to process an eVisa for ${countryName}?`,
          answer: `Standard processing for ${countryName} eVisas typically takes 3-5 business days. Express processing options may be available for an additional fee.`
        },
        {
          question: `How much does a ${countryName} eVisa cost?`,
          answer: `eVisa fees vary depending on your nationality and the type of visa. Please check the specific requirements for your nationality on our platform.`
        },
        {
          question: `Can I extend my eVisa while in ${countryName}?`,
          answer: `eVisa extensions are typically handled by local immigration offices in ${countryName}. You should apply for an extension before your current visa expires.`
        }
      );
      break;
    
    case 'visa-required':
      baseQuestions.push(
        {
          question: `How do I apply for a visa to ${countryName}?`,
          answer: `You will need to apply for a visa through the ${countryName} embassy or consulate in your country, or through an authorized visa application center. Our platform can guide you through the requirements.`
        },
        {
          question: `What documents are required for a ${countryName} visa application?`,
          answer: `Typically, you'll need a valid passport, visa application form, passport-sized photos, proof of accommodation, travel itinerary, proof of sufficient funds, and travel insurance. Specific requirements may vary.`
        },
        {
          question: `How long does it take to process a visa for ${countryName}?`,
          answer: `Standard visa processing for ${countryName} typically takes 5-15 business days, depending on your nationality and the type of visa.`
        },
        {
          question: `Can I expedite my visa application for ${countryName}?`,
          answer: `Many ${countryName} consulates offer expedited processing for an additional fee. Check with the specific consulate for availability and pricing.`
        }
      );
      break;

    case 'visa-on-arrival':
      baseQuestions.push(
        {
          question: `How does Visa on Arrival work for ${countryName}?`,
          answer: `When you arrive at a major port of entry in ${countryName}, you can apply for a visa at the immigration counter. You'll typically need your passport, passport photos, visa fee payment, and proof of onward travel.`
        },
        {
          question: `How much does a Visa on Arrival for ${countryName} cost?`,
          answer: `Visa on Arrival fees for ${countryName} vary depending on your nationality and length of stay. It's recommended to have the exact amount in the accepted currency.`
        },
        {
          question: `Can I extend a Visa on Arrival while in ${countryName}?`,
          answer: `Extensions for Visas on Arrival are typically handled by local immigration offices in ${countryName}. You should apply before your current visa expires.`
        },
        {
          question: `What payment methods are accepted for Visa on Arrival in ${countryName}?`,
          answer: `Most Visa on Arrival counters in ${countryName} accept cash payment in major currencies. Some locations may accept credit cards, but it's advisable to have cash as a backup.`
        }
      );
      break;

    case 'eta':
      baseQuestions.push(
        {
          question: `What is an ETA for ${countryName}?`,
          answer: `An Electronic Travel Authorization (ETA) is a digital travel authorization for visa-exempt foreign nationals traveling to ${countryName}. It is linked electronically to your passport.`
        },
        {
          question: `How do I apply for an ETA for ${countryName}?`,
          answer: `You can apply for an ETA through our online platform. The process is simple and requires your passport details and payment of the processing fee.`
        },
        {
          question: `How long is the ${countryName} ETA valid for?`,
          answer: `The ETA for ${countryName} is typically valid for multiple entries over a period of time, allowing stays of up to ${lengthOfStay} per visit.`
        },
        {
          question: `Can I extend my stay in ${countryName} beyond the ETA period?`,
          answer: `In most cases, you would need to apply for a visa extension at a local immigration office before your authorized stay under the ETA expires.`
        }
      );
      break;
      
    default:
      // Additional generic questions
      baseQuestions.push(
        {
          question: `What is the best time to visit ${countryName}?`,
          answer: `The best time to visit ${countryName} depends on your preferences for weather and activities. Research the seasonal variations to plan your trip accordingly.`
        },
        {
          question: `Are there any travel advisories for ${countryName}?`,
          answer: `Travel advisories can change frequently. We recommend checking your government's official travel advisory website for the most up-to-date information before planning your trip to ${countryName}.`
        }
      );
  }

  // Add a couple more general questions
  baseQuestions.push(
    {
      question: `Do I need travel insurance to visit ${countryName}?`,
      answer: `While travel insurance may not be mandatory for all visitors to ${countryName}, it is highly recommended to cover unexpected medical expenses, trip cancellations, and lost luggage.`
    },
    {
      question: `What currency is used in ${countryName}?`,
      answer: `Research the local currency used in ${countryName} and check if credit cards are widely accepted or if you should carry cash.`
    }
  );

  return baseQuestions;
};

/**
 * Generate Cloudinary image URLs for a country
 */
export const generateCloudinaryUrls = (countryCode: string, cloudName: string = 'drdpxs3je'): string[] => {
  const code = countryCode.toLowerCase();
  
  // Use the country-specific images directly from the root level
  // Based on image 1 showing the format "al_image_1.jpg", etc.
  const countryImages = [
    `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${code}_image_1`,
    `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${code}_image_2`,
    `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${code}_image_3`,
    `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${code}_image_4`
  ];
  
  // Only add fallback images if absolutely necessary
  const fallbackImage = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/sample`;
  
  return [...countryImages, fallbackImage];
};

/**
 * Helper function to determine the region for a country
 */
function getRegionForCountry(code: string): string {
  // Simple mapping of countries to regions
  const regionMap: Record<string, string> = {
    // Europe
    'GB': 'europe', 'DE': 'europe', 'FR': 'europe', 'ES': 'europe', 'IT': 'europe',
    // North America
    'US': 'north-america', 'CA': 'north-america', 'MX': 'north-america',
    // Asia
    'JP': 'asia', 'CN': 'asia', 'IN': 'asia', 'SG': 'asia', 'TH': 'asia',
    // Africa
    'ZA': 'africa', 'EG': 'africa', 'NG': 'africa', 'KE': 'africa',
    // South America
    'BR': 'south-america', 'AR': 'south-america', 'CO': 'south-america',
    // Oceania
    'AU': 'oceania', 'NZ': 'oceania'
  };
  
  return regionMap[code] || 'global';
};
