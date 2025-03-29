export interface User {
  id: string;
  email: string;
  full_name: string;
  nationality: string;
  residency: string;
  created_at: string;
  subscription_tier: 'free' | 'monthly' | 'lifetime';
  stripe_customer_id?: string;
}

export interface UserProfile extends User {
  travel_score?: number;
  visa_free_countries?: number;
  travel_history_count?: number;
} 