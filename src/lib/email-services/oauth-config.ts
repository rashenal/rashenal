// OAuth configuration for Gmail and Outlook integration
export interface OAuthProvider {
  name: 'gmail' | 'outlook' | 'yahoo';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  tokenType: string;
  provider: string;
}

export interface EmailAccount {
  id: string;
  email: string;
  displayName: string;
  provider: 'gmail' | 'outlook' | 'yahoo';
  isConnected: boolean;
  lastSyncAt: string | null;
  token?: OAuthToken;
  settings: {
    enableJobAlerts: boolean;
    alertFrequency: 'realtime' | 'daily' | 'weekly';
    emailSignature: string;
    autoReply: boolean;
    folderMappings: {
      jobAlerts: string;
      applications: string;
      interviews: string;
      offers: string;
    };
  };
}

// OAuth provider configurations
export const OAUTH_PROVIDERS: Record<string, Omit<OAuthProvider, 'clientId' | 'clientSecret'>> = {
  gmail: {
    name: 'gmail',
    redirectUri: `${window.location.origin}/auth/gmail/callback`,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token'
  },
  outlook: {
    name: 'outlook',
    redirectUri: `${window.location.origin}/auth/outlook/callback`,
    scopes: [
      'https://graph.microsoft.com/mail.read',
      'https://graph.microsoft.com/mail.send',
      'https://graph.microsoft.com/mail.readwrite',
      'https://graph.microsoft.com/user.read',
      'offline_access'
    ],
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
  },
  yahoo: {
    name: 'yahoo',
    redirectUri: `${window.location.origin}/auth/yahoo/callback`,
    scopes: ['mail-r', 'mail-w', 'profile'],
    authUrl: 'https://api.login.yahoo.com/oauth2/request_auth',
    tokenUrl: 'https://api.login.yahoo.com/oauth2/get_token'
  }
};

export class OAuthManager {
  private static instance: OAuthManager;
  private providers: Map<string, OAuthProvider> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  public static getInstance(): OAuthManager {
    if (!OAuthManager.instance) {
      OAuthManager.instance = new OAuthManager();
    }
    return OAuthManager.instance;
  }

  private initializeProviders(): void {
    // Initialize with environment variables or default values
    Object.entries(OAUTH_PROVIDERS).forEach(([key, config]) => {
      const provider: OAuthProvider = {
        ...config,
        clientId: this.getClientId(key),
        clientSecret: this.getClientSecret(key)
      };
      this.providers.set(key, provider);
    });
  }

  private getClientId(provider: string): string {
    const envKey = `VITE_${provider.toUpperCase()}_CLIENT_ID`;
    return import.meta.env[envKey] || '';
  }

  private getClientSecret(provider: string): string {
    const envKey = `VITE_${provider.toUpperCase()}_CLIENT_SECRET`;
    return import.meta.env[envKey] || '';
  }

  public getAuthUrl(provider: string, state?: string): string {
    const config = this.providers.get(provider);
    if (!config) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      ...(state && { state })
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  public async exchangeCodeForToken(
    provider: string, 
    code: string, 
    state?: string
  ): Promise<OAuthToken> {
    const config = this.providers.get(provider);
    if (!config) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || '',
      expiresAt: Date.now() + (data.expires_in * 1000),
      scope: data.scope || config.scopes.join(' '),
      tokenType: data.token_type || 'Bearer',
      provider
    };
  }

  public async refreshToken(token: OAuthToken): Promise<OAuthToken> {
    const config = this.providers.get(token.provider);
    if (!config) {
      throw new Error(`Unknown OAuth provider: ${token.provider}`);
    }

    if (!token.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: token.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      ...token,
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      refreshToken: data.refresh_token || token.refreshToken
    };
  }

  public isTokenExpired(token: OAuthToken): boolean {
    return Date.now() >= (token.expiresAt - 300000); // 5 minutes buffer
  }

  public async getValidToken(token: OAuthToken): Promise<OAuthToken> {
    if (this.isTokenExpired(token)) {
      return await this.refreshToken(token);
    }
    return token;
  }

  public revokeToken(provider: string, token: string): Promise<void> {
    const config = this.providers.get(provider);
    if (!config) {
      throw new Error(`Unknown OAuth provider: ${provider}`);
    }

    let revokeUrl: string;
    switch (provider) {
      case 'gmail':
        revokeUrl = `https://oauth2.googleapis.com/revoke?token=${token}`;
        break;
      case 'outlook':
        revokeUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/logout';
        break;
      default:
        throw new Error(`Token revocation not implemented for ${provider}`);
    }

    return fetch(revokeUrl, { method: 'POST' }).then(() => {});
  }
}

export default OAuthManager;