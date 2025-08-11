// Machine learning-powered job matching and ranking system
import { JobPosting, ExtractedSkill } from './job-parser';
import { UserProfile, JobScore } from './job-scorer';

export interface MLJobFeatures {
  // Text features
  title_similarity: number;
  description_similarity: number;
  requirements_overlap: number;
  benefits_appeal: number;
  
  // Numeric features  
  salary_fit: number;
  experience_match: number;
  skills_coverage: number;
  location_preference: number;
  
  // Categorical features (encoded)
  employment_type_match: number;
  company_size_preference: number;
  industry_alignment: number;
  remote_compatibility: number;
  
  // Behavioral features
  application_likelihood: number;
  response_probability: number;
  success_prediction: number;
}

export interface JobInteraction {
  user_id: string;
  job_id: string;
  action: 'viewed' | 'saved' | 'applied' | 'rejected' | 'interviewed' | 'hired';
  timestamp: string;
  duration_viewed?: number; // seconds
  application_success?: boolean;
  feedback_rating?: number; // 1-5
  feedback_text?: string;
}

export interface UserBehaviorPattern {
  user_id: string;
  preferences: {
    preferred_job_titles: string[];
    preferred_companies: string[];
    preferred_locations: string[];
    preferred_salary_range: { min: number; max: number };
    preferred_skills: string[];
  };
  behavior: {
    application_rate: number; // % of jobs viewed that are applied to
    response_rate: number; // % of applications that get responses
    success_rate: number; // % of applications that lead to offers
    avg_viewing_time: number; // seconds
    peak_activity_hours: number[];
    search_patterns: string[];
  };
  model_weights: {
    salary_importance: number;
    location_importance: number;
    company_importance: number;
    skills_importance: number;
    growth_importance: number;
  };
  last_updated: string;
}

export class JobMatchingML {
  private userBehavior: Map<string, UserBehaviorPattern> = new Map();
  private jobFeatures: Map<string, MLJobFeatures> = new Map();

  constructor(private userId: string) {
    this.initializeUserBehavior();
  }

  private async initializeUserBehavior(): Promise<void> {
    // In a real implementation, this would load from database
    const defaultBehavior: UserBehaviorPattern = {
      user_id: this.userId,
      preferences: {
        preferred_job_titles: [],
        preferred_companies: [],
        preferred_locations: [],
        preferred_salary_range: { min: 0, max: 0 },
        preferred_skills: []
      },
      behavior: {
        application_rate: 0.15, // Default 15% application rate
        response_rate: 0.25, // Default 25% response rate
        success_rate: 0.1, // Default 10% success rate
        avg_viewing_time: 45, // Default 45 seconds
        peak_activity_hours: [9, 10, 11, 14, 15, 16],
        search_patterns: []
      },
      model_weights: {
        salary_importance: 0.25,
        location_importance: 0.15,
        company_importance: 0.20,
        skills_importance: 0.30,
        growth_importance: 0.10
      },
      last_updated: new Date().toISOString()
    };

    this.userBehavior.set(this.userId, defaultBehavior);
  }

  public async generateJobFeatures(job: JobPosting, userProfile: UserProfile): Promise<MLJobFeatures> {
    // Generate comprehensive features for ML model
    const features: MLJobFeatures = {
      // Text similarity features
      title_similarity: this.calculateTitleSimilarity(job.title, userProfile),
      description_similarity: this.calculateDescriptionSimilarity(job.description, userProfile),
      requirements_overlap: this.calculateRequirementsOverlap(job.requirements, userProfile),
      benefits_appeal: this.calculateBenefitsAppeal(job.benefits, userProfile),
      
      // Numeric matching features
      salary_fit: this.calculateSalaryFit(job.salary, userProfile.salary_expectations),
      experience_match: this.calculateExperienceMatch(job.experienceLevel, userProfile.experience_years),
      skills_coverage: this.calculateSkillsCoverage(job.skills, userProfile.skills),
      location_preference: this.calculateLocationPreference(job, userProfile.location_preferences),
      
      // Categorical features
      employment_type_match: this.encodeEmploymentTypeMatch(job.employmentType, userProfile.employment_preferences),
      company_size_preference: this.encodeCompanySizePreference(job.metadata.companySize, userProfile.employment_preferences),
      industry_alignment: this.encodeIndustryAlignment(job.metadata.industry, userProfile.employment_preferences),
      remote_compatibility: job.remote ? 1.0 : 0.0,
      
      // Behavioral prediction features
      application_likelihood: 0.5, // Will be updated based on user behavior
      response_probability: 0.5,
      success_prediction: 0.5
    };

    // Update behavioral features based on user patterns
    const userBehavior = this.userBehavior.get(this.userId);
    if (userBehavior) {
      features.application_likelihood = this.predictApplicationLikelihood(job, userBehavior);
      features.response_probability = this.predictResponseProbability(job, userBehavior);
      features.success_prediction = this.predictSuccessProbability(job, userBehavior);
    }

    this.jobFeatures.set(job.id, features);
    return features;
  }

