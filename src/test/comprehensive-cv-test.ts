// Comprehensive CV Extraction Test
// Tests the enhanced Claude AI CV parsing with structured data

import { RealClaudeCVParser, ComprehensiveCV } from '../lib/real-claude-cv-parser';

// Sample comprehensive CV for testing
const sampleComprehensiveCV = `
SARAH ELIZABETH MARTINEZ
Senior Product Manager & Digital Strategy Leader

📧 sarah.e.martinez@email.com | 📱 +1 (555) 987-6543
🌍 San Francisco, CA 94105 | 💼 linkedin.com/in/sarahmartinez | 🌐 sarahmartinez.dev

PROFESSIONAL SUMMARY
Results-driven Senior Product Manager with 8+ years of experience leading cross-functional teams and driving product strategy for B2B SaaS platforms. Proven track record of launching products that increased revenue by 45% and user engagement by 75%. Expert in agile methodologies, user research, data-driven decision making, and team leadership. Passionate about building products that solve real customer problems at scale.

PROFESSIONAL EXPERIENCE

Senior Product Manager | TechFlow Innovations Inc. | March 2021 - Present
• Lead product strategy for enterprise collaboration platform serving 500K+ active users across 15 countries
• Increased monthly recurring revenue by 35% through strategic feature development and market expansion
• Manage cross-functional team of 15 engineers, 3 designers, and 2 data analysts
• Conducted comprehensive user research and A/B testing that improved conversion rates by 45%
• Implemented OKR framework that increased team productivity by 30% and goal achievement rate to 95%
• Led successful launch of mobile application that achieved 1M+ downloads in first 6 months

Product Manager | DataStream Solutions LLC | June 2019 - February 2021
• Launched AI-powered analytics dashboard that generated $2M in additional annual revenue
• Collaborated with engineering team to deliver 12 major features on time and within budget
• Implemented analytics framework that provided actionable insights for 100+ enterprise clients
• Led competitive analysis and market research for strategic product positioning
• Reduced customer churn by 25% through data-driven product improvements
• Mentored 2 junior product managers and established product development best practices

Associate Product Manager | Innovation Labs Startup | August 2017 - May 2019
• Supported senior product managers in roadmap planning and feature prioritization for fintech platform
• Analyzed user feedback and behavioral metrics to identify improvement opportunities
• Created detailed product requirements and user stories for agile development team
• Participated in customer interviews and usability testing sessions
• Assisted in raising $5M Series A funding through product demonstrations and market analysis

Business Analyst | Corporate Solutions Group | January 2016 - July 2017
• Conducted market research and competitive analysis for digital transformation initiatives
• Created business cases and ROI projections for technology investments
• Collaborated with stakeholders to gather requirements and define project scope
• Developed process improvements that increased operational efficiency by 20%

TECHNICAL SKILLS
Programming & Development: SQL, Python, JavaScript, HTML/CSS, R, REST APIs, GraphQL
Product Management Tools: Jira, Confluence, Figma, Sketch, InVision, Miro, ProductPlan
Analytics & Data: Google Analytics, Mixpanel, Amplitude, Tableau, Looker, Excel, Power BI
Cloud & Infrastructure: AWS, Azure, Docker, Kubernetes, Git, GitHub Actions
Testing & Research: A/B Testing, User Testing, Hotjar, Optimizely, UserVoice

LEADERSHIP & MANAGEMENT SKILLS
Team Leadership, Cross-functional Collaboration, Strategic Planning, Stakeholder Management
Project Management, Agile/Scrum Methodologies, OKR Implementation, Performance Management
Conflict Resolution, Decision Making, Public Speaking, Executive Communication

BUSINESS & STRATEGIC SKILLS
Product Strategy, Market Research, Competitive Analysis, Business Development
Revenue Optimization, Customer Success, Budget Management, Risk Assessment
Go-to-Market Strategy, Pricing Strategy, Partnership Development, Vendor Management

LANGUAGES
English (Native), Spanish (Professional Working Proficiency), French (Conversational)

EDUCATION

Master of Business Administration (MBA) | Stanford Graduate School of Business | 2017
Concentration: Technology Management and Entrepreneurship
GPA: 3.9/4.0 | Dean's List | Relevant Coursework: Strategic Management, Technology Innovation, Data Analytics
Thesis: "AI-Driven Product Development in Enterprise SaaS"

Bachelor of Science in Engineering | University of California, Berkeley | 2015
Major: Industrial Engineering and Operations Research
GPA: 3.7/4.0 | Magna Cum Laude | Dean's List (6 semesters)
Relevant Coursework: Data Structures, Algorithms, Statistics, Operations Research, Systems Design

CERTIFICATIONS & QUALIFICATIONS

Certified Scrum Product Owner (CSPO) | Scrum Alliance | 2022 - 2025
Product Management Certificate | Stanford Continuing Studies | 2020
Google Analytics Individual Qualification (IQ) | Google | 2021 - 2023
AWS Cloud Practitioner | Amazon Web Services | 2022 - 2025
Project Management Professional (PMP) | PMI | 2019 - 2022
Lean Six Sigma Green Belt | ASQ | 2018

AWARDS & ACHIEVEMENTS
• Product Manager of the Year - TechFlow Innovations (2022)
• 40 Under 40 Tech Leaders - Bay Area Business Journal (2021)
• Outstanding MBA Graduate - Stanford GSB (2017)
• Engineering Honor Society - UC Berkeley (2015)

VOLUNTEER EXPERIENCE
Product Mentor | Women in Product San Francisco | 2020 - Present
Board Member | Tech for Good Foundation | 2019 - Present
`;

