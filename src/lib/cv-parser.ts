// CV Parser utility for extracting text and structured data from uploaded files
// Uses browser APIs to parse PDF and DOC files

export interface CVExtractionResult {
  name: string;
  title: string;
  bio: string;
  skills: string[];
  email?: string;
  phone?: string;
  experience?: string[];
  education?: string[];
  raw_text?: string;
}

export class CVParser {
  // Extract text from PDF using PDF.js (if available) or fallback to file reader
  static async extractFromPDF(file: File): Promise<string> {
    try {
      // For now, we'll simulate PDF text extraction
      // In a real implementation, you'd use PDF.js or pdf-parse
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
      
      // Simulate extracted text from a PDF
      const mockPDFText = `
        John Smith
        Senior Software Engineer
        
        Email: john.smith@email.com
        Phone: (555) 123-4567
        
        PROFESSIONAL SUMMARY
        Experienced full-stack developer with 8+ years building scalable web applications. 
        Passionate about clean code, user experience, and modern development practices.
        
        SKILLS
        JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Kubernetes, 
        PostgreSQL, MongoDB, Git, Agile, Test-Driven Development
        
        EXPERIENCE
        Senior Software Engineer | TechCorp Inc. | 2020 - Present
        - Led development of microservices architecture serving 1M+ users
        - Mentored junior developers and established coding standards
        - Improved application performance by 40% through optimization
        
        Software Engineer | StartupXYZ | 2018 - 2020  
        - Built responsive React applications with Node.js backends
        - Implemented CI/CD pipelines using Docker and AWS
        
        EDUCATION
        Bachelor of Science in Computer Science | State University | 2018
        Relevant Coursework: Data Structures, Algorithms, Software Engineering
      `;
      
      return mockPDFText.trim();
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // Extract text from DOC/DOCX files
  static async extractFromDOC(file: File): Promise<string> {
    try {
      // For now, we'll simulate DOC text extraction
      // In a real implementation, you'd use mammoth.js for DOCX files
      await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate processing time
      
      // Simulate extracted text from a DOC file
      const mockDOCText = `
        Sarah Johnson
        Product Manager
        
        Contact: sarah.johnson@email.com | (555) 987-6543
        
        ABOUT ME
        Strategic product leader with expertise in B2B SaaS platforms. 
        Proven track record of launching successful products and driving user engagement.
        
        CORE COMPETENCIES  
        Product Strategy, Agile Methodology, SQL, Data Analytics, User Research, 
        Roadmap Planning, Stakeholder Management, A/B Testing, Wireframing
        
        PROFESSIONAL EXPERIENCE
        Senior Product Manager | SaaS Solutions Ltd. | 2021 - Present
        - Led product strategy for enterprise platform with $5M ARR
        - Increased user engagement by 60% through data-driven feature development
        - Managed cross-functional teams of 12+ engineers and designers
        
        Product Manager | Digital Innovations | 2019 - 2021
        - Launched 3 major product features resulting in 25% revenue growth
        - Conducted user research and competitive analysis
        
        EDUCATION
        MBA in Technology Management | Business School | 2019
        BS in Engineering | Tech University | 2017
      `;
      
      return mockDOCText.trim();
    } catch (error) {
      console.error('Error extracting DOC text:', error);
      throw new Error('Failed to extract text from DOC file');
    }
  }

  // Parse extracted text to find structured data
  static parseTextToStructuredData(text: string): CVExtractionResult {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Extract name (usually first non-empty line)
    const name = this.extractName(lines);
    
    // Extract title/role (usually second line or after name)
    const title = this.extractTitle(lines, name);
    
    // Extract email
    const email = this.extractEmail(text);
    
    // Extract phone
    const phone = this.extractPhone(text);
    
    // Extract skills
    const skills = this.extractSkills(text);
    
    // Extract experience
    const experience = this.extractExperience(text);
    
    // Extract education
    const education = this.extractEducation(text);
    
    // Create bio from summary or experience
    const bio = this.extractBio(text, experience);

    return {
      name,
      title,
      bio,
      skills,
      email,
      phone,
      experience,
      education,
      raw_text: text
    };
  }

  private static extractName(lines: string[]): string {
    // Name is typically the first substantive line
    for (const line of lines) {
      if (line.length > 2 && 
          !line.includes('@') && 
          !line.includes('(') && 
          !line.toLowerCase().includes('resume') &&
          !line.toLowerCase().includes('cv') &&
          line.split(' ').length >= 2 &&
          line.split(' ').length <= 4) {
        return line;
      }
    }
    return 'Unknown Name';
  }

  private static extractTitle(lines: string[], name: string): string {
    const nameIndex = lines.findIndex(line => line.includes(name));
    if (nameIndex >= 0 && nameIndex + 1 < lines.length) {
      const potentialTitle = lines[nameIndex + 1];
      if (potentialTitle && 
          !potentialTitle.includes('@') && 
          !potentialTitle.includes('(') &&
          potentialTitle.length < 100) {
        return potentialTitle;
      }
    }
    
    // Look for common title patterns
    const titlePatterns = [
      /engineer/i, /developer/i, /manager/i, /director/i, /analyst/i,
      /designer/i, /consultant/i, /specialist/i, /coordinator/i, /lead/i
    ];
    
    for (const line of lines) {
      if (titlePatterns.some(pattern => pattern.test(line)) && line.length < 100) {
        return line;
      }
    }
    
    return 'Professional';
  }

  private static extractEmail(text: string): string | undefined {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailRegex);
    return match ? match[0] : undefined;
  }

  private static extractPhone(text: string): string | undefined {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const match = text.match(phoneRegex);
    return match ? match[0] : undefined;
  }

  private static extractSkills(text: string): string[] {
    const skillsSection = this.findSection(text, ['skills', 'competencies', 'technologies', 'technical skills']);
    if (!skillsSection) return [];

    // Common skill patterns
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
      'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'SQL', 'MongoDB', 'PostgreSQL',
      'HTML', 'CSS', 'Vue.js', 'Angular', 'Express', 'Django', 'Flask', 'Spring',
      'Product Management', 'Agile', 'Scrum', 'Analytics', 'User Research', 'Figma',
      'Machine Learning', 'Data Science', 'TensorFlow', 'Tableau', 'Excel', 'PowerBI'
    ];

    const foundSkills: string[] = [];
    
    // Split by common separators and clean up
    const skillText = skillsSection.replace(/[•\-\*]/g, ',');
    const skillCandidates = skillText.split(/[,\n\|]/).map(s => s.trim());
    
    for (const candidate of skillCandidates) {
      // Check if it matches common skills (case insensitive)
      const matchedSkill = commonSkills.find(skill => 
        skill.toLowerCase() === candidate.toLowerCase()
      );
      
      if (matchedSkill && !foundSkills.includes(matchedSkill)) {
        foundSkills.push(matchedSkill);
      } else if (candidate.length > 2 && candidate.length < 30 && 
                 !candidate.includes(' ') && 
                 foundSkills.length < 15) {
        // Add other reasonable skill candidates
        foundSkills.push(candidate);
      }
    }

    return foundSkills.slice(0, 10); // Limit to 10 skills
  }

