export const API_BASE = import.meta.env.VITE_API_URL || '';

export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

export const CLERK_ENABLED =
  CLERK_PUBLISHABLE_KEY.length > 0 && !CLERK_PUBLISHABLE_KEY.includes('replace_me');
