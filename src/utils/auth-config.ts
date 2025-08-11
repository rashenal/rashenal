// Authentication Configuration Utility
// Handles dynamic callback URLs for different environments

export const getCallbackUrl = (provider: 'supabase' | 'outlook' | 'gmail' = 'supabase'): string => {
  const baseUrl = window.location.origin;
  
  switch (provider) {
    case 'outlook':
      return `${baseUrl}/auth/outlook/callback`;
    case 'gmail':
      return `${baseUrl}/auth/gmail/callback`;
    case 'supabase':
    default:
      return `${baseUrl}/auth/callback`;
  }
};

// List of allowed origins for development
export const DEV_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:5181',
  'http://localhost:5182',
  'http://localhost:5183',
  'http://localhost:5184',
  'http://localhost:5185',
];

// Check if current origin is allowed for development
export const isValidDevOrigin = (): boolean => {
  return DEV_ALLOWED_ORIGINS.includes(window.location.origin);
};

// Get the current environment
export const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  } else if (hostname.includes('staging') || hostname.includes('preview')) {
    return 'staging';
  } else {
    return 'production';
  }
};

// Debug callback URL information
export const debugAuthConfig = () => {
  const env = getEnvironment();
  const origin = window.location.origin;
  const supabaseCallback = getCallbackUrl('supabase');
  const outlookCallback = getCallbackUrl('outlook');
  const gmailCallback = getCallbackUrl('gmail');
  
  console.log('🔧 Auth Configuration Debug:', {
    environment: env,
    origin,
    callbacks: {
      supabase: supabaseCallback,
      outlook: outlookCallback,
      gmail: gmailCallback
    },
    isValidDevOrigin: isValidDevOrigin()
  });
  
  return {
    environment: env,
    origin,
    callbacks: {
      supabase: supabaseCallback,
      outlook: outlookCallback,
      gmail: gmailCallback
    }
  };
};