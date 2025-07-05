/**
 * Passport OCR Utility
 * 
 * This utility extracts structured information from passport OCR text
 * for use in visa application forms.
 */

interface PassportData {
  full_name: string | null;
  surname: string | null;
  given_names: string | null;
  passport_number: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  gender: string | null;
  passport_expiry_date: string | null;
  issue_date: string | null;
  place_of_birth: string | null;
  issuing_country: string | null;
}

/**
 * Normalizes names from passport MRZ format
 * Replaces << with spaces and fixes casing
 * 
 * @param name The name string from MRZ
 * @returns Properly formatted name
 */
const normalizeName = (name: string | null): string | null => {
  if (!name) return null;
  
  // Replace << with spaces and remove single <
  const spacedName = name.replace(/<<+/g, ' ').replace(/</g, '');
  
  // Proper case conversion (capitalize first letter of each word)
  return spacedName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a date from YYMMDD format to YYYY-MM-DD
 * 
 * @param dateStr Date string in YYMMDD format
 * @returns Formatted date string or null if invalid
 */
const formatDate = (dateStr: string | null): string | null => {
  if (!dateStr || dateStr.length !== 6) return null;
  
  try {
    const year = parseInt(dateStr.substring(0, 2));
    const month = dateStr.substring(2, 4);
    const day = dateStr.substring(4, 6);
    
    // Determine century (assuming 20th century for years > current year's last 2 digits)
    const currentYear = new Date().getFullYear() % 100;
    const century = year > currentYear ? '19' : '20';
    
    return `${century}${year}-${month}-${day}`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return null;
  }
};

/**
 * Converts a month name to its numeric representation
 * 
 * @param monthName Three-letter month abbreviation (e.g., JAN, FEB)
 * @returns Two-digit month number as string (e.g., "01", "02")
 */
const parseMonth = (monthName: string): string | null => {
  const months: Record<string, string> = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
    'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
    'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };
  
  const upperMonth = monthName.toUpperCase();
  return months[upperMonth] || null;
};

/**
 * Normalizes date formats from various formats to YYYY-MM-DD
 * 
 * @param dateStr Date string in various formats
 * @returns Normalized date string
 */
const normalizeDate = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  
  // Remove any non-alphanumeric characters except spaces and basic separators
  const cleanedDate = dateStr.replace(/[^\w\s\/\-\.]/gi, '').trim();
  
  // Try different date formats
  
  // Format: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dateSeparatorMatch = cleanedDate.match(/(\d{1,2})[\-\.\/](\d{1,2}|[A-Za-z]{3})[\-\.\/](\d{2,4})/);
  if (dateSeparatorMatch) {
    let day = dateSeparatorMatch[1].padStart(2, '0');
    let month = dateSeparatorMatch[2];
    let year = dateSeparatorMatch[3];
    
    // Handle month as text (e.g., JAN, FEB)
    if (isNaN(parseInt(month))) {
      const numericMonth = parseMonth(month);
      if (numericMonth) {
        month = numericMonth;
      }
    } else {
      month = month.padStart(2, '0');
    }
    
    // Handle 2-digit years
    if (year.length === 2) {
      const currentYear = new Date().getFullYear() % 100;
      const century = parseInt(year) > currentYear ? '19' : '20';
      year = century + year;
    }
    
    return `${year}-${month}-${day}`;
  }
  
  // Format: YYMMDD (common in MRZ)
  if (/^\d{6}$/.test(cleanedDate)) {
    return formatDate(cleanedDate);
  }
  
  // Format: YYYY-MM-DD already correctly formatted
  if (/^\d{4}[\-\.\/]\d{2}[\-\.\/]\d{2}$/.test(cleanedDate)) {
    return cleanedDate.replace(/[\.\/]/g, '-');
  }
  
  // Format: Text format like "23 Jan 1980" or "23 January 1980"
  const textFormatMatch = cleanedDate.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/i);
  if (textFormatMatch) {
    const day = textFormatMatch[1].padStart(2, '0');
    const monthText = textFormatMatch[2].substring(0, 3).toUpperCase();
    const year = textFormatMatch[3];
    
    const month = parseMonth(monthText);
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }
  
  // Just return the original if no format matches
  return dateStr;
};

