// Intelligent job parsing and extraction system
export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salary: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
    equity?: boolean;
  };
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  remote: boolean;
  postedDate: string;
  applicationDeadline?: string;
  applicationUrl: string;
  source: 'linkedin' | 'indeed' | 'glassdoor' | 'company-website' | 'email' | 'other';
  skills: ExtractedSkill[];
  metadata: {
    scraped_at: string;
    raw_html?: string;
    confidence_score: number;
    language: string;
    category: string;
    industry: string[];
    companySize?: string;
    funding?: string;
  };
}

export interface ExtractedSkill {
  name: string;
  category: 'programming' | 'framework' | 'database' | 'tool' | 'soft-skill' | 'certification' | 'language';
  required: boolean;
  years_required?: number;
  confidence: number;
}

export interface JobExtractionResult {
  job: JobPosting;
  confidence: number;
  warnings: string[];
  missing_fields: string[];
}

export interface SkillDatabase {
  [key: string]: {
    category: ExtractedSkill['category'];
    aliases: string[];
    weight: number;
    related: string[];
  };
}

export const SKILL_DATABASE: SkillDatabase = {
  // Programming Languages
  'javascript': { category: 'programming', aliases: ['js', 'es6', 'es2015', 'node.js', 'nodejs'], weight: 1.0, related: ['typescript', 'react', 'vue'] },
  'typescript': { category: 'programming', aliases: ['ts'], weight: 0.9, related: ['javascript', 'angular', 'react'] },
  'python': { category: 'programming', aliases: ['py'], weight: 1.0, related: ['django', 'flask', 'pandas', 'numpy'] },
  'java': { category: 'programming', aliases: [], weight: 0.9, related: ['spring', 'hibernate', 'maven'] },
  'c#': { category: 'programming', aliases: ['csharp', 'c-sharp'], weight: 0.8, related: ['.net', 'asp.net', 'azure'] },
  'go': { category: 'programming', aliases: ['golang'], weight: 0.8, related: ['docker', 'kubernetes'] },
  'rust': { category: 'programming', aliases: [], weight: 0.7, related: ['wasm', 'systems'] },
  'php': { category: 'programming', aliases: [], weight: 0.7, related: ['laravel', 'symfony', 'wordpress'] },
  'ruby': { category: 'programming', aliases: [], weight: 0.7, related: ['rails', 'sinatra'] },
  'swift': { category: 'programming', aliases: [], weight: 0.6, related: ['ios', 'xcode'] },
  'kotlin': { category: 'programming', aliases: [], weight: 0.6, related: ['android', 'java'] },

  // Frameworks & Libraries
  'react': { category: 'framework', aliases: ['reactjs', 'react.js'], weight: 1.0, related: ['javascript', 'jsx', 'redux'] },
  'vue': { category: 'framework', aliases: ['vuejs', 'vue.js'], weight: 0.8, related: ['javascript', 'nuxt'] },
  'angular': { category: 'framework', aliases: ['angularjs'], weight: 0.8, related: ['typescript', 'rxjs'] },
  'django': { category: 'framework', aliases: [], weight: 0.8, related: ['python', 'rest'] },
  'flask': { category: 'framework', aliases: [], weight: 0.7, related: ['python'] },
  'spring': { category: 'framework', aliases: ['spring boot'], weight: 0.8, related: ['java', 'hibernate'] },
  'express': { category: 'framework', aliases: ['express.js', 'expressjs'], weight: 0.8, related: ['node.js', 'javascript'] },
  'laravel': { category: 'framework', aliases: [], weight: 0.7, related: ['php'] },
  'rails': { category: 'framework', aliases: ['ruby on rails'], weight: 0.7, related: ['ruby'] },
  '.net': { category: 'framework', aliases: ['dotnet', 'asp.net'], weight: 0.8, related: ['c#', 'azure'] },

  // Databases
  'postgresql': { category: 'database', aliases: ['postgres', 'psql'], weight: 0.9, related: ['sql', 'database'] },
  'mysql': { category: 'database', aliases: [], weight: 0.8, related: ['sql', 'database'] },
  'mongodb': { category: 'database', aliases: ['mongo'], weight: 0.8, related: ['nosql', 'database'] },
  'redis': { category: 'database', aliases: [], weight: 0.7, related: ['caching', 'nosql'] },
  'elasticsearch': { category: 'database', aliases: ['elastic'], weight: 0.7, related: ['search', 'nosql'] },
  'sqlite': { category: 'database', aliases: [], weight: 0.6, related: ['sql', 'database'] },
  'oracle': { category: 'database', aliases: ['oracle db'], weight: 0.6, related: ['sql', 'database'] },

  // Tools & Platforms
  'docker': { category: 'tool', aliases: ['containerization'], weight: 0.9, related: ['kubernetes', 'devops'] },
  'kubernetes': { category: 'tool', aliases: ['k8s'], weight: 0.8, related: ['docker', 'devops'] },
  'aws': { category: 'tool', aliases: ['amazon web services'], weight: 0.9, related: ['cloud', 'devops'] },
  'azure': { category: 'tool', aliases: ['microsoft azure'], weight: 0.8, related: ['cloud', 'devops'] },
  'gcp': { category: 'tool', aliases: ['google cloud', 'google cloud platform'], weight: 0.8, related: ['cloud', 'devops'] },
  'git': { category: 'tool', aliases: ['github', 'gitlab', 'version control'], weight: 1.0, related: ['devops'] },
  'jenkins': { category: 'tool', aliases: [], weight: 0.7, related: ['ci/cd', 'devops'] },
  'terraform': { category: 'tool', aliases: [], weight: 0.7, related: ['iac', 'devops', 'cloud'] },
  'ansible': { category: 'tool', aliases: [], weight: 0.6, related: ['devops', 'automation'] },

  // Soft Skills
  'leadership': { category: 'soft-skill', aliases: ['team lead', 'management'], weight: 0.8, related: ['communication'] },
  'communication': { category: 'soft-skill', aliases: ['verbal', 'written'], weight: 0.9, related: ['leadership'] },
  'problem-solving': { category: 'soft-skill', aliases: ['analytical', 'critical thinking'], weight: 0.9, related: [] },
  'teamwork': { category: 'soft-skill', aliases: ['collaboration', 'team player'], weight: 0.8, related: ['communication'] },
  'agile': { category: 'soft-skill', aliases: ['scrum', 'kanban'], weight: 0.8, related: ['project management'] },
  'project management': { category: 'soft-skill', aliases: ['pm'], weight: 0.7, related: ['leadership', 'agile'] }
};

