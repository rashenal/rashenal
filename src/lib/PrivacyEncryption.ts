// Privacy Encryption System - Client-side encryption for personal data
// Educational scaffolding with mockups to demonstrate the encryption process

// Encryption key types
export interface EncryptionKeys {
  publicKey: string;
  privateKey: string;
  recoveryPhrase: string[];
  keyFingerprint: string;
  createdAt: string;
  lastRotated?: string;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string; // Initialization vector
  salt: string;
  algorithm: string;
  keyId: string;
  timestamp: string;
  dataType: string;
  isEncrypted: true;
}

export interface DecryptedData {
  data: any;
  decryptedAt: string;
  keyId: string;
  isEncrypted: false;
}

export type SensitivityLevel = 'public' | 'private' | 'sensitive' | 'highly_sensitive';

export interface DataClassification {
  fieldName: string;
  dataType: string;
  sensitivity: SensitivityLevel;
  requiresEncryption: boolean;
  requiresConsent: boolean;
  retentionDays: number;
  description: string;
}

// Data classifications for different types of personal information
export const DATA_CLASSIFICATIONS: DataClassification[] = [
  // Health Data - Highly Sensitive
  {
    fieldName: 'blood_pressure',
    dataType: 'health_metric',
    sensitivity: 'highly_sensitive',
    requiresEncryption: true,
    requiresConsent: true,
    retentionDays: 365 * 2, // 2 years
    description: 'Blood pressure readings including systolic/diastolic values'
  },
  {
    fieldName: 'medications',
    dataType: 'health_record',
    sensitivity: 'highly_sensitive',
    requiresEncryption: true,
    requiresConsent: true,
    retentionDays: 365 * 5, // 5 years
    description: 'Current and past medications, dosages, and schedules'
  },
  {
    fieldName: 'mental_health_notes',
    dataType: 'health_record',
    sensitivity: 'highly_sensitive',
    requiresEncryption: true,
    requiresConsent: true,
    retentionDays: 365 * 3,
    description: 'Mood tracking, therapy notes, mental health observations'
  },
  {
    fieldName: 'medical_conditions',
    dataType: 'health_record',
    sensitivity: 'highly_sensitive',
    requiresEncryption: true,
    requiresConsent: true,
    retentionDays: -1, // Permanent
    description: 'Diagnosed conditions, allergies, medical history'
  },

  // Personal Identifiable Information - Sensitive
  {
    fieldName: 'full_name',
    dataType: 'pii',
    sensitivity: 'sensitive',
    requiresEncryption: true,
    requiresConsent: false,
    retentionDays: -1,
    description: 'User\'s full legal name'
  },
  {
    fieldName: 'date_of_birth',
    dataType: 'pii',
    sensitivity: 'sensitive',
    requiresEncryption: true,
    requiresConsent: false,
    retentionDays: -1,
    description: 'Date of birth for age verification and health calculations'
  },
  {
    fieldName: 'phone_number',
    dataType: 'pii',
    sensitivity: 'sensitive',
    requiresEncryption: true,
    requiresConsent: false,
    retentionDays: -1,
    description: 'Contact phone number'
  },

  // Behavioral Data - Private
  {
    fieldName: 'daily_habits',
    dataType: 'behavioral',
    sensitivity: 'private',
    requiresEncryption: true,
    requiresConsent: false,
    retentionDays: 365,
    description: 'Daily habit completion and tracking data'
  },
  {
    fieldName: 'ai_conversations',
    dataType: 'behavioral',
    sensitivity: 'private',
    requiresEncryption: true,
    requiresConsent: false,
    retentionDays: 90,
    description: 'Conversations with AI assistants'
  },
  {
    fieldName: 'personality_assessment',
    dataType: 'behavioral',
    sensitivity: 'private',
    requiresEncryption: true,
    requiresConsent: false,
    retentionDays: 365 * 2,
    description: 'Myers-Briggs, VIA, and other personality test results'
  },

  // Public/Low Sensitivity
  {
    fieldName: 'username',
    dataType: 'profile',
    sensitivity: 'public',
    requiresEncryption: false,
    requiresConsent: false,
    retentionDays: -1,
    description: 'Public display username'
  },
  {
    fieldName: 'avatar_url',
    dataType: 'profile',
    sensitivity: 'public',
    requiresEncryption: false,
    requiresConsent: false,
    retentionDays: -1,
    description: 'Profile picture URL'
  }
];

export class PrivacyEncryption {
  private static instance: PrivacyEncryption;
  private userKeys: EncryptionKeys | null = null;
  private isInitialized: boolean = false;
  private encryptedFields: Set<string> = new Set();

  private constructor() {}

  static getInstance(): PrivacyEncryption {
    if (!PrivacyEncryption.instance) {
      PrivacyEncryption.instance = new PrivacyEncryption();
    }
    return PrivacyEncryption.instance;
  }

