// AI-powered job scoring and matching system
import { JobPosting, ExtractedSkill } from './job-parser';
import { supabase } from '../supabase';

export interface UserProfile {
  id: string;
  skills: UserSkill[];
  experience_years: number;
  current_role: string;
  desired_roles: string[];
  salary_expectations: {
    min: number;
    max: number;
    currency: string;
  };
  location_preferences: {
    remote_only: boolean;
    locations: string[];
    willing_to_relocate: boolean;
  };
  employment_preferences: {
    types: ('full-time' | 'part-time' | 'contract' | 'internship')[];
    company_sizes: string[];
    industries: string[];
  };
  deal_breakers: string[];
  priorities: {
    salary: number; // Weight 0-1
    location: number;
    company_culture: number;
    growth_opportunity: number;
    work_life_balance: number;
    benefits: number;
  };
}

export interface UserSkill {
  name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  verified: boolean;
  last_used: string;
}

export interface JobScore {
  job_id: string;
  user_id: string;
  overall_score: number; // 0-100
  breakdown: {
    skills_match: number;
    experience_match: number;
    location_match: number;
    salary_match: number;
    company_match: number;
    requirements_match: number;
  };
  reasoning: {
    strengths: string[];
    concerns: string[];
    suggestions: string[];
  };
  compatibility: {
    must_have_skills: { skill: string; have: boolean; gap: string }[];
    nice_to_have_skills: { skill: string; have: boolean; level: string }[];
    experience_gap: number; // Years above/below requirement
    salary_gap: number; // Percentage difference
  };
  recommendation: 'highly_recommended' | 'good_match' | 'consider' | 'poor_match';
  confidence: number; // How confident we are in this score
  created_at: string;
  updated_at: string;
}

export interface MatchingCriteria {
  skill_weight: number;
  experience_weight: number;
  location_weight: number;
  salary_weight: number;
  company_weight: number;
  requirements_weight: number;
}

export class JobScorer {
  private defaultCriteria: MatchingCriteria = {
    skill_weight: 0.35,
    experience_weight: 0.20,
    location_weight: 0.15,
    salary_weight: 0.15,
    company_weight: 0.10,
    requirements_weight: 0.05
  };

  constructor(private userId: string) {}

