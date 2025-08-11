// src/lib/job-finder-service.ts
// Service functions for Job Finder functionality

import { supabase } from './supabase';
import { JobProfile, JobSearch, JobMatch, JobApplication } from './database-types';

export class JobFinderService {
  // Test database connectivity and authentication
  static async testConnection(): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        return { success: false, error: `Authentication error: ${authError.message}` };
      }
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Test a simple query
      const { data, error } = await supabase
        .from('job_profiles')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        return { success: false, userId: user.id, error: `Database error: ${error.message}` };
      }

      return { success: true, userId: user.id };
    } catch (error) {
      return { 
        success: false, 
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Comprehensive schema validation test
  static async validateSchema(): Promise<{ 
    success: boolean; 
    results: Record<string, { success: boolean; error?: string; count?: number }>;
  }> {
    const results: Record<string, { success: boolean; error?: string; count?: number }> = {};
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, results: { auth: { success: false, error: 'Not authenticated' } } };
      }

      // Test each table with exact schema column names
      const tests = [
        {
          name: 'job_profiles',
          query: () => supabase
            .from('job_profiles')
            .select('id, user_id, name, bio, summary, skills, is_active')
            .eq('user_id', user.id)
            .limit(1)
        },
        {
          name: 'job_searches', 
          query: () => supabase
            .from('job_searches')
            .select('id, user_id, name, job_description, location, is_active')
            .eq('user_id', user.id)
            .limit(1)
        },
        {
          name: 'job_matches',
          query: () => supabase
            .from('job_matches')
            .select('id, search_id, job_title, company_name, ai_score, is_saved, is_dismissed')
            .limit(1)
        },
        {
          name: 'job_applications',
          query: () => supabase
            .from('job_applications')
            .select('id, user_id, job_listing_id, status, applied_at')
            .eq('user_id', user.id)
            .limit(1)
        }
      ];

      for (const test of tests) {
        try {
          const { data, error } = await test.query();
          if (error) {
            results[test.name] = { success: false, error: error.message };
          } else {
            results[test.name] = { success: true, count: data?.length || 0 };
          }
        } catch (err) {
          results[test.name] = { 
            success: false, 
            error: err instanceof Error ? err.message : 'Unknown error' 
          };
        }
      }

      const allSuccess = Object.values(results).every(r => r.success);
      return { success: allSuccess, results };
    } catch (error) {
      return { 
        success: false, 
        results: { 
          general: { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } 
        } 
      };
    }
  }
  // Profile Management
  static async getProfiles(userId: string): Promise<JobProfile[]> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await supabase
        .from('job_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        console.error('User ID:', userId);
        throw new Error(`Failed to fetch job profiles: ${error.message}`);
      }

      if (!data) {
        console.warn('No data returned from profiles query');
        return [];
      }

      console.log(`Successfully fetched ${data.length} profiles for user ${userId}`);
      return data;
    } catch (error) {
      console.error('Unexpected error in getProfiles:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred while fetching profiles');
    }
  }

  static async createProfile(profileData: Partial<JobProfile>): Promise<JobProfile> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication failed');
      }
      if (!user) {
        throw new Error('User not authenticated');
      }

      // **FIXED**: Ensure user_profile exists using the new migration function
      console.log(`Ensuring user profile exists for user: ${user.id}`);
      
      try {
        // Call the new ensure_user_profile function from migration
        const { data: userProfile, error: ensureError } = await supabase
          .rpc('ensure_user_profile', { user_uuid: user.id });

        if (ensureError) {
          console.error('Error ensuring user profile exists:', ensureError);
          throw new Error(`Failed to ensure user profile exists: ${ensureError.message}`);
        }

        console.log('User profile ensured successfully:', userProfile);
      } catch (profileError) {
        console.error('Error in user profile creation process:', profileError);
        throw new Error(`Cannot create job profile without user profile: ${profileError}`);
      }

      // Create job profile with corrected schema (using 'name' field and email)
      const profileToInsert = {
        user_id: user.id, // References user_profiles.id (which matches auth.users.id)
        name: profileData.name || 'New Profile',
        email: profileData.email || user.email || null, // New email field
        phone: profileData.phone || null,
        location: profileData.location || null,
        bio: profileData.bio || null,
        summary: profileData.summary || null,
        skills: profileData.skills || [],
        is_active: profileData.is_active !== undefined ? profileData.is_active : true
      };

      console.log('Creating job profile with corrected schema:', profileToInsert);
      
      const { data, error } = await supabase
        .from('job_profiles')
        .insert([profileToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error creating job profile:', error);
        console.error('Profile data attempted:', profileToInsert);
        throw new Error(`Failed to create job profile: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from job profile creation');
      }

      console.log('Job profile created successfully:', data);
      return data;

    } catch (error) {
      console.error('Unexpected error in createProfile:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred while creating profile');
    }
  }

  static async updateProfile(profileId: string, profileData: Partial<JobProfile>): Promise<JobProfile> {
    const { data, error } = await supabase
      .from('job_profiles')
      .update(profileData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update job profile');
    }

    return data;
  }

  static async deleteProfile(profileId: string): Promise<void> {
    const { error } = await supabase
      .from('job_profiles')
      .delete()
      .eq('id', profileId);

    if (error) {
      console.error('Error deleting profile:', error);
      throw new Error('Failed to delete job profile');
    }
  }

  // Search Management
  static async getSearches(userId: string): Promise<JobSearch[]> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await supabase
        .from('job_searches')
        .select(`
          *,
          job_profiles (
            name,
            bio
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching searches:', error);
        console.error('User ID:', userId);
        throw new Error(`Failed to fetch job searches: ${error.message}`);
      }

      if (!data) {
        console.warn('No data returned from searches query');
        return [];
      }

      console.log(`Successfully fetched ${data.length} searches for user ${userId}`);
      return data;
    } catch (error) {
      console.error('Unexpected error in getSearches:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred while fetching searches');
    }
  }

  static async createSearch(searchData: Partial<JobSearch>): Promise<JobSearch> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication failed');
      }
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Map to exact schema columns
      const searchToInsert = {
        user_id: user.id,
        profile_id: searchData.profile_id || null,
        name: searchData.name || '', // Changed from search_name
        job_description: searchData.job_description || null,
        exclusions: searchData.exclusions || null,
        location: searchData.location || null,
        job_type: searchData.job_type || null,
        minimum_salary: searchData.minimum_salary || null,
        preferred_companies: Array.isArray(searchData.preferred_companies) ? searchData.preferred_companies : [],
        avoid_companies: Array.isArray(searchData.avoid_companies) ? searchData.avoid_companies : [],
        avoid_sectors: Array.isArray(searchData.avoid_sectors) ? searchData.avoid_sectors : [],
        search_frequency: searchData.search_frequency || 'daily',
        is_active: searchData.is_active !== undefined ? searchData.is_active : true,
        last_run_at: searchData.last_run_at || null
      };

      const { data, error } = await supabase
        .from('job_searches')
        .insert([searchToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error creating search:', error);
        console.error('Search data:', searchToInsert);
        throw new Error(`Failed to create job search: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from search creation');
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in createSearch:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred while creating search');
    }
  }

  static async updateSearch(searchId: string, searchData: Partial<JobSearch>): Promise<JobSearch> {
    try {
      if (!searchId) {
        throw new Error('Search ID is required');
      }

      // Don't manually set updated_at - handled by trigger
      const updatesWithoutTimestamp = { ...searchData };
      delete (updatesWithoutTimestamp as any).updated_at;

      const { data, error } = await supabase
        .from('job_searches')
        .update(updatesWithoutTimestamp)
        .eq('id', searchId)
        .select()
        .single();

      if (error) {
        console.error('Error updating search:', error);
        console.error('Search ID:', searchId);
        console.error('Updates:', updatesWithoutTimestamp);
        throw new Error(`Failed to update job search: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from search update');
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in updateSearch:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred while updating search');
    }
  }

  static async deleteSearch(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('job_searches')
      .delete()
      .eq('id', searchId);

    if (error) {
      console.error('Error deleting search:', error);
      throw new Error('Failed to delete job search');
    }
  }

  // Job Matches
  static async getMatches(userId: string, filters?: {
    saved?: boolean;
    dismissed?: boolean;
    minScore?: number;
    applied?: boolean;
  }): Promise<JobMatch[]> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Query through job_searches relationship (NO direct user_id on job_matches)
      let query = supabase
        .from('job_matches')
        .select(`
          *,
          job_searches!inner (
            user_id,
            name
          )
        `)
        .eq('job_searches.user_id', userId);

      // Apply filters using exact schema column names
      if (filters) {
        if (filters.saved !== undefined) {
          query = query.eq('is_saved', filters.saved);
        }
        if (filters.dismissed !== undefined) {
          query = query.eq('is_dismissed', filters.dismissed);
        }
        if (filters.applied !== undefined) {
          query = query.eq('is_applied', filters.applied);
        }
        if (filters.minScore !== undefined && filters.minScore > 0) {
          query = query.gte('ai_score', filters.minScore); // Changed from ai_match_score
        }
      }

      // Apply ordering and limit using exact schema columns
      const { data, error } = await query
        .order('ai_score', { ascending: false, nullsLast: true })
        .order('discovered_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching matches:', error);
        console.error('Query filters:', filters);
        console.error('User ID:', userId);
        throw new Error(`Failed to fetch job matches: ${error.message}`);
      }

      if (!data) {
        console.warn('No data returned from job matches query');
        return [];
      }

      console.log(`Successfully fetched ${data.length} job matches for user ${userId}`);
      return data;
    } catch (error) {
      console.error('Unexpected error in getMatches:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred while fetching matches');
    }
  }

  static async updateMatch(matchId: string, updates: Partial<JobMatch>): Promise<JobMatch> {
    try {
      if (!matchId) {
        throw new Error('Match ID is required');
      }

      // Don't manually set updated_at - it's handled by trigger
      const updatesWithTimestamp = { ...updates };

      const { data, error } = await supabase
        .from('job_matches')
        .update(updatesWithTimestamp)
        .eq('id', matchId)
        .select()
        .single();

      if (error) {
        console.error('Error updating match:', error);
        console.error('Match ID:', matchId);
        console.error('Updates:', updatesWithTimestamp);
        throw new Error(`Failed to update job match: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from match update');
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in updateMatch:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred while updating match');
    }
  }

  // Job Applications
  static async createApplication(applicationData: Partial<JobApplication>): Promise<JobApplication> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication failed');
      }
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Map to exact schema columns (NO company_name)
      const applicationToInsert = {
        user_id: user.id, // Required
        job_listing_id: applicationData.job_listing_id || null,
        profile_id: applicationData.profile_id || null,
        task_id: applicationData.task_id || null,
        status: applicationData.status || 'draft', // Changed from application_status
        applied_at: applicationData.applied_at || null, // Changed from application_date
        cv_version_url: applicationData.cv_version_url || null,
        cover_letter_url: applicationData.cover_letter_url || null,
        video_pitch_url: applicationData.video_pitch_url || null,
        notes: applicationData.notes || null,
        follow_up_date: applicationData.follow_up_date || null // Singular, not plural
        // Don't include created_at/updated_at - they have defaults
      };

      const { data, error } = await supabase
        .from('job_applications')
        .insert([applicationToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error creating application:', error);
        console.error('Application data:', applicationToInsert);
        throw new Error(`Failed to create job application: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from application creation');
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in createApplication:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred while creating application');
    }
  }

  static async getApplications(userId: string): Promise<JobApplication[]> {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      throw new Error('Failed to fetch job applications');
    }

    return data || [];
  }

  static async updateApplication(applicationId: string, updates: Partial<JobApplication>): Promise<JobApplication> {
    const { data, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating application:', error);
      throw new Error('Failed to update job application');
    }

    return data;
  }

  // AI Job Analysis
  static async analyzeJob(jobData: {
    title: string;
    company: string;
    description: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    remote_type?: string;
    source?: string;
    url: string;
  }, profileId?: string): Promise<{
    match_score: number;
    analysis: string;
    pros: string[];
    cons: string[];
    suggestions: string;
  }> {
    try {
      if (!jobData.title || !jobData.company || !jobData.url) {
        throw new Error('Job title, company, and URL are required');
      }

      const { data, error } = await supabase.functions.invoke('job-discovery', {
        body: {
          action: 'analyze_job',
          jobData,
          profileId
        }
      });

      if (error) {
        console.error('Error analyzing job:', error);
        console.error('Job data:', jobData);
        throw new Error(`Failed to analyze job: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from job analysis');
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in analyzeJob:', error);
      throw error instanceof Error ? error : new Error('Unknown error occurred while analyzing job');
    }
  }

  // Dashboard Statistics
  static async getDashboardStats(userId: string): Promise<{
    totalProfiles: number;
    activeSearches: number;
    totalMatches: number;
    savedMatches: number;
    totalApplications: number;
    pendingApplications: number;
    avgMatchScore: number;
  }> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log(`Fetching dashboard stats for user: ${userId}`);

      // Execute queries with exact schema columns
      const results = await Promise.allSettled([
        supabase.from('job_profiles').select('id, is_active').eq('user_id', userId),
        supabase.from('job_searches').select('id, is_active').eq('user_id', userId),
        // Query job_matches through job_searches relationship
        supabase.from('job_matches')
          .select('id, is_saved, is_dismissed, ai_score, job_searches!inner(user_id)')
          .eq('job_searches.user_id', userId),
        supabase.from('job_applications').select('id, status').eq('user_id', userId)
      ]);

      // Handle individual query results
      const profiles = results[0].status === 'fulfilled' && results[0].value.data ? results[0].value.data : [];
      const searches = results[1].status === 'fulfilled' && results[1].value.data ? results[1].value.data : [];
      const matches = results[2].status === 'fulfilled' && results[2].value.data ? results[2].value.data : [];
      const applications = results[3].status === 'fulfilled' && results[3].value.data ? results[3].value.data : [];

      // Log any failed queries
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const tableNames = ['job_profiles', 'job_searches', 'job_matches', 'job_applications'];
          console.error(`Error fetching ${tableNames[index]}:`, result.reason);
        }
      });

      // Calculate stats with exact schema column names
      const activeSearches = searches.filter(s => s.is_active === true).length;
      const savedMatches = matches.filter(m => m.is_saved === true).length;
      const pendingApplications = applications.filter(a => 
        a.status && ['applied', 'screening', 'interview', 'pending'].includes(a.status) // Updated status values
      ).length;

      const matchScores = matches
        .filter(m => m.ai_score != null && typeof m.ai_score === 'number') // Changed from ai_match_score
        .map(m => m.ai_score);
      
      const avgMatchScore = matchScores.length > 0 
        ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
        : 0;

      const stats = {
        totalProfiles: profiles.length,
        activeSearches,
        totalMatches: matches.length,
        savedMatches,
        totalApplications: applications.length,
        pendingApplications,
        avgMatchScore
      };

      console.log('Dashboard stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default stats instead of throwing
      return {
        totalProfiles: 0,
        activeSearches: 0,
        totalMatches: 0,
        savedMatches: 0,
        totalApplications: 0,
        pendingApplications: 0,
        avgMatchScore: 0
      };
    }
  }
}