// supabase/functions/job-discovery/index.ts
// AI-powered job discovery and matching service

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobDiscoveryRequest {
  action: 'analyze_job' | 'run_search' | 'match_profile';
  jobData?: {
    title: string;
    company: string;
    description: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    remote_type?: string;
    source?: string;
    url: string;
  };
  searchId?: string;
  profileId?: string;
}

interface JobAnalysisResponse {
  match_score: number;
  pros: string[];
  cons: string[];
  suggestions: string;
  analysis: {
    skills_match: number;
    experience_match: number;
    location_match: number;
    salary_match: number;
    culture_match: number;
    overall_fit: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Parse the request body
    const { action, jobData, searchId, profileId }: JobDiscoveryRequest = await req.json()

    let response: any = {}

    switch (action) {
      case 'analyze_job':
        response = await analyzeJob(supabaseClient, user.id, jobData!, profileId)
        break
      case 'run_search':
        response = await runJobSearch(supabaseClient, user.id, searchId!)
        break
      case 'match_profile':
        response = await matchJobToProfile(supabaseClient, user.id, jobData!, profileId!)
        break
      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: response,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  } catch (error) {
    console.error('Error in job-discovery function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      },
    )
  }
})

async function analyzeJob(
  supabaseClient: any, 
  userId: string, 
  jobData: any, 
  profileId: string | undefined
): Promise<JobAnalysisResponse> {
  // Get user's job profile or create a generic one
  let profile = null
  if (profileId) {
    const { data } = await supabaseClient
      .from('job_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', userId)
      .single()
    profile = data
  } else {
    // Get the most active profile
    const { data } = await supabaseClient
      .from('job_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
    profile = data?.[0]
  }

  if (!profile) {
    throw new Error('No job profile found. Please create a profile first.')
  }

  // Build analysis prompt for Claude
  const analysisPrompt = `You are an expert career advisor analyzing a job opportunity for a candidate. Provide a detailed analysis with scoring.

CANDIDATE PROFILE:
- Name: ${profile.name || 'Not specified'}
- Experience Level: ${profile.experience_level || 'Not specified'}
- Skills: ${profile.skills?.length ? profile.skills.join(', ') : 'Not specified'}
- Industries: ${profile.industries?.length ? profile.industries.join(', ') : 'Not specified'}
- Location Preferences: ${profile.locations?.length ? profile.locations.join(', ') : profile.location || 'Not specified'}
- Remote Preference: ${profile.remote_preference || 'Not specified'}
- Salary Range: ${profile.salary_currency || 'USD'} ${profile.desired_salary_min || 'N/A'} - ${profile.desired_salary_max || 'N/A'}
- Company Sizes: ${profile.company_sizes?.length ? profile.company_sizes.join(', ') : 'Not specified'}
- Values: ${profile.values?.length ? profile.values.join(', ') : 'Not specified'}
- Deal Breakers: ${profile.deal_breakers?.length ? profile.deal_breakers.join(', ') : 'Not specified'}

JOB OPPORTUNITY:
- Title: ${jobData.title}
- Company: ${jobData.company}
- Location: ${jobData.location} (${jobData.remote_type})
- Salary: ${jobData.salary_min ? `${jobData.salary_min} - ${jobData.salary_max}` : 'Not specified'}
- Description: ${jobData.description}

Analyze this match and respond in the following JSON format:
{
  "match_score": [0-100 overall match score],
  "pros": ["list of 3-5 specific advantages"],
  "cons": ["list of 3-5 specific concerns or drawbacks"],
  "suggestions": "One paragraph of actionable advice for applying or preparing",
  "analysis": {
    "skills_match": [0-100 how well skills align],
    "experience_match": [0-100 how well experience level matches],
    "location_match": [0-100 location/remote preference alignment],
    "salary_match": [0-100 salary expectation alignment],
    "culture_match": [0-100 company values alignment],
    "overall_fit": "Brief summary of overall fit assessment"
  }
}

Focus on specific, actionable insights. Consider both explicit requirements and implicit company culture cues from the job description.`

  // Call Claude API
  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: analysisPrompt
        }
      ]
    })
  })

  if (!claudeResponse.ok) {
    console.error('Claude API error:', await claudeResponse.text())
    throw new Error(`Claude API error: ${claudeResponse.status}`)
  }

  const claudeData = await claudeResponse.json()
  const analysisText = claudeData.content[0].text

  try {
    // Parse the JSON response from Claude
    const analysis = JSON.parse(analysisText)
    
    // Store the job match in database
    const { error: insertError } = await supabaseClient
      .from('job_matches')
      .insert([{
        search_id: null, // This function is called for single job analysis, not search-based matching
        job_listing_id: null, 
        job_title: jobData.title,
        company_name: jobData.company,
        job_url: jobData.url,
        job_description: jobData.description,
        salary_range: jobData.salary_min && jobData.salary_max ? `${jobData.salary_min} - ${jobData.salary_max} ${profile.salary_currency}` : null,
        location: jobData.location,
        job_type: null,
        remote_option: jobData.remote_type,
        ai_score: analysis.match_score,
        ai_reasoning: analysis.suggestions,
        fit_analysis: analysis.analysis,
        skills_match: { score: analysis.analysis.skills_match },
        preference_alignment: null,
        red_flags: analysis.cons,
        opportunities: analysis.pros,
        is_applied: false,
        is_saved: false
      }])

    if (insertError) {
      console.error('Error storing job match:', insertError)
    }

    return analysis
  } catch (parseError) {
    console.error('Error parsing Claude response:', parseError)
    console.error('Raw response:', analysisText)
    
    // Fallback response
    return {
      match_score: 50,
      pros: ['Opportunity to grow in a new role'],
      cons: ['Unable to fully analyze at this time'],
      suggestions: 'Please review the job description carefully and consider how your skills align with the requirements.',
      analysis: {
        skills_match: 50,
        experience_match: 50,
        location_match: 50,
        salary_match: 50,
        culture_match: 50,
        overall_fit: 'Analysis temporarily unavailable'
      }
    }
  }
}