/**
 * Extracts the MRZ lines from OCR text
 * 
 * @param ocrText The full OCR text
 * @returns Array of MRZ lines
 */
const extractMRZLines = (ocrText: string): string[] => {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for lines that match MRZ patterns
  const mrzLines: string[] = [];
  
  // First try to find lines with the standard pattern (P<XXX...)
  for (const line of lines) {
    // First line of TD3 format typically starts with P<
    if (line.startsWith('P<') && line.includes('<<') && line.length >= 30) {
      mrzLines.push(line);
      continue;
    }
    
    // Second line often starts with a letter followed by digits
    if (/^[A-Z][0-9]/.test(line) && line.includes('<') && line.length >= 30) {
      mrzLines.push(line);
      continue;
    }
    
    // Alternative detection: high density of < characters and alphanumeric
    const containsLessThan = line.includes('<');
    const alphanumericRatio = line.replace(/[^A-Z0-9<]/g, '').length / line.length;
    if (containsLessThan && alphanumericRatio > 0.8 && line.length > 30) {
      mrzLines.push(line);
    }
  }
  
  return mrzLines;
};

/**
 * Parses MRZ lines from a passport
 * 
 * @param mrzLines Array of MRZ lines (typically 2 or 3 lines)
 * @returns Partial passport data extracted from MRZ
 */
const parseMRZ = (mrzLines: string[]): Partial<PassportData> => {
  console.log("Parsing MRZ lines:", mrzLines);
  const data: Partial<PassportData> = {};
  
  if (mrzLines.length < 2) {
    console.warn("Not enough MRZ lines found:", mrzLines.length);
    return data;
  }
  
  // Clean up MRZ lines (remove spaces, normalize)
  const cleanedMRZ = mrzLines.map(line => line.trim().replace(/\s+/g, ''));
  console.log("Cleaned MRZ lines:", cleanedMRZ);
  
  // Pakistani passport format (based on the image)
  // Line 1: P<PAKHAIDER<<SHER<ALI<<<<<<<<<<<<<<<<<<<<<<
  // Line 2: C1497479717PAK9302280M2023134034675279<<30
  
  // Extract data from first line (typically contains name)
  const line1 = cleanedMRZ[0];
  if (line1.startsWith('P<')) {
    // Extract issuing country (positions 2-5)
    const countryCode = line1.substring(2, 5);
    data.issuing_country = countryCode;
    console.log("Extracted country code:", countryCode);
    
    // Extract name components - Pakistani format has surname after country code
    const nameSection = line1.substring(5);
    const nameParts = nameSection.split('<<');
    
    if (nameParts.length >= 2) {
      data.surname = normalizeName(nameParts[0].replace(/</g, ''));
      data.given_names = normalizeName(nameParts[1].replace(/</g, ''));
      
      if (data.surname && data.given_names) {
        data.full_name = `${data.given_names} ${data.surname}`;
      } else {
        data.full_name = normalizeName(nameSection.replace(/</g, ' ').trim());
      }
      console.log("Extracted name parts:", { surname: data.surname, givenNames: data.given_names });
    }
  }
  
  // Extract data from second line
  const line2 = cleanedMRZ[1];
  if (line2.length >= 30) {
    // Pakistani passport format: 
    // C1497479717PAK9302280M2023134034675279<<30
    // [Passport#][Country][DOB][Sex][Expiry][PersonalNo]
    
    // Extract passport number - first 9 characters after the document type
    // In Pakistani passports, it often starts with a letter followed by digits
    const passportNumberMatch = line2.match(/^[A-Z][0-9]+/);
    if (passportNumberMatch) {
      data.passport_number = passportNumberMatch[0];
      console.log("Extracted passport number:", data.passport_number);
    }
    
    // Find nationality - typically 3 letters after passport number
    // Look for 3-letter country code (e.g., PAK)
    const nationalityMatch = line2.match(/[A-Z]{3}/);
    if (nationalityMatch) {
      data.nationality = nationalityMatch[0];
      console.log("Extracted nationality:", data.nationality);
      
      // Date of birth - 6 digits after nationality
      const nationalityIndex = line2.indexOf(nationalityMatch[0]);
      if (nationalityIndex > 0) {
        const dobStart = nationalityIndex + 3;
        const dobStr = line2.substring(dobStart, dobStart + 6);
        data.date_of_birth = formatDate(dobStr);
        console.log("Extracted DOB:", dobStr, "->", data.date_of_birth);
        
        // Gender - 1 character after DOB
        const genderChar = line2.charAt(dobStart + 6);
        data.gender = genderChar === 'M' ? 'Male' : genderChar === 'F' ? 'Female' : null;
        console.log("Extracted gender:", genderChar, "->", data.gender);
        
        // Expiry date - 6 digits after gender
        const expiryStart = dobStart + 7;
        const expiryStr = line2.substring(expiryStart, expiryStart + 6);
        data.passport_expiry_date = formatDate(expiryStr);
        console.log("Extracted expiry date:", expiryStr, "->", data.passport_expiry_date);
      }
    }
  }
  
  return data;
};