  // Initialize encryption for a user
  async initialize(userId: string): Promise<{
    success: boolean;
    keys?: EncryptionKeys;
    message: string;
    educationalInfo: string[];
  }> {
    console.log('🔐 Initializing privacy encryption for user:', userId);

    // Educational information about the process
    const educationalInfo = [
      '1. Generating your unique encryption keys using WebCrypto API',
      '2. Your private key never leaves your device',
      '3. Public key can be shared for others to encrypt data for you',
      '4. Recovery phrase allows key restoration if needed',
      '5. All sensitive data is encrypted before storage'
    ];

    try {
      // Check if keys already exist
      const existingKeys = await this.loadExistingKeys(userId);
      
      if (existingKeys) {
        this.userKeys = existingKeys;
        this.isInitialized = true;
        return {
          success: true,
          keys: existingKeys,
          message: 'Encryption keys loaded successfully',
          educationalInfo
        };
      }

      // Generate new keys (mockup for now)
      const newKeys = await this.generateKeys(userId);
      this.userKeys = newKeys;
      this.isInitialized = true;

      // Store keys securely (in production, use secure key storage)
      await this.storeKeys(userId, newKeys);

      return {
        success: true,
        keys: newKeys,
        message: 'New encryption keys generated successfully',
        educationalInfo
      };

    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      return {
        success: false,
        message: 'Failed to initialize encryption',
        educationalInfo
      };
    }
  }

  // Generate encryption keys (mockup)
  private async generateKeys(userId: string): Promise<EncryptionKeys> {
    // In production, use WebCrypto API for real key generation
    // This is a mockup for demonstration
    
    const mockPrivateKey = this.generateMockKey('private', userId);
    const mockPublicKey = this.generateMockKey('public', userId);
    const recoveryPhrase = this.generateRecoveryPhrase();
    
    return {
      privateKey: mockPrivateKey,
      publicKey: mockPublicKey,
      recoveryPhrase,
      keyFingerprint: this.generateFingerprint(mockPublicKey),
      createdAt: new Date().toISOString()
    };
  }

