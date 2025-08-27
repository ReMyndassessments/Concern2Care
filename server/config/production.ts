/**
 * Production configuration and optimizations
 */
import { env } from "../services/environment";

export const productionConfig = {
  // Database connection pooling
  database: {
    poolMax: 20,
    poolMin: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    statementTimeoutMillis: 30000
  },

  // Session configuration
  session: {
    name: 'concern2care_session',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax'
    }
  },

  // Security headers
  security: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.deepseek.com"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    frameguard: { action: 'deny' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // Logging configuration
  logging: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'debug',
    format: env.NODE_ENV === 'production' ? 'json' : 'dev',
    requests: {
      skipSuccessfulRequests: env.NODE_ENV === 'production',
      skipPaths: ['/health', '/favicon.ico']
    }
  },

  // Performance settings
  performance: {
    compression: {
      level: 6,
      threshold: 1024
    },
    cache: {
      defaultTtl: 300, // 5 minutes
      staticAssetsTtl: 86400 // 1 day
    }
  }
};

export default productionConfig;