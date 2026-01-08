/**
 * Indian Pincode Validation and Location Service
 * Uses India Post API for accurate pincode validation and location data
 */

export interface PincodeData {
  pincode: string;
  city: string;
  state: string;
  district: string;
  region: string;
  country: string;
}

export interface PincodeValidationResult {
  isValid: boolean;
  data?: PincodeData;
  error?: string;
}

export interface PincodeMatchResult {
  isValid: boolean;
  matches: boolean;
  data?: PincodeData;
  error?: string;
  cityMatch?: boolean;
  stateMatch?: boolean;
}

class PincodeService {
  private cache = new Map<string, PincodeData>();
  private readonly API_BASE = 'https://api.postalpincode.in/pincode';

  /**
   * Validate pincode and get location data
   */
  async validatePincode(pincode: string): Promise<PincodeValidationResult> {
    // Basic format validation
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return {
        isValid: false,
        error: 'Please enter a valid 6-digit pincode'
      };
    }

    // Check cache first
    if (this.cache.has(pincode)) {
      return {
        isValid: true,
        data: this.cache.get(pincode)!
      };
    }

    try {
      const response = await fetch(`${this.API_BASE}/${pincode}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network error');
      }

      const result = await response.json();

      // API returns array with status
      if (!result || !Array.isArray(result) || result.length === 0) {
        return {
          isValid: false,
          error: 'Invalid pincode'
        };
      }

      const apiData = result[0];
      
      if (apiData.Status !== 'Success' || !apiData.PostOffice || apiData.PostOffice.length === 0) {
        return {
          isValid: false,
          error: 'Pincode not found'
        };
      }

      // Get the first post office data (usually the main one)
      const postOffice = apiData.PostOffice[0];
      
      const pincodeData: PincodeData = {
        pincode: pincode,
        city: postOffice.Name || postOffice.District,
        state: postOffice.State,
        district: postOffice.District,
        region: postOffice.Region,
        country: postOffice.Country || 'India'
      };

      // Cache the result
      this.cache.set(pincode, pincodeData);

      return {
        isValid: true,
        data: pincodeData
      };

    } catch (error) {
      console.error('Pincode validation error:', error);
      return {
        isValid: false,
        error: 'Unable to validate pincode. Please check your internet connection.'
      };
    }
  }

  /**
   * Validate if user-entered city and state match the pincode
   */
  async validateCityStateWithPincode(
    pincode: string, 
    userCity: string, 
    userState: string
  ): Promise<PincodeMatchResult> {
    // First validate the pincode
    const pincodeResult = await this.validatePincode(pincode);
    
    if (!pincodeResult.isValid || !pincodeResult.data) {
      return {
        isValid: false,
        matches: false,
        error: pincodeResult.error || 'Invalid pincode'
      };
    }

    const pincodeData = pincodeResult.data;
    
    // Normalize strings for comparison (remove extra spaces, convert to lowercase)
    const normalizeString = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');
    
    const normalizedUserCity = normalizeString(userCity);
    const normalizedUserState = normalizeString(userState);
    const normalizedPincodeCity = normalizeString(pincodeData.city);
    const normalizedPincodeState = normalizeString(pincodeData.state);
    const normalizedPincodeDistrict = normalizeString(pincodeData.district);
    
    // State matching - must be exact
    const stateMatch = normalizedUserState === normalizedPincodeState;
    
    // City matching - more strict approach
    const cityMatch = this.validateCityMatch(
      normalizedUserCity, 
      normalizedPincodeCity, 
      normalizedPincodeDistrict
    );
    
    return {
      isValid: true,
      matches: cityMatch && stateMatch,
      data: pincodeData,
      cityMatch,
      stateMatch,
      error: !cityMatch || !stateMatch ? this.generateMismatchError(
        userCity, userState, pincodeData, cityMatch, stateMatch
      ) : undefined
    };
  }

  /**
   * Validate city match with stricter rules
   */
  private validateCityMatch(
    userCity: string, 
    pincodeCity: string, 
    pincodeDistrict: string
  ): boolean {
    // Exact match
    if (userCity === pincodeCity || userCity === pincodeDistrict) {
      return true;
    }

    // Check if user entered a reasonable length (at least 3 characters)
    if (userCity.length < 3) {
      return false;
    }

    // Allow match if user city is at least 70% of the actual city name length
    // and the actual city name starts with user input
    const minLength = Math.max(3, Math.floor(pincodeCity.length * 0.7));
    if (userCity.length >= minLength && pincodeCity.startsWith(userCity)) {
      return true;
    }

    // Same check for district name
    const minDistrictLength = Math.max(3, Math.floor(pincodeDistrict.length * 0.7));
    if (userCity.length >= minDistrictLength && pincodeDistrict.startsWith(userCity)) {
      return true;
    }

    // Check for common abbreviations and variations
    const cityVariations = this.getCityVariations(pincodeCity);
    const districtVariations = this.getCityVariations(pincodeDistrict);
    
    return cityVariations.includes(userCity) || districtVariations.includes(userCity);
  }

  /**
   * Get common variations/abbreviations for a city name
   */
  private getCityVariations(cityName: string): string[] {
    const variations: string[] = [cityName];
    
    // Common city name patterns and abbreviations
    const commonReplacements: { [key: string]: string[] } = {
      'bangalore': ['bengaluru', 'blr'],
      'bengaluru': ['bangalore', 'blr'],
      'mumbai': ['bombay'],
      'bombay': ['mumbai'],
      'kolkata': ['calcutta'],
      'calcutta': ['kolkata'],
      'chennai': ['madras'],
      'madras': ['chennai'],
      'thiruvananthapuram': ['trivandrum'],
      'trivandrum': ['thiruvananthapuram'],
      'kochi': ['cochin'],
      'cochin': ['kochi'],
      'pune': ['poona'],
      'poona': ['pune'],
      'vadodara': ['baroda'],
      'baroda': ['vadodara'],
      'mysuru': ['mysore'],
      'mysore': ['mysuru'],
      'hubballi': ['hubli'],
      'hubli': ['hubballi'],
      'belagavi': ['belgaum'],
      'belgaum': ['belagavi'],
      'vijayawada': ['bezawada'],
      'bezawada': ['vijayawada'],
      'visakhapatnam': ['vizag', 'vishakhapatnam'],
      'vizag': ['visakhapatnam'],
      'vishakhapatnam': ['visakhapatnam', 'vizag']
    };

    const lowerCityName = cityName.toLowerCase();
    if (commonReplacements[lowerCityName]) {
      variations.push(...commonReplacements[lowerCityName]);
    }

    // Add variations without common suffixes
    const suffixesToRemove = ['city', 'town', 'nagar', 'pur', 'puram', 'bad', 'abad'];
    suffixesToRemove.forEach(suffix => {
      if (lowerCityName.endsWith(suffix)) {
        const withoutSuffix = lowerCityName.slice(0, -suffix.length).trim();
        if (withoutSuffix.length >= 3) {
          variations.push(withoutSuffix);
        }
      }
    });

    return variations;
  }

  /**
   * Generate appropriate error message for city/state mismatch
   */
  private generateMismatchError(
    userCity: string,
    userState: string,
    pincodeData: PincodeData,
    cityMatch: boolean,
    stateMatch: boolean
  ): string {
    if (!cityMatch && !stateMatch) {
      return `Pincode ${pincodeData.pincode} belongs to ${pincodeData.city}, ${pincodeData.state}. Please enter the correct city and state.`;
    } else if (!cityMatch) {
      const suggestions = [pincodeData.city];
      if (pincodeData.district !== pincodeData.city) {
        suggestions.push(pincodeData.district);
      }
      const suggestionText = suggestions.length > 1 
        ? `${suggestions[0]} or ${suggestions[1]}` 
        : suggestions[0];
      return `Pincode ${pincodeData.pincode} belongs to ${suggestionText}. Please enter the complete city name.`;
    } else if (!stateMatch) {
      return `Pincode ${pincodeData.pincode} belongs to ${pincodeData.state}, not ${userState}. Please select the correct state.`;
    }
    return '';
  }

  /**
   * Get cached pincode data if available
   */
  getCachedData(pincode: string): PincodeData | null {
    return this.cache.get(pincode) || null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Validate multiple pincodes at once
   */
  async validateMultiplePincodes(pincodes: string[]): Promise<Map<string, PincodeValidationResult>> {
    const results = new Map<string, PincodeValidationResult>();
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < pincodes.length; i += batchSize) {
      const batch = pincodes.slice(i, i + batchSize);
      const batchPromises = batch.map(async (pincode) => {
        const result = await this.validatePincode(pincode);
        return { pincode, result };
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ pincode, result }) => {
        results.set(pincode, result);
      });

      // Small delay between batches to be respectful to the API
      if (i + batchSize < pincodes.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}

// Export singleton instance
export const pincodeService = new PincodeService();

// Export utility functions
export const validatePincode = (pincode: string) => pincodeService.validatePincode(pincode);
export const validateCityStateWithPincode = (pincode: string, city: string, state: string) => 
  pincodeService.validateCityStateWithPincode(pincode, city, state);
export const getCachedPincodeData = (pincode: string) => pincodeService.getCachedData(pincode);