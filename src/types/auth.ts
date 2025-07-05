import { User } from './user';

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: User;
  provider_token: string | null;
  provider_refresh_token: string | null;
} 