async function runJobSearch(supabaseClient: any, userId: string, searchId: string) {
  // Get the search configuration
  const { data: search, error } = await supabaseClient
    .from('job_searches')
    .select(`
      *,
      job_profiles (*)
    `)
    .eq('id', searchId)
    .eq('user_id', userId)
    .single()

  if (error || !search) {
    throw new Error('Job search not found')
  }

  if (!search.is_active) {
    throw new Error('Job search is not active')
  }

  // Mock job search results (in production, this would call external APIs)
  const mockJobs = [
    {
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc',
      description: 'We are looking for a senior software engineer with React and TypeScript experience...',
      location: 'San Francisco, CA',
      remote_type: 'hybrid',
      salary_min: 120000,
      salary_max: 160000,
      source: 'linkedin',
      url: 'https://linkedin.com/jobs/example1'
    },
    {
      title: 'Full Stack Developer',
      company: 'StartupXYZ',
      description: 'Join our fast-growing startup as a full stack developer. Experience with Node.js required...',
      location: 'Remote',
      remote_type: 'remote',
      salary_min: 90000,
      salary_max: 130000,
      source: 'indeed',
      url: 'https://indeed.com/viewjob?jk=example2'
    }
  ]

  // Filter jobs based on search criteria
  const filteredJobs = mockJobs.filter(job => {
    // Check keywords
    if (search.keywords.length > 0) {
      const hasKeyword = search.keywords.some(keyword => 
        job.title.toLowerCase().includes(keyword.toLowerCase()) ||
        job.description.toLowerCase().includes(keyword.toLowerCase())
      )
      if (!hasKeyword) return false
    }

    // Check excluded keywords
    if (search.excluded_keywords.length > 0) {
      const hasExcludedKeyword = search.excluded_keywords.some(keyword => 
        job.title.toLowerCase().includes(keyword.toLowerCase()) ||
        job.description.toLowerCase().includes(keyword.toLowerCase())
      )
      if (hasExcludedKeyword) return false
    }

    return true
  })

  // Analyze each job against the profile
  const analyzedJobs = []
  for (const job of filteredJobs) {
    try {
      const analysis = await analyzeJob(supabaseClient, userId, job, search.profile_id)
      
      // Only include jobs that meet the minimum match score
      if (analysis.match_score >= search.min_match_score) {
        analyzedJobs.push({
          ...job,
          analysis
        })
      }
    } catch (analysisError) {
      console.error('Error analyzing job:', analysisError)
      // Skip this job if analysis fails
    }
  }

  // Update search with last run time
  await supabaseClient
    .from('job_searches')
    .update({
      last_run_at: new Date().toISOString(),
      next_run_at: calculateNextRunTime(search.search_frequency)
    })
    .eq('id', searchId)

  return {
    search_id: searchId,
    jobs_found: analyzedJobs.length,
    jobs: analyzedJobs.sort((a, b) => b.analysis.match_score - a.analysis.match_score)
  }
}

async function matchJobToProfile(
  supabaseClient: any, 
  userId: string, 
  jobData: any, 
  profileId: string
): Promise<JobAnalysisResponse> {
  return await analyzeJob(supabaseClient, userId, jobData, profileId)
}

function calculateNextRunTime(frequency: string): string {
  const now = new Date()
  
  switch (frequency) {
    case 'realtime':
      // Next run in 5 minutes for real-time
      return new Date(now.getTime() + 5 * 60 * 1000).toISOString()
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }
}