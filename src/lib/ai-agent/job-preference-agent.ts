import { supabase } from '../supabase';
import { 
  JobPreferences, 
  UserFeedback, 
  ParsedJobEmail,
  ConversationalResponse,
  ExclusionRule,
  LearningInsight
} from './types';

export class JobPreferenceAgent {
  private userId: string;
  private preferences: JobPreferences | null = null;
  private claudeApiKey: string;

  constructor(userId: string) {
    this.userId = userId;
    this.claudeApiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || '';
  }

  async initialize(): Promise<void> {
    // Load existing preferences from database
    const { data } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (data) {
      this.preferences = {
        ...data.structured_preferences,
        naturalLanguagePreferences: data.natural_language_preferences,
        exclusions: data.exclusion_rules || {
          companies: [],
          keywords: [],
          sectors: [],
          locations: [],
          reasons: {}
        },
        feedbackHistory: [],
        lastUpdated: new Date(data.updated_at),
        confidence: data.confidence || 0.5
      };
    } else {
      // Initialize default preferences
      this.preferences = this.getDefaultPreferences();
    }
  }

  async parseNaturalLanguagePreferences(input: string): Promise<Partial<JobPreferences>> {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'system',
            content: `You are a job preference parser. Extract structured job preferences from natural language input.
              
              Return a JSON object with these fields:
              - jobTitles: array of job titles
              - locations: array of locations
              - salaryRange: {min, max, currency}
              - remotePreference: 'onsite' | 'hybrid' | 'remote' | 'flexible'
              - experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
              - exclusions: {companies: [], keywords: [], sectors: [], reasons: {}}
              - preferences: {industries: [], benefits: [], culture: [], technologies: []}
              
              Be specific and extract all mentioned preferences.`
          }, {
            role: 'user',
            content: input
          }],
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000
        })
      });

      const data = await response.json();
      const parsed = JSON.parse(data.content[0].text);
      
      return this.validateAndMergePreferences(parsed);
    } catch (error) {
      console.error('Error parsing natural language preferences:', error);
      return {};
    }
  }

  async processConversationalInput(message: string): Promise<ConversationalResponse> {
    // Analyze the intent of the message
    const intent = await this.analyzeIntent(message);
    
    switch (intent.type) {
      case 'add_preference':
        return this.handleAddPreference(message, intent);
        
      case 'add_exclusion':
        return this.handleAddExclusion(message, intent);
        
      case 'remove_preference':
        return this.handleRemovePreference(message, intent);
        
      case 'query_preferences':
        return this.handleQueryPreferences(message, intent);
        
      case 'refine_search':
        return this.handleRefineSearch(message, intent);
        
      default:
        return this.handleGeneralConversation(message);
    }
  }

  private async handleAddExclusion(message: string, intent: any): Promise<ConversationalResponse> {
    const exclusionData = await this.extractExclusionFromMessage(message);
    
    if (!exclusionData) {
      return {
        response: 'I couldn\'t understand what you want to exclude. Could you be more specific? For example: \'No sales jobs\' or \'Exclude companies in finance\'',
        clarifyingQuestions: [
          'What specific companies would you like to exclude?',
          'Are there certain job titles you want to avoid?',
          'Any industries you\'re not interested in?'
        ],
        needsClarification: true,
        confidence: 0.3
      };
    }

    // Add the exclusion
    const updatedPreferences = await this.addExclusion(exclusionData);
    
    // Generate examples of what will be excluded
    const examples = await this.generateExclusionExamples(exclusionData);
    
    return {
      response: `Got it! I'll exclude ${exclusionData.description}. This means I'll filter out jobs like:\n${examples.join('\n')}`,
      updatedPreferences,
      suggestedActions: [{
        id: 'confirm_exclusion',
        type: 'exclude',
        label: 'Looks good',
        description: 'Confirm this exclusion'
      }, {
        id: 'modify_exclusion',
        type: 'refine',
        label: 'Too broad',
        description: 'This excludes too much'
      }],
      confidence: 0.85,
      needsClarification: false
    };
  }

  async updatePreferencesFromFeedback(jobId: string, feedback: UserFeedback): Promise<void> {
    if (!this.preferences) {
      await this.initialize();
    }

    // Store feedback
    await supabase.from('job_feedback').insert({
      user_id: this.userId,
      job_result_id: jobId,
      feedback_type: feedback.feedbackType,
      rating: feedback.rating,
      reason: feedback.reason,
      created_at: new Date().toISOString()
    });

    // Update preferences based on feedback
    if (feedback.feedbackType === 'like' || feedback.feedbackType === 'applied') {
      this.preferences!.likedJobs.push(jobId);
    } else if (feedback.feedbackType === 'dislike' || feedback.feedbackType === 'rejected') {
      this.preferences!.dislikedJobs.push(jobId);
    }

    // Analyze patterns if we have enough feedback
    if (this.preferences!.feedbackHistory.length >= 10) {
      await this.analyzeAndUpdatePreferences();
    }

    // Save updated preferences
    await this.savePreferences();
  }

  async shouldExcludeJob(job: ParsedJobEmail): Promise<{ exclude: boolean; reason: string }> {
    if (!this.preferences) {
      return { exclude: false, reason: '' };
    }

    const exclusions = this.preferences.exclusions;

    // Check company exclusions
    if (exclusions.companies.some(company => 
      job.company.toLowerCase().includes(company.toLowerCase())
    )) {
      return { 
        exclude: true, 
        reason: `Company "${job.company}" is in your exclusion list` 
      };
    }

    // Check keyword exclusions in job title
    for (const keyword of exclusions.keywords) {
      if (job.jobTitle.toLowerCase().includes(keyword.toLowerCase())) {
        return { 
          exclude: true, 
          reason: `Job title contains excluded keyword "${keyword}"` 
        };
      }
    }

    // Check sector exclusions
    if (job.description) {
      for (const sector of exclusions.sectors) {
        if (job.description.toLowerCase().includes(sector.toLowerCase())) {
          return { 
            exclude: true, 
            reason: `Job appears to be in excluded sector "${sector}"` 
          };
        }
      }
    }

    // Check location exclusions
    if (job.location) {
      for (const location of exclusions.locations) {
        if (job.location.toLowerCase().includes(location.toLowerCase())) {
          return { 
            exclude: true, 
            reason: `Location "${job.location}" is excluded` 
          };
        }
      }
    }

    // Check salary if below minimum
    if (this.preferences.salaryRange.min && job.salary?.max) {
      if (job.salary.max < this.preferences.salaryRange.min) {
        return { 
          exclude: true, 
          reason: `Salary below your minimum of ${this.preferences.salaryRange.currency || '$'}${this.preferences.salaryRange.min}` 
        };
      }
    }

    return { exclude: false, reason: '' };
  }

  async suggestExclusions(): Promise<ExclusionRule[]> {
    if (!this.preferences || this.preferences.dislikedJobs.length < 5) {
      return [];
    }

    // Analyze disliked jobs for patterns
    const dislikedJobsData = await this.fetchJobsData(this.preferences.dislikedJobs);
    const patterns = await this.analyzeJobPatterns(dislikedJobsData);
    
    const suggestions: ExclusionRule[] = [];

    // Company patterns
    if (patterns.commonCompanies.length > 0) {
      for (const company of patterns.commonCompanies) {
        if (company.count >= 2) {
          suggestions.push({
            id: `suggest_company_${company.name}`,
            type: 'company',
            pattern: company.name,
            reason: `You've rejected ${company.count} jobs from ${company.name}`,
            confidence: Math.min(company.count * 0.3, 0.9),
            userConfirmed: false,
            suggestedBy: 'ai',
            createdAt: new Date(),
            exampleMatches: company.examples
          });
        }
      }
    }

    // Keyword patterns in job titles
    if (patterns.commonKeywords.length > 0) {
      for (const keyword of patterns.commonKeywords) {
        if (keyword.count >= 3) {
          suggestions.push({
            id: `suggest_keyword_${keyword.word}`,
            type: 'keyword',
            pattern: keyword.word,
            reason: `You've rejected ${keyword.count} "${keyword.word}" positions`,
            confidence: Math.min(keyword.count * 0.25, 0.85),
            userConfirmed: false,
            suggestedBy: 'ai',
            createdAt: new Date(),
            exampleMatches: keyword.examples
          });
        }
      }
    }

    return suggestions;
  }

  private async analyzeIntent(message: string): Promise<{ type: string; entities: any }> {
    const lowerMessage = message.toLowerCase();
    
    // Simple intent detection - could be enhanced with Claude
    if (lowerMessage.includes('don\'t want') || lowerMessage.includes('no more') || lowerMessage.includes('exclude')) {
      return { type: 'add_exclusion', entities: {} };
    }
    
    if (lowerMessage.includes('looking for') || lowerMessage.includes('want') || lowerMessage.includes('interested in')) {
      return { type: 'add_preference', entities: {} };
    }
    
    if (lowerMessage.includes('remove') || lowerMessage.includes('delete') || lowerMessage.includes('don\'t exclude')) {
      return { type: 'remove_preference', entities: {} };
    }
    
    if (lowerMessage.includes('what are my') || lowerMessage.includes('show me my') || lowerMessage.includes('current preferences')) {
      return { type: 'query_preferences', entities: {} };
    }
    
    return { type: 'general', entities: {} };
  }

  private async extractExclusionFromMessage(message: string): Promise<any> {
    // Extract exclusion details from message
    // This would use Claude API for better extraction
    const patterns = {
      company: /exclude|no\s+(?:more\s+)?(?:jobs?\s+)?(?:from|at)\s+([^,.\s]+)/i,
      keyword: /no\s+(?:more\s+)?(\w+)\s+(?:jobs?|positions?|roles?)/i,
      sector: /not\s+interested\s+in\s+(\w+)/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = message.match(pattern);
      if (match) {
        return {
          type,
          pattern: match[1],
          description: match[0],
          reason: `User requested: "${message}"`
        };
      }
    }

    return null;
  }

  private async addExclusion(exclusionData: any): Promise<Partial<JobPreferences>> {
    if (!this.preferences) return {};

    switch (exclusionData.type) {
      case 'company':
        this.preferences.exclusions.companies.push(exclusionData.pattern);
        this.preferences.exclusions.reasons[exclusionData.pattern] = exclusionData.reason;
        break;
      case 'keyword':
        this.preferences.exclusions.keywords.push(exclusionData.pattern);
        this.preferences.exclusions.reasons[exclusionData.pattern] = exclusionData.reason;
        break;
      case 'sector':
        this.preferences.exclusions.sectors.push(exclusionData.pattern);
        this.preferences.exclusions.reasons[exclusionData.pattern] = exclusionData.reason;
        break;
    }

    await this.savePreferences();
    
    return {
      exclusions: this.preferences.exclusions
    };
  }

  private async generateExclusionExamples(exclusionData: any): Promise<string[]> {
    // Generate examples of what would be excluded
    const examples: string[] = [];
    
    switch (exclusionData.type) {
      case 'company':
        examples.push(`• Any position at ${exclusionData.pattern}`);
        examples.push(`• Jobs from ${exclusionData.pattern} subsidiaries`);
        break;
      case 'keyword':
        examples.push(`• "${exclusionData.pattern} Engineer" positions`);
        examples.push(`• "Senior ${exclusionData.pattern}" roles`);
        examples.push(`• Any job with "${exclusionData.pattern}" in the title`);
        break;
      case 'sector':
        examples.push(`• Jobs in the ${exclusionData.pattern} industry`);
        examples.push(`• ${exclusionData.pattern}-related positions`);
        break;
    }
    
    return examples;
  }

  private async analyzeAndUpdatePreferences(): Promise<void> {
    // Analyze feedback patterns and update preferences
    const insights = await this.generateLearningInsights();
    
    for (const insight of insights) {
      if (insight.confidence > 0.7) {
        await this.applyLearningInsight(insight);
      }
    }
  }

  private async generateLearningInsights(): Promise<LearningInsight[]> {
    // Analyze patterns in liked/disliked jobs
    // This would use more sophisticated ML in production
    const insights: LearningInsight[] = [];
    
    // Placeholder for actual analysis
    insights.push({
      id: 'insight_1',
      type: 'preference_pattern',
      insight: 'You seem to prefer remote positions at mid-size companies',
      confidence: 0.75,
      data: { remoteCount: 8, companySizePreference: 'medium' },
      createdAt: new Date()
    });
    
    return insights;
  }

  private async applyLearningInsight(insight: LearningInsight): Promise<void> {
    // Apply the insight to preferences
    if (insight.type === 'preference_pattern' && insight.data.remoteCount > 5) {
      this.preferences!.remotePreference = 'remote';
    }
  }

  private async savePreferences(): Promise<void> {
    if (!this.preferences) return;

    await supabase.from('job_preferences').upsert({
      user_id: this.userId,
      natural_language_preferences: this.preferences.naturalLanguagePreferences,
      structured_preferences: {
        jobTitles: this.preferences.jobTitles,
        locations: this.preferences.locations,
        salaryRange: this.preferences.salaryRange,
        remotePreference: this.preferences.remotePreference,
        experienceLevel: this.preferences.experienceLevel,
        employmentType: this.preferences.employmentType,
        preferences: this.preferences.preferences
      },
      exclusion_rules: this.preferences.exclusions,
      confidence: this.preferences.confidence,
      updated_at: new Date().toISOString()
    });
  }

  private getDefaultPreferences(): JobPreferences {
    return {
      jobTitles: [],
      locations: [],
      salaryRange: {},
      remotePreference: 'flexible',
      experienceLevel: 'mid',
      employmentType: 'full-time',
      naturalLanguagePreferences: '',
      exclusions: {
        companies: [],
        keywords: [],
        sectors: [],
        locations: [],
        reasons: {}
      },
      preferences: {
        companySize: 'any',
        industries: [],
        benefits: [],
        culture: [],
        technologies: []
      },
      likedJobs: [],
      dislikedJobs: [],
      appliedJobs: [],
      feedbackHistory: [],
      lastUpdated: new Date(),
      confidence: 0.5
    };
  }

  private validateAndMergePreferences(parsed: any): Partial<JobPreferences> {
    // Validate and merge parsed preferences with existing ones
    const validated: Partial<JobPreferences> = {};
    
    if (Array.isArray(parsed.jobTitles)) {
      validated.jobTitles = parsed.jobTitles;
    }
    
    if (Array.isArray(parsed.locations)) {
      validated.locations = parsed.locations;
    }
    
    if (parsed.salaryRange && typeof parsed.salaryRange === 'object') {
      validated.salaryRange = parsed.salaryRange;
    }
    
    if (['onsite', 'hybrid', 'remote', 'flexible'].includes(parsed.remotePreference)) {
      validated.remotePreference = parsed.remotePreference;
    }
    
    return validated;
  }

  private async fetchJobsData(jobIds: string[]): Promise<ParsedJobEmail[]> {
    // Fetch job data from database
    const { data } = await supabase
      .from('job_search_results')
      .select('*')
      .in('id', jobIds);
    
    return data || [];
  }

  private async analyzeJobPatterns(jobs: ParsedJobEmail[]): Promise<any> {
    // Analyze common patterns in jobs
    const patterns = {
      commonCompanies: [] as any[],
      commonKeywords: [] as any[],
      commonSectors: [] as any[]
    };
    
    // Count company occurrences
    const companyCount = new Map<string, number>();
    jobs.forEach(job => {
      const count = companyCount.get(job.company) || 0;
      companyCount.set(job.company, count + 1);
    });
    
    // Convert to array and sort
    patterns.commonCompanies = Array.from(companyCount.entries())
      .map(([name, count]) => ({ 
        name, 
        count,
        examples: jobs.filter(j => j.company === name).map(j => j.jobTitle)
      }))
      .sort((a, b) => b.count - a.count);
    
    return patterns;
  }

  private async handleAddPreference(message: string, intent: any): Promise<ConversationalResponse> {
    const preferences = await this.parseNaturalLanguagePreferences(message);
    
    if (Object.keys(preferences).length === 0) {
      return {
        response: 'I\'m having trouble understanding your preferences. Could you tell me more specifically about the type of job you\'re looking for?',
        clarifyingQuestions: [
          'What job titles are you interested in?',
          'Where would you like to work (location/remote)?',
          'What\'s your desired salary range?',
          'What size company do you prefer?'
        ],
        needsClarification: true,
        confidence: 0.3
      };
    }

    // Merge with existing preferences
    this.preferences = { ...this.preferences!, ...preferences };
    await this.savePreferences();

    return {
      response: `Great! I've updated your preferences. ${this.summarizePreferences(preferences)}`,
      updatedPreferences: preferences,
      suggestedActions: [{
        id: 'run_search',
        type: 'search',
        label: 'Search for jobs now',
        description: 'Find jobs matching these preferences'
      }],
      confidence: 0.9,
      needsClarification: false
    };
  }

  private summarizePreferences(prefs: Partial<JobPreferences>): string {
    const parts: string[] = [];
    
    if (prefs.jobTitles?.length) {
      parts.push(`Looking for ${prefs.jobTitles.join(', ')} positions`);
    }
    
    if (prefs.locations?.length) {
      parts.push(`in ${prefs.locations.join(', ')}`);
    }
    
    if (prefs.salaryRange?.min) {
      parts.push(`with salary above ${prefs.salaryRange.currency || '$'}${prefs.salaryRange.min}`);
    }
    
    if (prefs.remotePreference && prefs.remotePreference !== 'flexible') {
      parts.push(`(${prefs.remotePreference})`);
    }
    
    return parts.join(' ');
  }

  private async handleRemovePreference(message: string, intent: any): Promise<ConversationalResponse> {
    // Implementation for removing preferences
    return {
      response: 'I\'ll help you remove that preference. What specifically would you like to remove?',
      clarifyingQuestions: [
        'Remove a company from exclusions?',
        'Remove a keyword filter?',
        'Change location preferences?'
      ],
      needsClarification: true,
      confidence: 0.7
    };
  }

  private async handleQueryPreferences(message: string, intent: any): Promise<ConversationalResponse> {
    if (!this.preferences) {
      return {
        response: 'You haven\'t set any preferences yet. Would you like to tell me what kind of jobs you\'re looking for?',
        needsClarification: false,
        confidence: 1.0
      };
    }

    const summary = this.generatePreferencesSummary();
    
    return {
      response: summary,
      suggestedActions: [{
        id: 'edit_preferences',
        type: 'refine',
        label: 'Edit preferences',
        description: 'Modify your current preferences'
      }],
      needsClarification: false,
      confidence: 1.0
    };
  }

  private generatePreferencesSummary(): string {
    if (!this.preferences) return 'No preferences set.';
    
    const parts: string[] = ['Here are your current preferences:\n'];
    
    if (this.preferences.jobTitles.length > 0) {
      parts.push(`📍 **Job Titles**: ${this.preferences.jobTitles.join(', ')}`);
    }
    
    if (this.preferences.locations.length > 0) {
      parts.push(`📍 **Locations**: ${this.preferences.locations.join(', ')}`);
    }
    
    if (this.preferences.salaryRange.min || this.preferences.salaryRange.max) {
      const salary = this.preferences.salaryRange;
      parts.push(`💰 **Salary**: ${salary.currency || '$'}${salary.min || '0'} - ${salary.max || 'open'}`);
    }
    
    parts.push(`🏠 **Work Style**: ${this.preferences.remotePreference}`);
    parts.push(`📊 **Experience Level**: ${this.preferences.experienceLevel}`);
    
    if (this.preferences.exclusions.companies.length > 0) {
      parts.push(`\n❌ **Excluded Companies**: ${this.preferences.exclusions.companies.join(', ')}`);
    }
    
    if (this.preferences.exclusions.keywords.length > 0) {
      parts.push(`❌ **Excluded Keywords**: ${this.preferences.exclusions.keywords.join(', ')}`);
    }
    
    return parts.join('\n');
  }

  private async handleRefineSearch(message: string, intent: any): Promise<ConversationalResponse> {
    // Implementation for refining search
    return {
      response: 'Let\'s refine your job search. What would you like to adjust?',
      suggestedActions: [
        {
          id: 'narrow_location',
          type: 'refine',
          label: 'Narrow location',
          description: 'Be more specific about location'
        },
        {
          id: 'adjust_salary',
          type: 'refine',
          label: 'Adjust salary range',
          description: 'Change salary expectations'
        },
        {
          id: 'add_skills',
          type: 'refine',
          label: 'Add required skills',
          description: 'Specify technologies or skills'
        }
      ],
      needsClarification: true,
      confidence: 0.8
    };
  }

  private async handleGeneralConversation(message: string): Promise<ConversationalResponse> {
    // Use Claude for general conversation about job search
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'system',
            content: `You are a helpful job search assistant. Help the user with their job search questions. 
            Current preferences: ${JSON.stringify(this.preferences)}
            Be concise and helpful.`
          }, {
            role: 'user',
            content: message
          }],
          model: 'claude-3-haiku-20240307',
          max_tokens: 500
        })
      });

      const data = await response.json();
      
      return {
        response: data.content[0].text,
        needsClarification: false,
        confidence: 0.7
      };
    } catch (error) {
      return {
        response: 'I\'m here to help with your job search. You can tell me what kind of jobs you\'re looking for, what to exclude, or ask about your current preferences.',
        needsClarification: false,
        confidence: 0.5
      };
    }
  }
}