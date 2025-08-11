// AI Agent type definitions

export interface JobPreferences {
  // Traditional structured preferences
  jobTitles: string[];
  locations: string[];
  salaryRange: { 
    min?: number; 
    max?: number; 
    currency?: string;
  };
  remotePreference: 'onsite' | 'hybrid' | 'remote' | 'flexible';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'any';
  
  // AI-learned natural language preferences
  naturalLanguagePreferences: string; // "I want React jobs with good work-life balance"
  
  // Exclusions
  exclusions: {
    companies: string[];
    keywords: string[];
    sectors: string[];
    locations: string[];
    reasons: { [key: string]: string }; // keyword/company -> reason mapping
  };
  
  // Preferences
  preferences: {
    companySize?: 'startup' | 'small' | 'medium' | 'large' | 'any';
    industries?: string[];
    benefits?: string[];
    culture?: string[];
    technologies?: string[];
  };
  
  // Learning data
  likedJobs: string[];
  dislikedJobs: string[];
  appliedJobs: string[];
  feedbackHistory: UserFeedback[];
  
  // Meta
  lastUpdated: Date;
  confidence: number; // How confident the AI is in these preferences
}

export interface UserFeedback {
  id: string;
  jobId: string;
  timestamp: Date;
  feedbackType: 'like' | 'dislike' | 'applied' | 'interview' | 'offer' | 'rejected';
  rating?: number; // 1-5
  reason?: string;
  tags?: string[];
}

export interface ConversationalResponse {
  response: string;
  updatedPreferences?: Partial<JobPreferences>;
  suggestedActions?: SuggestedAction[];
  clarifyingQuestions?: string[];
  confidence: number;
  needsClarification: boolean;
}

export interface SuggestedAction {
  id: string;
  type: 'search' | 'exclude' | 'include' | 'refine' | 'apply';
  label: string;
  description?: string;
  data?: any;
}

export interface ExclusionRule {
  id: string;
  type: 'company' | 'keyword' | 'sector' | 'salary' | 'location' | 'custom';
  pattern: string;
  reason: string;
  confidence: number; // AI confidence in this exclusion
  userConfirmed: boolean;
  suggestedBy: 'user' | 'ai';
  createdAt: Date;
  exampleMatches?: string[]; // Examples of what this would exclude
}

export interface LearningInsight {
  id: string;
  type: 'preference_pattern' | 'exclusion_pattern' | 'salary_trend' | 'location_trend' | 'skill_gap';
  insight: string;
  confidence: number;
  data: any;
  suggestedAction?: SuggestedAction;
  createdAt: Date;
}

export interface ParsedJobEmail {
  id: string;
  emailId: string;
  provider: 'gmail' | 'outlook';
  jobTitle: string;
  company: string;
  location?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  description: string;
  requirements?: string[];
  benefits?: string[];
  remote?: 'onsite' | 'remote' | 'hybrid';
  experienceLevel?: string;
  postedDate?: Date;
  applyUrl?: string;
  source: string;
  confidence: number;
  extractedAt: Date;
}

export interface AgentReport {
  id: string;
  userId: string;
  timestamp: Date;
  totalEmailsProcessed: number;
  jobsFound: number;
  jobsAfterFiltering: number;
  topRecommendations: JobRecommendation[];
  insights: string[];
  suggestedActions: SuggestedAction[];
  learningProgress: {
    preferencesRefined: number;
    exclusionsAdded: number;
    accuracyImprovement: number;
  };
}

export interface JobRecommendation {
  job: ParsedJobEmail;
  score: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  recommendation: 'strong-yes' | 'yes' | 'maybe' | 'no';
  matchedPreferences: string[];
  missingRequirements?: string[];
}