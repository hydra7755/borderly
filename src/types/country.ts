export interface Country {
  id: string;
  name: string;
  code: string; // ISO country code
  region: string;
  passport_strength: number; // 0-100 score
  visa_free_count: number;
  flag_url?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface SavedDestination {
  id: string;
  user_id: string;
  country_id: string;
  saved_date: string;
  notes?: string;
  country?: Country;
} 