export async function testComprehensiveCVExtraction(): Promise<{
  success: boolean;
  extractedData?: ComprehensiveCV;
  error?: string;
  analysisReport?: string;
}> {
  console.log('🧪 Testing Comprehensive CV Extraction...');
  
  try {
    // Create a mock file with comprehensive CV data
    const mockFile = new File([sampleComprehensiveCV], 'sarah-martinez-cv.txt', { 
      type: 'text/plain' 
    });
    
    console.log('📄 Created test CV file:', mockFile.name, `(${mockFile.size} bytes)`);
    
    // Set up progress tracking
    const progressUpdates: string[] = [];
    RealClaudeCVParser.setProgressCallback((progress) => {
      const update = `${progress.stage}: ${progress.progress}% - ${progress.message}`;
      progressUpdates.push(update);
      console.log(`⏳ ${update}`);
    });
    
    // Extract CV data using Claude AI
    console.log('🤖 Starting Claude AI extraction...');
    const startTime = Date.now();
    
    const extractedData = await RealClaudeCVParser.extractFromFile(mockFile);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`✅ Extraction completed in ${processingTime}ms`);
    
    // Analyze the extraction results
    const analysisReport = generateAnalysisReport(extractedData, progressUpdates, processingTime);
    
    console.log('📊 Analysis Report:');
    console.log(analysisReport);
    
    // Validate critical extraction requirements
    const validationResults = validateExtractionQuality(extractedData);
    
    if (validationResults.isValid) {
      console.log('🎉 Comprehensive CV extraction test PASSED!');
      return {
        success: true,
        extractedData,
        analysisReport
      };
    } else {
      console.log('❌ Comprehensive CV extraction test FAILED!');
      console.log('Validation issues:', validationResults.issues);
      return {
        success: false,
        extractedData,
        error: `Validation failed: ${validationResults.issues.join(', ')}`,
        analysisReport
      };
    }
    
  } catch (error) {
    console.error('💥 Comprehensive CV extraction test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function generateAnalysisReport(
  data: ComprehensiveCV, 
  progressUpdates: string[], 
  processingTime: number
): string {
  const totalSkills = (data.skills.technical?.length || 0) +
                     (data.skills.leadership?.length || 0) +
                     (data.skills.business?.length || 0) +
                     (data.skills.languages?.length || 0) +
                     (data.skills.other?.length || 0);

  return `
COMPREHENSIVE CV EXTRACTION ANALYSIS REPORT
==========================================

📋 PROCESSING SUMMARY
Processing Time: ${processingTime}ms
Progress Updates: ${progressUpdates.length}
File: ${data.extractionMetadata.fileName}
Timestamp: ${new Date(data.extractionMetadata.timestamp).toLocaleString()}

👤 PERSONAL INFORMATION (Confidence: ${data.confidence.personalInfo}%)
Name: ${data.personalInfo.name}
Email: ${data.personalInfo.email || 'Not found'}
Phone: ${data.personalInfo.phone || 'Not found'}
Location: ${data.personalInfo.location || 'Not found'}
LinkedIn: ${data.personalInfo.linkedin || 'Not found'}
Website: ${data.personalInfo.website || 'Not found'}

📝 PROFESSIONAL SUMMARY (Confidence: ${data.confidence.professionalSummary}%)
Length: ${data.professionalSummary.length} characters
Preview: ${data.professionalSummary.substring(0, 100)}...

💼 WORK EXPERIENCE (Confidence: ${data.confidence.experience}%)
Total Positions: ${data.experience.length}
Experience Details:
${data.experience.map((exp, index) => `
  ${index + 1}. ${exp.jobTitle} at ${exp.company}
     Duration: ${exp.startDate} - ${exp.endDate}
     Achievements: ${exp.achievements.length}
     Responsibilities: ${exp.responsibilities?.length || 0}
     Technologies: ${exp.technologies?.length || 0}
     Auto-extracted: ${exp.autoExtracted ? 'Yes' : 'No'}
`).join('')}

🎯 SKILLS ANALYSIS (Confidence: ${data.confidence.skills}%)
Total Skills: ${totalSkills}
Technical Skills: ${data.skills.technical?.length || 0}
Leadership Skills: ${data.skills.leadership?.length || 0}
Business Skills: ${data.skills.business?.length || 0}
Languages: ${data.skills.languages?.length || 0}
Other Skills: ${data.skills.other?.length || 0}

🎓 EDUCATION (Confidence: ${data.confidence.education}%)
Total Entries: ${data.education.length}
Education Details:
${data.education.map((edu, index) => `
  ${index + 1}. ${edu.degree} - ${edu.institution} (${edu.year})
     Details: ${edu.details || 'None'}
     GPA: ${edu.gpa || 'Not specified'}
     Honors: ${edu.honors || 'None'}
     Auto-extracted: ${edu.autoExtracted ? 'Yes' : 'No'}
`).join('')}

🏆 QUALIFICATIONS (Confidence: ${data.confidence.qualifications}%)
Total Certifications: ${data.qualifications.length}
Qualification Details:
${data.qualifications.map((qual, index) => `
  ${index + 1}. ${qual.name} - ${qual.issuer} (${qual.year})
     Details: ${qual.details || 'None'}
     Expiry: ${qual.expiryDate || 'No expiry'}
     Credential ID: ${qual.credentialId || 'Not specified'}
     Auto-extracted: ${qual.autoExtracted ? 'Yes' : 'No'}
`).join('')}

📊 CONFIDENCE SCORES
Personal Info: ${data.confidence.personalInfo}%
Professional Summary: ${data.confidence.professionalSummary}%
Experience: ${data.confidence.experience}%
Skills: ${data.confidence.skills}%
Education: ${data.confidence.education}%
Qualifications: ${data.confidence.qualifications}%
OVERALL: ${data.confidence.overall}%

🔍 PROGRESS TRACKING
${progressUpdates.map((update, index) => `${index + 1}. ${update}`).join('\n')}

==========================================
`;
}

function validateExtractionQuality(data: ComprehensiveCV): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Validate personal information
  if (!data.personalInfo.name || data.personalInfo.name === 'Professional') {
    issues.push('Name not properly extracted');
  }
  
  if (!data.personalInfo.email && !data.personalInfo.phone) {
    issues.push('No contact information extracted');
  }
  
  // Validate professional summary
  if (!data.professionalSummary || data.professionalSummary.length < 50) {
    issues.push('Professional summary too short or missing');
  }
  
  // Validate experience
  if (data.experience.length === 0) {
    issues.push('No work experience extracted');
  }
  
  // Validate skills
  const totalSkills = (data.skills.technical?.length || 0) +
                     (data.skills.leadership?.length || 0) +
                     (data.skills.business?.length || 0);
  
  if (totalSkills === 0) {
    issues.push('No skills extracted');
  }
  
  // Validate education (should have at least 1 for this comprehensive CV)
  if (data.education.length === 0) {
    issues.push('No education entries extracted');
  }
  
  // Validate overall confidence
  if (data.confidence.overall < 60) {
    issues.push(`Overall confidence too low: ${data.confidence.overall}%`);
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testComprehensiveCVExtraction = testComprehensiveCVExtraction;
  console.log('🧪 Comprehensive CV test available: testComprehensiveCVExtraction()');
}