export class JobParser {
  private skillDatabase: SkillDatabase;

  constructor() {
    this.skillDatabase = SKILL_DATABASE;
  }

  public parseJobPosting(rawText: string, source: JobPosting['source'] = 'other', url?: string): JobExtractionResult {
    const cleanText = this.cleanText(rawText);
    const warnings: string[] = [];
    const missing_fields: string[] = [];

    // Extract basic information
    const title = this.extractTitle(cleanText);
    const company = this.extractCompany(cleanText);
    const location = this.extractLocation(cleanText);
    const salary = this.extractSalary(cleanText);
    const employmentType = this.extractEmploymentType(cleanText);
    const experienceLevel = this.extractExperienceLevel(cleanText);
    const remote = this.detectRemote(cleanText);
    const skills = this.extractSkills(cleanText);
    const requirements = this.extractRequirements(cleanText);
    const benefits = this.extractBenefits(cleanText);
    const postedDate = this.extractPostedDate(cleanText);
    const applicationDeadline = this.extractApplicationDeadline(cleanText);

    // Calculate confidence based on extracted fields
    let confidence = this.calculateConfidence({
      title, company, location, salary, skills, requirements
    });

    // Check for missing critical fields
    if (!title) { missing_fields.push('title'); confidence -= 0.3; }
    if (!company) { missing_fields.push('company'); confidence -= 0.2; }
    if (!location) { missing_fields.push('location'); confidence -= 0.1; }
    if (skills.length === 0) { missing_fields.push('skills'); confidence -= 0.2; }

    // Add warnings
    if (confidence < 0.5) warnings.push('Low confidence extraction - manual review recommended');
    if (missing_fields.length > 2) warnings.push('Multiple critical fields missing');

    const job: JobPosting = {
      id: this.generateJobId(title, company),
      title: title || 'Unknown Position',
      company: company || 'Unknown Company',
      location: location || 'Location not specified',
      description: cleanText,
      requirements,
      benefits,
      salary,
      employmentType,
      experienceLevel,
      remote,
      postedDate: postedDate || new Date().toISOString(),
      applicationDeadline,
      applicationUrl: url || '',
      source,
      skills,
      metadata: {
        scraped_at: new Date().toISOString(),
        raw_html: rawText.length > 1000 ? rawText.substring(0, 1000) + '...' : rawText,
        confidence_score: Math.max(0, Math.min(1, confidence)),
        language: this.detectLanguage(cleanText),
        category: this.categorizeJob(title, skills),
        industry: this.detectIndustry(cleanText, company),
        companySize: this.extractCompanySize(cleanText),
        funding: this.extractFunding(cleanText)
      }
    };

    return {
      job,
      confidence: Math.max(0, Math.min(1, confidence)),
      warnings,
      missing_fields
    };
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\-\.\,\;\:\!\?\$\%\(\)\[\]•\*\+]/g, ' ') // Keep basic punctuation and bullet characters
      .trim();
  }

  private extractTitle(text: string): string {
    const patterns = [
      /(?:job title|position|role):\s*([^\n\r]{2,100})/i,
      /^([^\n\r]{10,100})(?:\s*-\s*[A-Z])/m, // First line pattern
      /hiring\s+(?:a\s+)?([^\n\r]{5,80})/i,
      /seeking\s+(?:a\s+)?([^\n\r]{5,80})/i,
      /position:\s*([^\n\r]{5,80})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return this.cleanJobTitle(match[1]);
      }
    }

    // Fallback: look for common job title patterns
    const commonTitles = [
      /\b(senior|lead|principal|staff|junior)?\s*(software|web|mobile|full.?stack|front.?end|back.?end|data|devops|site reliability)\s*(engineer|developer|architect|analyst)\b/i,
      /\b(product|project|program|engineering)\s*(manager|director|lead)\b/i,
      /\b(ui|ux|product)\s*(designer|researcher)\b/i,
      /\b(data|business|financial|marketing)\s*(scientist|analyst)\b/i
    ];

    for (const pattern of commonTitles) {
      const match = text.match(pattern);
      if (match) {
        return this.cleanJobTitle(match[0]);
      }
    }

    return '';
  }

  private cleanJobTitle(title: string): string {
    return title
      .replace(/^\W+|\W+$/g, '') // Remove leading/trailing non-word chars
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractCompany(text: string): string {
    const patterns = [
      /(?:company|employer|organization):\s*([^\n\r]{2,50})/i,
      /(?:at|@)\s+([A-Z][a-zA-Z\s&\.,]{2,30})(?:\s+is|,|\n)/,
      /([A-Z][a-zA-Z\s&\.,]{2,30})\s+(?:is hiring|seeks|looking for)/i,
      /work\s+(?:at|for)\s+([A-Z][a-zA-Z\s&\.,]{2,30})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && !this.isCommonWord(match[1])) {
        return match[1].replace(/^\W+|\W+$/g, '').trim();
      }
    }

    return '';
  }

  private extractLocation(text: string): string {
    const patterns = [
      /(?:location|based in|located in):\s*([^\n\r]{3,50})/i,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/, // City, State
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+)\b/, // City, Country
      /(?:remote|work from home|wfh)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern === patterns[3]) return 'Remote';
        return match[1] || match[0];
      }
    }

    return '';
  }

  private extractSalary(text: string): JobPosting['salary'] {
    const salaryPatterns = [
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(per\s+year|annually|\/year|yearly)/i,
      /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(per\s+hour|hourly|\/hour|\/hr)/i,
      /salary:\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
      /\$(\d{1,3}(?:,\d{3})*)\+/i, // $100K+
      /(\d{1,3})k?\s*-\s*(\d{1,3})k\s*(per\s+year|annually)/i // 100k-150k annually
    ];

    for (const pattern of salaryPatterns) {
      const match = text.match(pattern);
      if (match) {
        const min = parseInt(match[1].replace(/[,$]/g, ''));
        const max = match[2] ? parseInt(match[2].replace(/[,$]/g, '')) : undefined;
        const periodMatch = match[3] || '';
        
        let period: 'hourly' | 'monthly' | 'yearly' = 'yearly';
        if (periodMatch.toLowerCase().includes('hour')) period = 'hourly';
        else if (periodMatch.toLowerCase().includes('month')) period = 'monthly';

        // Convert k notation
        const finalMin = match[1].includes('k') || match[1].includes('K') ? min * 1000 : min;
        const finalMax = max && (match[2]?.includes('k') || match[2]?.includes('K')) ? max * 1000 : max;

        return {
          min: finalMin,
          max: finalMax,
          currency: 'USD',
          period,
          equity: /equity|stock options|rsu|restricted stock/i.test(text)
        };
      }
    }

    return {
      currency: 'USD',
      period: 'yearly'
    };
  }

  private extractEmploymentType(text: string): JobPosting['employmentType'] {
    if (/\b(full.time|full time|fulltime)\b/i.test(text)) return 'full-time';
    if (/\b(part.time|part time|parttime)\b/i.test(text)) return 'part-time';
    if (/\b(contract|contractor|freelance|consulting)\b/i.test(text)) return 'contract';
    if (/\b(intern|internship)\b/i.test(text)) return 'internship';
    if (/\b(temporary|temp|seasonal)\b/i.test(text)) return 'temporary';
    
    return 'full-time'; // Default
  }

  private extractExperienceLevel(text: string): JobPosting['experienceLevel'] {
    if (/\b(junior|jr|entry.level|entry level|new grad|graduate|0-2 years)\b/i.test(text)) return 'entry';
    if (/\b(senior|sr|senior level|5\+ years|5+ years)\b/i.test(text)) return 'senior';
    if (/\b(lead|principal|staff|architect|7\+ years|10\+ years)\b/i.test(text)) return 'lead';
    if (/\b(director|vp|vice president|chief|head of|executive)\b/i.test(text)) return 'executive';
    
    return 'mid'; // Default
  }

  private detectRemote(text: string): boolean {
    return /\b(remote|work from home|wfh|distributed|anywhere|virtual)\b/i.test(text);
  }

  private extractSkills(text: string): ExtractedSkill[] {
    const skills: ExtractedSkill[] = [];
    const foundSkills = new Set<string>();

    // Check each skill in our database
    for (const [skillName, skillData] of Object.entries(this.skillDatabase)) {
      const allNames = [skillName, ...skillData.aliases];
      
      for (const name of allNames) {
        const regex = new RegExp(`\\b${this.escapeRegex(name)}\\b`, 'gi');
        const matches = text.match(regex);
        
        if (matches && !foundSkills.has(skillName)) {
          const isRequired = this.isSkillRequired(text, name);
          const yearsRequired = this.extractYearsRequired(text, name);
          
          skills.push({
            name: skillName,
            category: skillData.category,
            required: isRequired,
            years_required: yearsRequired,
            confidence: skillData.weight * (matches.length > 1 ? 1.0 : 0.8)
          });
          
          foundSkills.add(skillName);
        }
      }
    }

    return skills.sort((a, b) => b.confidence - a.confidence);
  }

  private isSkillRequired(text: string, skill: string): boolean {
    const requiredPatterns = [
      new RegExp(`\\b(required|must have|essential|mandatory)\\b[^.]*\\b${this.escapeRegex(skill)}\\b`, 'i'),
      new RegExp(`\\b${this.escapeRegex(skill)}\\b[^.]*\\b(required|must have|essential|mandatory)\\b`, 'i'),
      new RegExp(`requirements?[^:]*:([^.]*\\b${this.escapeRegex(skill)}\\b[^.]*)`, 'i')
    ];

    return requiredPatterns.some(pattern => pattern.test(text));
  }

  private extractYearsRequired(text: string, skill: string): number | undefined {
    const yearPattern = new RegExp(`(\\d+)\\+?\\s*years?[^.]*\\b${this.escapeRegex(skill)}\\b|\\b${this.escapeRegex(skill)}\\b[^.]*?(\\d+)\\+?\\s*years?`, 'i');
    const match = text.match(yearPattern);
    return match ? parseInt(match[1] || match[2]) : undefined;
  }

  private extractRequirements(text: string): string[] {
    const requirementSections = [
      /requirements?:([^]*?)(?:\n\s*\n|responsibilities?:|qualifications?:|$)/i,
      /qualifications?:([^]*?)(?:\n\s*\n|requirements?:|responsibilities?:|$)/i,
      /must have:([^]*?)(?:\n\s*\n|nice to have:|requirements?:|$)/i
    ];

    const requirements: string[] = [];

    for (const pattern of requirementSections) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const items = this.extractListItems(match[1]);
        requirements.push(...items);
      }
    }

    return requirements.slice(0, 15); // Limit to 15 requirements
  }

  private extractBenefits(text: string): string[] {
    const benefitSections = [
      /benefits?:([^]*?)(?:\n\s*\n|requirements?:|responsibilities?:|$)/i,
      /we offer:([^]*?)(?:\n\s*\n|requirements?:|responsibilities?:|$)/i,
      /perks?:([^]*?)(?:\n\s*\n|requirements?:|responsibilities?:|$)/i
    ];

    const benefits: string[] = [];

    for (const pattern of benefitSections) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const items = this.extractListItems(match[1]);
        benefits.push(...items);
      }
    }

    return benefits.slice(0, 10); // Limit to 10 benefits
  }

  private extractListItems(text: string): string[] {
    const items: string[] = [];
    
    // Try bullet points first - use multiline regex to match complete bullet lines
    const bulletItems = text.match(/^[\s]*[•\-\*\+]\s*(.+)$/gm);
    
    if (bulletItems && bulletItems.length > 0) {
      items.push(...bulletItems.map(item => 
        item.replace(/^[\s]*[•\-\*\+]\s*/, '').trim()
      ).filter(item => item.length > 3 && item.length < 200));
    } else {
      // Try numbered lists
      const numberedItems = text.match(/^\d+\.\s*(.+)$/gm);
      if (numberedItems && numberedItems.length > 0) {
        items.push(...numberedItems.map(item => 
          item.replace(/^\d+\.\s*/, '').trim()
        ).filter(item => item.length > 3 && item.length < 200));
      } else {
        // Split by newlines and filter meaningful sentences
        const lines = text.split(/\n/).filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 10 && trimmed.length < 200 && 
                 !trimmed.match(/^(posted|apply|requirements?|benefits?|qualifications?)/i);
        });
        items.push(...lines.map(line => line.trim()));
      }
    }

    return items.filter(item => item.length > 3 && item.length < 200);
  }

  private extractPostedDate(text: string): string | undefined {
    const datePatterns = [
      /posted:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /posted:?\s*(\d{4}-\d{2}-\d{2})/i,
      /(\d{1,2})\s+days?\s+ago/i,
      /(\d{1,2})\s+hours?\s+ago/i,
      /(yesterday)/i,
      /(today)/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] === 'today') return new Date().toISOString();
        if (match[1] === 'yesterday') {
          const date = new Date();
          date.setDate(date.getDate() - 1);
          return date.toISOString();
        }
        if (match[0].includes('days ago')) {
          const daysAgo = parseInt(match[1]);
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          return date.toISOString();
        }
        if (match[0].includes('hours ago')) {
          const hoursAgo = parseInt(match[1]);
          const date = new Date();
          date.setHours(date.getHours() - hoursAgo);
          return date.toISOString();
        }
        
        try {
          return new Date(match[1]).toISOString();
        } catch {
          continue;
        }
      }
    }

    return undefined;
  }

  private extractApplicationDeadline(text: string): string | undefined {
    const deadlinePatterns = [
      /deadline:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /apply by:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /applications? close:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
    ];

    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          return new Date(match[1]).toISOString();
        } catch {
          continue;
        }
      }
    }

    return undefined;
  }

  private calculateConfidence(extracted: any): number {
    let score = 0;
    
    if (extracted.title) score += 0.3;
    if (extracted.company) score += 0.2;
    if (extracted.location) score += 0.1;
    if (extracted.salary.min) score += 0.1;
    if (extracted.skills.length > 0) score += 0.2;
    if (extracted.skills.length > 5) score += 0.1;
    if (extracted.requirements.length > 0) score += 0.1;

    return score;
  }

  private generateJobId(title: string, company: string): string {
    const hash = this.simpleHash(title + company + Date.now());
    return `job-${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'or', 'but', 'with', 'for', 'you', 'we', 'are', 'have'];
    const englishCount = englishWords.reduce((count, word) => {
      return count + (text.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
    }, 0);

    return englishCount > 10 ? 'en' : 'unknown';
  }

  private categorizeJob(title: string, skills: ExtractedSkill[]): string {
    const categories = {
      'software-engineering': ['engineer', 'developer', 'programming', 'software'],
      'data-science': ['data scientist', 'analyst', 'ml', 'machine learning'],
      'design': ['designer', 'ui', 'ux', 'design'],
      'product': ['product manager', 'pm', 'product'],
      'devops': ['devops', 'sre', 'infrastructure', 'ops'],
      'marketing': ['marketing', 'growth', 'acquisition'],
      'sales': ['sales', 'account', 'business development'],
      'management': ['manager', 'director', 'lead', 'head']
    };

    const titleLower = title.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return category;
      }
    }

    return 'other';
  }

  private detectIndustry(text: string, company: string): string[] {
    const industries = {
      'technology': ['tech', 'software', 'startup', 'saas', 'ai', 'ml'],
      'finance': ['bank', 'financial', 'fintech', 'trading', 'investment'],
      'healthcare': ['health', 'medical', 'pharma', 'biotech', 'hospital'],
      'ecommerce': ['ecommerce', 'retail', 'marketplace', 'shopping'],
      'consulting': ['consulting', 'advisory', 'professional services'],
      'education': ['education', 'edtech', 'university', 'school'],
      'gaming': ['gaming', 'game', 'entertainment', 'mobile games'],
      'media': ['media', 'advertising', 'publishing', 'content']
    };

    const combined = `${text} ${company}`.toLowerCase();
    const detected: string[] = [];

    for (const [industry, keywords] of Object.entries(industries)) {
      if (keywords.some(keyword => combined.includes(keyword))) {
        detected.push(industry);
      }
    }

    return detected.length > 0 ? detected : ['other'];
  }

  private extractCompanySize(text: string): string | undefined {
    const sizePatterns = [
      /(\d+)\+?\s*employees/i,
      /(startup|small|medium|large|enterprise)/i,
      /series\s+[a-z]/i
    ];

    for (const pattern of sizePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && !isNaN(parseInt(match[1]))) {
          const size = parseInt(match[1]);
          if (size < 50) return 'small';
          if (size < 200) return 'medium';
          if (size < 1000) return 'large';
          return 'enterprise';
        }
        return match[1];
      }
    }

    return undefined;
  }

  private extractFunding(text: string): string | undefined {
    const fundingPatterns = [
      /(series\s+[a-z])/i,
      /(seed|pre-seed|ipo|public)/i,
      /raised\s+\$(\d+[mb])/i
    ];

    for (const pattern of fundingPatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  private isCommonWord(word: string): boolean {
    const common = ['the', 'and', 'or', 'but', 'with', 'for', 'you', 'we', 'are', 'have', 'this', 'that', 'will', 'can', 'all'];
    return common.includes(word.toLowerCase());
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default JobParser;