  public async scoreJob(
    job: JobPosting, 
    userProfile?: UserProfile,
    customCriteria?: Partial<MatchingCriteria>
  ): Promise<JobScore> {
    
    // Get user profile if not provided
    const profile = userProfile || await this.getUserProfile();
    if (!profile) {
      throw new Error('User profile not found');
    }

    const criteria = { ...this.defaultCriteria, ...customCriteria };

    // Calculate individual scores
    const skillsScore = this.calculateSkillsMatch(job.skills, profile.skills);
    const experienceScore = this.calculateExperienceMatch(job.experienceLevel, profile.experience_years);
    const locationScore = this.calculateLocationMatch(job, profile.location_preferences);
    const salaryScore = this.calculateSalaryMatch(job.salary, profile.salary_expectations);
    const companyScore = this.calculateCompanyMatch(job, profile);
    const requirementsScore = this.calculateRequirementsMatch(job.requirements, profile);

    // Calculate weighted overall score
    const overallScore = Math.round(
      (skillsScore.score * criteria.skill_weight +
       experienceScore.score * criteria.experience_weight +
       locationScore.score * criteria.location_weight +
       salaryScore.score * criteria.salary_weight +
       companyScore.score * criteria.company_weight +
       requirementsScore.score * criteria.requirements_weight) * 100
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(
      { skillsScore, experienceScore, locationScore, salaryScore, companyScore, requirementsScore },
      job,
      profile
    );

    // Calculate compatibility details
    const compatibility = this.calculateCompatibility(job, profile);

    // Determine recommendation
    const recommendation = this.getRecommendation(overallScore, reasoning.concerns);

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(job, profile);

    const jobScore: JobScore = {
      job_id: job.id,
      user_id: this.userId,
      overall_score: overallScore,
      breakdown: {
        skills_match: Math.round(skillsScore.score * 100),
        experience_match: Math.round(experienceScore.score * 100),
        location_match: Math.round(locationScore.score * 100),
        salary_match: Math.round(salaryScore.score * 100),
        company_match: Math.round(companyScore.score * 100),
        requirements_match: Math.round(requirementsScore.score * 100)
      },
      reasoning,
      compatibility,
      recommendation,
      confidence,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to database
    await this.saveJobScore(jobScore);

    return jobScore;
  }

  private calculateSkillsMatch(jobSkills: ExtractedSkill[], userSkills: UserSkill[]): { score: number; details: any } {
    if (jobSkills.length === 0) return { score: 0.5, details: { message: 'No skills specified' } };

    const userSkillsMap = new Map(userSkills.map(skill => [skill.name.toLowerCase(), skill]));
    let totalWeight = 0;
    let matchedWeight = 0;
    let requiredMatched = 0;
    let requiredTotal = 0;

    const matches: Array<{ skill: string; userHas: boolean; userLevel?: string; required: boolean }> = [];

    for (const jobSkill of jobSkills) {
      const weight = jobSkill.required ? 2.0 : 1.0;
      totalWeight += weight;
      
      if (jobSkill.required) requiredTotal++;

      const userSkill = userSkillsMap.get(jobSkill.name.toLowerCase());
      
      if (userSkill) {
        let skillScore = this.getSkillLevelScore(userSkill.proficiency);
        
        // Bonus for recent experience
        const monthsSinceUsed = this.getMonthsSince(userSkill.last_used);
        if (monthsSinceUsed < 12) skillScore *= 1.1;
        else if (monthsSinceUsed > 24) skillScore *= 0.9;

        matchedWeight += weight * Math.min(1.0, skillScore);
        
        if (jobSkill.required) requiredMatched++;

        matches.push({
          skill: jobSkill.name,
          userHas: true,
          userLevel: userSkill.proficiency,
          required: jobSkill.required
        });
      } else {
        matches.push({
          skill: jobSkill.name,
          userHas: false,
          required: jobSkill.required
        });
      }
    }

    let score = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    // Penalty for missing required skills
    if (requiredTotal > 0) {
      const requiredScore = requiredMatched / requiredTotal;
      score = score * 0.7 + requiredScore * 0.3;
    }

    return {
      score: Math.min(1.0, score),
      details: {
        matches,
        requiredMatched,
        requiredTotal,
        totalSkills: jobSkills.length
      }
    };
  }

  private getSkillLevelScore(level: UserSkill['proficiency']): number {
    const scores = {
      'beginner': 0.4,
      'intermediate': 0.7,
      'advanced': 0.9,
      'expert': 1.0
    };
    return scores[level] || 0.5;
  }

  private calculateExperienceMatch(jobLevel: JobPosting['experienceLevel'], userYears: number): { score: number; details: any } {
    const levelRequirements = {
      'entry': { min: 0, max: 2, ideal: 1 },
      'mid': { min: 2, max: 5, ideal: 3.5 },
      'senior': { min: 5, max: 10, ideal: 7 },
      'lead': { min: 7, max: 15, ideal: 10 },
      'executive': { min: 10, max: 30, ideal: 15 }
    };

    const requirement = levelRequirements[jobLevel];
    let score = 0;

    if (userYears >= requirement.min && userYears <= requirement.max) {
      // Perfect match - within range
      const distanceFromIdeal = Math.abs(userYears - requirement.ideal);
      const maxDistance = Math.max(requirement.ideal - requirement.min, requirement.max - requirement.ideal);
      score = 1.0 - (distanceFromIdeal / maxDistance) * 0.3; // Minimum 0.7 for being in range
    } else if (userYears < requirement.min) {
      // Under-qualified
      const deficit = requirement.min - userYears;
      score = Math.max(0, 0.6 - (deficit / requirement.min) * 0.4);
    } else {
      // Over-qualified
      const excess = userYears - requirement.max;
      score = Math.max(0.7, 0.9 - (excess / requirement.max) * 0.2);
    }

    return {
      score,
      details: {
        userYears,
        requiredRange: `${requirement.min}-${requirement.max}`,
        ideal: requirement.ideal,
        gap: userYears < requirement.min ? requirement.min - userYears : 
             userYears > requirement.max ? userYears - requirement.max : 0
      }
    };
  }

  private calculateLocationMatch(job: JobPosting, preferences: UserProfile['location_preferences']): { score: number; details: any } {
    if (preferences.remote_only) {
      return {
        score: job.remote ? 1.0 : 0.0,
        details: {
          jobRemote: job.remote,
          userRemoteOnly: true,
          match: job.remote
        }
      };
    }

    if (job.remote) {
      return { score: 1.0, details: { jobRemote: true, match: true } };
    }

    // Check if job location matches user preferences
    const jobLocationLower = job.location.toLowerCase();
    const matchingLocations = preferences.locations.filter(loc => 
      jobLocationLower.includes(loc.toLowerCase()) || loc.toLowerCase().includes(jobLocationLower)
    );

    if (matchingLocations.length > 0) {
      return {
        score: 1.0,
        details: {
          jobLocation: job.location,
          userLocations: preferences.locations,
          matches: matchingLocations
        }
      };
    }

    // Partial match for same state/country
    const partialMatch = preferences.locations.some(loc => {
      const locParts = loc.split(',');
      const jobParts = job.location.split(',');
      return locParts.length > 1 && jobParts.length > 1 && 
             locParts[locParts.length - 1].trim().toLowerCase() === 
             jobParts[jobParts.length - 1].trim().toLowerCase();
    });

    if (partialMatch) {
      return {
        score: preferences.willing_to_relocate ? 0.7 : 0.4,
        details: {
          jobLocation: job.location,
          partialMatch: true,
          willingToRelocate: preferences.willing_to_relocate
        }
      };
    }

    return {
      score: preferences.willing_to_relocate ? 0.3 : 0.1,
      details: {
        jobLocation: job.location,
        userLocations: preferences.locations,
        match: false,
        willingToRelocate: preferences.willing_to_relocate
      }
    };
  }

  private calculateSalaryMatch(jobSalary: JobPosting['salary'], userExpectations: UserProfile['salary_expectations']): { score: number; details: any } {
    if (!jobSalary.min && !jobSalary.max) {
      return { score: 0.5, details: { message: 'No salary information available' } };
    }

    const jobMin = jobSalary.min || 0;
    const jobMax = jobSalary.max || jobMin || userExpectations.max;
    const userMin = userExpectations.min;
    const userMax = userExpectations.max;

    // Check for overlap
    const overlapStart = Math.max(jobMin, userMin);
    const overlapEnd = Math.min(jobMax, userMax);
    const hasOverlap = overlapStart <= overlapEnd;

    if (hasOverlap) {
      const overlapSize = overlapEnd - overlapStart;
      const userRange = userMax - userMin;
      const jobRange = jobMax - jobMin;
      const avgRange = (userRange + jobRange) / 2;
      
      const overlapRatio = avgRange > 0 ? overlapSize / avgRange : 1.0;
      return {
        score: Math.min(1.0, 0.7 + overlapRatio * 0.3),
        details: {
          jobRange: `${jobMin}-${jobMax}`,
          userRange: `${userMin}-${userMax}`,
          overlap: `${overlapStart}-${overlapEnd}`,
          overlapRatio
        }
      };
    }

    // No overlap - calculate penalty based on gap
    let score = 0.5;
    let gap = 0;

    if (jobMax < userMin) {
      // Job pays less than user expects
      gap = (userMin - jobMax) / userMin;
      score = Math.max(0, 0.5 - gap * 0.5);
    } else if (jobMin > userMax) {
      // Job pays more than user expects (less likely to get it)
      gap = (jobMin - userMax) / userMax;
      score = Math.max(0.3, 0.8 - gap * 0.3);
    }

    return {
      score,
      details: {
        jobRange: `${jobMin}-${jobMax}`,
        userRange: `${userMin}-${userMax}`,
        gap: gap * 100, // As percentage
        gapType: jobMax < userMin ? 'underpaid' : 'overpaid'
      }
    };
  }

  private calculateCompanyMatch(job: JobPosting, profile: UserProfile): { score: number; details: any } {
    let score = 0.5; // Base score
    const factors: string[] = [];

    // Industry preferences
    if (profile.employment_preferences.industries.length > 0) {
      const industryMatch = job.metadata.industry.some(industry => 
        profile.employment_preferences.industries.includes(industry)
      );
      if (industryMatch) {
        score += 0.3;
        factors.push('Industry match');
      } else {
        score -= 0.1;
        factors.push('Industry mismatch');
      }
    }

    // Company size preferences
    if (profile.employment_preferences.company_sizes.length > 0 && job.metadata.companySize) {
      if (profile.employment_preferences.company_sizes.includes(job.metadata.companySize)) {
        score += 0.2;
        factors.push('Company size match');
      } else {
        score -= 0.1;
        factors.push('Company size mismatch');
      }
    }

    // Employment type match
    if (profile.employment_preferences.types.includes(job.employmentType)) {
      score += 0.2;
      factors.push('Employment type match');
    } else {
      score -= 0.2;
      factors.push('Employment type mismatch');
    }

    return {
      score: Math.max(0, Math.min(1, score)),
      details: {
        factors,
        industryMatch: job.metadata.industry,
        companySize: job.metadata.companySize
      }
    };
  }

  private calculateRequirementsMatch(requirements: string[], profile: UserProfile): { score: number; details: any } {
    if (requirements.length === 0) {
      return { score: 0.5, details: { message: 'No specific requirements listed' } };
    }

    // This is a simplified implementation
    // In a real system, this would use NLP to analyze requirements against user profile
    let score = 0.6; // Base score assuming reasonable match

    const dealBreakerFound = requirements.some(req => 
      profile.deal_breakers.some(db => 
        req.toLowerCase().includes(db.toLowerCase())
      )
    );

    if (dealBreakerFound) {
      score = 0.1;
    }

    return {
      score,
      details: {
        totalRequirements: requirements.length,
        dealBreakerFound
      }
    };
  }

  private generateReasoning(
    scores: any,
    job: JobPosting,
    profile: UserProfile
  ): JobScore['reasoning'] {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const suggestions: string[] = [];

    // Analyze each component
    if (scores.skillsScore.score >= 0.8) {
      strengths.push(`Excellent skills match (${Math.round(scores.skillsScore.score * 100)}%) with ${scores.skillsScore.details.requiredMatched}/${scores.skillsScore.details.requiredTotal} required skills`);
    } else if (scores.skillsScore.score >= 0.6) {
      strengths.push(`Good skills alignment with ${scores.skillsScore.details.requiredMatched}/${scores.skillsScore.details.requiredTotal} required skills`);
    } else {
      concerns.push(`Limited skills match - missing ${scores.skillsScore.details.requiredTotal - scores.skillsScore.details.requiredMatched} required skills`);
      suggestions.push('Consider learning the missing required skills before applying');
    }

    if (scores.experienceScore.score >= 0.8) {
      strengths.push(`Experience level aligns well with ${job.experienceLevel} position`);
    } else if (scores.experienceScore.details.gap > 0) {
      if (scores.experienceScore.details.userYears < scores.experienceScore.details.requiredRange.split('-')[0]) {
        concerns.push(`May be under-qualified (${scores.experienceScore.details.gap} years below minimum)`);
        suggestions.push('Highlight relevant projects and quick learning ability in application');
      } else {
        concerns.push('May be overqualified - consider if this aligns with career goals');
      }
    }

    if (scores.salaryScore.score >= 0.7) {
      strengths.push('Salary expectations align with offer');
    } else if (scores.salaryScore.details.gapType === 'underpaid') {
      concerns.push(`Salary may be ${Math.round(scores.salaryScore.details.gap)}% below expectations`);
      suggestions.push('Consider negotiating salary or highlighting additional benefits');
    }

    if (scores.locationScore.score >= 0.9) {
      strengths.push('Perfect location match');
    } else if (scores.locationScore.score < 0.5) {
      concerns.push('Location may not be ideal - requires relocation or long commute');
    }

    return { strengths, concerns, suggestions };
  }

  private calculateCompatibility(job: JobPosting, profile: UserProfile): JobScore['compatibility'] {
    const userSkillsMap = new Map(profile.skills.map(s => [s.name.toLowerCase(), s]));
    
    const must_have_skills = job.skills
      .filter(s => s.required)
      .map(skill => ({
        skill: skill.name,
        have: userSkillsMap.has(skill.name.toLowerCase()),
        gap: userSkillsMap.has(skill.name.toLowerCase()) ? 
          '' : `Learn ${skill.name} (${skill.category})`
      }));

    const nice_to_have_skills = job.skills
      .filter(s => !s.required)
      .map(skill => ({
        skill: skill.name,
        have: userSkillsMap.has(skill.name.toLowerCase()),
        level: userSkillsMap.get(skill.name.toLowerCase())?.proficiency || 'none'
      }));

    // Calculate experience gap
    const levelYears = {
      'entry': 1,
      'mid': 3.5,
      'senior': 7,
      'lead': 10,
      'executive': 15
    };
    const expectedYears = levelYears[job.experienceLevel];
    const experience_gap = profile.experience_years - expectedYears;

    // Calculate salary gap
    const jobMid = job.salary.min && job.salary.max ? 
      (job.salary.min + job.salary.max) / 2 : job.salary.min || job.salary.max || 0;
    const userMid = (profile.salary_expectations.min + profile.salary_expectations.max) / 2;
    const salary_gap = jobMid > 0 ? ((jobMid - userMid) / userMid) * 100 : 0;

    return {
      must_have_skills,
      nice_to_have_skills,
      experience_gap,
      salary_gap
    };
  }

  private getRecommendation(score: number, concerns: string[]): JobScore['recommendation'] {
    if (score >= 85) return 'highly_recommended';
    if (score >= 70) return 'good_match';
    if (score >= 50) return 'consider';
    return 'poor_match';
  }

  private calculateConfidence(job: JobPosting, profile: UserProfile): number {
    let confidence = 0.5;

    // Job data completeness
    if (job.title) confidence += 0.1;
    if (job.skills.length > 0) confidence += 0.15;
    if (job.salary.min || job.salary.max) confidence += 0.1;
    if (job.requirements.length > 0) confidence += 0.1;

    // Profile data completeness
    if (profile.skills.length > 0) confidence += 0.15;
    if (profile.salary_expectations.min > 0) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  private async getUserProfile(): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error || !data) return null;

    // Transform database data to UserProfile format
    return {
      id: data.id,
      skills: data.skills || [],
      experience_years: data.experience_years || 0,
      current_role: data.current_role || '',
      desired_roles: data.desired_roles || [],
      salary_expectations: data.salary_expectations || { min: 0, max: 0, currency: 'USD' },
      location_preferences: data.location_preferences || { remote_only: false, locations: [], willing_to_relocate: false },
      employment_preferences: data.employment_preferences || { types: ['full-time'], company_sizes: [], industries: [] },
      deal_breakers: data.deal_breakers || [],
      priorities: data.priorities || {
        salary: 0.3,
        location: 0.2,
        company_culture: 0.2,
        growth_opportunity: 0.15,
        work_life_balance: 0.1,
        benefits: 0.05
      }
    };
  }

  private async saveJobScore(jobScore: JobScore): Promise<void> {
    const { error } = await supabase
      .from('job_scores')
      .upsert({
        job_id: jobScore.job_id,
        user_id: jobScore.user_id,
        overall_score: jobScore.overall_score,
        breakdown: jobScore.breakdown,
        reasoning: jobScore.reasoning,
        compatibility: jobScore.compatibility,
        recommendation: jobScore.recommendation,
        confidence: jobScore.confidence,
        created_at: jobScore.created_at,
        updated_at: jobScore.updated_at
      });

    if (error) {
      console.error('Failed to save job score:', error);
    }
  }

  private getMonthsSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  }

  public async batchScoreJobs(jobs: JobPosting[]): Promise<JobScore[]> {
    const profile = await this.getUserProfile();
    if (!profile) {
      throw new Error('User profile not found');
    }

    const scores: JobScore[] = [];
    
    for (const job of jobs) {
      try {
        const score = await this.scoreJob(job, profile);
        scores.push(score);
      } catch (error) {
        console.error(`Failed to score job ${job.id}:`, error);
      }
    }

    return scores.sort((a, b) => b.overall_score - a.overall_score);
  }
}

export default JobScorer;