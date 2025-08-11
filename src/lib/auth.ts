import { Request, Response, NextFunction } from 'express';
import { supabase } from './supabase';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
      apiKey?: {
        id: string;
        name: string;
        permissions: string[];
      };
    }
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token provided' });
    }

    const token = authHeader.substring(7);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Check API key in database
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hashApiKey(apiKey))
      .eq('is_active', true)
      .single();

    if (error || !keyData) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ 
        last_used_at: new Date().toISOString(),
        request_count: keyData.request_count + 1
      })
      .eq('id', keyData.id);

    req.apiKey = {
      id: keyData.id,
      name: keyData.name,
      permissions: keyData.permissions || []
    };

    // Set user context from API key
    req.user = {
      id: keyData.user_id,
      role: 'api_user'
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(401).json({ error: 'API key authentication failed' });
  }
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === 'admin') {
      return next(); // Admins have all permissions
    }

    if (req.apiKey && !req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission 
      });
    }

    next();
  };
}

// Simple hash function for API keys (in production, use proper hashing)
function hashApiKey(key: string): string {
  // This should use a proper hashing algorithm like bcrypt in production
  return Buffer.from(key).toString('base64');
}

// Generate API key
export function generateApiKey(): string {
  return 'rash_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

// API key management functions
export class ApiKeyManager {
  static async createApiKey(userId: string, name: string, permissions: string[] = []): Promise<string> {
    const key = generateApiKey();
    const keyHash = hashApiKey(key);

    const { error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name,
        key_hash: keyHash,
        permissions,
        is_active: true,
        created_at: new Date().toISOString(),
        request_count: 0
      });

    if (error) {
      throw new Error('Failed to create API key: ' + error.message);
    }

    return key;
  }

  static async revokeApiKey(keyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to revoke API key: ' + error.message);
    }
  }

  static async getUserApiKeys(userId: string) {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, permissions, is_active, created_at, last_used_at, request_count')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to get API keys: ' + error.message);
    }

    return data;
  }
}