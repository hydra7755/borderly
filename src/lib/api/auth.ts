import { User, Session, AuthError } from '@supabase/supabase-js';
import supabase from '../supabase/client';

// Define mock types if needed, ensuring they align with User/Session structure
type MockUser = User; // Use the actual User type for consistency
type MockSession = Session; // Use the actual Session type

/**
 * Auth service for handling authentication with Supabase
 */
const authService = {
  /**
   * Sign up a new user
   * @param email - User's email
   * @param password - User's password
   * @param userData - Additional user data
   * @returns Promise with the user data or error
   */
  async signUp(email: string, password: string, userData: { 
    full_name: string;
    nationality?: string;
    residency?: string;
  }): Promise<{ user: User | null; session: Session | null; error: AuthError | null }> {
    try {
      // Mock sign-up for development
      if (import.meta.env.DEV && typeof (supabase.auth as any).signUp !== 'function') {
        console.warn("DEV MODE: Mock sign-up");
        const mockUser: User = {
          id: `mock-signup-${Date.now()}`,
          email: email,
          app_metadata: { provider: 'email' }, 
          user_metadata: { full_name: userData.full_name },
          aud: 'authenticated', 
          created_at: new Date().toISOString(),
          // Add potentially missing optional fields if necessary
          phone: undefined, 
          updated_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(), // Assume confirmed in mock
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated'
        };
        const mockSession: Session = {
          access_token: 'mock-signup-token', 
          refresh_token: 'mock-signup-refresh', 
          expires_in: 3600, 
          token_type: 'bearer',
          user: mockUser,
          // Add potentially missing optional fields
          provider_token: null,
          provider_refresh_token: null,
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };
        return { user: mockUser, session: mockSession, error: null };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            nationality: userData.nationality,
            residency: userData.residency,
          }
        }
      });

      return { user: data.user, session: data.session, error };
    } catch (error) {
      console.error("Unexpected signup error:", error);
      return { user: null, session: null, error: error as AuthError };
    }
  },

  /**
   * Sign in an existing user
   * @param email - User's email
   * @param password - User's password
   * @returns Promise with the user data or error
   */
  async signIn(email: string, password: string): Promise<{ 
    user: User | null; 
    session: Session | null; 
    error: AuthError | null 
  }> {
    try {
      // Simulate sign-in for mock environment
      if (import.meta.env.DEV && typeof (supabase.auth as any).signInWithPassword !== 'function') {
        console.warn("DEV MODE: Mock sign-in");
        const mockUser: User = {
          id: 'mock-signin-user',
          email: email,
          app_metadata: {}, user_metadata: { full_name: 'Mock User' },
          aud: 'authenticated', created_at: new Date().toISOString(),
          // Fill in other required/optional fields from User type
          phone: undefined,
          updated_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated'
        };
        const mockSession: Session = {
          access_token: 'mock-token', refresh_token: 'mock-refresh', 
          expires_in: 3600, token_type: 'bearer',
          user: mockUser,
          provider_token: null,
          provider_refresh_token: null,
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };
        return { user: mockUser, session: mockSession, error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { user: data?.user ?? null, session: data?.session ?? null, error };
    } catch (err) {
      console.error("Unexpected sign-in error:", err);
      return { user: null, session: null, error: err as AuthError };
    }
  },

  /**
   * Sign in with Google OAuth
   * @returns Promise with the user data or error
   */
  async signInWithGoogle(): Promise<{ 
    user: User | null; 
    session: Session | null; 
    error: AuthError | null 
  }> {
    try {
      console.log("Starting Google OAuth sign-in process");
      const currentUrl = window.location.origin;
      // Make sure the redirect URL is properly formed - must end with /auth/callback
      const redirectUrl = currentUrl.endsWith('/') 
        ? `${currentUrl}auth/callback` 
        : `${currentUrl}/auth/callback`;
        
      console.log(`Redirect URL set to: ${redirectUrl}`);
      
      // Check if we're in development mode and using mock client
      const isDevelopmentEnv = import.meta.env.DEV;
      // Check if the function exists on the actual auth object (might be missing on mock)
      const usingMockClient = typeof (supabase.auth as any).signInWithOAuth !== 'function' || !supabase.auth.signInWithPassword; 
      
      if (isDevelopmentEnv && usingMockClient) {
        console.warn("DEVELOPMENT MODE: Using mock Supabase client. Real Google OAuth redirect is skipped.");
        console.log(`Mock Client: Would normally redirect to Google and then back to: ${redirectUrl}`);
        
        // Simulate ONLY the expected return value if the call were made, NOT the redirect.
        // The actual sign-in state management should happen after the mock callback.
        return { 
          user: null, // OAuth redirects, no immediate user/session return
          session: null, 
          error: null 
        }; 
      }
      
      // In production or when using real client, use the real Supabase OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account', // Forces user to select an account
            access_type: 'offline' // Get a refresh token too
          }
        }
      });

      if (error) {
        console.error("Google sign in error:", error);
        return { user: null, session: null, error };
      }

      console.log("OAuth sign-in initialized successfully", data);
      // Since OAuth redirects the user, we won't actually reach this point
      // The user will be redirected to Google for authentication
      return { 
        user: null, 
        session: null, 
        error: null 
      };
    } catch (error) {
      console.error("Unexpected error during Google sign in:", error);
      return { 
        user: null, 
        session: null, 
        error: error as AuthError 
      };
    }
  },

  /**
   * Sign out the current user
   * @returns Promise with success status
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      // Clear mock user on sign out
      if (import.meta.env.DEV && typeof (supabase.auth as any).signOut !== 'function') {
         console.warn("DEV MODE: Mock sign-out");
         saveMockUser(null);
      }
      return { error };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error: error as AuthError };
    }
  },

  /**
   * Get the current user session
   * @returns Promise with the current session
   */
  async getCurrentSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      // Handle mock session for development
      if (import.meta.env.DEV && typeof (supabase.auth as any).getSession !== 'function') {
        console.warn("DEV MODE: Mock getSession");
        const mockStoredUser = getCurrentMockUser(); // Check local storage
        if (!mockStoredUser) return { session: null, error: null };
        
        // Reconstruct mock session if user exists
        const mockUser: User = mockStoredUser as User;
        const mockSession: Session = {
          access_token: 'mock-session-token', refresh_token: 'mock-refresh-token',
          expires_in: 3600, token_type: 'bearer',
          user: mockUser,
          provider_token: null,
          provider_refresh_token: null,
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };
        return { session: mockSession, error: null };
      }

      const { data, error } = await supabase.auth.getSession();
      return { session: data?.session ?? null, error: error ?? null };
    } catch (error) {
      console.error("Get session error:", error);
      return { session: null, error: error as AuthError };
    }
  },

  /**
   * Get the current user data
   * @returns Promise with the current user
   */
  async getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      // Handle mock user for development
      if (import.meta.env.DEV && typeof (supabase.auth as any).getUser !== 'function') {
        console.warn("DEV MODE: Mock getCurrentUser");
        const mockStoredUser = getCurrentMockUser();
        return { user: mockStoredUser ? (mockStoredUser as User) : null, error: null };
      }

      const { data, error } = await supabase.auth.getUser();
      return { user: data?.user ?? null, error: error ?? null };
    } catch (error) {
      console.error("Get user error:", error);
      return { user: null, error: error as AuthError };
    }
  },

  /**
   * Update the current user's profile data
   * @param data - User profile data to update
   * @returns Promise with the updated user
   */
  async updateProfile(userId: string, data: any): Promise<{ error: Error | null }> {
    try {
      // Update the auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: data // Update user_metadata in auth schema
      });

      if (authError) {
        console.error("Error updating auth user data:", authError);
        return { error: authError };
      }

      // Update the profile in the public profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update(data) // Assuming 'data' contains fields for the profiles table
        .eq('id', userId)
        .select() // Add select to potentially get error details better
        .single(); // Use single if expecting one row update result

      if (profileError) {
        console.error("Error updating profile data:", profileError);
        return { error: profileError as Error }; 
      }

      return { error: null };
    } catch (error) {
      console.error("Profile update error:", error);
      return { error: error as Error };
    }
  },

  /**
   * Initiate password reset for a user
   * @param email - User's email address
   * @returns Promise indicating success or failure
   */
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const currentUrl = window.location.origin;
      // Ensure the redirect URL points to your intended password reset page
      const redirectUrl = `${currentUrl}/update-password`; // Or your chosen path
      
      console.log(`Initiating password reset for ${email}, redirecting to: ${redirectUrl}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Password reset initiation error:", error);
      }
      
      return { error };
    } catch (error) {
      console.error("Unexpected error during password reset initiation:", error);
      return { error: error as AuthError };
    }
  }
};

// Moved mock helper functions outside the service object
const MOCK_USER_KEY = 'travelscore_mock_user';

const getCurrentMockUser = (): MockUser | null => {
  const storedUser = localStorage.getItem(MOCK_USER_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
};

const saveMockUser = (user: User | MockUser | null) => { 
  if (user) {
    // Ensure we save the full user object
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(MOCK_USER_KEY);
  }
};

export default authService; 