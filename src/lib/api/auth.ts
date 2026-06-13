import { User } from '../../types/user';
import { Session } from '../../types/auth';
import { AuthError } from '@supabase/supabase-js';
import supabase from '../supabase/client';

// Define mock types if needed, ensuring they align with User/Session structure
type MockUser = User;
type MockSession = Session;

// Helper function to convert Supabase session to our custom Session type
const convertSupabaseSession = (supabaseSession: any): Session | null => {
  if (!supabaseSession) return null;
  
  const user = convertSupabaseUser(supabaseSession.user);
  
  if (!user) return null;
  
  return {
    access_token: supabaseSession.access_token,
    refresh_token: supabaseSession.refresh_token || '',
    expires_in: supabaseSession.expires_in || 3600,
    expires_at: supabaseSession.expires_at || Math.floor(Date.now() / 1000) + 3600,
    token_type: supabaseSession.token_type || 'bearer',
    user: user,
    provider_token: supabaseSession.provider_token,
    provider_refresh_token: supabaseSession.provider_refresh_token
  };
};

// Helper function to convert Supabase user to our custom User type
const convertSupabaseUser = (supabaseUser: any): User | null => {
  if (!supabaseUser) return null;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    full_name: supabaseUser.user_metadata?.full_name || '',
    nationality: supabaseUser.user_metadata?.nationality || '',
    residency: supabaseUser.user_metadata?.residency || '',
    created_at: supabaseUser.created_at || new Date().toISOString(),
    subscription_tier: supabaseUser.user_metadata?.subscription_tier || 'free',
    app_metadata: supabaseUser.app_metadata || {},
    user_metadata: supabaseUser.user_metadata || {},
    aud: supabaseUser.aud || ''
  };
};

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
    nationality: string;
    residency: string;
  }): Promise<{ 
    user: User | null; 
    session: Session | null; 
    error: AuthError | null 
  }> {
    try {
      // Always use mock implementation in development mode
      if (import.meta.env.DEV) {
        console.log("DEV MODE: Using mock signup implementation");
        const mockUser: User = {
          id: 'mock-user-id-' + Date.now(),
          email: email,
          full_name: userData.full_name,
          nationality: userData.nationality,
          residency: userData.residency,
          created_at: new Date().toISOString(),
          subscription_tier: 'free',
          app_metadata: {},
          user_metadata: userData,
          aud: 'authenticated'
        };
        const mockSession: Session = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser,
          provider_token: null,
          provider_refresh_token: null,
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };
        
        // Store in localStorage to persist the session
        localStorage.setItem('travelscore_user', JSON.stringify(mockUser));
        localStorage.setItem('travelscore_session', JSON.stringify(mockSession));
        
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

      // Transform data.user to match our User type
      const user = data.user ? convertSupabaseUser(data.user) : null;
      const session = convertSupabaseSession(data.session);

      return { user, session, error };
    } catch (error) {
      console.error("Unexpected signup error:", error);
      const message = error instanceof TypeError && error.message === 'Failed to fetch'
        ? 'Unable to reach the authentication server. Check that Supabase is configured and your project is active.'
        : error instanceof Error
          ? error.message
          : 'An unexpected error occurred during signup.';
      return {
        user: null,
        session: null,
        error: { message, name: 'AuthApiError', status: 503 } as AuthError,
      };
    }
  },

  /**
   * Sign in a user with email and password
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
      // Always use mock implementation in development mode
      if (import.meta.env.DEV) {
        console.log("DEV MODE: Using mock signin implementation");
        
        // Create a mock user with basic data
        const mockUser: User = {
          id: 'mock-user-id-' + Date.now(),
          email: email,
          full_name: 'Mock User',
          nationality: 'US',
          residency: 'US',
          created_at: new Date().toISOString(),
          subscription_tier: 'free',
          app_metadata: {},
          user_metadata: { full_name: 'Mock User' },
          aud: 'authenticated'
        };
        
        const mockSession: Session = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUser,
          provider_token: null,
          provider_refresh_token: null,
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };
        
        // Store in localStorage to persist the session
        localStorage.setItem('travelscore_user', JSON.stringify(mockUser));
        localStorage.setItem('travelscore_session', JSON.stringify(mockSession));
        
        return { user: mockUser, session: mockSession, error: null };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Convert types to our custom types
      const user = data?.user ? convertSupabaseUser(data.user) : null;
      const session = convertSupabaseSession(data?.session);
      
      return { user, session, error };
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
   * Sign in with Apple OAuth
   * @returns Promise with the user data or error
   */
  async signInWithApple(): Promise<{ 
    user: User | null; 
    session: Session | null; 
    error: AuthError | null 
  }> {
    try {
      console.log("Starting Apple OAuth sign-in process");
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
        console.warn("DEVELOPMENT MODE: Using mock Supabase client. Real Apple OAuth redirect is skipped.");
        console.log(`Mock Client: Would normally redirect to Apple and then back to: ${redirectUrl}`);
        
        // Simulate ONLY the expected return value if the call were made, NOT the redirect.
        return { 
          user: null, // OAuth redirects, no immediate user/session return
          session: null, 
          error: null 
        }; 
      }
      
      // In production or when using real client, use the real Supabase OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          // Apple specific options can be added here if needed
          scopes: 'name email', // Request name and email from Apple
        }
      });

      if (error) {
        console.error("Apple sign in error:", error);
        return { user: null, session: null, error };
      }

      console.log("Apple OAuth sign-in initialized successfully", data);
      // Since OAuth redirects the user, we won't actually reach this point
      // The user will be redirected to Apple for authentication
      return { 
        user: null, 
        session: null, 
        error: null 
      };
    } catch (error) {
      console.error("Unexpected error during Apple sign in:", error);
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
   * Get the current session
   * @returns Promise with the session data or error
   */
  async getSession(): Promise<{
    session: Session | null;
    error: AuthError | null;
  }> {
    try {
      // Always use mock implementation in development mode
      if (import.meta.env.DEV) {
        console.log("DEV MODE: Using mock getSession implementation");
        
        // Try to get session from localStorage
        const storedSession = localStorage.getItem('travelscore_session');
        const storedUser = localStorage.getItem('travelscore_user');
        
        if (storedSession && storedUser) {
          const mockSession = JSON.parse(storedSession);
          return { session: mockSession, error: null };
        }
        
        // If no stored session, return null
        return { session: null, error: null };
      }
      
      const { data, error } = await supabase.auth.getSession();
      const session = convertSupabaseSession(data?.session);
      return { session, error: error ?? null };
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
        const mockUser = getCurrentMockUser();
        return { user: mockUser, error: null };
      }

      const { data, error } = await supabase.auth.getUser();
      const user = data?.user ? convertSupabaseUser(data.user) : null;
      
      return { user, error };
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