  private calculateTitleSimilarity(jobTitle: string, userProfile: UserProfile): number {
    const jobTitleLower = jobTitle.toLowerCase();
    const desiredRoles = userProfile.desired_roles.map(role => role.toLowerCase());
    
    // Exact match
    if (desiredRoles.some(role => jobTitleLower.includes(role) || role.includes(jobTitleLower))) {
      return 1.0;
    }

    // Partial match - check for common keywords
    const jobKeywords = this.extractKeywords(jobTitleLower);
    const userKeywords = desiredRoles.flatMap(role => this.extractKeywords(role));
    
    const intersection = jobKeywords.filter(kw => userKeywords.includes(kw));
    const union = [...new Set([...jobKeywords, ...userKeywords])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  private calculateDescriptionSimilarity(description: string, userProfile: UserProfile): number {
    // Simple keyword-based similarity
    const descWords = this.extractKeywords(description.toLowerCase());
    const userSkills = userProfile.skills.map(s => s.name.toLowerCase());
    const userRoles = userProfile.desired_roles.map(r => r.toLowerCase());
    
    const userTerms = [...userSkills, ...userRoles];
    const matches = descWords.filter(word => userTerms.some(term => 
      word.includes(term) || term.includes(word)
    ));
    
    return Math.min(1.0, matches.length / Math.max(20, descWords.length * 0.1));
  }

  private calculateRequirementsOverlap(requirements: string[], userProfile: UserProfile): number {
    if (requirements.length === 0) return 0.5;
    
    const userSkills = userProfile.skills.map(s => s.name.toLowerCase());
    const reqText = requirements.join(' ').toLowerCase();
    
    const skillMatches = userSkills.filter(skill => reqText.includes(skill));
    return Math.min(1.0, skillMatches.length / userSkills.length);
  }

  private calculateBenefitsAppeal(benefits: string[], userProfile: UserProfile): number {
    if (benefits.length === 0) return 0.3;
    
    // Weight different benefits based on typical preferences
    const benefitWeights: { [key: string]: number } = {
      'health': 0.25,
      'dental': 0.15,
      'vision': 0.10,
      'retirement': 0.20,
      '401k': 0.20,
      'pto': 0.25,
      'vacation': 0.25,
      'flexible': 0.30,
      'remote': 0.35,
      'equity': 0.30,
      'stock': 0.30,
      'bonus': 0.25,
      'learning': 0.20,
      'development': 0.20,
      'gym': 0.10,
      'food': 0.15
    };

    let totalWeight = 0;
    let matchedWeight = 0;

    for (const benefit of benefits) {
      const benefitLower = benefit.toLowerCase();
      for (const [keyword, weight] of Object.entries(benefitWeights)) {
        if (benefitLower.includes(keyword)) {
          totalWeight += 1;
          matchedWeight += weight;
          break;
        }
      }
    }

    return totalWeight > 0 ? Math.min(1.0, matchedWeight / totalWeight) : 0.3;
  }

  private calculateSalaryFit(jobSalary: JobPosting['salary'], userExpectations: UserProfile['salary_expectations']): number {
    if (!jobSalary.min && !jobSalary.max) return 0.5;
    
    const jobMid = jobSalary.min && jobSalary.max ? 
      (jobSalary.min + jobSalary.max) / 2 : jobSalary.min || jobSalary.max || 0;
    const userMid = (userExpectations.min + userExpectations.max) / 2;
    
    if (userMid === 0) return 0.5;
    
    const ratio = jobMid / userMid;
    
    // Optimal range is 0.9 to 1.3 (90% to 130% of expectations)
    if (ratio >= 0.9 && ratio <= 1.3) {
      return 1.0;
    } else if (ratio < 0.9) {
      return Math.max(0, 0.5 + (ratio - 0.5) * 0.5);
    } else {
      // Higher salary is good but may indicate overqualification concern
      return Math.max(0.6, 1.0 - (ratio - 1.3) * 0.2);
    }
  }

  private calculateExperienceMatch(jobLevel: JobPosting['experienceLevel'], userYears: number): number {
    const levelYears = {
      'entry': { ideal: 1, range: 2 },
      'mid': { ideal: 4, range: 3 },
      'senior': { ideal: 7, range: 4 },
      'lead': { ideal: 10, range: 5 },
      'executive': { ideal: 15, range: 8 }
    };

    const target = levelYears[jobLevel];
    const distance = Math.abs(userYears - target.ideal);
    
    if (distance <= target.range) {
      return 1.0 - (distance / target.range) * 0.3;
    } else {
      return Math.max(0.1, 0.7 - (distance - target.range) / target.ideal);
    }
  }

  private calculateSkillsCoverage(jobSkills: ExtractedSkill[], userSkills: UserProfile['skills']): number {
    if (jobSkills.length === 0) return 0.5;
    
    const userSkillNames = new Set(userSkills.map(s => s.name.toLowerCase()));
    const requiredSkills = jobSkills.filter(s => s.required);
    const allSkills = jobSkills;
    
    const requiredMatched = requiredSkills.filter(s => userSkillNames.has(s.name.toLowerCase())).length;
    const allMatched = allSkills.filter(s => userSkillNames.has(s.name.toLowerCase())).length;
    
    const requiredScore = requiredSkills.length > 0 ? requiredMatched / requiredSkills.length : 1.0;
    const overallScore = allMatched / allSkills.length;
    
    return requiredScore * 0.7 + overallScore * 0.3;
  }

  private calculateLocationPreference(job: JobPosting, preferences: UserProfile['location_preferences']): number {
    if (job.remote && preferences.remote_only) return 1.0;
    if (job.remote && !preferences.remote_only) return 0.9;
    if (!job.remote && preferences.remote_only) return 0.1;
    
    const jobLocation = job.location.toLowerCase();
    const matchingLocations = preferences.locations.filter(loc => 
      jobLocation.includes(loc.toLowerCase()) || loc.toLowerCase().includes(jobLocation)
    );
    
    if (matchingLocations.length > 0) return 1.0;
    if (preferences.willing_to_relocate) return 0.6;
    return 0.2;
  }

  private encodeEmploymentTypeMatch(jobType: JobPosting['employmentType'], preferences: UserProfile['employment_preferences']): number {
    return preferences.types.includes(jobType) ? 1.0 : 0.0;
  }

  private encodeCompanySizePreference(jobCompanySize: string | undefined, preferences: UserProfile['employment_preferences']): number {
    if (!jobCompanySize || preferences.company_sizes.length === 0) return 0.5;
    return preferences.company_sizes.includes(jobCompanySize) ? 1.0 : 0.0;
  }

  private encodeIndustryAlignment(jobIndustries: string[], preferences: UserProfile['employment_preferences']): number {
    if (jobIndustries.length === 0 || preferences.industries.length === 0) return 0.5;
    
    const matches = jobIndustries.filter(industry => preferences.industries.includes(industry));
    return matches.length > 0 ? matches.length / jobIndustries.length : 0.0;
  }

  private predictApplicationLikelihood(job: JobPosting, behavior: UserBehaviorPattern): number {
    let likelihood = behavior.behavior.application_rate;
    
    // Adjust based on preferences
    if (behavior.preferences.preferred_job_titles.some(title => 
      job.title.toLowerCase().includes(title.toLowerCase())
    )) {
      likelihood *= 1.5;
    }
    
    if (behavior.preferences.preferred_companies.some(company => 
      job.company.toLowerCase().includes(company.toLowerCase())
    )) {
      likelihood *= 1.3;
    }
    
    // Salary preference
    const jobSalaryMid = job.salary.min && job.salary.max ? 
      (job.salary.min + job.salary.max) / 2 : job.salary.min || job.salary.max || 0;
    
    if (jobSalaryMid >= behavior.preferences.preferred_salary_range.min && 
        jobSalaryMid <= behavior.preferences.preferred_salary_range.max) {
      likelihood *= 1.2;
    }
    
    return Math.min(1.0, likelihood);
  }

  private predictResponseProbability(job: JobPosting, behavior: UserBehaviorPattern): number {
    let probability = behavior.behavior.response_rate;
    
    // Adjust based on job characteristics that typically get better response rates
    if (job.salary.min && job.salary.min > 80000) probability *= 1.1;
    if (job.remote) probability *= 1.15;
    if (job.metadata.companySize === 'large' || job.metadata.companySize === 'enterprise') probability *= 1.1;
    if (job.skills.filter(s => s.required).length <= 5) probability *= 1.05; // Reasonable requirements
    
    return Math.min(1.0, probability);
  }

  private predictSuccessProbability(job: JobPosting, behavior: UserBehaviorPattern): number {
    let probability = behavior.behavior.success_rate;
    
    // Adjust based on match quality
    const features = this.jobFeatures.get(job.id);
    if (features) {
      const avgFeatureScore = (
        features.skills_coverage + 
        features.experience_match + 
        features.salary_fit + 
        features.title_similarity
      ) / 4;
      
      probability = probability * 0.5 + avgFeatureScore * 0.5;
    }
    
    return Math.min(1.0, probability);
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
      'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'
    ]);
    return stopWords.has(word);
  }

