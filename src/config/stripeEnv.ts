/** Resolve Stripe publishable key from Vite env or runtime env-config.js */
export function getStripePublishableKey(): string {
  const fromImportMeta =
    import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
    import.meta.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    import.meta.env.REACT_APP_STRIPE_PUBLIC_KEY ||
    '';

  if (fromImportMeta) return fromImportMeta;

  if (typeof window !== 'undefined' && window._env_) {
    return (
      window._env_.VITE_STRIPE_PUBLIC_KEY ||
      window._env_.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      window._env_.REACT_APP_STRIPE_PUBLIC_KEY ||
      ''
    );
  }

  return '';
}

declare global {
  interface Window {
    _env_?: Record<string, string>;
  }
}
