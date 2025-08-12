// REAL Claude AI CV Parser using actual Claude API
// Uses the existing ai-chat Edge Function to call Claude API

import { supabase } from './supabase';

export interface PersonalInfo {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface WorkExperience {
  id: string; // For UI management
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  achievements: string[];
  responsibilities?: string[];
  technologies?: string[];
  autoExtracted: boolean; // Track if extracted by AI
}

export interface SkillCategories {
  technical: string[];
  leadership: string[];
  business: string[];
  languages?: string[];
  other?: string[];
}

export interface Education {
  id: string; // For UI management
  degree: string;
  institution: string;
  year: string;
  details?: string;
  gpa?: string;
  honors?: string;
  autoExtracted: boolean;
}

export interface Qualification {
  id: string; // For UI management
  name: string;
  issuer: string;
  year: string;
  details?: string;
  expiryDate?: string;
  credentialId?: string;
  autoExtracted: boolean;
}

export interface SectionConfidence {
  personalInfo: number;
  professionalSummary: number;
  experience: number;
  skills: number;
  education: number;
  qualifications: number;
  overall: number;
}

export interface ComprehensiveCV {
  personalInfo: PersonalInfo;
  professionalSummary: string;
  experience: WorkExperience[];
  skills: SkillCategories;
  education: Education[];
  qualifications: Qualification[];
  confidence: SectionConfidence;
  extractionMetadata: {
    timestamp: string;
    fileType: string;
    fileName: string;
    processingTime?: number;
  };
}

// Legacy interface for backward compatibility
export interface ClaudeCV {
  name: string;
  email?: string;
  phone?: string;
  title: string;
  skills: string[];
  experience: string[];
  summary: string;
}

export interface CVProcessingProgress {
  stage: 'reading' | 'sending_to_claude' | 'analyzing_with_ai' | 'parsing_response' | 'complete';
  progress: number;
  message: string;
}

export class RealClaudeCVParser {
  private static progressCallback?: (progress: CVProcessingProgress) => void;

  public static setProgressCallback(callback: (progress: CVProcessingProgress) => void) {
    this.progressCallback = callback;
  }

