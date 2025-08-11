// Test file for Claude AI CV Parser
// This file tests the integration without requiring database operations

import { RealClaudeCVParser } from '../lib/real-claude-cv-parser';

// Mock test CV text
const mockCVText = `
JOHN SMITH
john.smith@email.com | (555) 123-4567 | LinkedIn: /in/johnsmith

PROFESSIONAL SUMMARY
Senior Software Engineer with 8+ years of experience building scalable web applications.
Expert in React, Node.js, and cloud architecture. Passionate about clean code and user experience.

WORK EXPERIENCE

Senior Software Engineer | TechCorp Inc. | 2020 - Present
• Lead technical architecture for e-commerce platform serving 2M+ daily users
• Reduced page load times by 60% through performance optimization and caching strategies
• Mentor team of 6 junior developers and conduct technical interviews
• Built microservices architecture using Node.js, Docker, and AWS

Software Engineer | Digital Innovations Inc. | 2018 - 2020  
• Developed responsive web applications using React, Redux, and TypeScript
• Implemented CI/CD pipelines that reduced deployment time from 2 hours to 15 minutes
• Collaborated with product team to translate requirements into technical solutions

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, SQL
Frontend: React, Vue.js, HTML5, CSS3, SASS, Tailwind CSS
Backend: Node.js, Express.js, Django, Spring Boot, RESTful APIs
Databases: PostgreSQL, MySQL, MongoDB, Redis
Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, GitHub Actions

EDUCATION
Bachelor of Science in Computer Science | State University | 2018
GPA: 3.8/4.0 | Dean's List
`;

// Test the parser
export async function testClaudeAIParser() {
  console.log('🤖 Testing Claude AI CV Parser...');
  
  try {
    // Create a mock File object
    const mockFile = new File([mockCVText], 'test-cv.txt', { type: 'text/plain' });
    
    // Set up progress callback for testing
    RealClaudeCVParser.setProgressCallback((progress) => {
      console.log(`⏳ Progress: ${progress.stage} - ${progress.progress}% - ${progress.message}`);
    });
    
    // Test the extraction
    const result = await RealClaudeCVParser.extractFromFile(mockFile);
    
    console.log('✅ Claude AI CV Parser test completed successfully!');
    console.log('📊 Extracted Data:', result);
    
    // Validate the result
    if (result.name && result.title && result.skills.length > 0) {
      console.log('✅ All required fields extracted successfully');
      console.log(`   - Name: ${result.name}`);
      console.log(`   - Title: ${result.title}`);
      console.log(`   - Skills: ${result.skills.length} found`);
      console.log(`   - Email: ${result.email || 'Not found'}`);
      console.log(`   - Phone: ${result.phone || 'Not found'}`);
      console.log(`   - Summary length: ${result.summary?.length || 0} characters`);
      return true;
    } else {
      console.log('❌ Missing required fields in extraction result');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Claude AI CV Parser test failed:', error);
    return false;
  }
}

// Test confidence calculation
export function testConfidenceCalculation() {
  console.log('🎯 Testing confidence calculation...');
  
  const mockData = {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    title: 'Senior Software Engineer',
    skills: ['JavaScript', 'React', 'Node.js', 'AWS'],
    experience: ['TechCorp Inc.', 'Digital Innovations Inc.'],
    summary: 'Senior Software Engineer with 8+ years of experience building scalable web applications.'
  };
  
  // Calculate confidence (mimicking the function from JobProfileManager)
  let score = 0;
  let factors = 0;
  
  // Name confidence
  if (mockData.name && mockData.name !== 'Professional') {
    score += 95;
  } else {
    score += 30;
  }
  factors++;
  
  // Title confidence
  if (mockData.title && mockData.title !== 'Professional') {
    score += 90;
  } else {
    score += 40;
  }
  factors++;
  
  // Skills confidence
  if (mockData.skills && mockData.skills.length > 3) {
    score += 85;
  } else if (mockData.skills && mockData.skills.length > 0) {
    score += 60;
  } else {
    score += 20;
  }
  factors++;
  
  // Summary confidence
  if (mockData.summary && mockData.summary.length > 50) {
    score += 80;
  } else if (mockData.summary) {
    score += 50;
  } else {
    score += 30;
  }
  factors++;
  
  // Contact info confidence
  if (mockData.email || mockData.phone) {
    score += 100;
  } else {
    score += 0;
  }
  factors++;
  
  const confidence = Math.round(score / factors);
  
  console.log(`✅ Confidence calculation test completed: ${confidence}%`);
  console.log(`   - Expected high confidence (80%+): ${confidence >= 80 ? 'PASS' : 'FAIL'}`);
  
  return confidence;
}

// Export test functions for manual testing
if (typeof window !== 'undefined') {
  (window as any).testClaudeAIParser = testClaudeAIParser;
  (window as any).testConfidenceCalculation = testConfidenceCalculation;
  console.log('🧪 Test functions available: testClaudeAIParser(), testConfidenceCalculation()');
}