import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { env } from "./services/environment";

// Smart environment detection - use production settings when needed
const shouldUseProductionConfig = (
  process.env.NODE_ENV === 'production' || 
  process.env.REPL_SLUG !== 'workspace' ||
  (process.env.REPLIT_DOMAINS && process.env.REPLIT_DOMAINS.includes('.replit.app'))
);

// Set default NODE_ENV only if not specified (don't override production deployments)
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
} else if (shouldUseProductionConfig && process.env.NODE_ENV !== 'production') {
  process.env.NODE_ENV = 'production';
}

console.log('🌍 Original NODE_ENV:', process.env.NODE_ENV);
console.log('🌍 Should use production config:', shouldUseProductionConfig);
console.log('🌍 REPL_SLUG:', process.env.REPL_SLUG);
console.log('🌍 REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS);

const app = express();

// Trust proxy for accurate IP addresses behind reverse proxy
// Always trust proxy in Replit environment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - Allow ALL origins for now to fix connection issues
app.use(cors({
  origin: true, // Allow all origins temporarily to fix connection issues
  credentials: true,
  optionsSuccessStatus: 200
}));

// Log all incoming requests to debug connection issues
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'} - Host: ${req.get('Host')}`);
  next();
});

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Reasonable rate limiting for auth endpoints  
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 20 : 100, // More reasonable limits - 20 in prod, 100 in dev
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/', authLimiter);

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Health check endpoint (before other routes)
app.get('/health', async (_req, res) => {
  try {
    // Basic health check with database connectivity test
    const startTime = Date.now();
    
    // Test database connectivity
    const { db } = await import("./db");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    
    const dbResponseTime = Date.now() - startTime;
    
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`
      },
      environment: env.NODE_ENV
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Enhanced error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Always log error details for debugging
    console.error(`[ERROR] ${req.method} ${req.path} - ${status}: ${err.message}`);
    console.error('Full error:', err);
    if (err.stack) {
      console.error(err.stack);
    }

    res.status(status).json({ 
      message,
      stack: err.stack // Include stack trace for debugging
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
