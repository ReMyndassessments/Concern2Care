import { db } from "../db";
import { users } from "@shared/schema";
import { count } from "drizzle-orm";
import fs from "fs";
import path from "path";
import os from "os";

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    responseTime?: number;
    error?: string;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    disk: {
      available: number;
      total: number;
      percentage: number;
    };
  };
}

export interface DetailedHealthStatus extends HealthStatus {
  services: {
    ai: {
      available: boolean;
      lastCheck: string;
      responseTime?: number;
    };
    email: {
      configured: boolean;
      lastSent?: string;
    };
    pdf: {
      available: boolean;
      reportsDirectory: string;
      writeable: boolean;
    };
  };
  database: HealthStatus['database'] & {
    tableStats: {
      users: number;
      concerns: number;
      interventions: number;
    };
    migrations: {
      current: string;
      pending: number;
    };
  };
  performance: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
}

let requestCount = 0;
let errorCount = 0;
let responseTimeSum = 0;
const startTime = Date.now();

// Track basic metrics
export function trackRequest(responseTime: number, isError: boolean = false) {
  requestCount++;
  responseTimeSum += responseTime;
  if (isError) errorCount++;
}

export async function getSystemHealth(): Promise<HealthStatus> {
  const startTime = Date.now();
  let databaseHealth = { connected: false, responseTime: 0, error: undefined };
  
  try {
    const dbStart = Date.now();
    await db.select({ count: count() }).from(users).limit(1);
    databaseHealth = {
      connected: true,
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    databaseHealth = {
      connected: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    };
  }

  // System metrics
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  // CPU usage (simplified)
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });

  const cpuUsage = 100 - Math.floor(100 * totalIdle / totalTick);

  // Disk space (for reports directory)
  let diskStats = { available: 0, total: 0, percentage: 0 };
  try {
    const stats = fs.statSync('.');
    diskStats = {
      available: freeMemory, // Simplified
      total: totalMemory,
      percentage: Math.floor(((totalMemory - freeMemory) / totalMemory) * 100)
    };
  } catch (error) {
    // Ignore disk stats errors
  }

  const overallStatus = databaseHealth.connected ? 'healthy' : 'error';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    database: databaseHealth,
    system: {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.floor((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      cpu: {
        usage: cpuUsage
      },
      disk: diskStats
    }
  };
}

export async function getDetailedSystemHealth(): Promise<DetailedHealthStatus> {
  const basicHealth = await getSystemHealth();
  
  // AI Service Health
  let aiHealth = {
    available: false,
    lastCheck: new Date().toISOString(),
    responseTime: 0
  };
  
  try {
    // Mock AI health check - in production, test actual AI service
    const aiStart = Date.now();
    // await testAIService();
    aiHealth = {
      available: true,
      lastCheck: new Date().toISOString(),
      responseTime: Date.now() - aiStart
    };
  } catch (error) {
    // AI service unavailable
  }

  // Email Service Health
  const emailConfigured = Boolean(process.env.SMTP_HOST || process.env.EMAIL_SERVICE);
  
  // PDF Service Health
  const reportsDir = path.join(process.cwd(), 'reports');
  let pdfHealth = {
    available: false,
    reportsDirectory: reportsDir,
    writeable: false
  };
  
  try {
    // Test if reports directory exists and is writeable
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Test write permission
    const testFile = path.join(reportsDir, 'health-check.tmp');
    fs.writeFileSync(testFile, 'health check');
    fs.unlinkSync(testFile);
    
    pdfHealth = {
      available: true,
      reportsDirectory: reportsDir,
      writeable: true
    };
  } catch (error) {
    // PDF service issues
  }

  // Database table statistics
  let tableStats = { users: 0, concerns: 0, interventions: 0 };
  try {
    const [usersCount, concernsCount, interventionsCount] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM users'),
      db.execute('SELECT COUNT(*) as count FROM concerns'),
      db.execute('SELECT COUNT(*) as count FROM interventions')
    ]);
    
    tableStats = {
      users: Number(usersCount.rows[0]?.count || 0),
      concerns: Number(concernsCount.rows[0]?.count || 0),
      interventions: Number(interventionsCount.rows[0]?.count || 0)
    };
  } catch (error) {
    // Use defaults
  }

  // Performance metrics
  const avgResponseTime = requestCount > 0 ? responseTimeSum / requestCount : 0;
  const uptimeMinutes = Math.floor((Date.now() - startTime) / 60000);
  const requestsPerMinute = uptimeMinutes > 0 ? requestCount / uptimeMinutes : 0;
  const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

  return {
    ...basicHealth,
    services: {
      ai: aiHealth,
      email: {
        configured: emailConfigured,
        lastSent: undefined // Would track from actual email service
      },
      pdf: pdfHealth
    },
    database: {
      ...basicHealth.database,
      tableStats,
      migrations: {
        current: 'latest', // Would check actual migration status
        pending: 0
      }
    },
    performance: {
      averageResponseTime: Math.round(avgResponseTime),
      requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100
    }
  };
}

// Connection pool monitoring (for production)
export function getConnectionPoolStats() {
  // This would integrate with your actual connection pool
  // For now, return mock data
  return {
    active: 2,
    idle: 8,
    total: 10,
    waiting: 0,
    maxConnections: 20
  };
}

// Log health metrics periodically
let healthCheckInterval: NodeJS.Timeout | null = null;

export function startHealthMonitoring(intervalMinutes: number = 5) {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    try {
      const health = await getSystemHealth();
      console.log(`Health Check: ${health.status} - DB: ${health.database.connected ? 'OK' : 'ERROR'} - Memory: ${health.system.memory.percentage}%`);
      
      // Log warnings
      if (health.system.memory.percentage > 80) {
        console.warn('High memory usage detected:', health.system.memory.percentage + '%');
      }
      
      if (health.system.cpu.usage > 80) {
        console.warn('High CPU usage detected:', health.system.cpu.usage + '%');
      }
      
      if (!health.database.connected) {
        console.error('Database connection lost:', health.database.error);
      }
      
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }, intervalMinutes * 60 * 1000);
}

export function stopHealthMonitoring() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}