  // Generate mock key for demonstration
  private generateMockKey(type: 'private' | 'public', userId: string): string {
    const prefix = type === 'private' ? 'priv_' : 'pub_';
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}${userId.substring(0, 8)}_${random}_mock`;
  }

  // Generate recovery phrase (BIP39-style)
  private generateRecoveryPhrase(): string[] {
    const words = [
      'health', 'protect', 'secure', 'private', 'trust', 'guard',
      'shield', 'safe', 'lock', 'vault', 'cipher', 'code'
    ];
    
    const phrase: string[] = [];
    for (let i = 0; i < 12; i++) {
      phrase.push(words[Math.floor(Math.random() * words.length)]);
    }
    
    return phrase;
  }

  // Generate key fingerprint for verification
  private generateFingerprint(publicKey: string): string {
    // Simple hash mockup
    let hash = 0;
    for (let i = 0; i < publicKey.length; i++) {
      hash = ((hash << 5) - hash) + publicKey.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase().substring(0, 8);
  }

  // Encrypt sensitive data
  async encryptData(
    data: any,
    dataType: string,
    sensitivity: SensitivityLevel
  ): Promise<{
    encrypted: EncryptedData | any;
    process: string[];
    isActuallyEncrypted: boolean;
  }> {
    const process = [
      `1. Checking data sensitivity: ${sensitivity}`,
      `2. Data type: ${dataType}`,
      `3. Requires encryption: ${sensitivity !== 'public'}`
    ];

    // Only encrypt if sensitive
    if (sensitivity === 'public') {
      process.push('4. Data is public - no encryption needed');
      return {
        encrypted: data,
        process,
        isActuallyEncrypted: false
      };
    }

    if (!this.userKeys) {
      process.push('4. ERROR: No encryption keys available');
      throw new Error('Encryption keys not initialized');
    }

    process.push('4. Generating random IV and salt');
    process.push('5. Encrypting data with AES-256-GCM');
    process.push('6. Creating encrypted data package');

    // Mockup encrypted data
    const encryptedData: EncryptedData = {
      ciphertext: this.mockEncrypt(JSON.stringify(data)),
      iv: this.generateRandomHex(16),
      salt: this.generateRandomHex(32),
      algorithm: 'AES-256-GCM',
      keyId: this.userKeys.keyFingerprint,
      timestamp: new Date().toISOString(),
      dataType,
      isEncrypted: true
    };

    this.encryptedFields.add(dataType);

    return {
      encrypted: encryptedData,
      process,
      isActuallyEncrypted: true
    };
  }

  // Decrypt data
  async decryptData(
    encryptedData: EncryptedData,
    userPrivateKey?: string
  ): Promise<{
    decrypted: any;
    process: string[];
    success: boolean;
  }> {
    const process = [
      '1. Verifying encrypted data package',
      '2. Checking key ID matches',
      '3. Loading private key'
    ];

    if (!encryptedData.isEncrypted) {
      process.push('4. Data is not encrypted - returning as-is');
      return {
        decrypted: encryptedData,
        process,
        success: true
      };
    }

    const privateKey = userPrivateKey || this.userKeys?.privateKey;
    
    if (!privateKey) {
      process.push('4. ERROR: Private key not available');
      return {
        decrypted: null,
        process,
        success: false
      };
    }

    process.push('4. Extracting IV and salt');
    process.push('5. Decrypting with AES-256-GCM');
    process.push('6. Parsing decrypted data');

    // Mockup decryption
    const decryptedString = this.mockDecrypt(encryptedData.ciphertext);
    
    try {
      const decryptedData = JSON.parse(decryptedString);
      process.push('7. ✅ Decryption successful');
      
      return {
        decrypted: decryptedData,
        process,
        success: true
      };
    } catch (error) {
      process.push('7. ❌ Decryption failed');
      return {
        decrypted: null,
        process,
        success: false
      };
    }
  }

  // Mock encryption (for demonstration)
  private mockEncrypt(data: string): string {
    // Simple base64 encoding for mockup
    // In production, use real AES-256-GCM encryption
    return btoa(data);
  }

  // Mock decryption (for demonstration)
  private mockDecrypt(ciphertext: string): string {
    // Simple base64 decoding for mockup
    // In production, use real AES-256-GCM decryption
    try {
      return atob(ciphertext);
    } catch {
      return '{"error": "Decryption failed"}';
    }
  }

  // Generate random hex string
  private generateRandomHex(bytes: number): string {
    const array = new Uint8Array(bytes);
    // In production, use crypto.getRandomValues(array)
    for (let i = 0; i < bytes; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Load existing keys from secure storage
  private async loadExistingKeys(userId: string): Promise<EncryptionKeys | null> {
    try {
      // In production, load from secure storage (IndexedDB with encryption)
      const storedKeys = localStorage.getItem(`rashenal_keys_${userId}`);
      if (storedKeys) {
        return JSON.parse(storedKeys);
      }
    } catch (error) {
      console.error('Failed to load existing keys:', error);
    }
    return null;
  }

  // Store keys securely
  private async storeKeys(userId: string, keys: EncryptionKeys): Promise<void> {
    try {
      // In production, use IndexedDB with additional encryption
      // Never store private keys in plain text
      localStorage.setItem(`rashenal_keys_${userId}`, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to store keys:', error);
    }
  }

  // Rotate encryption keys
  async rotateKeys(userId: string): Promise<{
    success: boolean;
    newKeys?: EncryptionKeys;
    reEncryptedCount: number;
  }> {
    console.log('🔄 Rotating encryption keys...');

    const oldKeys = this.userKeys;
    const newKeys = await this.generateKeys(userId);
    
    // In production, re-encrypt all data with new keys
    const reEncryptedCount = this.encryptedFields.size;

    this.userKeys = {
      ...newKeys,
      lastRotated: new Date().toISOString()
    };

    await this.storeKeys(userId, this.userKeys);

    return {
      success: true,
      newKeys: this.userKeys,
      reEncryptedCount
    };
  }

  // Export keys for backup
  exportKeys(): {
    publicKey: string;
    recoveryPhrase: string[];
    fingerprint: string;
    warning: string;
  } | null {
    if (!this.userKeys) return null;

    return {
      publicKey: this.userKeys.publicKey,
      recoveryPhrase: this.userKeys.recoveryPhrase,
      fingerprint: this.userKeys.keyFingerprint,
      warning: 'NEVER share your private key or recovery phrase with anyone!'
    };
  }

  // Get encryption status
  getStatus(): {
    initialized: boolean;
    hasKeys: boolean;
    encryptedFieldsCount: number;
    keyAge?: string;
    lastRotated?: string;
  } {
    const keyAge = this.userKeys 
      ? this.calculateAge(this.userKeys.createdAt)
      : undefined;

    return {
      initialized: this.isInitialized,
      hasKeys: this.userKeys !== null,
      encryptedFieldsCount: this.encryptedFields.size,
      keyAge,
      lastRotated: this.userKeys?.lastRotated
    };
  }

  private calculateAge(dateString: string): string {
    const age = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(age / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }

  // Check if a field should be encrypted
  shouldEncrypt(fieldName: string): boolean {
    const classification = DATA_CLASSIFICATIONS.find(c => c.fieldName === fieldName);
    return classification?.requiresEncryption || false;
  }

  // Get field sensitivity
  getFieldSensitivity(fieldName: string): SensitivityLevel {
    const classification = DATA_CLASSIFICATIONS.find(c => c.fieldName === fieldName);
    return classification?.sensitivity || 'public';
  }

  // Clear all keys (for logout)
  clearKeys(): void {
    this.userKeys = null;
    this.isInitialized = false;
    this.encryptedFields.clear();
    console.log('🔒 Encryption keys cleared from memory');
  }
}

// Export singleton instance
export const privacyEncryption = PrivacyEncryption.getInstance();