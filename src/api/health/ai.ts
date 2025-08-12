import { HealthCheckResult } from './status';

/**
 * Test Claude API connectivity
 */
export async function checkAI(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test Claude API through our Supabase edge function
    const response = await fetch('/api/ai/health-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Health check test',
        isHealthCheck: true
      })
    });

    if (!response.ok) {
      return {
        status: 'fail',
        message: 'Claude API health check failed',
        details: { 
          status: response.status, 
          statusText: response.statusText 
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }

    const data = await response.json();
    
    return {
      status: 'pass',
      message: 'Claude API is responding',
      details: { 
        responseTime: Date.now() - startTime,
        apiResponse: data
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Claude API connection failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test AI chat functionality
 */
export async function checkAIChat(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const testMessage = 'This is a health check. Please respond with just \'Health check successful\' and nothing else.';
    
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        context: { isHealthCheck: true },
        maxTokens: 50
      })
    });

    if (!response.ok) {
      return {
        status: 'fail',
        message: 'AI chat test failed',
        details: { 
          status: response.status, 
          statusText: response.statusText 
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }

    const data = await response.json();
    
    return {
      status: 'pass',
      message: 'AI chat is functional',
      details: { 
        responseTime: Date.now() - startTime,
        response: data.response,
        tokensUsed: data.usage?.total_tokens || 'unknown'
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'AI chat test error',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Mock AI service for development (when real API isn't available)
 */
export async function checkAIMock(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    return {
      status: 'warn',
      message: 'Using mock AI service (development mode)',
      details: { 
        mode: 'mock',
        responseTime: Date.now() - startTime
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Mock AI service failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  }
}

/**
 * Comprehensive AI system check
 */
export async function checkAISystem(): Promise<{ [key: string]: HealthCheckResult }> {
  const results: { [key: string]: HealthCheckResult } = {};
  
  // Check if we're in development mode
  const isDevelopment = import.meta.env.MODE === 'development';
  
  if (isDevelopment && !import.meta.env.VITE_ANTHROPIC_API_KEY) {
    // Use mock service in development if no API key
    results.ai_service = await checkAIMock();
  } else {
    // Test real AI service
    results.ai_connectivity = await checkAI();
    results.ai_chat = await checkAIChat();
  }
  
  return results;
}