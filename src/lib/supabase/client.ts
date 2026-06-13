import { createClient } from '@supabase/supabase-js';

// Define environment variables type
interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Singleton instance
let supabaseInstance: any = null;

/**
 * Get Supabase client - implements singleton pattern to prevent multiple instances
 */
const getEnvVar = (key: string, fallback: string = ''): string => {
  const windowEnv = (window as any)?._env_?.[key];
  if (windowEnv) return windowEnv;

  const viteEnv = import.meta.env[key];
  if (viteEnv) return viteEnv;

  const altKey = key.replace('VITE_', 'REACT_APP_');
  const altEnv = (window as any)?._env_?.[altKey];
  if (altEnv) return altEnv;

  return fallback;
};

const getSupabaseClient = () => {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', '');
  const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');

  // Clean the keys in case there are newlines or extra spaces
  const cleanedSupabaseUrl = supabaseUrl.trim();
  const cleanedSupabaseAnonKey = supabaseAnonKey.trim().replace(/\r?\n|\r/g, '');

  // Log connection details for debugging
  console.log('🔧 Supabase Configuration:');
  console.log('URL:', cleanedSupabaseUrl);
  console.log('Key Length:', cleanedSupabaseAnonKey.length);

  // Check if we have valid Supabase configuration
  const hasValidConfig = cleanedSupabaseUrl && cleanedSupabaseAnonKey;

  if (!hasValidConfig) {
    console.error("🚫 CRITICAL ERROR: Missing Supabase configuration!");
    console.error("Using mock client for development");
    
    // Create a basic mock client for development
    supabaseInstance = createMockClient();
    return supabaseInstance;
  }

  console.log("[SupabaseClient] Creating REAL client with URL:", cleanedSupabaseUrl.substring(0, 30) + "...");
  try {
    // Create the real Supabase client with enhanced auth options
    supabaseInstance = createClient(cleanedSupabaseUrl, cleanedSupabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });
    
    console.log("✅ Supabase client created successfully");
  } catch (error) {
    console.error("Failed to create Supabase client:", error);
    console.warn("Falling back to mock client");
    supabaseInstance = createMockClient();
  }

  return supabaseInstance;
};

