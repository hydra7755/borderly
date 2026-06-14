/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_EMAIL_SERVICE_ID: string;
  readonly VITE_EMAIL_TEMPLATE_ID: string;
  readonly VITE_EMAIL_USER_ID: string;
  readonly VITE_CONTACT_EMAIL: string;
  readonly VITE_STRIPE_PUBLIC_KEY: string;
  readonly NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 