/**
 * Extracts visual data from OCR text (non-MRZ parts)
 * 
 * @param ocrText The full OCR text
 * @returns Partial passport data from visual inspection zone
 */
const extractVisualData = (ocrText: string): Partial<PassportData> => {
  console.log("Extracting visual data from OCR text");
  const data: Partial<PassportData> = {};
  const lines = ocrText.split('\n');
  
  // Helper function to find lines containing specific text
  const findLine = (keyword: string, excludeKeywords: string[] = []): string | null => {
    const matchingLines = lines.filter(line => {
      const normalizedLine = line.toLowerCase();
      return normalizedLine.includes(keyword.toLowerCase()) && 
        !excludeKeywords.some(exclude => normalizedLine.includes(exclude.toLowerCase()));
    });
    return matchingLines.length > 0 ? matchingLines[0] : null;
  };

  // Helper function to find multiple lines containing keyword
  const findLines = (keyword: string, excludeKeywords: string[] = []): string[] => {
    return lines.filter(line => {
      const normalizedLine = line.toLowerCase();
      return normalizedLine.includes(keyword.toLowerCase()) && 
        !excludeKeywords.some(exclude => normalizedLine.includes(exclude.toLowerCase()));
    });
  };
  
  // Helper function to extract value after a label in a line
  const extractAfterLabel = (line: string | null, label: string): string | null => {
    if (!line) return null;
    
    // Try to find the label followed by a colon or space
    const regex = new RegExp(`${label}[:\\s]+([^\\n\\r]+)`, 'i');
    const match = line.match(regex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If no match with label, try to extract content after the label position
    const labelIndex = line.toLowerCase().indexOf(label.toLowerCase());
    if (labelIndex >= 0) {
      const valueStart = labelIndex + label.length;
      // Skip any non-alphanumeric characters
      let startPos = valueStart;
      while (startPos < line.length && !/[a-zA-Z0-9]/.test(line[startPos])) {
        startPos++;
      }
      if (startPos < line.length) {
        return line.substring(startPos).trim();
      }
    }
    
    return null;
  };

  // Extract passport number - try multiple variations
  const passportLines = findLines("passport", ["old"]).concat(findLines("document no"));
  
  for (const passportLine of passportLines) {
    // Try to extract using regex for common formats
    const passportMatch = passportLine.match(/(?:passport|document)(?:\s+no\.?|\s*number|\s*#)?(?:\s*:?\s*)([A-Z0-9]+)/i);
    
    if (passportMatch && passportMatch[1]) {
      data.passport_number = passportMatch[1].trim();
      console.log("Extracted passport number:", data.passport_number);
      break;
    }
  }
  
  if (!data.passport_number) {
    // Try simpler extraction if regex didn't work
    const passportLine = findLine("passport no", ["old"]) || findLine("document no");
    if (passportLine) {
      data.passport_number = extractAfterLabel(passportLine, "passport no") || 
                            extractAfterLabel(passportLine, "document no");
      console.log("Extracted passport number (simple method):", data.passport_number);
    }
  }
  
  // Extract name components
  const nameLines = findLines("name").concat(findLines("surname")).concat(findLines("given name"));
  
  // Look for full name
  const fullNameLine = findLine("name", ["sur", "given", "last", "first"]) || findLine("full name");
  if (fullNameLine) {
    const fullName = extractAfterLabel(fullNameLine, "name") || extractAfterLabel(fullNameLine, "full name");
    if (fullName) {
      data.full_name = fullName;
      console.log("Extracted full name:", data.full_name);
      
      // Try to split full name into components if we don't already have surname/given name
      if (!data.surname && !data.given_names && fullName.includes(' ')) {
        const nameParts = fullName.split(' ');
        if (nameParts.length > 1) {
          // Western name format: Given name(s) followed by surname
          data.given_names = nameParts[0];
          data.surname = nameParts.slice(1).join(' ');
        }
      }
    }
  }
  
  // Look for surname specifically
  const surnameLine = findLine("surname") || findLine("family name") || findLine("last name");
  if (surnameLine) {
    data.surname = extractAfterLabel(surnameLine, "surname") || 
                  extractAfterLabel(surnameLine, "family name") ||
                  extractAfterLabel(surnameLine, "last name");
    console.log("Extracted surname:", data.surname);
  }
  
  // Look for given name specifically
  const givenNameLine = findLine("given name") || findLine("first name");
  if (givenNameLine) {
    data.given_names = extractAfterLabel(givenNameLine, "given name") ||
                      extractAfterLabel(givenNameLine, "first name");
    console.log("Extracted given names:", data.given_names);
  }
  
  // If we have surname and given name but no full name, construct it
  if (!data.full_name && data.surname && data.given_names) {
    data.full_name = `${data.given_names} ${data.surname}`;
    console.log("Constructed full name:", data.full_name);
  }
  
  // Extract nationality - try multiple variations and combinations
  const nationalityLines = findLines("national").concat(findLines("citizenship"));
  
  for (const nationalityLine of nationalityLines) {
    const nationality = extractAfterLabel(nationalityLine, "national") ||
                       extractAfterLabel(nationalityLine, "citizenship") ||
                       extractAfterLabel(nationalityLine, "nationality");
                       
    if (nationality) {
      data.nationality = nationality;
      console.log("Extracted nationality:", data.nationality);
      break;
    }
  }
  
  // Extract date of birth - try multiple variations
  const dobLines = findLines("birth").concat(findLines("born")).filter(line => 
    line.toLowerCase().includes('date') || 
    line.toLowerCase().includes('birth') || 
    /\d{1,2}[\-\.\/]\d{1,2}[\-\.\/]\d{2,4}/.test(line)
  );
  
  for (const dobLine of dobLines) {
    const dobRaw = extractAfterLabel(dobLine, "birth") ||
                  extractAfterLabel(dobLine, "born") ||
                  extractAfterLabel(dobLine, "date of birth");
    
    if (dobRaw) {
      data.date_of_birth = normalizeDate(dobRaw);
      console.log("Extracted date of birth:", dobRaw, "->", data.date_of_birth);
      break;
    } else {
      // Try to extract date directly from line
      const dateMatch = dobLine.match(/(\d{1,2})[\-\.\/](\d{1,2}|[A-Za-z]{3})[\-\.\/](\d{2,4})/);
      if (dateMatch) {
        const extractedDate = normalizeDate(dateMatch[0]);
        if (extractedDate) {
          data.date_of_birth = extractedDate;
          console.log("Extracted DOB from direct match:", dateMatch[0], "->", data.date_of_birth);
          break;
        }
      }
    }
  }
  
  // Extract gender - try various formats and keywords
  const genderLines = findLines("sex").concat(findLines("gender"));
  
  for (const genderLine of genderLines) {
    const genderRaw = extractAfterLabel(genderLine, "sex") ||
                     extractAfterLabel(genderLine, "gender");
    
    if (genderRaw) {
      // Normalize gender value
      const normalizedGender = genderRaw.trim().toUpperCase();
      if (normalizedGender.startsWith('M')) {
        data.gender = 'Male';
        console.log("Extracted gender:", data.gender);
        break;
      } else if (normalizedGender.startsWith('F')) {
        data.gender = 'Female';
        console.log("Extracted gender:", data.gender);
        break;
      } else {
        data.gender = normalizedGender;
        console.log("Extracted gender (other):", data.gender);
        break;
      }
    }
  }
  
  // Extract passport expiry date - try multiple variations
  const expiryLines = findLines("expiry").concat(findLines("expiration")).concat(findLines("valid until"));
  
  for (const expiryLine of expiryLines) {
    const expiryRaw = extractAfterLabel(expiryLine, "expiry") ||
                     extractAfterLabel(expiryLine, "expiration") ||
                     extractAfterLabel(expiryLine, "date of expiry") ||
                     extractAfterLabel(expiryLine, "valid until");
    
    if (expiryRaw) {
      data.passport_expiry_date = normalizeDate(expiryRaw);
      console.log("Extracted passport expiry date:", expiryRaw, "->", data.passport_expiry_date);
      break;
    } else {
      // Try to extract date directly from line
      const dateMatch = expiryLine.match(/(\d{1,2})[\-\.\/](\d{1,2}|[A-Za-z]{3})[\-\.\/](\d{2,4})/);
      if (dateMatch) {
        const extractedDate = normalizeDate(dateMatch[0]);
        if (extractedDate) {
          data.passport_expiry_date = extractedDate;
          console.log("Extracted expiry from direct match:", dateMatch[0], "->", data.passport_expiry_date);
          break;
        }
      }
    }
  }
  
  // Extract issue date - try multiple variations
  const issueLines = findLines("issue").filter(line => !line.toLowerCase().includes("authority"));
  
  for (const issueLine of issueLines) {
    const issueRaw = extractAfterLabel(issueLine, "issue") ||
                    extractAfterLabel(issueLine, "date of issue");
    
    if (issueRaw) {
      data.issue_date = normalizeDate(issueRaw);
      console.log("Extracted issue date:", issueRaw, "->", data.issue_date);
      break;
    } else {
      // Try to extract date directly from line
      const dateMatch = issueLine.match(/(\d{1,2})[\-\.\/](\d{1,2}|[A-Za-z]{3})[\-\.\/](\d{2,4})/);
      if (dateMatch) {
        const extractedDate = normalizeDate(dateMatch[0]);
        if (extractedDate) {
          data.issue_date = extractedDate;
          console.log("Extracted issue date from direct match:", dateMatch[0], "->", data.issue_date);
          break;
        }
      }
    }
  }
  
  // Extract place of birth - try multiple variations
  const birthPlaceLines = findLines("place of birth").concat(findLines("born in")).concat(findLines("birth place"));
  
  for (const birthPlaceLine of birthPlaceLines) {
    const birthPlace = extractAfterLabel(birthPlaceLine, "place of birth") ||
                      extractAfterLabel(birthPlaceLine, "born in") ||
                      extractAfterLabel(birthPlaceLine, "birth place");
    
    if (birthPlace) {
      data.place_of_birth = birthPlace;
      console.log("Extracted place of birth:", data.place_of_birth);
      break;
    }
  }
  
  // Extract issuing authority - try multiple variations
  const authorityLines = findLines("authority").concat(findLines("issued by")).concat(findLines("issuing"));
  
  for (const authorityLine of authorityLines) {
    const authority = extractAfterLabel(authorityLine, "authority") ||
                     extractAfterLabel(authorityLine, "issued by") ||
                     extractAfterLabel(authorityLine, "issuing");
    
    if (authority) {
      data.issuing_country = authority;
      console.log("Extracted issuing authority:", data.issuing_country);
      break;
    }
  }
  
  return data;
};

/**
 * Maps country codes to full country names
 * 
 * @param code Three-letter country code
 * @returns Full country name
 */
const mapCountryCode = (code: string | null): string | null => {
  if (!code) return null;
  
  const countryMap: {[key: string]: string} = {
    'PAK': 'Pakistan',
    'USA': 'United States of America',
    'GBR': 'United Kingdom',
    'CAN': 'Canada',
    'AUS': 'Australia',
    'NZL': 'New Zealand',
    'IND': 'India',
    'CHN': 'China',
    'JPN': 'Japan',
    'DEU': 'Germany',
    'FRA': 'France',
    'ITA': 'Italy',
    'ESP': 'Spain',
    'RUS': 'Russia',
    'BRA': 'Brazil',
    'ZAF': 'South Africa',
    'SAU': 'Saudi Arabia',
    'ARE': 'United Arab Emirates',
    // Add more country codes as needed
  };
  
  return countryMap[code] || code;
};

/**
 * Extracts passport data from OCR text
 * 
 * @param ocrText The raw OCR text from a passport scan
 * @returns Structured passport data
 */
export const extractPassportData = (ocrText: string): PassportData => {
  // Initialize with empty values
  const data: PassportData = {
    full_name: null,
    surname: null,
    given_names: null,
    passport_number: null,
    nationality: null,
    date_of_birth: null,
    gender: null,
    passport_expiry_date: null,
    issue_date: null,
    place_of_birth: null,
    issuing_country: null
  };
  
  // Extract MRZ lines
  const mrzLines = extractMRZLines(ocrText);
  
  // Try to extract data from MRZ
  if (mrzLines.length >= 2) {
    const mrzData = parseMRZ(mrzLines);
    Object.assign(data, mrzData);
  }
  
  // Extract data from visual inspection zone
  const visualData = extractVisualData(ocrText);
  
  // Merge data - prioritize visual data over MRZ for better readability
  // except for structured fields like dates and passport numbers
  
  // For names, prefer visual data over MRZ
  if (visualData.full_name) data.full_name = visualData.full_name;
  if (visualData.surname) data.surname = visualData.surname;
  if (visualData.given_names) data.given_names = visualData.given_names;
  
  // For passport number, nationality and dates, prefer MRZ if available
  if (!data.passport_number && visualData.passport_number) data.passport_number = visualData.passport_number;
  if (!data.nationality && visualData.nationality) data.nationality = visualData.nationality;
  if (!data.date_of_birth && visualData.date_of_birth) data.date_of_birth = visualData.date_of_birth;
  if (!data.passport_expiry_date && visualData.passport_expiry_date) data.passport_expiry_date = visualData.passport_expiry_date;
  
  // For other fields, always use visual data
  data.gender = visualData.gender || data.gender;
  data.issue_date = visualData.issue_date || null;
  data.place_of_birth = visualData.place_of_birth || null;
  data.issuing_country = visualData.issuing_country || data.issuing_country;
  
  // Map country codes to full names
  if (data.nationality) {
    const fullNationality = mapCountryCode(data.nationality);
    if (fullNationality) {
      data.nationality = fullNationality;
    }
  }
  
  if (data.issuing_country) {
    const fullCountry = mapCountryCode(data.issuing_country);
    if (fullCountry) {
      data.issuing_country = fullCountry;
    }
  }
  
  return data;
};

/**
 * Process OCR text and return structured passport data as JSON string
 * 
 * @param ocrText The raw OCR text from a passport scan
 * @returns JSON string of structured passport data
 */
export const processPassportOCR = (ocrText: string): string => {
  const data = extractPassportData(ocrText);
  return JSON.stringify(data, null, 2);
};

// Export the interface and functions
export type { PassportData };
export default processPassportOCR;
