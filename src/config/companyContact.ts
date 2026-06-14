const DEFAULT_COMPANY_EMAIL = 'contactborderly@gmail.com';

function readRuntimeEnv(key: string): string {
  if (typeof window !== 'undefined') {
    const value = (window as { _env_?: Record<string, string> })._env_?.[key];
    if (value) return value;
  }

  const metaEnv = import.meta.env as Record<string, string | undefined>;
  if (metaEnv[key]) return metaEnv[key] as string;

  return '';
}

/** Official Borderly inbox for contact forms, applications, and support. */
export function getCompanyEmail(): string {
  return (
    readRuntimeEnv('VITE_CONTACT_EMAIL') ||
    readRuntimeEnv('REACT_APP_CONTACT_EMAIL') ||
    DEFAULT_COMPANY_EMAIL
  );
}

export function getCompanyMailtoHref(): string {
  return `mailto:${getCompanyEmail()}`;
}