  public async rankJobs(jobs: JobPosting[], userProfile: UserProfile): Promise<Array<JobPosting & { mlScore: number; features: MLJobFeatures }>> {
    const rankedJobs = [];
    
    for (const job of jobs) {
      const features = await this.generateJobFeatures(job, userProfile);
      const mlScore = this.calculateMLScore(features);
      
      rankedJobs.push({
        ...job,
        mlScore,
        features
      });
    }
    
    // Sort by ML score descending
    return rankedJobs.sort((a, b) => b.mlScore - a.mlScore);
  }

  private calculateMLScore(features: MLJobFeatures): number {
    const userBehavior = this.userBehavior.get(this.userId);
    if (!userBehavior) return 0.5;
    
    const weights = userBehavior.model_weights;
    
    // Weighted combination of features
    const score = (
      features.skills_coverage * weights.skills_importance +
      features.salary_fit * weights.salary_importance +
      features.location_preference * weights.location_importance +
      features.title_similarity * weights.company_importance +
      features.experience_match * weights.growth_importance +
      features.application_likelihood * 0.1 +
      features.response_probability * 0.1 +
      features.success_prediction * 0.1
    );
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  public async updateUserBehavior(interaction: JobInteraction): Promise<void> {
    const behavior = this.userBehavior.get(interaction.user_id);
    if (!behavior) return;
    
    // Update behavior patterns based on interaction
    switch (interaction.action) {
      case 'viewed':
        if (interaction.duration_viewed) {
          behavior.behavior.avg_viewing_time = 
            (behavior.behavior.avg_viewing_time + interaction.duration_viewed) / 2;
        }
        break;
        
      case 'applied':
        // Increase application rate slightly
        behavior.behavior.application_rate = Math.min(1.0, behavior.behavior.application_rate * 1.05);
        break;
        
      case 'hired':
        // This is a successful outcome - reinforce preferences
        behavior.behavior.success_rate = Math.min(1.0, behavior.behavior.success_rate * 1.1);
        break;
        
      case 'rejected':
        // User rejected the job - this tells us about their preferences
        if (interaction.feedback_rating && interaction.feedback_rating < 3) {
          // Low rating - avoid similar jobs
          behavior.behavior.application_rate = Math.max(0.05, behavior.behavior.application_rate * 0.95);
        }
        break;
    }
    
    behavior.last_updated = new Date().toISOString();
    this.userBehavior.set(interaction.user_id, behavior);
    
    // In a real implementation, save to database
    await this.saveBehaviorToDatabase(behavior);
  }

  private async saveBehaviorToDatabase(behavior: UserBehaviorPattern): Promise<void> {
    // Mock implementation - in reality would save to database
    console.log(`Saving behavior pattern for user ${behavior.user_id}`, {
      application_rate: behavior.behavior.application_rate,
      response_rate: behavior.behavior.response_rate,
      success_rate: behavior.behavior.success_rate
    });
  }

  public async getPersonalizedJobRecommendations(
    jobs: JobPosting[], 
    userProfile: UserProfile,
    limit: number = 20
  ): Promise<Array<JobPosting & { mlScore: number; reasoning: string }>> {
    const rankedJobs = await this.rankJobs(jobs, userProfile);
    
    return rankedJobs.slice(0, limit).map(job => ({
      ...job,
      reasoning: this.generateRecommendationReasoning(job.features, job.mlScore)
    }));
  }

  private generateRecommendationReasoning(features: MLJobFeatures, score: number): string {
    const reasons = [];
    
    if (features.skills_coverage > 0.8) {
      reasons.push('Excellent skills match');
    } else if (features.skills_coverage > 0.6) {
      reasons.push('Good skills alignment');
    }
    
    if (features.salary_fit > 0.8) {
      reasons.push('Salary matches expectations');
    }
    
    if (features.location_preference > 0.8) {
      reasons.push('Perfect location fit');
    }
    
    if (features.application_likelihood > 0.7) {
      reasons.push('High likelihood of application success');
    }
    
    if (features.title_similarity > 0.7) {
      reasons.push('Title matches career goals');
    }
    
    if (reasons.length === 0) {
      if (score > 0.7) reasons.push('Good overall match');
      else if (score > 0.5) reasons.push('Decent fit with growth potential');
      else reasons.push('Consider for skill development');
    }
    
    return reasons.slice(0, 3).join(', ');
  }
}

export default JobMatchingML;