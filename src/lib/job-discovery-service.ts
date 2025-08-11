// src/lib/job-discovery-service.ts
// Enhanced Job Discovery Service with AI-powered matching and multi-job-board support

import { supabase } from './supabase';
import { 
  EnhancedJobSearch, 
  JobBoardSource, 
  JobSearchResult, 
  SearchExecutionLog,
  JobProfile 
} from './database-types';
import { LinkedInScraperService, LinkedInScrapingConfig } from './linkedin-scraper-service';
import { ScrapingConfigService } from './scraping-config-service';

export interface JobBoardSearchParams {
  jobTitle?: string;
  location?: string;
  remoteType?: string;
  employmentType?: string[];
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  companySizes?: string[];
  industries?: string[];
  requiredSkills?: string[];
  maxResults?: number;
}

export interface JobBoardResult {
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  location?: string;
  remoteType?: string;
  employmentType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  originalJobId?: string;
  jobUrl: string;
  postedDate?: string;
  applicationDeadline?: string;
}

export interface AIJobAnalysis {
  matchScore: number; // 0.0 to 1.0
  analysis: {
    summary: string;
    strengths: string[];
    concerns: string[];
    skillMatch: {
      matching: string[];
      missing: string[];
      transferable: string[];
    };
    recommendations: string;
  };
}

export interface AIJobLevelAnalysis {
  detectedLevel: string;
  confidence: number; // 0.0 to 1.0
  reasoning: string;
  alternativeOptions: string[];
}

export interface ExperienceLevel {
  value: string;
  label: string;
  description: string;
  keywords: string[];
}

export class JobDiscoveryService {
  // Experience level definitions for AI analysis
  static readonly EXPERIENCE_LEVELS: ExperienceLevel[] = [
    {
      value: 'entry',
      label: 'Entry Level (0-2 years)',
      description: 'New graduate, bootcamp graduate, career changer',
      keywords: ['graduate', 'junior', 'entry', '0-1 year', '1-2 years', 'bootcamp', 'intern', 'trainee', 'new grad']
    },
    {
      value: 'junior',
      label: 'Junior (2-4 years)',
      description: 'Some professional experience, learning advanced skills',
      keywords: ['junior', '2-3 years', '3-4 years', 'associate', 'developing', 'early career']
    },
    {
      value: 'mid',
      label: 'Mid Level (4-7 years)',
      description: 'Solid professional experience, can work independently',
      keywords: ['4-6 years', '5-7 years', 'mid-level', 'experienced', 'independent', 'intermediate']
    },
    {
      value: 'senior',
      label: 'Senior (7-12 years)',
      description: 'Expert in domain, mentors others, leads projects',
      keywords: ['senior', '7+ years', '8-10 years', 'expert', 'lead', 'mentor', 'specialist', 'team lead']
    },
    {
      value: 'principal',
      label: 'Principal/Staff (12+ years)',
      description: 'Technical leadership, architecture decisions, cross-team impact',
      keywords: ['principal', 'staff', 'architect', '10+ years', '12+ years', 'technical lead', 'distinguished', 'principal engineer']
    },
    {
      value: 'executive',
      label: 'Executive/Leadership',
      description: 'Director, VP, C-level, manages large teams and strategy',
      keywords: ['director', 'VP', 'head of', 'chief', 'executive', 'founder', 'CEO', 'CTO', 'manager of managers', 'vice president']
    }
  ];