// Create a mock client for when Supabase is not configured
const createMockClient = () => {
  console.warn("⚠️ USING MOCK SUPABASE CLIENT - authentication will be simulated ⚠️");
  
  const mockData: { [key: string]: { [id: string]: any } } = {
    profiles: {},
    users: {}
  };
  
  // Load any existing data from localStorage
  const localStorageKey = 'travelscore_mock_db';
  const savedData = localStorage.getItem(localStorageKey);
  if (savedData) {
    try {
      Object.assign(mockData, JSON.parse(savedData));
    } catch (e) {
      console.error("Error loading mock data from localStorage:", e);
    }
  }
  
  // Save data to localStorage
  const saveData = () => {
    localStorage.setItem(localStorageKey, JSON.stringify(mockData));
  };

  // Mock client implementation
  return {
    auth: {
      signUp: async ({ email, password, options = {} }: { email: string; password: string; options?: any }) => {
        console.log("MOCK: Sign up", { email, options });
        
        // Check if user already exists
        const existingUser = Object.values(mockData.users).find((u: any) => u.email === email);
        if (existingUser) {
          return { 
            data: { user: null, session: null }, 
            error: { message: "User already exists", status: 400 } 
          };
        }
        
        // Create new user
        const userId = `mock-user-${Date.now()}`;
        const user = {
          id: userId,
          email,
          created_at: new Date().toISOString(),
          user_metadata: options?.data || {},
          app_metadata: {},
          aud: "authenticated"
        };
        
        // Store user
        mockData.users[userId] = user;
        
        // Create profile
        mockData.profiles[userId] = {
          id: userId,
          user_id: userId,
          full_name: options?.data?.full_name || "",
          nationality: options?.data?.nationality || "",
          residency: options?.data?.residency || "",
          created_at: new Date().toISOString(),
          subscription_tier: "free"
        };
        
        saveData();
        
        // Return success
        return {
          data: {
            user,
            session: {
              access_token: `mock-token-${userId}`,
              refresh_token: `mock-refresh-${userId}`,
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: "bearer",
              user
            }
          },
          error: null
        };
      },
      
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        console.log("MOCK: Sign in with password", { email });
        
        // Find user
        const user = Object.values(mockData.users).find((u: any) => u.email === email);
        if (!user) {
          return { 
            data: { user: null, session: null }, 
            error: { message: "Invalid login credentials", status: 400 } 
          };
        }
        
        // Return success
        return {
          data: {
            user,
            session: {
              access_token: `mock-token-${user.id}`,
              refresh_token: `mock-refresh-${user.id}`,
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: "bearer",
              user
            }
          },
          error: null
        };
      },
      
      signOut: async () => {
        console.log("MOCK: Sign out");
        return { error: null };
      },
      
      getSession: async () => {
        const stored = localStorage.getItem('travelscore_session');
        if (stored) {
          try {
            const session = JSON.parse(stored);
            return { data: { session }, error: null };
          } catch {
            // fall through
          }
        }
        return { data: { session: null }, error: null };
      },

      getUser: async () => {
        const stored = localStorage.getItem('travelscore_user');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            return { data: { user }, error: null };
          } catch {
            // fall through
          }
        }
        return { data: { user: null }, error: null };
      },
      
      onAuthStateChange: (callback: any) => {
        console.log("MOCK: Auth state change listener registered");
        return { data: { subscription: { unsubscribe: () => {} } }, error: null };
      },
      
      // Add other auth methods as needed
      signInWithOAuth: async (params: any) => {
        console.log("MOCK: Sign in with OAuth", params);
        return { error: { message: "OAuth not supported in mock mode", status: 400 } };
      }
    },
    from: (table: string) => {
      type Filter = { field: string; value: any };

      const applyFilters = (items: any[], filters: Filter[]) =>
        filters.reduce(
          (rows, { field, value }) => rows.filter((item) => item[field] === value),
          items
        );

      const buildSelectQuery = (filters: Filter[] = []) => {
        const query: any = {
          eq: (field: string, value: any) => buildSelectQuery([...filters, { field, value }]),
          order: (field: string, options: { ascending?: boolean } = {}) => {
            const ascending = options.ascending !== false;
            const run = async () => {
              const items = Object.values(mockData[table] || {});
              const filtered = applyFilters(items, filters);
              filtered.sort((a: any, b: any) => {
                const av = a[field];
                const bv = b[field];
                if (av === bv) return 0;
                return ascending ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
              });
              return { data: filtered, error: null };
            };
            return { then: (resolve: any, reject?: any) => run().then(resolve, reject) };
          },
          single: async () => {
            const items = Object.values(mockData[table] || {});
            const filtered = applyFilters(items, filters);
            return { data: filtered[0] ?? null, error: null };
          },
          maybeSingle: async () => {
            const items = Object.values(mockData[table] || {});
            const filtered = applyFilters(items, filters);
            return { data: filtered[0] ?? null, error: null };
          },
          then: (resolve: any, reject?: any) => {
            const items = Object.values(mockData[table] || {});
            const filtered = applyFilters(items, filters);
            return Promise.resolve({ data: filtered, error: null }).then(resolve, reject);
          },
        };
        return query;
      };

      const buildMutationQuery = (
        action: 'update' | 'delete',
        payload?: any,
        filters: Filter[] = []
      ) => {
        const run = async () => {
          const items = mockData[table] || {};
          const affected: any[] = [];

          Object.keys(items).forEach((key) => {
            const matches = filters.every(({ field, value }) => items[key][field] === value);
            if (!matches) return;

            if (action === 'update') {
              items[key] = { ...items[key], ...payload };
              affected.push(items[key]);
            } else {
              affected.push(items[key]);
              delete items[key];
            }
          });

          saveData();
          return { data: affected, error: null };
        };

        return {
          eq: (field: string, value: any) =>
            buildMutationQuery(action, payload, [...filters, { field, value }]),
          select: (_columns?: string) => ({
            single: async () => {
              const result = await run();
              return { data: result.data[0] ?? null, error: null };
            },
            then: (resolve: any, reject?: any) => run().then(resolve, reject),
          }),
          then: (resolve: any, reject?: any) => run().then(resolve, reject),
        };
      };

      return {
        select: (_columns?: string) => buildSelectQuery(),
        insert: (data: any) => {
          let savedRows: any[] | null = null;

          const performInsert = () => {
            if (savedRows) return savedRows;
            console.log(`MOCK: Insert into ${table}`, data);
            const rows = Array.isArray(data) ? data : [data];
            savedRows = rows.map((row) => {
              const id = row.id || `mock-${table}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
              if (!mockData[table]) mockData[table] = {};
              mockData[table][id] = {
                ...row,
                id,
                created_at: row.created_at || new Date().toISOString(),
              };
              return mockData[table][id];
            });
            saveData();
            return savedRows;
          };

          return {
            select: (_columns?: string) => ({
              single: async () => ({ data: performInsert()[0], error: null }),
            }),
            then: (resolve: any, reject?: any) =>
              Promise.resolve({ data: performInsert()[0], error: null }).then(resolve, reject),
          };
        },
        upsert: (data: any, _options?: any) => {
          const rows = Array.isArray(data) ? data : [data];
          const saved = rows.map((row) => {
            const id = row.id;
            if (!id) return row;
            if (!mockData[table]) mockData[table] = {};
            mockData[table][id] = { ...mockData[table][id], ...row };
            return mockData[table][id];
          });
          saveData();
          return {
            select: (_columns?: string) => ({
              single: async () => ({ data: saved[0] ?? null, error: null }),
            }),
            then: (resolve: any, reject?: any) =>
              Promise.resolve({ data: saved, error: null }).then(resolve, reject),
          };
        },
        update: (data: any) => buildMutationQuery('update', data),
        delete: () => buildMutationQuery('delete'),
      };
    }
  };
};

// Export the Supabase client
const supabase = getSupabaseClient();
export { supabase };
export default supabase; 