import crypto from 'crypto';

// AES-256-CBC encryption for PIN storage (simpler and more compatible)
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Get encryption key from environment with fallback for development
function getEncryptionKey(): Buffer {
  const key = process.env.PIN_ENCRYPTION_KEY || 'dev-pin-encryption-key-32-chars-long-for-development';
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypts a 4-digit PIN for admin viewing
 */
export function encryptPin(pin: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(pin, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Combine iv + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts a PIN for admin viewing
 */
export function decryptPin(encryptedPin: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedPin.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted PIN format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('PIN decryption error:', error);
    throw new Error('Failed to decrypt PIN');
  }
}

/**
 * Validates that a PIN is exactly 4 digits
 */
export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}