  private static extractExperience(text: string): string[] {
    const experienceSection = this.findSection(text, ['experience', 'work history', 'employment', 'professional experience']);
    if (!experienceSection) return [];

    // Split into job entries (usually separated by years or company names)
    const jobPattern = /\d{4}\s*[-–]\s*(?:\d{4}|present|current)/gi;
    const jobs = experienceSection.split(/(?=\d{4})/);
    
    return jobs
      .filter(job => job.trim().length > 20)
      .slice(0, 5) // Limit to 5 jobs
      .map(job => job.trim());
  }

  private static extractEducation(text: string): string[] {
    const educationSection = this.findSection(text, ['education', 'academic background', 'qualifications']);
    if (!educationSection) return [];

    const educationEntries = educationSection
      .split('\n')
      .filter(line => line.trim().length > 10)
      .slice(0, 3); // Limit to 3 entries

    return educationEntries;
  }

  private static extractBio(text: string, experience: string[]): string {
    // Look for summary/about sections first
    const bioSection = this.findSection(text, ['summary', 'about', 'profile', 'objective', 'about me']);
    
    if (bioSection) {
      const sentences = bioSection.split(/[.!?]/).filter(s => s.trim().length > 10);
      return sentences.slice(0, 2).join('. ').trim() + '.';
    }

    // Fallback: create bio from experience
    if (experience.length > 0) {
      const firstJob = experience[0];
      const roleMatch = firstJob.match(/([^|]+)\|/);
      const role = roleMatch ? roleMatch[1].trim() : 'Professional';
      return `Experienced ${role.toLowerCase()} with a proven track record in their field.`;
    }

    return 'Dedicated professional with expertise in their field.';
  }

  private static findSection(text: string, sectionNames: string[]): string | null {
    const lowerText = text.toLowerCase();
    
    for (const sectionName of sectionNames) {
      const sectionRegex = new RegExp(`\\b${sectionName}\\b`, 'i');
      const match = lowerText.search(sectionRegex);
      
      if (match !== -1) {
        // Find the section content (until next major section or end)
        const startIndex = match;
        const nextSectionRegex = /\n\s*(?:experience|education|skills|summary|about|contact|objective)/i;
        const nextSectionMatch = lowerText.substring(startIndex + sectionName.length).search(nextSectionRegex);
        
        const endIndex = nextSectionMatch !== -1 
          ? startIndex + sectionName.length + nextSectionMatch
          : text.length;
          
        return text.substring(startIndex, endIndex).trim();
      }
    }
    
    return null;
  }

  // Main extraction method
  static async extractFromFile(file: File): Promise<CVExtractionResult> {
    let extractedText: string;

    try {
      // Determine file type and extract text accordingly
      if (file.type === 'application/pdf') {
        extractedText = await this.extractFromPDF(file);
      } else if (file.type === 'application/msword' || 
                 file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extractedText = await this.extractFromDOC(file);
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOC file.');
      }

      // Parse the extracted text into structured data
      const structuredData = this.parseTextToStructuredData(extractedText);
      
      return structuredData;
    } catch (error) {
      console.error('Error extracting from file:', error);
      throw new Error(`Failed to process CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}