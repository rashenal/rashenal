// Test Claude API connection through Supabase Edge Function
// This file can be used to debug the Claude AI integration

import { supabase } from '../lib/supabase';

// Test basic Claude API connection with a simple prompt
export async function testClaudeAPIConnection(): Promise<{
  success: boolean;
  error?: string;
  response?: any;
  debug?: any;
}> {
  console.log('🧪 Testing Claude API connection...');
  
  try {
    // Simple test prompt
    const testPrompt = 'Hello Claude! Please respond with ONLY this exact JSON: {"status": "success", "message": "Claude AI is working correctly"}';
    
    console.log('📡 Sending test request to ai-chat Edge Function...');
    console.log('   - Test prompt:', testPrompt);
    
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        message: testPrompt,
        context: 'cv_parsing'
      }
    });
    
    console.log('📥 Received response from Edge Function');
    console.log('   - Error:', error);
    console.log('   - Data:', data);
    
    if (error) {
      console.error('❌ Edge Function error:', error);
      return {
        success: false,
        error: `Edge Function error: ${JSON.stringify(error)}`,
        debug: { error, data }
      };
    }
    
    if (!data) {
      console.error('❌ No data returned from Edge Function');
      return {
        success: false,
        error: 'No data returned from Edge Function',
        debug: { error, data }
      };
    }
    
    if (data.error) {
      console.error('❌ API error in response:', data.error);
      return {
        success: false,
        error: data.error,
        debug: data
      };
    }
    
    if (!data.response) {
      console.error('❌ No response field in data');
      return {
        success: false,
        error: 'No response field in Edge Function data',
        debug: data
      };
    }
    
    console.log('✅ Claude API connection test successful!');
    console.log('   - Response:', data.response);
    
    // Try to parse the JSON response
    try {
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Response JSON parsed successfully:', parsed);
        
        if (parsed.status === 'success') {
          console.log('🎉 Claude AI is working correctly!');
          return {
            success: true,
            response: parsed,
            debug: data
          };
        }
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse JSON from response, but API connection works');
    }
    
    // If we got a response but couldn't parse it as expected JSON, that's still success
    return {
      success: true,
      response: data.response,
      debug: data
    };
    
  } catch (error) {
    console.error('💥 Claude API connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: { error }
    };
  }
}

// Test CV parsing with a simple example
export async function testClaudeCVParsing(): Promise<{
  success: boolean;
  error?: string;
  extracted?: any;
  debug?: any;
}> {
  console.log('🧪 Testing Claude CV parsing...');
  
  const sampleCV = `
JOHN SMITH
john.smith@email.com | (555) 123-4567

Senior Software Engineer

SUMMARY
Experienced software engineer with 5+ years in web development.

SKILLS
JavaScript, React, Node.js, Python
`;
  
  const cvParsingPrompt = `Extract professional data from this CV and return ONLY valid JSON in this exact format:

{
  "name": "Full Name",
  "email": "email@example.com", 
  "phone": "+1234567890",
  "title": "Professional Title",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": ["Job description"],
  "summary": "Professional summary paragraph"
}

CV Text:
${sampleCV}

Return ONLY the JSON, no other text:`;
  
  try {
    console.log('📡 Sending CV parsing test to ai-chat Edge Function...');
    
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        message: cvParsingPrompt,
        context: 'cv_parsing'
      }
    });
    
    console.log('📥 Received CV parsing response');
    console.log('   - Error:', error);
    console.log('   - Data keys:', data ? Object.keys(data) : 'no data');
    
    if (error) {
      return {
        success: false,
        error: `Edge Function error: ${JSON.stringify(error)}`,
        debug: { error, data }
      };
    }
    
    if (!data || !data.response) {
      return {
        success: false,
        error: 'No response from Edge Function',
        debug: { error, data }
      };
    }
    
    console.log('📝 Claude CV parsing response:', data.response);
    
    // Try to extract and parse JSON
    try {
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ CV parsing JSON parsed successfully:', parsed);
        
        // Validate required fields
        if (parsed.name && parsed.title && parsed.skills) {
          console.log('🎉 Claude CV parsing test successful!');
          return {
            success: true,
            extracted: parsed,
            debug: data
          };
        } else {
          return {
            success: false,
            error: 'Missing required fields in parsed CV data',
            extracted: parsed,
            debug: data
          };
        }
      } else {
        return {
          success: false,
          error: 'No JSON found in Claude response',
          debug: data
        };
      }
    } catch (parseError) {
      return {
        success: false,
        error: `JSON parsing failed: ${parseError.message}`,
        debug: { data, parseError }
      };
    }
    
  } catch (error) {
    console.error('💥 Claude CV parsing test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: { error }
    };
  }
}

// Export functions for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testClaudeAPIConnection = testClaudeAPIConnection;
  (window as any).testClaudeCVParsing = testClaudeCVParsing;
  console.log('🧪 Claude API test functions available:');
  console.log('   - testClaudeAPIConnection()');
  console.log('   - testClaudeCVParsing()');
}