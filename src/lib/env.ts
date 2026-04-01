/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().startsWith('https://'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(), // Optional for client-side

  // Application Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default('https://absensi-ubig.vercel.app'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('https://absensi-ubig.vercel.app'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Optional: Monitoring Services
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // Optional: Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').optional(),
  NEXT_PUBLIC_ENABLE_PWA: z.string().transform(val => val === 'true').optional(),

  // Optional: API Configuration
  NEXT_PUBLIC_API_TIMEOUT: z.string().transform(Number).optional().default(30000),
  NEXT_PUBLIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).optional(),
});

// Parse and validate environment variables
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));

    // In production, throw an error to prevent the app from starting
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables');
    } else {
      // In development, show warning but continue
      console.warn('⚠️ Running with invalid environment variables. Some features may not work correctly.');
    }

    // Return partial env with defaults
    return envSchema.parse({});
  }

  return parsed.data;
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment variable access
export type Env = z.infer<typeof envSchema>;

// Helper functions for environment checks
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Helper to get public runtime config
export function getPublicConfig() {
  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    enableAnalytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    enablePWA: env.NEXT_PUBLIC_ENABLE_PWA,
    apiTimeout: env.NEXT_PUBLIC_API_TIMEOUT,
    logLevel: env.NEXT_PUBLIC_LOG_LEVEL,
  };
}

// Validate critical environment variables at runtime
export function validateCriticalEnv() {
  const critical = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = critical.filter(key => !process.env[key]);

  if (missing.length > 0) {
    const message = `Missing critical environment variables: ${missing.join(', ')}`;
    console.error(`❌ ${message}`);

    if (isProduction) {
      throw new Error(message);
    }

    return false;
  }

  return true;
}

// Export for use in other files
export default env;
