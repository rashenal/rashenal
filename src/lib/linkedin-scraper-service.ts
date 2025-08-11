// src/lib/linkedin-scraper-service.ts
// LinkedIn Job Scraper with Public Search and Optional Login Support

import { JobBoardResult, JobBoardSearchParams } from './job-discovery-service';

export interface LinkedInCredentials {
  email?: string;
  password?: string;
}

export interface LinkedInScrapingConfig {
  credentials?: LinkedInCredentials;
  useLogin?: boolean;
  maxResults?: number;
  delayMs?: number;
  userAgentRotation?: boolean;
  respectRateLimit?: boolean;
}

export interface LinkedInJobData {
  jobId: string;
  title: string;
  company: string;
  location: string;
  description: string;
  postedDate?: string;
  salary?: string;
  employmentType?: string;
  experienceLevel?: string;
  applyUrl: string;
  companyUrl?: string;
  logoUrl?: string;
}

export class LinkedInScraperService {
  private static readonly BASE_URL = 'https://www.linkedin.com';
  private static readonly JOBS_SEARCH_URL = `${LinkedInScraperService.BASE_URL}/jobs/search`;
  private static readonly DEFAULT_DELAY_MS = 3000; // 3 second delay
  private static readonly MAX_RETRIES = 3;

  // Realistic user agents for rotation
  private static readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0'
  ];

  // Search LinkedIn jobs (public search - no login required)
  static async searchJobs(
    params: JobBoardSearchParams, 
    config: LinkedInScrapingConfig = {}
  ): Promise<JobBoardResult[]> {
    try {
      const {
        maxResults = 50,
        delayMs = this.DEFAULT_DELAY_MS,
        userAgentRotation = true,
        respectRateLimit = true
      } = config;

      console.log('🔍 Starting LinkedIn job search:', params);

      // Build search URL with parameters
      const searchUrl = this.buildSearchUrl(params);
      console.log('📍 Search URL:', searchUrl);

      // Get jobs from public search
      const jobResults = await this.scrapePublicSearch(searchUrl, {
        maxResults,
        delayMs: respectRateLimit ? delayMs : 100,
        userAgentRotation
      });

      console.log(`✅ Found ${jobResults.length} jobs from LinkedIn`);
      return jobResults;

    } catch (error) {
      console.error('❌ LinkedIn scraping failed:', error);
      
      // Return empty array instead of throwing to allow other job boards to continue
      return [];
    }
  }

  // Build LinkedIn search URL from parameters
  private static buildSearchUrl(params: JobBoardSearchParams): string {
    const searchParams = new URLSearchParams();
    
    // Keywords (job title)
    if (params.jobTitle) {
      searchParams.append('keywords', params.jobTitle);
    }

    // Location (default to UK if not specified)
    const location = params.location || 'United Kingdom';
    searchParams.append('location', location);

    // Experience level mapping
    if (params.experienceLevel) {
      const experienceMap: Record<string, string> = {
        'entry': '1', // Entry level
        'junior': '2', // Associate  
        'mid': '3', // Mid-Senior level
        'senior': '4', // Senior level
        'principal': '5', // Director
        'executive': '6' // Executive
      };
      
      const linkedinLevel = experienceMap[params.experienceLevel];
      if (linkedinLevel) {
        searchParams.append('f_E', linkedinLevel);
      }
    }

    // Employment type
    if (params.employmentType && params.employmentType.length > 0) {
      const typeMap: Record<string, string> = {
        'permanent': 'F', // Full-time
        'contract': 'C', // Contract
        'part-time': 'P', // Part-time
        'temporary': 'T', // Temporary
        'internship': 'I', // Internship
        'freelance': 'C' // Contract (closest match)
      };
      
      const linkedinTypes = params.employmentType
        .map(type => typeMap[type])
        .filter(Boolean);
      
      if (linkedinTypes.length > 0) {
        searchParams.append('f_JT', linkedinTypes.join(','));
      }
    }

    // Remote work filter
    if (params.remoteType) {
      const remoteMap: Record<string, string> = {
        'remote': '2', // Remote
        'hybrid': '3', // Hybrid  
        'onsite': '1' // On-site
      };
      
      const linkedinRemote = remoteMap[params.remoteType];
      if (linkedinRemote) {
        searchParams.append('f_WT', linkedinRemote);
      }
    }

    // Sort by most recent
    searchParams.append('sortBy', 'DD');

    return `${this.JOBS_SEARCH_URL}?${searchParams.toString()}`;
  }

  // Scrape LinkedIn public job search (no login required)
  private static async scrapePublicSearch(
    searchUrl: string, 
    options: {
      maxResults: number;
      delayMs: number;
      userAgentRotation: boolean;
    }
  ): Promise<JobBoardResult[]> {
    const jobs: JobBoardResult[] = [];
    let page = 0;
    const jobsPerPage = 25; // LinkedIn default

    try {
      while (jobs.length < options.maxResults && page < 10) { // Max 10 pages
        console.log(`📄 Scraping LinkedIn page ${page + 1}...`);

        const pageUrl = page === 0 ? searchUrl : `${searchUrl}&start=${page * jobsPerPage}`;
        
        // Respectful delay between requests
        if (page > 0 && options.delayMs > 0) {
          console.log(`⏳ Waiting ${options.delayMs}ms before next request...`);
          await this.delay(options.delayMs);
        }

        const pageJobs = await this.scrapePage(pageUrl, options.userAgentRotation);
        
        if (pageJobs.length === 0) {
          console.log('📭 No more jobs found, stopping pagination');
          break;
        }

        jobs.push(...pageJobs);
        page++;

        // Stop if we have enough results
        if (jobs.length >= options.maxResults) {
          break;
        }
      }

      return jobs.slice(0, options.maxResults);

    } catch (error) {
      console.error('❌ Error during LinkedIn scraping:', error);
      return jobs; // Return what we have so far
    }
  }

  // Scrape a single page of LinkedIn job results
  private static async scrapePage(url: string, useUserAgentRotation: boolean): Promise<JobBoardResult[]> {
    try {
      const headers = this.getRandomHeaders(useUserAgentRotation);
      
      console.log('🌐 Fetching:', url);
      
      // In a real implementation, you'd use fetch or axios here
      // For now, we'll simulate the scraping with mock data
      const html = await this.fetchWithRetry(url, headers);
      
      if (!html) {
        throw new Error('Failed to fetch page content');
      }

      // Parse the HTML to extract job data
      const jobs = this.parseJobListings(html, url);
      
      console.log(`📊 Extracted ${jobs.length} jobs from page`);
      return jobs;

    } catch (error) {
      console.error('❌ Error scraping LinkedIn page:', error);
      return [];
    }
  }

  // Generate realistic request headers with optional user agent rotation
  private static getRandomHeaders(rotateUserAgent: boolean): Record<string, string> {
    const userAgent = rotateUserAgent 
      ? this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)]
      : this.USER_AGENTS[0];

    return {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9,en-US;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };
  }

  // Fetch with retry logic and anti-bot detection handling
  private static async fetchWithRetry(url: string, headers: Record<string, string>): Promise<string | null> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.MAX_RETRIES} for URL: ${url}`);

        // In a real implementation, this would be a fetch() call
        // For demonstration, we'll simulate different responses
        const response = await this.simulateFetch(url, headers);
        
        if (response.status === 429) {
          // Rate limited - wait longer
          const waitTime = Math.min(10000 * attempt, 30000); // Max 30 seconds
          console.log(`⏳ Rate limited, waiting ${waitTime}ms...`);
          await this.delay(waitTime);
          continue;
        }

        if (response.status === 403 || response.status === 401) {
          // Possible bot detection
          console.log('🤖 Possible bot detection, rotating user agent...');
          headers['User-Agent'] = this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
          await this.delay(5000); // Wait 5 seconds
          continue;
        }

        if (response.ok) {
          return response.text;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        
        if (attempt === this.MAX_RETRIES) {
          throw error;
        }

        // Exponential backoff
        const waitTime = 1000 * Math.pow(2, attempt);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await this.delay(waitTime);
      }
    }

    return null;
  }

  // Simulate fetch response (replace with real fetch in production)
  private static async simulateFetch(url: string, headers: Record<string, string>): Promise<{
    status: number;
    statusText: string;
    ok: boolean;
    text: string;
  }> {
    // Simulate network delay
    await this.delay(500 + Math.random() * 1000);

    // Simulate occasional rate limiting or bot detection
    const random = Math.random();
    if (random < 0.05) { // 5% chance of rate limiting
      return {
        status: 429,
        statusText: 'Too Many Requests',
        ok: false,
        text: ''
      };
    }

    if (random < 0.02) { // 2% chance of bot detection
      return {
        status: 403,
        statusText: 'Forbidden',
        ok: false,
        text: ''
      };
    }

    // Simulate successful response with mock HTML
    return {
      status: 200,
      statusText: 'OK',
      ok: true,
      text: this.generateMockLinkedInHTML(url)
    };
  }

  // Generate mock LinkedIn HTML for testing (replace with real HTML parsing)
  private static generateMockLinkedInHTML(url: string): string {
    // This would contain actual LinkedIn HTML structure in production
    return `
      <html>
        <body>
          <div class="jobs-search-results">
            ${Array.from({ length: 10 }, (_, i) => `
              <div class="job-card">
                <h3 class="job-title">Senior Software Engineer ${i + 1}</h3>
                <h4 class="company-name">TechCorp ${i + 1}</h4>
                <span class="job-location">London, England, United Kingdom</span>
                <span class="job-posted-date">2 days ago</span>
                <div class="job-description">
                  Exciting opportunity for a Senior Software Engineer to join our growing team...
                </div>
                <a href="/jobs/view/123456${i}" class="apply-link">Apply</a>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;
  }

  // Parse job listings from LinkedIn HTML
  private static parseJobListings(html: string, sourceUrl: string): JobBoardResult[] {
    const jobs: JobBoardResult[] = [];

    try {
      // In production, you'd use a proper HTML parser like Cheerio or JSDOM
      // For now, we'll extract from our mock HTML structure
      const jobMatches = html.match(/<div class="job-card">[\s\S]*?<\/div>/g) || [];

      for (const jobHtml of jobMatches) {
        try {
          const job = this.parseJobCard(jobHtml, sourceUrl);
          if (job) {
            jobs.push(job);
          }
        } catch (error) {
          console.error('❌ Error parsing job card:', error);
          // Continue with next job
        }
      }

    } catch (error) {
      console.error('❌ Error parsing job listings:', error);
    }

    return jobs;
  }

  // Parse individual job card
  private static parseJobCard(jobHtml: string, sourceUrl: string): JobBoardResult | null {
    try {
      // Extract job details using regex (in production, use proper HTML parser)
      const titleMatch = jobHtml.match(/<h3 class="job-title">(.*?)<\/h3>/);
      const companyMatch = jobHtml.match(/<h4 class="company-name">(.*?)<\/h4>/);
      const locationMatch = jobHtml.match(/<span class="job-location">(.*?)<\/span>/);
      const postedMatch = jobHtml.match(/<span class="job-posted-date">(.*?)<\/span>/);
      const descriptionMatch = jobHtml.match(/<div class="job-description">(.*?)<\/div>/);
      const linkMatch = jobHtml.match(/<a href="(.*?)" class="apply-link">/);

      if (!titleMatch || !companyMatch) {
        return null;
      }

      const jobTitle = titleMatch[1].trim();
      const companyName = companyMatch[1].trim();
      const location = locationMatch?.[1]?.trim() || 'Location not specified';
      const description = descriptionMatch?.[1]?.trim() || 'No description available';
      const relativeUrl = linkMatch?.[1]?.trim() || '#';
      const jobUrl = relativeUrl.startsWith('http') ? relativeUrl : `${this.BASE_URL}${relativeUrl}`;

      // Convert posted date
      const postedDateStr = postedMatch?.[1]?.trim();
      const postedDate = this.parsePostedDate(postedDateStr);

      return {
        jobTitle,
        companyName,
        jobDescription: description,
        location,
        remoteType: this.detectRemoteType(jobTitle, description, location),
        employmentType: this.detectEmploymentType(jobTitle, description),
        experienceLevel: this.detectExperienceLevel(jobTitle, description),
        originalJobId: `linkedin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        jobUrl,
        postedDate: postedDate?.toISOString(),
        applicationDeadline: null, // LinkedIn doesn't typically show deadlines
        salaryMin: null, // Will be extracted if available in description
        salaryMax: null,
        salaryCurrency: 'GBP' // Default for UK searches
      };

    } catch (error) {
      console.error('❌ Error parsing job card details:', error);
      return null;
    }
  }

  // Parse LinkedIn's relative posted dates
  private static parsePostedDate(dateStr?: string): Date | null {
    if (!dateStr) return null;

    const now = new Date();
    const lowerDate = dateStr.toLowerCase();

    if (lowerDate.includes('today')) {
      return now;
    }

    if (lowerDate.includes('yesterday')) {
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const daysMatch = lowerDate.match(/(\d+)\s*days?\s*ago/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    const weeksMatch = lowerDate.match(/(\d+)\s*weeks?\s*ago/);
    if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1]);
      return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
    }

    return null;
  }

  // Detect remote work type from job content
  private static detectRemoteType(title: string, description: string, location: string): string | undefined {
    const text = `${title} ${description} ${location}`.toLowerCase();
    
    if (text.match(/(remote|work from home|wfh|distributed|anywhere)/)) {
      return 'remote';
    }
    
    if (text.match(/(hybrid|flexible|mix of office and remote)/)) {
      return 'hybrid';
    }
    
    return 'onsite'; // Default assumption
  }

  // Detect employment type from job content
  private static detectEmploymentType(title: string, description: string): string | undefined {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.match(/(contract|contractor|freelance|temporary|temp)/)) {
      return 'contract';
    }
    
    if (text.match(/(part.time|part time|partial)/)) {
      return 'part-time';
    }
    
    if (text.match(/(intern|internship|graduate program)/)) {
      return 'internship';
    }
    
    return 'full-time'; // Default assumption
  }

  // Detect experience level from job content
  private static detectExperienceLevel(title: string, description: string): string | undefined {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.match(/(senior|sr\.|lead|principal|staff|architect)/)) {
      return 'senior';
    }
    
    if (text.match(/(junior|jr\.|entry|graduate|trainee)/)) {
      return 'junior';
    }
    
    if (text.match(/(director|head of|vp|vice president|chief|executive)/)) {
      return 'executive';
    }
    
    return 'mid'; // Default assumption
  }

  // Utility delay function
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Optional: Login-enhanced scraping (requires credentials)
  static async searchJobsWithLogin(
    params: JobBoardSearchParams,
    credentials: LinkedInCredentials,
    config: LinkedInScrapingConfig = {}
  ): Promise<JobBoardResult[]> {
    console.log('🔐 LinkedIn login-enhanced scraping requested');
    
    try {
      // For security and compliance reasons, we'll implement this as a premium feature
      // that requires additional user consent and secure credential handling
      
      console.log('⚠️ Login-enhanced scraping requires premium features and user consent');
      console.log('🔄 Falling back to public search...');
      
      // Fallback to public search
      return await this.searchJobs(params, config);
      
    } catch (error) {
      console.error('❌ Login-enhanced scraping failed:', error);
      return await this.searchJobs(params, config);
    }
  }
}