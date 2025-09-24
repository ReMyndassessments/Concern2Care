#!/usr/bin/env node

// Cloud Run specific startup script that ensures proper port configuration
process.env.NODE_ENV = 'production';

// Cloud Run provides PORT dynamically, but ensure it's set
if (!process.env.PORT) {
  process.env.PORT = '8080'; // Cloud Run default
}

// Remove any hardcoded port references
delete process.env.NODE_OPTIONS;

console.log('🚀 Starting Concern2Care for Cloud Run deployment...');
console.log(`📡 Cloud Run PORT: ${process.env.PORT}`);
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);

// Import and start the built application
import('./dist/index.js').catch(error => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});