  private static updateProgress(stage: CVProcessingProgress['stage'], progress: number, message: string) {
    console.log(`RealClaudeCVParser: ${stage} - ${progress}% - ${message}`);
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message });
    }
  }

  // Main extraction method using REAL Claude AI
  public static async extractFromFile(file: File): Promise<ComprehensiveCV> {
    console.log('RealClaudeCVParser: Starting REAL Claude AI extraction for:', file.name);
    console.log('RealClaudeCVParser: File type:', file.type, 'Size:', file.size, 'bytes');
    
    try {
      this.updateProgress('reading', 10, 'Reading CV file...');
      
      // Extract text from file
      const cvText = await this.extractTextFromFile(file);
      console.log('RealClaudeCVParser: Extracted text length:', cvText.length);
      console.log('RealClaudeCVParser: Text preview (first 500 chars):', cvText.substring(0, 500));
      
      // Verify we have substantial content
      if (cvText.length < 100) {
        throw new Error('Extracted text is too short to be a valid CV. Please ensure your file contains readable text.');
      }
      
      this.updateProgress('sending_to_claude', 30, 'Sending CV to Claude AI...');
      
      // Send to REAL Claude AI via Edge Function
      const claudeResult = await this.sendToClaudeAPI(cvText);
      
      this.updateProgress('parsing_response', 80, 'Parsing Claude AI response...');
      
      // Parse Claude's response
      const extractedData = this.parseClaudeResponse(claudeResult);
      
      // Set proper metadata
      extractedData.extractionMetadata = {
        timestamp: new Date().toISOString(),
        fileType: file.type || 'unknown',
        fileName: file.name || 'unknown',
        processingTime: Date.now() // Will be calculated by caller
      };
      
      this.updateProgress('complete', 100, 'Claude AI extraction complete!');
      
      console.log('🎉 RealClaudeCVParser: Claude AI extraction successful!');
      console.log('📋 EXTRACTED DATA SUMMARY:');
      console.log('   👤 Name:', extractedData.personalInfo.name);
      console.log('   📧 Email:', extractedData.personalInfo.email);
      console.log('   📱 Phone:', extractedData.personalInfo.phone);
      console.log('   📍 Location:', extractedData.personalInfo.location);
      console.log('   💼 Experience count:', extractedData.experience.length);
      console.log('   🎓 Education count:', extractedData.education.length);
      console.log('   🏆 Qualifications count:', extractedData.qualifications.length);
      console.log('   📊 Overall confidence:', extractedData.confidence.overall + '%');
      console.log('🔍 DETAILED PERSONAL INFO:', JSON.stringify(extractedData.personalInfo, null, 2));
      
      if (extractedData.experience.length > 0) {
        console.log('💼 EXPERIENCE PREVIEW:');
        extractedData.experience.slice(0, 2).forEach((exp, idx) => {
          console.log(`   ${idx + 1}. ${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${exp.endDate})`);
        });
      }
      
      return extractedData;

    } catch (error) {
      console.error('RealClaudeCVParser: REAL Claude AI extraction failed:', error);
      this.updateProgress('complete', 100, 'CV processing failed');
      
      // Provide specific error messages based on error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Don't fall back to sample data - throw the actual error
      throw new Error(`CV processing failed: ${errorMessage}`);
    }
  }

  // Extract text from different file types with enhanced processing
  private static async extractTextFromFile(file: File): Promise<string> {
    console.log('📄 Processing file type:', file.type, 'Size:', file.size);
    console.log('📄 File name:', file.name);
    
    try {
      // Handle different file types
      switch (file.type) {
        case 'text/plain':
          console.log('📝 Processing as plain text file');
          const plainText = await this.readFileAsText(file);
          console.log('📝 Plain text extracted, length:', plainText.length);
          console.log('📝 Plain text preview:', plainText.substring(0, 200));
          return plainText;
          
        case 'application/pdf':
          console.log('📕 Processing PDF file - attempting text extraction');
          return await this.extractFromPDF(file);
          
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          console.log('📄 Processing Word document');
          return await this.extractFromDOC(file);
          
        default:
          // Try to process as text for unknown types
          console.log('❓ Unknown file type, attempting text extraction');
          const unknownText = await this.readFileAsText(file);
          console.log('❓ Unknown file text extracted, length:', unknownText.length);
          if (unknownText && unknownText.length > 50) {
            console.log('❓ Unknown file text preview:', unknownText.substring(0, 200));
            return unknownText;
          }
          throw new Error(`Unsupported file type: ${file.type}. Please upload a TXT file or provide CV text manually.`);
      }
    } catch (error) {
      console.error('❌ CRITICAL: File extraction completely failed:', error);
      console.error('❌ File details - Name:', file.name, 'Type:', file.type, 'Size:', file.size);
      throw error; // Don't fall back to sample data - let the user know extraction failed
    }
  }
  
  // Enhanced PDF text extraction
  private static async extractFromPDF(file: File): Promise<string> {
    console.log('🔍 Extracting text from PDF...');
    console.log('🔍 PDF file size:', file.size, 'bytes');
    console.log('🔍 PDF file name:', file.name);
    
    // Simulate PDF processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Try basic text extraction first (for PDFs that might have text content)
      const text = await this.readFileAsText(file);
      console.log('🔍 Raw PDF text extracted, length:', text.length);
      console.log('🔍 Raw PDF text preview (first 500 chars):', text.substring(0, 500));
      
      // Most PDFs are binary and will contain '%PDF' - this is expected
      if (text.includes('%PDF')) {
        console.warn('❌ CRITICAL: PDF contains binary data and cannot be processed as plain text');
        console.warn('❌ This PDF requires a proper PDF parsing library (PDF.js or pdf-parse)');
        console.warn('❌ For now, please save your CV as a TXT file and upload that instead');
        throw new Error(`PDF processing not fully implemented. Please save your CV as a plain text (.txt) file for accurate extraction. 

Your PDF appears to contain binary data that requires specialized parsing. To get your real CV data extracted:
1. Open your CV in Word/Google Docs
2. Save it as a plain text (.txt) file  
3. Upload the .txt file instead

This will ensure your actual CV content (not sample data) is extracted and used.`);
      }
      
      if (text && text.length > 100) {
        console.log('✅ Successfully extracted readable text from PDF (rare - likely a text-based PDF)');
        return text;
      }
      
      if (text.length <= 100) {
        console.warn('❌ PDF text extraction yielded insufficient content');
        throw new Error('PDF text extraction failed. Please save your CV as a .txt file for accurate processing.');
      }
      
    } catch (error) {
      console.error('❌ PDF text extraction failed:', error);
      // Don't fallback to demonstration data - throw the error so user knows why
      throw error;
    }
    
    throw new Error('PDF processing failed. Please convert your CV to a .txt file for accurate extraction.');
  }
  
  // Enhanced DOC/DOCX text extraction
  private static async extractFromDOC(file: File): Promise<string> {
    console.log('🔍 Extracting text from Word document...');
    console.log('🔍 DOC file size:', file.size, 'bytes');
    console.log('🔍 DOC file name:', file.name);
    
    // Simulate document processing time
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    try {
      // Try basic text extraction first
      const text = await this.readFileAsText(file);
      console.log('🔍 Raw DOC text extracted, length:', text.length);
      console.log('🔍 Raw DOC text preview (first 500 chars):', text.substring(0, 500));
      
      if (text && text.length > 100 && !text.includes('PK')) {
        console.log('✅ Successfully extracted text from Word document');
        return text;
      }
      
      // Word documents are often binary/compressed (DOCX files contain 'PK' zip signatures)
      if (text.includes('PK') || text.length <= 100) {
        console.warn('❌ CRITICAL: Word document contains binary/compressed data');
        console.warn('❌ This document requires specialized parsing (mammoth.js for DOCX)');
        console.warn('❌ For accurate extraction, please save as TXT file');
        throw new Error(`Word document processing not fully implemented. Please save your CV as a plain text (.txt) file for accurate extraction.

Your document appears to be in binary format that requires specialized parsing. To get your real CV data extracted:
1. Open your CV in Word/Google Docs
2. Save it as a plain text (.txt) file
3. Upload the .txt file instead

This will ensure your actual CV content (not sample data) is extracted and used.`);
      }
      
    } catch (error) {
      console.error('❌ Word document text extraction failed:', error);
      // Don't fallback to demonstration data - throw the error so user knows why
      throw error;
    }
    
    throw new Error('Word document processing failed. Please convert your CV to a .txt file for accurate extraction.');
  }

  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        resolve(text || '');
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  // Send CV text to REAL Claude AI using existing Edge Function
  private static async sendToClaudeAPI(cvText: string): Promise<string> {
    console.log('🤖 RealClaudeCVParser: Calling REAL Claude AI via Edge Function...');
    console.log('   - CV text length:', cvText.length);
    console.log('   - CV text preview (first 1000 chars):');
    console.log('---START CV TEXT---');
    console.log(cvText.substring(0, 1000));
    console.log('---END CV TEXT PREVIEW---');
    
    this.updateProgress('analyzing_with_ai', 50, 'Claude AI is analyzing your CV...');
    
    const prompt = `Extract comprehensive professional data from this CV and return detailed JSON in this EXACT format. Be thorough and extract ALL information found:

{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, State/Country",
    "linkedin": "linkedin.com/in/profile",
    "website": "portfolio-website.com"
  },
  "professionalSummary": "Comprehensive professional summary paragraph highlighting key experience, skills, and career objectives",
  "experience": [
    {
      "jobTitle": "Job Title",
      "company": "Company Name",
      "startDate": "MM/YYYY or Month Year",
      "endDate": "MM/YYYY or Present",
      "current": false,
      "achievements": [
        "Specific achievement with metrics",
        "Another quantified accomplishment"
      ],
      "responsibilities": [
        "Key responsibility",
        "Another responsibility"
      ],
      "technologies": ["Tech1", "Tech2"]
    }
  ],
  "skills": {
    "technical": ["Programming languages", "Frameworks", "Tools"],
    "leadership": ["Team management", "Project leadership"],
    "business": ["Strategic planning", "Business analysis"],
    "languages": ["English (Native)", "Spanish (Fluent)"],
    "other": ["Other relevant skills"]
  },
  "education": [
    {
      "degree": "Degree Type and Major",
      "institution": "University/School Name",
      "year": "YYYY or YYYY-YYYY",
      "details": "Relevant coursework, thesis, projects",
      "gpa": "3.8/4.0",
      "honors": "Magna Cum Laude, Dean's List"
    }
  ],
  "qualifications": [
    {
      "name": "Certification/License Name", 
      "issuer": "Issuing Organization",
      "year": "YYYY",
      "details": "Additional details about the qualification",
      "expiryDate": "MM/YYYY if applicable",
      "credentialId": "ID if available"
    }
  ]
}

EXTRACTION GUIDELINES:
1. Extract ALL work experience, education, and certifications found
2. For experience: Include ALL jobs, internships, volunteer work
3. For skills: Categorize appropriately (technical, leadership, business, languages)
4. For achievements: Extract quantified results and specific accomplishments
5. For dates: Use consistent format (MM/YYYY or Month Year)
6. For current positions: Set "current": true and "endDate": "Present"
7. If information is missing, use null or empty array, don't make up data
8. Be thorough - extract everything relevant to professional profile

CV Text:
${cvText}

Return ONLY the JSON object, no other text or markdown:`;

    try {
      console.log('📡 RealClaudeCVParser: Invoking ai-chat Edge Function...');
      console.log('   - Prompt length:', prompt.length);
      
      // Add timeout for the request
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000)
      );
      
      const requestPromise = supabase.functions.invoke('ai-chat', {
        body: {
          message: prompt,
          context: 'cv_parsing'
        }
      });
      
      console.log('⏳ Waiting for Claude AI response (max 30s)...');
      const { data, error } = await Promise.race([requestPromise, timeoutPromise]) as any;

      console.log('📥 Edge Function response received');
      console.log('   - Error:', error);
      console.log('   - Data keys:', data ? Object.keys(data) : 'no data');

      if (error) {
        console.error('❌ RealClaudeCVParser: Edge Function error:', error);
        console.error('   - Error type:', typeof error);
        console.error('   - Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Edge Function error: ${JSON.stringify(error)}`);
      }

      if (!data) {
        console.error('❌ No data returned from Edge Function');
        throw new Error('No data returned from Edge Function');
      }

      console.log('📋 Full Edge Function response:', JSON.stringify(data, null, 2));

      // Check for different response formats
      if (data.error) {
        console.error('❌ Edge Function returned error:', data.error);
        throw new Error(`Claude API error: ${data.error}${data.details ? ` - ${data.details}` : ''}`);
      }

      if (!data.response) {
        console.error('❌ No response field in Edge Function data');
        console.error('   - Available fields:', Object.keys(data));
        throw new Error('No response field in Edge Function data');
      }

      console.log('✅ RealClaudeCVParser: Received Claude AI response');
      console.log('   - Response length:', data.response.length);
      console.log('   - Response preview:', data.response.substring(0, 200) + '...');
      
      return data.response;

    } catch (error) {
      console.error('💥 RealClaudeCVParser: Error calling Claude API:', error);
      console.error('   - Error type:', error.constructor.name);
      console.error('   - Error message:', error.message);
      
      // Provide more specific error messages
      if (error.message.includes('timeout')) {
        throw new Error('Claude AI request timed out. Please try again.');
      } else if (error.message.includes('Network')) {
        throw new Error('Network error connecting to Claude AI. Please check your connection.');
      } else if (error.message.includes('API key')) {
        throw new Error('Claude API configuration error. Please contact support.');
      } else {
        throw new Error(`Claude AI processing failed: ${error.message}`);
      }
    }
  }

  // Parse Claude's JSON response
  private static parseClaudeResponse(response: string): ComprehensiveCV {
    console.log('🔍 RealClaudeCVParser: Parsing Claude AI response...');
    console.log('   - Response length:', response.length);
    console.log('   - Response preview:', response.substring(0, 500) + '...');
    
    try {
      // Try to find JSON in the response (Claude might include markdown or other text)
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Look for JSON object pattern
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ No JSON object found in Claude response, trying to extract from text...');
        throw new Error('No JSON found in Claude response');
      }
      
      jsonStr = jsonMatch[0];
      console.log('📋 Extracted JSON string:', jsonStr);
      
      const parsed = JSON.parse(jsonStr);
      console.log('✅ JSON parsed successfully:', parsed);
      
      // Generate unique IDs for entries
      const generateId = () => Math.random().toString(36).substr(2, 9);
      
      // Process experience entries
      const experience: WorkExperience[] = (parsed.experience || []).map((exp: any) => ({
        id: generateId(),
        jobTitle: exp.jobTitle || 'Position',
        company: exp.company || 'Company',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        current: exp.current || false,
        achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
        responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
        technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
        autoExtracted: true
      }));
      
      // Process education entries
      const education: Education[] = (parsed.education || []).map((edu: any) => ({
        id: generateId(),
        degree: edu.degree || 'Degree',
        institution: edu.institution || 'Institution',
        year: edu.year || '',
        details: edu.details || '',
        gpa: edu.gpa || undefined,
        honors: edu.honors || undefined,
        autoExtracted: true
      }));
      
      // Process qualifications
      const qualifications: Qualification[] = (parsed.qualifications || []).map((qual: any) => ({
        id: generateId(),
        name: qual.name || 'Qualification',
        issuer: qual.issuer || 'Issuer',
        year: qual.year || '',
        details: qual.details || '',
        expiryDate: qual.expiryDate || undefined,
        credentialId: qual.credentialId || undefined,
        autoExtracted: true
      }));
      
      // Calculate section confidence scores
      const confidence: SectionConfidence = {
        personalInfo: this.calculatePersonalInfoConfidence(parsed.personalInfo),
        professionalSummary: parsed.professionalSummary ? 90 : 30,
        experience: experience.length > 0 ? 85 : 20,
        skills: this.calculateSkillsConfidence(parsed.skills),
        education: education.length > 0 ? 80 : 20,
        qualifications: qualifications.length > 0 ? 80 : 20,
        overall: 0
      };
      
      // Calculate overall confidence
      confidence.overall = Math.round((
        confidence.personalInfo * 0.2 +
        confidence.professionalSummary * 0.15 +
        confidence.experience * 0.25 +
        confidence.skills * 0.2 +
        confidence.education * 0.1 +
        confidence.qualifications * 0.1
      ));
      
      // Validate and ensure all required fields with detailed logging
      const extractedData: ComprehensiveCV = {
        personalInfo: {
          name: parsed.personalInfo?.name || 'Professional',
          email: parsed.personalInfo?.email || undefined,
          phone: parsed.personalInfo?.phone || undefined,
          location: parsed.personalInfo?.location || undefined,
          linkedin: parsed.personalInfo?.linkedin || undefined,
          website: parsed.personalInfo?.website || undefined
        },
        professionalSummary: parsed.professionalSummary || 'Experienced professional with expertise in their field.',
        experience,
        skills: {
          technical: Array.isArray(parsed.skills?.technical) ? parsed.skills.technical : [],
          leadership: Array.isArray(parsed.skills?.leadership) ? parsed.skills.leadership : [],
          business: Array.isArray(parsed.skills?.business) ? parsed.skills.business : [],
          languages: Array.isArray(parsed.skills?.languages) ? parsed.skills.languages : [],
          other: Array.isArray(parsed.skills?.other) ? parsed.skills.other : []
        },
        education,
        qualifications,
        confidence,
        extractionMetadata: {
          timestamp: new Date().toISOString(),
          fileType: 'unknown', // Will be set by caller
          fileName: 'unknown'   // Will be set by caller
        }
      };
      
      console.log('🎉 RealClaudeCVParser: Successfully parsed comprehensive Claude response:');
      console.log('   - Name:', extractedData.personalInfo.name);
      console.log('   - Email:', extractedData.personalInfo.email);
      console.log('   - Phone:', extractedData.personalInfo.phone);
      console.log('   - Location:', extractedData.personalInfo.location);
      console.log('   - Experience entries:', extractedData.experience.length);
      console.log('   - Education entries:', extractedData.education.length);
      console.log('   - Qualifications:', extractedData.qualifications.length);
      console.log('   - Technical skills:', extractedData.skills.technical.length);
      console.log('   - Overall confidence:', extractedData.confidence.overall + '%');
      
      return extractedData;
      
    } catch (error) {
      console.error('❌ RealClaudeCVParser: Error parsing Claude response:', error);
      console.error('   - Error type:', error.constructor.name);
      console.error('   - Error message:', error.message);
      console.log('📝 Raw Claude response was:', response);
      
      // Try to extract some basic information from the text response
      console.log('🔧 Attempting fallback text extraction...');
      const fallbackData = this.extractFallbackData(response);
      
      console.log('⚠️ Using fallback data extraction:', fallbackData);
      return fallbackData;
    }
  }
  
  // Calculate confidence for personal info section
  private static calculatePersonalInfoConfidence(personalInfo: any): number {
    if (!personalInfo) return 20;
    
    let score = 0;
    let factors = 0;
    
    // Name confidence
    if (personalInfo.name && personalInfo.name !== 'Professional') {
      score += 95;
    } else {
      score += 30;
    }
    factors++;
    
    // Contact info confidence
    if (personalInfo.email) score += 100;
    if (personalInfo.phone) score += 100;
    if (personalInfo.location) score += 80;
    if (personalInfo.linkedin) score += 80;
    if (personalInfo.website) score += 60;
    factors += 5;
    
    return Math.round(score / factors);
  }
  
  // Calculate confidence for skills section
  private static calculateSkillsConfidence(skills: any): number {
    if (!skills) return 20;
    
    const totalSkills = (skills.technical?.length || 0) +
                       (skills.leadership?.length || 0) +
                       (skills.business?.length || 0) +
                       (skills.languages?.length || 0) +
                       (skills.other?.length || 0);
    
    if (totalSkills >= 10) return 90;
    if (totalSkills >= 5) return 75;
    if (totalSkills >= 3) return 60;
    if (totalSkills >= 1) return 40;
    return 20;
  }

  // Fallback data extraction from non-JSON responses
  private static extractFallbackData(text: string): ComprehensiveCV {
    console.log('🔧 Performing fallback extraction from text response...');
    
    // Simple regex patterns to extract key information
    const nameMatch = text.match(/name[:\s]+([^\n,]+)/i);
    const emailMatch = text.match(/email[:\s]+([^\s,\n]+@[^\s,\n]+)/i);
    const phoneMatch = text.match(/phone[:\s]+([+\d\s\-()]+)/i);
    const titleMatch = text.match(/title[:\s]+([^\n,]+)/i);
    
    // Extract skills (look for skills section)
    const skillsMatch = text.match(/skills?[:\s]+([^\n]+)/i);
    let skills: string[] = [];
    if (skillsMatch) {
      skills = skillsMatch[1]
        .split(/[,;]/)
        .map(s => s.trim().replace(/["\[\]]/g, ''))
        .filter(s => s.length > 0)
        .slice(0, 10); // Limit to 10 skills
    }
    
    // Create summary from available text
    const summaryMatch = text.match(/summary[:\s]+([^\n]+)/i);
    let summary = 'Experienced professional with expertise in their field.';
    if (summaryMatch) {
      summary = summaryMatch[1].trim().replace(/["\[\]]/g, '');
    }
    
    const fallbackData: ComprehensiveCV = {
      personalInfo: {
        name: nameMatch ? nameMatch[1].trim().replace(/["\[\]]/g, '') : 'Professional',
        email: emailMatch ? emailMatch[1].trim() : undefined,
        phone: phoneMatch ? phoneMatch[1].trim() : undefined,
        location: undefined,
        linkedin: undefined,
        website: undefined
      },
      professionalSummary: summary,
      experience: [],
      skills: {
        technical: skills.filter(s => s.toLowerCase().includes('javascript') || s.toLowerCase().includes('python') || s.toLowerCase().includes('react')),
        leadership: skills.filter(s => s.toLowerCase().includes('leadership') || s.toLowerCase().includes('management')),
        business: skills.filter(s => s.toLowerCase().includes('business') || s.toLowerCase().includes('strategy')),
        languages: skills.filter(s => s.toLowerCase().includes('english') || s.toLowerCase().includes('spanish')),
        other: skills.filter(s => !['technical', 'leadership', 'business', 'languages'].some(cat => 
          s.toLowerCase().includes(cat.toLowerCase())))
      },
      education: [],
      qualifications: [],
      confidence: {
        personalInfo: nameMatch ? 60 : 30,
        professionalSummary: summary ? 50 : 20,
        experience: 20,
        skills: skills.length > 0 ? 40 : 20,
        education: 20,
        qualifications: 20,
        overall: 35
      },
      extractionMetadata: {
        timestamp: new Date().toISOString(),
        fileType: 'fallback',
        fileName: 'fallback'
      }
    };
    
    console.log('✅ Fallback extraction completed:', fallbackData);
    return fallbackData;
  }

  // Comprehensive demonstration CV for PDF processing
  private static getComprehensiveDemonstrationCV(): string {
    return `ALEX RODRIGUEZ
Senior Software Engineer & Technical Lead

📧 alex.rodriguez@email.com | 📱 +1 (555) 234-5678
🌍 Austin, TX 78701 | 💼 linkedin.com/in/alexrodriguez | 🌐 alexrodriguez.dev

PROFESSIONAL SUMMARY
Senior Software Engineer with 8+ years of experience building scalable web applications and leading cross-functional teams. Expertise in full-stack development, cloud architecture, and agile methodologies. Proven track record of delivering high-impact projects that improved system performance by 60% and user engagement by 45%.

PROFESSIONAL EXPERIENCE

Senior Software Engineer | TechFlow Systems Inc. | March 2021 - Present
• Lead development of microservices architecture serving 2M+ daily active users
• Architected and implemented CI/CD pipeline reducing deployment time by 75%
• Mentored team of 6 junior developers and established code review best practices
• Optimized database queries resulting in 50% improvement in response times
• Spearheaded migration to Kubernetes, improving system reliability to 99.9% uptime

Software Engineer | DataVision Solutions | June 2019 - February 2021
• Developed RESTful APIs handling 100K+ requests per day with sub-200ms response times
• Built real-time analytics dashboard using React and D3.js for executive reporting
• Implemented automated testing suite achieving 95% code coverage
• Collaborated with product team to define technical requirements and user stories
• Reduced critical bugs by 60% through implementation of comprehensive error handling

Full Stack Developer | StartupVenture Inc. | August 2017 - May 2019
• Built responsive web applications using React, Node.js, and PostgreSQL
• Developed mobile-first approach increasing mobile user engagement by 40%
• Integrated third-party APIs for payment processing and user authentication
• Participated in agile development cycles with 2-week sprint deliveries
• Created technical documentation and conducted knowledge transfer sessions

Junior Developer | Innovation Labs | January 2016 - July 2017
• Developed features for e-commerce platform processing $2M+ monthly transactions
• Collaborated with senior developers on code reviews and architectural decisions
• Implemented responsive design principles improving cross-device compatibility
• Contributed to open-source projects and maintained legacy codebases

TECHNICAL SKILLS
Programming Languages: JavaScript, TypeScript, Python, Java, Go, SQL
Frontend: React, Vue.js, Angular, HTML5, CSS3, SASS, Responsive Design
Backend: Node.js, Express, Django, Spring Boot, RESTful APIs, GraphQL
Cloud & Infrastructure: AWS, Docker, Kubernetes, Terraform, Jenkins, GitHub Actions
Databases: PostgreSQL, MongoDB, Redis, DynamoDB, MySQL
Tools & Platforms: Git, Jira, Confluence, Postman, DataDog, New Relic

LEADERSHIP & MANAGEMENT SKILLS
Team Leadership, Technical Mentoring, Code Reviews, Architecture Design
Project Management, Agile/Scrum, Cross-functional Collaboration
Strategic Planning, Technical Decision Making, Stakeholder Communication

BUSINESS & STRATEGIC SKILLS
Product Development, User Experience Optimization, Performance Analysis
Business Requirements Analysis, Cost Optimization, Risk Assessment
Technical Documentation, Knowledge Transfer, Process Improvement

LANGUAGES
English (Native), Spanish (Professional Working Proficiency), Portuguese (Conversational)

EDUCATION

Master of Science in Computer Science | University of Texas at Austin | 2016
Concentration: Software Engineering and Distributed Systems
GPA: 3.9/4.0 | Thesis: "Scalable Microservices Architecture for High-Traffic Applications"
Relevant Coursework: Advanced Algorithms, Database Systems, Software Architecture

Bachelor of Science in Computer Engineering | Texas A&M University | 2014
GPA: 3.7/4.0 | Magna Cum Laude | Dean's List (6 semesters)
Relevant Coursework: Data Structures, Operating Systems, Computer Networks, Software Engineering

CERTIFICATIONS & QUALIFICATIONS

AWS Certified Solutions Architect - Professional | Amazon Web Services | 2023 - 2026
Certified Kubernetes Administrator (CKA) | Cloud Native Computing Foundation | 2022 - 2025
Professional Scrum Master (PSM I) | Scrum.org | 2021 - 2024
Google Cloud Professional Developer | Google Cloud | 2020 - 2023
Oracle Certified Java Professional | Oracle | 2019 - 2022

AWARDS & ACHIEVEMENTS
• Technical Excellence Award - TechFlow Systems (2023)
• Innovation Award for CI/CD Pipeline Implementation (2022)
• Outstanding Graduate Student - UT Austin Computer Science (2016)
• Dean's List Recognition - Texas A&M University (2012-2014)

PROJECTS & OPEN SOURCE
• Contributor to React Native community with 500+ GitHub stars
• Technical blogger with 50K+ monthly readers on Medium
• Speaker at Austin Tech Conference 2022 and 2023`;
  }

  // Comprehensive sample CV for demonstration
  private static getComprehensiveSampleCV(): string {
    return `SARAH ELIZABETH MARTINEZ
Senior Product Manager & Digital Strategy Leader

📧 sarah.e.martinez@email.com | 📱 +1 (555) 987-6543
🌍 San Francisco, CA 94105 | 💼 linkedin.com/in/sarahmartinez | 🌐 sarahmartinez.dev

PROFESSIONAL SUMMARY
Results-driven Senior Product Manager with 8+ years of experience leading cross-functional teams and driving product strategy for B2B SaaS platforms. Proven track record of launching products that increased revenue by 45% and user engagement by 75%. Expert in agile methodologies, user research, data-driven decision making, and team leadership.

PROFESSIONAL EXPERIENCE

Senior Product Manager | TechFlow Innovations Inc. | March 2021 - Present
• Lead product strategy for enterprise collaboration platform serving 500K+ active users
• Increased monthly recurring revenue by 35% through strategic feature development  
• Manage cross-functional team of 15 engineers, 3 designers, and 2 data analysts
• Conducted comprehensive user research and A/B testing that improved conversion rates by 45%
• Implemented OKR framework that increased team productivity by 30%

Product Manager | DataStream Solutions LLC | June 2019 - February 2021
• Launched AI-powered analytics dashboard that generated $2M in additional annual revenue
• Collaborated with engineering team to deliver 12 major features on time and within budget
• Implemented analytics framework that provided actionable insights for 100+ enterprise clients
• Led competitive analysis and market research for strategic product positioning
• Reduced customer churn by 25% through data-driven product improvements

Associate Product Manager | Innovation Labs Startup | August 2017 - May 2019
• Supported senior product managers in roadmap planning and feature prioritization
• Analyzed user feedback and behavioral metrics to identify improvement opportunities
• Created detailed product requirements and user stories for agile development team
• Participated in customer interviews and usability testing sessions

TECHNICAL SKILLS
Programming & Development: SQL, Python, JavaScript, HTML/CSS, R, REST APIs
Product Management Tools: Jira, Confluence, Figma, Sketch, InVision, Miro
Analytics & Data: Google Analytics, Mixpanel, Amplitude, Tableau, Looker
Cloud & Infrastructure: AWS, Azure, Docker, Kubernetes, Git, GitHub Actions

LEADERSHIP & MANAGEMENT SKILLS  
Team Leadership, Cross-functional Collaboration, Strategic Planning, Stakeholder Management
Project Management, Agile/Scrum Methodologies, OKR Implementation
Performance Management, Conflict Resolution, Decision Making, Public Speaking

BUSINESS & STRATEGIC SKILLS
Product Strategy, Market Research, Competitive Analysis, Business Development
Revenue Optimization, Customer Success, Budget Management, Risk Assessment
Go-to-Market Strategy, Pricing Strategy, Partnership Development

LANGUAGES
English (Native), Spanish (Professional Working Proficiency), French (Conversational)

EDUCATION

Master of Business Administration (MBA) | Stanford Graduate School of Business | 2017
Concentration: Technology Management and Entrepreneurship
GPA: 3.9/4.0 | Dean's List | Relevant Coursework: Strategic Management, Technology Innovation
Thesis: "AI-Driven Product Development in Enterprise SaaS"

Bachelor of Science in Engineering | University of California, Berkeley | 2015
Major: Industrial Engineering and Operations Research  
GPA: 3.7/4.0 | Magna Cum Laude | Dean's List (6 semesters)
Relevant Coursework: Data Structures, Algorithms, Statistics, Operations Research

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
• Engineering Honor Society - UC Berkeley (2015)`;
  }

  // Legacy sample CV for backward compatibility
  private static getSampleCV(): string {
    return `SARAH MARTINEZ
sarah.martinez@email.com | (555) 987-6543 | San Francisco, CA

PROFESSIONAL SUMMARY
Senior Product Manager with 7+ years of experience leading cross-functional teams and driving product strategy for B2B SaaS platforms. Proven track record of launching products that increased revenue by 40% and user engagement by 60%. Expert in agile methodologies, user research, and data-driven decision making.

WORK EXPERIENCE

Senior Product Manager | TechFlow Inc. | 2021 - Present
• Lead product strategy for enterprise collaboration platform serving 500K+ users
• Increased monthly recurring revenue by 35% through strategic feature development
• Manage cross-functional team of 12 engineers, designers, and analysts
• Conducted user research and A/B testing that improved conversion rates by 45%

Product Manager | DataStream Solutions | 2019 - 2021
• Launched mobile application that achieved 1M+ downloads in first year
• Collaborated with engineering team to deliver features on time and within budget
• Implemented analytics framework that provided actionable insights for business decisions
• Led competitive analysis and market research for product positioning

Associate Product Manager | StartupVenture | 2017 - 2019
• Supported senior product managers in roadmap planning and feature prioritization
• Analyzed user feedback and metrics to identify improvement opportunities
• Created detailed product requirements and user stories for development team

SKILLS
Product Strategy, Agile/Scrum, User Research, Data Analytics, SQL, A/B Testing, Wireframing, Project Management, Stakeholder Management, Market Research, Customer Development, Product Marketing, Business Analysis, Strategic Planning

EDUCATION
Master of Business Administration (MBA) | Stanford University | 2017
Bachelor of Science in Engineering | UC Berkeley | 2015

CERTIFICATIONS
Certified Scrum Product Owner (CSPO) | 2020
Google Analytics Certified | 2019
AWS Cloud Practitioner | 2021`;
  }
}