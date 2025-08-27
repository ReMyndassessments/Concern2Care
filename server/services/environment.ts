/**
 * Environment variable validation and configuration
 */
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  EMAIL_ENCRYPTION_KEY: string;
  BASE_URL: string;
  ALLOWED_ORIGINS?: string;
  SESSION_SECRET: string;
}

const requiredEnvVars = [
  'DATABASE_URL',
  'EMAIL_ENCRYPTION_KEY',
  'SESSION_SECRET'
] as const;

const developmentDefaults = {
  NODE_ENV: 'development' as const,
  PORT: 5000,
  BASE_URL: 'http://localhost:5000',
  EMAIL_ENCRYPTION_KEY: 'dev-key-32-chars-minimum-required!',
  SESSION_SECRET: 'dev-session-secret-32-chars-minimum!'
};

function validateEnvironment(): EnvironmentConfig {
  const errors: string[] = [];
  
  // Set development defaults if missing
  if (process.env.NODE_ENV !== 'production') {
    if (!process.env.EMAIL_ENCRYPTION_KEY) {
      process.env.EMAIL_ENCRYPTION_KEY = developmentDefaults.EMAIL_ENCRYPTION_KEY;
      console.warn('Using development default for EMAIL_ENCRYPTION_KEY');
    }
    if (!process.env.SESSION_SECRET) {
      process.env.SESSION_SECRET = developmentDefaults.SESSION_SECRET;
      console.warn('Using development default for SESSION_SECRET');
    }
  }
  
  // Check required environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate EMAIL_ENCRYPTION_KEY
  if (process.env.EMAIL_ENCRYPTION_KEY === 'default-key-change-in-production') {
    errors.push('EMAIL_ENCRYPTION_KEY must be changed from default value');
  }

  // Validate EMAIL_ENCRYPTION_KEY length
  if (process.env.EMAIL_ENCRYPTION_KEY && process.env.EMAIL_ENCRYPTION_KEY.length < 32) {
    errors.push('EMAIL_ENCRYPTION_KEY must be at least 32 characters long');
  }

  if (errors.length > 0) {
    console.error('Environment validation errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }

  const config: EnvironmentConfig = {
    NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || developmentDefaults.NODE_ENV,
    PORT: parseInt(process.env.PORT || developmentDefaults.PORT.toString(), 10),
    DATABASE_URL: process.env.DATABASE_URL!,
    EMAIL_ENCRYPTION_KEY: process.env.EMAIL_ENCRYPTION_KEY!,
    BASE_URL: process.env.BASE_URL || developmentDefaults.BASE_URL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    SESSION_SECRET: process.env.SESSION_SECRET!
  };

  // Additional validation
  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    throw new Error('PORT must be a valid port number between 1 and 65535');
  }

  if (config.NODE_ENV === 'production') {
    if (config.SESSION_SECRET.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters long in production');
    }
    
    if (!config.ALLOWED_ORIGINS) {
      console.warn('ALLOWED_ORIGINS not set in production - this may cause CORS issues');
    }
  }

  return config;
}

export const env = validateEnvironment();

// Log configuration (without sensitive data)
console.log('Environment configuration:', {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  BASE_URL: env.BASE_URL,
  ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
  EMAIL_ENCRYPTION_KEY_SET: !!env.EMAIL_ENCRYPTION_KEY,
  SESSION_SECRET_SET: !!env.SESSION_SECRET,
  DATABASE_URL_SET: !!env.DATABASE_URL
});