  // Get all available job boards
  static async getJobBoardSources(): Promise<JobBoardSource[]> {
    try {
      const { data, error } = await supabase
        .from('job_board_sources')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) {
        console.error('Error fetching job board sources:', error);
        throw new Error(`Failed to fetch job board sources: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in getJobBoardSources:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  // Create a new enhanced job search
  static async createEnhancedSearch(searchData: Partial<EnhancedJobSearch>): Promise<EnhancedJobSearch> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      const searchToInsert = {
        user_id: user.id,
        name: searchData.search_name || searchData.name || 'New Search', // Handle both 'name' and 'search_name' fields
        profile_id: searchData.profile_id || null,
        job_title: searchData.job_title || null,
        location: searchData.location || null,
        remote_type: searchData.remote_type || null,
        employment_type: searchData.employment_type || null,
        experience_level: searchData.experience_level || null,
        salary_min: searchData.salary_min || null,
        salary_max: searchData.salary_max || null,
        salary_currency: searchData.salary_currency || 'USD',
        company_size: searchData.company_size || null,
        industry_sectors: searchData.industry_sectors || null,
        required_skills: searchData.required_skills || null,
        preferred_skills: searchData.preferred_skills || null,
        work_authorization: searchData.work_authorization || null,
        visa_sponsorship: searchData.visa_sponsorship || null,
        selected_job_boards: searchData.selected_job_boards || ['linkedin', 'indeed'],
        search_frequency: searchData.search_frequency || 'manual',
        scheduled_time: searchData.scheduled_time || null,
        timezone: searchData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        max_results_per_board: searchData.max_results_per_board || 50,
        ai_matching_enabled: searchData.ai_matching_enabled !== false,
        minimum_match_score: searchData.minimum_match_score || 60,
        is_active: searchData.is_active !== false
      };

      const { data, error } = await supabase
        .from('enhanced_job_searches')
        .insert([searchToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error creating enhanced search:', error);
        throw new Error(`Failed to create job search: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in createEnhancedSearch:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  // Get user's enhanced job searches
  static async getEnhancedSearches(userId: string): Promise<EnhancedJobSearch[]> {
    try {
      const { data, error } = await supabase
        .from('enhanced_job_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching enhanced searches:', error);
        throw new Error(`Failed to fetch job searches: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in getEnhancedSearches:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  // Execute a job search immediately
  static async executeSearch(searchId: string): Promise<SearchExecutionLog> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Get the search configuration
      const { data: search, error: searchError } = await supabase
        .from('enhanced_job_searches')
        .select('*')
        .eq('id', searchId)
        .eq('user_id', user.id)
        .single();

      if (searchError || !search) {
        throw new Error('Search not found or access denied');
      }

      // Create execution log
      const { data: executionLog, error: logError } = await supabase
        .from('search_execution_log')
        .insert([{
          search_id: searchId,
          execution_type: 'manual',
          started_at: new Date().toISOString(),
          status: 'running'
        }])
        .select()
        .single();

      if (logError) {
        throw new Error(`Failed to create execution log: ${logError.message}`);
      }

      try {
        // Execute the search across selected job boards
        const results = await this.performJobBoardSearch(search);
        
        // Store results in database
        if (results.length > 0) {
          await this.storeSearchResults(searchId, results);
        }

        // Update execution log with success
        await supabase
          .from('search_execution_log')
          .update({
            completed_at: new Date().toISOString(),
            status: 'completed',
            total_results_found: results.length,
            results_by_board: this.summarizeResultsByBoard(results)
          })
          .eq('id', executionLog.id);

        // Update search last_executed_at
        await supabase
          .from('enhanced_job_searches')
          .update({
            last_executed_at: new Date().toISOString()
          })
          .eq('id', searchId);

        return { ...executionLog, status: 'completed', total_results_found: results.length };
      } catch (executionError) {
        // Update execution log with error
        await supabase
          .from('search_execution_log')
          .update({
            completed_at: new Date().toISOString(),
            status: 'failed',
            error_message: executionError instanceof Error ? executionError.message : 'Unknown error',
            error_details: { error: executionError }
          })
          .eq('id', executionLog.id);

        throw executionError;
      }
    } catch (error) {
      console.error('Unexpected error in executeSearch:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  // Get search results for a specific search
  static async getSearchResults(
    searchId: string, 
    options?: {
      includeBookmarked?: boolean;
      includeDismissed?: boolean;
      minMatchScore?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<JobSearchResult[]> {
    try {
      let query = supabase
        .from('job_search_results')
        .select(`
          *,
          job_board_sources!job_search_results_job_board_source_id_fkey (
            display_name,
            website_url
          )
        `)
        .eq('search_id', searchId);

      // Apply filters
      if (options?.includeBookmarked === false) {
        query = query.neq('is_bookmarked', true);
      }
      if (options?.includeDismissed === false) {
        query = query.neq('is_dismissed', true);
      }
      if (options?.minMatchScore) {
        query = query.gte('ai_match_score', options.minMatchScore);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      }

      // Order by match score and created date
      query = query.order('ai_match_score', { ascending: false, nullsLast: true })
                  .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching search results:', error);
        throw new Error(`Failed to fetch search results: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in getSearchResults:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  // Populate search form from job profile
  static populateSearchFromProfile(profile: JobProfile): Partial<EnhancedJobSearch> {
    return {
      profile_id: profile.id,
      job_title: profile.summary?.split(' ')[0] || '', // Basic title extraction
      location: profile.location || profile.locations?.[0] || null,
      remote_type: profile.remote_preference || null,
      employment_type: profile.employment_types || null,
      experience_level: profile.experience_level || null,
      salary_min: profile.desired_salary_min || null,
      salary_max: profile.desired_salary_max || null,
      salary_currency: profile.salary_currency || 'USD',
      industry_sectors: profile.industries || null,
      required_skills: profile.skills || null,
      company_size: profile.company_sizes || null,
      ai_matching_enabled: true,
      minimum_match_score: 70
    };
  }

  // AI-powered job level analysis using Claude
  static async analyzeJobLevel(profile: JobProfile): Promise<AIJobLevelAnalysis> {
    try {
      const analysisPrompt = this.buildJobLevelAnalysisPrompt(profile);
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: analysisPrompt,
          context: 'job_level_analysis',
          expectJSON: true
        }
      });

      if (error) {
        console.error('Claude API error for job level analysis:', error);
        return this.analyzeJobLevelFallback(profile);
      }

      // Parse Claude's response
      const claudeResponse = data?.response;
      if (!claudeResponse) {
        throw new Error('No response from Claude API');
      }

      // Try to extract JSON from Claude's response
      let analysisData;
      try {
        // Claude might return JSON wrapped in code blocks
        const jsonMatch = claudeResponse.match(/```json\n([\s\S]*?)\n```/) || 
                         claudeResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // If no JSON found, create structured response from text
          analysisData = this.parseJobLevelTextAnalysis(claudeResponse, profile);
        }
      } catch (parseError) {
        console.warn('Failed to parse Claude JSON response for job level, using text analysis');
        analysisData = this.parseJobLevelTextAnalysis(claudeResponse, profile);
      }

      return {
        detectedLevel: analysisData.detectedLevel || 'mid',
        confidence: Math.min(Math.max(analysisData.confidence || 0.5, 0), 1), // Clamp 0-1
        reasoning: analysisData.reasoning || 'Analysis completed',
        alternativeOptions: analysisData.alternativeOptions || []
      };
    } catch (error) {
      console.error('Error analyzing job level:', error);
      return this.analyzeJobLevelFallback(profile);
    }
  }

  // Enhanced populate with AI job level detection
  static async populateSearchFromProfileWithAI(profile: JobProfile): Promise<{
    searchData: Partial<EnhancedJobSearch>;
    levelAnalysis: AIJobLevelAnalysis;
  }> {
    try {
      // Get AI job level analysis
      const levelAnalysis = await this.analyzeJobLevel(profile);
      
      // Populate search with base data + AI-detected level
      const searchData = {
        ...this.populateSearchFromProfile(profile),
        name: `${profile.name} - ${this.EXPERIENCE_LEVELS.find(l => l.value === levelAnalysis.detectedLevel)?.label || 'Professional'} Jobs`,
        experience_level: levelAnalysis.detectedLevel,
        // Enhanced auto-detection
        employment_type: this.detectEmploymentPreference(profile),
        remote_type: this.detectRemotePreference(profile),
        salary_currency: this.detectCurrencyFromLocation(profile.location || ''),
        search_frequency: 'daily',
        is_active: true
      };

      return { searchData, levelAnalysis };
    } catch (error) {
      console.error('Error in enhanced profile population:', error);
      
      // Fallback to basic population
      const fallbackLevel = this.analyzeJobLevelFallback(profile);
      return {
        searchData: {
          ...this.populateSearchFromProfile(profile),
          experience_level: fallbackLevel.detectedLevel
        },
        levelAnalysis: fallbackLevel
      };
    }
  }

  // Private helper methods
  private static async performJobBoardSearch(search: EnhancedJobSearch): Promise<JobBoardResult[]> {
    const searchParams: JobBoardSearchParams = {
      jobTitle: search.job_title || undefined,
      location: search.location || undefined,
      remoteType: search.remote_type || undefined,
      employmentType: search.employment_type || undefined,
      experienceLevel: search.experience_level || undefined,
      salaryMin: search.salary_min || undefined,
      salaryMax: search.salary_max || undefined,
      companySizes: search.company_size || undefined,
      industries: search.industry_sectors || undefined,
      requiredSkills: search.required_skills || undefined,
      maxResults: search.max_results_per_board || 50
    };

    const allResults: JobBoardResult[] = [];
    const selectedBoards = search.selected_job_boards || ['linkedin', 'indeed'];

    for (const boardName of selectedBoards) {
      try {
        const results = await this.searchJobBoard(boardName, searchParams);
        allResults.push(...results);
      } catch (error) {
        console.error(`Error searching ${boardName}:`, error);
        // Continue with other job boards even if one fails
      }
    }

    return allResults;
  }

  private static async searchJobBoard(boardName: string, params: JobBoardSearchParams): Promise<JobBoardResult[]> {
    try {
      console.log(`🔍 Searching ${boardName} with params:`, params);

      switch (boardName.toLowerCase()) {
        case 'linkedin':
          return await this.searchLinkedIn(params);
        
        case 'indeed':
          // TODO: Implement Indeed scraper
          console.log('🚧 Indeed scraper not yet implemented, using mock data');
          return this.generateMockJobResults(boardName, params);
        
        case 'totaljobs':
          // TODO: Implement TotalJobs scraper  
          console.log('🚧 TotalJobs scraper not yet implemented, using mock data');
          return this.generateMockJobResults(boardName, params);
        
        default:
          // Use mock data for other job boards
          console.log(`🚧 ${boardName} scraper not yet implemented, using mock data`);
          return this.generateMockJobResults(boardName, params);
      }
    } catch (error) {
      console.error(`❌ Error searching ${boardName}:`, error);
      // Fallback to mock data to prevent complete failure
      return this.generateMockJobResults(boardName, params);
    }
  }

  // LinkedIn job search implementation with configuration and rate limiting
  private static async searchLinkedIn(params: JobBoardSearchParams): Promise<JobBoardResult[]> {
    const startTime = Date.now();
    
    try {
      console.log('🔵 Searching LinkedIn jobs...');
      
      // Get current user for configuration
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.log('❌ User not authenticated, using default LinkedIn search');
        return this.generateMockJobResults('linkedin', params);
      }

      // Check if LinkedIn scraping is allowed for this user
      const permission = await ScrapingConfigService.isLinkedInScrapingAllowed(user.id);
      if (!permission.allowed) {
        console.log(`❌ LinkedIn scraping not allowed: ${permission.reason}`);
        await ScrapingConfigService.logScrapingRequest(user.id, 'linkedin', 'blocked', {
          error_message: permission.reason
        });
        return this.generateMockJobResults('linkedin', params);
      }

      // Check rate limits
      const rateLimit = await ScrapingConfigService.checkRateLimit(user.id, 'linkedin');
      if (!rateLimit.allowed) {
        console.log(`⏳ LinkedIn rate limit exceeded: ${rateLimit.requests_in_last_hour} requests in last hour`);
        await ScrapingConfigService.logScrapingRequest(user.id, 'linkedin', 'rate_limited', {
          error_message: `Rate limit: ${rateLimit.requests_in_last_hour} requests in last hour`
        });
        
        // Use cached/mock data when rate limited
        return this.generateMockJobResults('linkedin', params);
      }

      // Get user's scraping preferences
      const userPrefs = permission.config;
      if (!userPrefs) {
        throw new Error('User preferences not available');
      }

      // Configure LinkedIn scraper with user preferences
      const config: LinkedInScrapingConfig = {
        maxResults: Math.min(params.maxResults || userPrefs.linkedin_max_results_per_search || 25, 50),
        delayMs: Math.max(userPrefs.linkedin_rate_limit_ms || 3000, 1000), // Min 1 second
        userAgentRotation: userPrefs.linkedin_user_agent_rotation !== false,
        respectRateLimit: userPrefs.respect_rate_limits !== false
      };

      console.log('⚙️ LinkedIn scraping config:', {
        maxResults: config.maxResults,
        delayMs: config.delayMs,
        userAgentRotation: config.userAgentRotation,
        respectRateLimit: config.respectRateLimit
      });

      // Perform the LinkedIn search
      const results = await LinkedInScraperService.searchJobs(params, config);
      
      const responseTime = Date.now() - startTime;
      console.log(`✅ LinkedIn returned ${results.length} results in ${responseTime}ms`);
      
      // Log successful request
      await ScrapingConfigService.logScrapingRequest(user.id, 'linkedin', 'success', {
        results_count: results.length,
        response_time_ms: responseTime
      });
      
      return results;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('❌ LinkedIn search failed:', error);
      
      // Log failed request
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await ScrapingConfigService.logScrapingRequest(user.id, 'linkedin', 'failed', {
            error_message: error instanceof Error ? error.message : 'Unknown error',
            response_time_ms: responseTime
          });
        }
      } catch (logError) {
        console.error('Failed to log scraping request:', logError);
      }
      
      // Fallback to mock data if scraping fails
      console.log('🔄 Falling back to LinkedIn mock data...');
      return this.generateMockJobResults('linkedin', params);
    }
  }

  private static generateMockJobResults(boardName: string, params: JobBoardSearchParams): JobBoardResult[] {
    const titles = [
      'Senior Software Engineer',
      'Product Manager',
      'Data Scientist',
      'UX Designer',
      'DevOps Engineer',
      'Marketing Manager',
      'Sales Executive',
      'Business Analyst'
    ];

    const companies = [
      'TechCorp', 'InnovateCo', 'DataDyne', 'DesignLabs', 
      'CloudSoft', 'MarketPro', 'SalesForce Plus', 'Analytics Inc'
    ];

    const locations = [
      'London, UK', 'New York, NY', 'San Francisco, CA', 
      'Remote', 'Berlin, Germany', 'Toronto, Canada'
    ];

    const results: JobBoardResult[] = [];
    const numResults = Math.min(params.maxResults || 20, 20);

    for (let i = 0; i < numResults; i++) {
      const title = params.jobTitle || titles[Math.floor(Math.random() * titles.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const location = params.location || locations[Math.floor(Math.random() * locations.length)];

      results.push({
        jobTitle: title,
        companyName: company,
        jobDescription: `Exciting opportunity at ${company} for a ${title}. We're looking for someone with strong skills and experience...`,
        location: location,
        remoteType: params.remoteType || (Math.random() > 0.5 ? 'hybrid' : 'remote'),
        employmentType: 'full-time',
        experienceLevel: params.experienceLevel || 'mid',
        salaryMin: params.salaryMin || (50000 + Math.floor(Math.random() * 50000)),
        salaryMax: params.salaryMax || (80000 + Math.floor(Math.random() * 70000)),
        salaryCurrency: 'GBP',
        originalJobId: `${boardName}-${Date.now()}-${i}`,
        jobUrl: `https://${boardName}.com/jobs/${Date.now()}-${i}`,
        postedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        applicationDeadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return results;
  }

  private static async storeSearchResults(searchId: string, results: JobBoardResult[]): Promise<void> {
    // Get the search to determine if AI analysis is enabled
    const { data: search } = await supabase
      .from('enhanced_job_searches')
      .select('ai_matching_enabled, profile_id')
      .eq('id', searchId)
      .single();

    let profile: JobProfile | null = null;
    if (search?.profile_id && search.ai_matching_enabled) {
      const { data: profileData } = await supabase
        .from('job_profiles')
        .select('*')
        .eq('id', search.profile_id)
        .single();
      profile = profileData;
    }

    const resultsToInsert = await Promise.all(results.map(async (result) => {
      let aiMatchScore = Math.random() * 0.4 + 0.6; // Default mock score
      let aiAnalysis = null;

      // Perform AI analysis if enabled and profile available
      if (search?.ai_matching_enabled && profile) {
        try {
          const jobSearchResult: JobSearchResult = {
            id: '', // Will be generated
            search_id: searchId,
            job_board_source_id: this.getBoardSourceId(result.originalJobId?.split('-')[0] || 'linkedin'),
            job_title: result.jobTitle,
            company_name: result.companyName,
            job_description: result.jobDescription,
            location: result.location,
            remote_type: result.remoteType,
            employment_type: result.employmentType,
            experience_level: result.experienceLevel,
            salary_min: result.salaryMin,
            salary_max: result.salaryMax,
            salary_currency: result.salaryCurrency,
            original_job_id: result.originalJobId,
            job_url: result.jobUrl,
            posted_date: result.postedDate,
            application_deadline: result.applicationDeadline,
            ai_match_score: null,
            ai_analysis: null,
            skill_matches: null,
            missing_skills: null,
            is_bookmarked: false,
            is_dismissed: false,
            viewed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const analysis = await this.analyzeJobMatch(jobSearchResult, profile);
          aiMatchScore = analysis.matchScore;
          aiAnalysis = analysis.analysis;
        } catch (error) {
          console.warn('AI analysis failed for job, using default score:', error);
          // Continue with mock score
        }
      }

      return {
        search_id: searchId,
        job_board_source_id: this.getBoardSourceId(result.originalJobId?.split('-')[0] || 'linkedin'),
        job_title: result.jobTitle,
        company_name: result.companyName,
        job_description: result.jobDescription,
        location: result.location,
        remote_type: result.remoteType,
        employment_type: result.employmentType,
        experience_level: result.experienceLevel,
        salary_min: result.salaryMin,
        salary_max: result.salaryMax,
        salary_currency: result.salaryCurrency,
        original_job_id: result.originalJobId,
        job_url: result.jobUrl,
        posted_date: result.postedDate,
        application_deadline: result.applicationDeadline,
        ai_match_score: aiMatchScore,
        ai_analysis: aiAnalysis,
        skill_matches: aiAnalysis?.skillMatch?.matching || null,
        missing_skills: aiAnalysis?.skillMatch?.missing || null,
        is_bookmarked: false,
        is_dismissed: false
      };
    }));

    const { error } = await supabase
      .from('job_search_results')
      .insert(resultsToInsert);

    if (error) {
      console.error('Error storing search results:', error);
      throw new Error(`Failed to store search results: ${error.message}`);
    }
  }

  private static getBoardSourceId(boardName: string): string {
    // In production, this would map to actual job board source IDs
    const boardMap: Record<string, string> = {
      'linkedin': '1',
      'indeed': '2',
      'totaljobs': '3',
      'glassdoor': '4',
      'stackoverflow': '5',
      'monster': '6',
      'reed': '7',
      'ziprecruiter': '8'
    };
    return boardMap[boardName] || '1';
  }

  private static summarizeResultsByBoard(results: JobBoardResult[]): Record<string, number> {
    const summary: Record<string, number> = {};
    
    for (const result of results) {
      const boardName = result.originalJobId?.split('-')[0] || 'unknown';
      summary[boardName] = (summary[boardName] || 0) + 1;
    }
    
    return summary;
  }

  // AI Job Analysis using Claude API
  static async analyzeJobMatch(job: JobSearchResult, profile: JobProfile): Promise<AIJobAnalysis> {
    try {
      const analysisPrompt = this.buildJobAnalysisPrompt(job, profile);
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: analysisPrompt,
          context: 'job_analysis',
          expectJSON: true
        }
      });

      if (error) {
        console.error('Claude API error:', error);
        // Fall back to mock analysis if Claude API fails
        return this.generateMockAnalysis(job, profile);
      }

      // Parse Claude's response
      const claudeResponse = data?.response;
      if (!claudeResponse) {
        throw new Error('No response from Claude API');
      }

      // Try to extract JSON from Claude's response
      let analysisData;
      try {
        // Claude might return JSON wrapped in code blocks
        const jsonMatch = claudeResponse.match(/```json\n([\s\S]*?)\n```/) || 
                         claudeResponse.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // If no JSON found, create structured response from text
          analysisData = this.parseTextAnalysis(claudeResponse, job, profile);
        }
      } catch (parseError) {
        console.warn('Failed to parse Claude JSON response, using text analysis');
        analysisData = this.parseTextAnalysis(claudeResponse, job, profile);
      }

      return {
        matchScore: analysisData.matchScore || Math.random() * 0.4 + 0.6, // 0.6-1.0 range
        analysis: {
          summary: analysisData.summary || `Analysis of ${job.job_title} at ${job.company_name}`,
          strengths: analysisData.strengths || [],
          concerns: analysisData.concerns || [],
          skillMatch: {
            matching: analysisData.skillMatch?.matching || [],
            missing: analysisData.skillMatch?.missing || [],
            transferable: analysisData.skillMatch?.transferable || []
          },
          recommendations: analysisData.recommendations || 'No specific recommendations available.'
        }
      };
    } catch (error) {
      console.error('Error analyzing job match:', error);
      // Fall back to mock analysis
      return this.generateMockAnalysis(job, profile);
    }
  }

  private static buildJobAnalysisPrompt(job: JobSearchResult, profile: JobProfile): string {
    return `
Analyze this job opportunity for compatibility with the candidate's profile. Provide a detailed JSON analysis.

JOB DETAILS:
- Title: ${job.job_title}
- Company: ${job.company_name}
- Location: ${job.location || 'Not specified'}
- Salary: ${job.salary_min || 'Not specified'} - ${job.salary_max || 'Not specified'} ${job.salary_currency || ''}
- Experience Level: ${job.experience_level || 'Not specified'}
- Employment Type: ${job.employment_type || 'Not specified'}
- Remote Type: ${job.remote_type || 'Not specified'}
- Description: ${job.job_description?.substring(0, 500) || 'No description available'}

CANDIDATE PROFILE:
- Name: ${profile.name}
- Experience Level: ${profile.experience_level || 'Not specified'}
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- Industries: ${profile.industries?.join(', ') || 'Not specified'}
- Location: ${profile.location || 'Not specified'}
- Remote Preference: ${profile.remote_preference || 'Not specified'}
- Salary Range: ${profile.desired_salary_min || 'Not specified'} - ${profile.desired_salary_max || 'Not specified'} ${profile.salary_currency || ''}
- Summary: ${profile.summary || 'No summary available'}

Please analyze this match and return a JSON response with this exact structure:
{
  "matchScore": 0.85,
  "summary": "Brief overall assessment of the match quality",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "concerns": ["Concern 1", "Concern 2"],
  "skillMatch": {
    "matching": ["Skill 1", "Skill 2"],
    "missing": ["Missing skill 1"],
    "transferable": ["Transferable skill 1"]
  },
  "recommendations": "Specific advice for the candidate"
}

Focus on:
1. Skills alignment and gaps
2. Experience level match
3. Salary expectations vs offering
4. Location/remote work compatibility
5. Industry/company culture fit
6. Career progression potential

Provide actionable insights and be honest about both strengths and potential challenges.
`;
  }

  private static parseTextAnalysis(text: string, job: JobSearchResult, profile: JobProfile): any {
    // Extract key information from Claude's text response
    const strengthsMatch = text.match(/strengths?:?\s*([^.]*)/i);
    const concernsMatch = text.match(/concerns?:?\s*([^.]*)/i);
    const recommendationsMatch = text.match(/recommendations?:?\s*([^.]*)/i);

    return {
      summary: `Analysis of ${job.job_title} position at ${job.company_name}`,
      strengths: strengthsMatch 
        ? strengthsMatch[1].split(/[,;]/).map(s => s.trim()).filter(s => s)
        : ['Experience level alignment', 'Location compatibility'],
      concerns: concernsMatch
        ? concernsMatch[1].split(/[,;]/).map(s => s.trim()).filter(s => s)
        : ['Some skill gaps may exist'],
      skillMatch: {
        matching: profile.skills?.slice(0, 3) || [],
        missing: ['To be determined through detailed analysis'],
        transferable: ['Communication', 'Problem solving']
      },
      recommendations: recommendationsMatch
        ? recommendationsMatch[1].trim()
        : 'Consider tailoring your application to highlight relevant experience and skills.'
    };
  }

  private static generateMockAnalysis(job: JobSearchResult, profile: JobProfile): AIJobAnalysis {
    // Fallback mock analysis when Claude API is unavailable
    const matchScore = Math.random() * 0.4 + 0.6; // 0.6-1.0 range

    return {
      matchScore,
      analysis: {
        summary: `This ${job.job_title} role at ${job.company_name} shows ${matchScore > 0.8 ? 'strong' : matchScore > 0.7 ? 'good' : 'moderate'} alignment with your background.`,
        strengths: [
          'Experience level appears suitable',
          'Location preferences align',
          'Industry background relevant'
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        concerns: [
          'Some skill gaps may exist',
          'Salary expectations may differ',
          'Company culture fit to be assessed'
        ].slice(0, Math.floor(Math.random() * 2) + 1),
        skillMatch: {
          matching: profile.skills?.slice(0, Math.floor(Math.random() * 4) + 1) || ['Communication', 'Problem solving'],
          missing: ['Technical skill assessment needed', 'Industry-specific knowledge'],
          transferable: ['Leadership', 'Project management', 'Analytical thinking'].slice(0, Math.floor(Math.random() * 2) + 1)
        },
        recommendations: matchScore > 0.8 
          ? 'This appears to be an excellent match. Consider applying and highlighting your relevant experience.'
          : matchScore > 0.7
          ? 'Good potential match. Focus on addressing any skill gaps and emphasizing transferable skills.'
          : 'Moderate match. Consider if this role aligns with your career goals and be prepared to demonstrate relevant capabilities.'
      }
    };
  }

  // Build prompt for AI job level analysis
  private static buildJobLevelAnalysisPrompt(profile: JobProfile): string {
    return `
Analyze this professional profile and determine their experience level for job searching.

PROFILE DATA:
- Name: ${profile.name}
- Professional Title/Summary: ${profile.summary || 'Not specified'}
- Bio/Description: ${profile.bio || 'Not specified'}
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- Location: ${profile.location || 'Not specified'}
- Current Experience Level (if set): ${profile.experience_level || 'Not specified'}
- Industries: ${profile.industries?.join(', ') || 'Not specified'}

EXPERIENCE LEVELS TO CHOOSE FROM:
- entry: Entry Level (0-2 years) - New graduate, career changer, bootcamp graduate
- junior: Junior (2-4 years) - Some professional experience, learning advanced skills  
- mid: Mid Level (4-7 years) - Solid experience, works independently
- senior: Senior (7-12 years) - Expert, mentors others, leads projects
- principal: Principal/Staff (12+ years) - Technical leadership, architecture decisions
- executive: Executive/Leadership - Director, VP, C-level, large team management

ANALYSIS CRITERIA:
Look for indicators like:
- Years of experience mentioned explicitly (most important)
- Job titles indicating seniority (Senior, Lead, Principal, Director, etc.)
- Leadership responsibilities (mentoring, team leading, strategic decisions)
- Technical depth vs breadth of skills
- Company progression or founding experience
- Educational background vs professional experience
- Management responsibilities
- Strategic vs operational focus

Respond with ONLY valid JSON in this exact format:
{
  "detectedLevel": "senior",
  "confidence": 0.85,
  "reasoning": "Profile shows 8+ years experience with leadership responsibilities and senior title",
  "alternativeOptions": ["mid", "principal"]
}

CONFIDENCE SCORING:
- 0.9+: Very clear indicators (explicit years, senior titles, obvious experience markers)
- 0.7-0.9: Strong indicators (leadership responsibilities, advanced skills, clear seniority)
- 0.5-0.7: Some indicators (skill complexity, title suggestions, moderate experience)
- Below 0.5: Unclear profile (default to mid-level)

Be conservative but accurate. If unsure, choose the lower level with lower confidence.
`;
  }

  // Fallback rule-based job level detection
  private static analyzeJobLevelFallback(profile: JobProfile): AIJobLevelAnalysis {
    const text = `${profile.summary || ''} ${profile.bio || ''} ${profile.experience_level || ''}`.toLowerCase();
    
    // Executive indicators
    if (text.match(/(ceo|cto|cmo|cfo|director|head of|vp|vice president|chief|founder|co-founder)/)) {
      return { 
        detectedLevel: 'executive', 
        confidence: 0.8, 
        reasoning: 'Executive keywords detected in profile',
        alternativeOptions: ['senior', 'principal']
      };
    }
    
    // Principal/Staff indicators
    if (text.match(/(principal|staff|architect|distinguished|15\+ years|12\+ years|10\+ years)/)) {
      return { 
        detectedLevel: 'principal', 
        confidence: 0.75, 
        reasoning: 'Principal/Staff level indicators found',
        alternativeOptions: ['senior', 'executive']
      };
    }
    
    // Senior indicators  
    if (text.match(/(senior|lead|team lead|technical lead|mentor|specialist|expert|8\+ years|7\+ years)/)) {
      return { 
        detectedLevel: 'senior', 
        confidence: 0.7, 
        reasoning: 'Senior level keywords and experience indicators detected',
        alternativeOptions: ['mid', 'principal']
      };
    }
    
    // Years of experience extraction
    const yearsMatch = text.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/);
    if (yearsMatch) {
      const years = parseInt(yearsMatch[1]);
      if (years >= 12) return { 
        detectedLevel: 'principal', 
        confidence: 0.85, 
        reasoning: `${years} years of experience indicates principal level`,
        alternativeOptions: ['senior', 'executive']
      };
      if (years >= 7) return { 
        detectedLevel: 'senior', 
        confidence: 0.8, 
        reasoning: `${years} years of experience indicates senior level`,
        alternativeOptions: ['mid', 'principal']
      };
      if (years >= 4) return { 
        detectedLevel: 'mid', 
        confidence: 0.8, 
        reasoning: `${years} years of experience indicates mid-level`,
        alternativeOptions: ['junior', 'senior']
      };
      if (years >= 2) return { 
        detectedLevel: 'junior', 
        confidence: 0.8, 
        reasoning: `${years} years of experience indicates junior level`,
        alternativeOptions: ['entry', 'mid']
      };
      return { 
        detectedLevel: 'entry', 
        confidence: 0.8, 
        reasoning: `${years} years of experience indicates entry level`,
        alternativeOptions: ['junior']
      };
    }

    // Junior indicators
    if (text.match(/(junior|associate|developing|early career|2-3 years|3-4 years)/)) {
      return { 
        detectedLevel: 'junior', 
        confidence: 0.6, 
        reasoning: 'Junior level indicators found',
        alternativeOptions: ['entry', 'mid']
      };
    }

    // Entry level indicators
    if (text.match(/(graduate|new grad|bootcamp|intern|trainee|entry|career change|transition)/)) {
      return { 
        detectedLevel: 'entry', 
        confidence: 0.65, 
        reasoning: 'Entry level indicators found',
        alternativeOptions: ['junior']
      };
    }
    
    // Default to mid-level if unclear
    return { 
      detectedLevel: 'mid', 
      confidence: 0.4, 
      reasoning: 'No clear experience indicators found, defaulting to mid-level',
      alternativeOptions: ['junior', 'senior']
    };
  }

  // Parse text response when JSON parsing fails
  private static parseJobLevelTextAnalysis(text: string, profile: JobProfile): any {
    const levelMatch = text.match(/(entry|junior|mid|senior|principal|executive)/i);
    const confidenceMatch = text.match(/confidence[:\s]*(\d+\.?\d*)/i);
    const reasoningMatch = text.match(/reasoning[:\s]*([^.]*)/i);

    return {
      detectedLevel: levelMatch ? levelMatch[1].toLowerCase() : 'mid',
      confidence: confidenceMatch ? Math.min(parseFloat(confidenceMatch[1]) / 100, 1) : 0.5,
      reasoning: reasoningMatch 
        ? reasoningMatch[1].trim() 
        : 'Analysis completed from profile text',
      alternativeOptions: ['mid'] // Basic fallback
    };
  }

  // Smart detection helpers
  private static detectEmploymentPreference(profile: JobProfile): string[] {
    const text = `${profile.summary || ''} ${profile.bio || ''}`.toLowerCase();
    
    if (text.match(/(freelance|consultant|contract)/)) return ['freelance', 'contract'];
    if (text.match(/(part.time|flexible)/)) return ['part-time', 'permanent'];
    if (text.match(/(startup|entrepreneur)/)) return ['permanent', 'contract'];
    
    return ['permanent']; // Default
  }

  private static detectRemotePreference(profile: JobProfile): string | null {
    const text = `${profile.summary || ''} ${profile.bio || ''} ${profile.remote_preference || ''}`.toLowerCase();
    
    if (text.match(/(remote.only|fully.remote|100%.remote)/)) return 'remote';
    if (text.match(/(hybrid|flexible|mix)/)) return 'hybrid';
    if (text.match(/(on.site|office|in.person)/)) return 'onsite';
    
    return profile.remote_preference || 'flexible';
  }

  private static detectCurrencyFromLocation(location: string): string {
    const loc = location.toLowerCase();
    
    if (loc.match(/(uk|united kingdom|london|manchester|birmingham|glasgow)/)) return 'GBP';
    if (loc.match(/(usa|united states|us|new york|california|texas|florida)/)) return 'USD';
    if (loc.match(/(canada|toronto|vancouver|montreal)/)) return 'CAD';
    if (loc.match(/(germany|berlin|munich|france|paris|spain|madrid|italy)/)) return 'EUR';
    if (loc.match(/(australia|sydney|melbourne)/)) return 'AUD';
    
    return 'USD'; // Default
  }
}