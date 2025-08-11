// supabase/functions/search-executor/index.ts
// Background job search execution with threading support

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchExecutionRequest {
  action: 'start_search' | 'get_status' | 'cancel_search';
  searchId: string;
  config?: {
    jobBoards: string[];
    maxResults: number;
    delayMs: number;
    respectRateLimit: boolean;
  };
}

// Global map to track running searches
const runningSearclhes = new Map<string, {
  abortController: AbortController;
  status: 'running' | 'cancelling';
  startTime: number;
  progress: any;
}>();

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
    const { action, searchId, config }: SearchExecutionRequest = await req.json()

    let response: any = {}

    switch (action) {
      case 'start_search':
        response = await startBackgroundSearch(supabaseClient, user.id, searchId, config)
        break
      case 'get_status':
        response = getSearchStatus(searchId)
        break
      case 'cancel_search':
        response = await cancelBackgroundSearch(supabaseClient, searchId)
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
    console.error('Error in search-executor function:', error)
    
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

async function startBackgroundSearch(
  supabaseClient: any, 
  userId: string, 
  searchId: string,
  config: any = {}
): Promise<{ executionId: string; status: string }> {
  console.log(`Starting background search for user ${userId}, search ${searchId}`)

  // Get the search configuration
  const { data: search, error: searchError } = await supabaseClient
    .from('enhanced_job_searches')
    .select('*')
    .eq('id', searchId)
    .eq('user_id', userId)
    .single()

  if (searchError || !search) {
    throw new Error('Search not found or access denied')
  }

  if (!search.is_active) {
    throw new Error('Search is not active')
  }

  // Create execution log entry
  const executionId = crypto.randomUUID()
  try {
    const { error: logError } = await supabaseClient
      .from('search_execution_log')
      .insert([{
        id: executionId,
        search_id: searchId,
        status: 'running',
        started_at: new Date().toISOString(),
        execution_type: 'manual',
        total_jobs_found: 0,
        new_jobs_found: 0,
        duplicate_jobs_filtered: 0,
        api_calls_made: 0,
        rate_limits_hit: 0,
        jobs_ai_analyzed: 0
      }])

    if (logError) {
      // If table doesn't exist, continue without logging but still execute search
      if (logError.message.includes('relation "search_execution_log" does not exist')) {
        console.log('search_execution_log table does not exist yet, continuing without execution logging')
      } else {
        console.error('Error creating execution log:', logError)
        throw new Error(`Failed to create execution log: ${logError.message}`)
      }
    }
  } catch (error) {
    console.error('Error with execution log table:', error)
    // Continue without execution logging if table doesn't exist
  }

  // Create abort controller for this search
  const abortController = new AbortController()
  
  // Store search in running searches map
  runningSearclhes.set(executionId, {
    abortController,
    status: 'running',
    startTime: Date.now(),
    progress: {
      current_step: 'Initializing',
      total_steps: 5,
      completed_steps: 0,
      results_found: 0
    }
  })

  // Start the search execution in background (non-blocking)
  executeSearchInBackground(supabaseClient, executionId, search, config, abortController.signal)

  return {
    executionId,
    status: 'started'
  }
}

async function executeSearchInBackground(
  supabaseClient: any,
  executionId: string,
  search: any,
  config: any,
  signal: AbortSignal
) {
  const searchInfo = runningSearclhes.get(executionId)
  if (!searchInfo) return

  try {
    console.log(`Executing background search ${executionId}`)
    
    // Step 1: Initialize search parameters
    await updateProgress(supabaseClient, executionId, {
      current_step: 'Preparing search parameters',
      completed_steps: 1,
      total_steps: 5,
      results_found: 0
    })

    if (signal.aborted) throw new Error('Search cancelled')

    // Step 2: Connect to job boards
    await updateProgress(supabaseClient, executionId, {
      current_step: 'Connecting to job boards',
      completed_steps: 2,
      total_steps: 5,
      results_found: 0
    })

    // Simulate job board connection delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    if (signal.aborted) throw new Error('Search cancelled')

    // Step 3: Execute searches on each job board
    let totalResults = 0
    const jobBoards = search.selected_job_boards || ['linkedin']
    
    for (let i = 0; i < jobBoards.length; i++) {
      const board = jobBoards[i]
      
      await updateProgress(supabaseClient, executionId, {
        current_step: `Searching ${board.toUpperCase()}`,
        completed_steps: 3,
        total_steps: 5,
        results_found: totalResults,
        current_url: `https://${board}.com/jobs/search`
      })

      await logActivity(supabaseClient, executionId, {
        type: 'info',
        message: `Starting search on ${board}`,
        url: `https://${board}.com/jobs/search`
      })

      // Simulate job board search with verbose logging
      const boardResults = await simulateJobBoardSearch(board, search, signal, supabaseClient, executionId)
      totalResults += boardResults.length

      await logActivity(supabaseClient, executionId, {
        type: 'success',
        message: `Found ${boardResults.length} results on ${board}`,
        details: { results: boardResults.length, jobs: boardResults.map(r => r.title) }
      })

      // Store results in database
      if (boardResults.length > 0) {
        await storeSearchResults(supabaseClient, search.id, boardResults)
        
        await logActivity(supabaseClient, executionId, {
          type: 'info',
          message: `Stored ${boardResults.length} job matches in database`,
          details: { stored_jobs: boardResults.length }
        })
      }

      if (signal.aborted) throw new Error('Search cancelled')
    }

    // Step 4: Process and analyze results
    await updateProgress(supabaseClient, executionId, {
      current_step: 'Processing results',
      completed_steps: 4,
      total_steps: 5,
      results_found: totalResults
    })

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 3000))

    if (signal.aborted) throw new Error('Search cancelled')

    // Step 5: Complete
    await updateProgress(supabaseClient, executionId, {
      current_step: 'Completed',
      completed_steps: 5,
      total_steps: 5,
      results_found: totalResults
    })

    // Mark as completed
    const executionTime = Date.now() - searchInfo.startTime
    try {
      await supabaseClient
        .from('search_execution_log')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          execution_time_ms: executionTime,
          total_results_found: totalResults,
          total_jobs_found: totalResults,
          new_jobs_found: totalResults // Assuming all are new for now
        })
        .eq('id', executionId)
    } catch (error) {
      // Ignore errors if table doesn't exist
      console.log('Could not update completion status - table may not exist:', error.message)
    }

    await logActivity(supabaseClient, executionId, {
      type: 'success',
      message: `Search completed successfully`,
      details: { 
        total_results: totalResults,
        execution_time_ms: executionTime
      }
    })

    console.log(`Background search ${executionId} completed successfully`)

  } catch (error) {
    console.error(`Background search ${executionId} failed:`, error)

    // Mark as failed
    try {
      await supabaseClient
        .from('search_execution_log')
        .update({
          status: error.message === 'Search cancelled' ? 'cancelled' : 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          execution_time_ms: Date.now() - searchInfo.startTime,
          total_jobs_found: 0,
          new_jobs_found: 0
        })
        .eq('id', executionId)
    } catch (updateError) {
      // Ignore errors if table doesn't exist
      console.log('Could not update failure status - table may not exist:', updateError.message)
    }

    await logActivity(supabaseClient, executionId, {
      type: 'error',
      message: `Search ${error.message === 'Search cancelled' ? 'cancelled' : 'failed'}`,
      details: { error: error.message }
    })
  } finally {
    // Clean up
    runningSearclhes.delete(executionId)
  }
}

async function simulateJobBoardSearch(
  board: string, 
  search: any, 
  signal: AbortSignal,
  supabaseClient?: any,
  executionId?: string
): Promise<any[]> {
  // This is a simulation - in real implementation, this would call actual job board APIs
  const mockResults = []
  const numResults = Math.floor(Math.random() * 20) + 5 // 5-25 results
  
  // Log search start with parameters
  if (supabaseClient && executionId) {
    await logActivity(supabaseClient, executionId, {
      type: 'info',
      message: `Analyzing jobs on ${board.toUpperCase()}`,
      details: { 
        search_terms: search.job_title || 'Software Engineer',
        location: search.location || 'Remote',
        expected_results: `${numResults} jobs`
      }
    })
  }
  
  for (let i = 0; i < numResults; i++) {
    if (signal.aborted) break
    
    const jobTitle = `${search.job_title || 'Software Engineer'} - ${getRandomJobVariant(i)}`
    const company = `${getRandomCompany(i)}`
    const salaryMin = 50000 + (i * 5000) + Math.floor(Math.random() * 10000)
    const salaryMax = salaryMin + 30000 + Math.floor(Math.random() * 20000)
    
    const job = {
      id: crypto.randomUUID(),
      title: jobTitle,
      company: company,
      location: search.location || getRandomLocation(),
      url: `https://${board}.com/jobs/${crypto.randomUUID()}`,
      description: `${getRandomJobDescription(search.job_title || 'Software Engineer', company)}`,
      salary_min: salaryMin,
      salary_max: salaryMax,
      posted_date: getRandomPostedDate(),
      source: board
    }
    
    mockResults.push(job)
    
    // Log each job being analyzed (verbose)
    if (supabaseClient && executionId && i % 5 === 0) { // Log every 5th job to avoid spam
      await logActivity(supabaseClient, executionId, {
        type: 'debug',
        message: `Analyzing job ${i + 1}/${numResults}: ${jobTitle}`,
        details: { 
          company: company,
          salary_range: `$${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`,
          url: job.url
        }
      })
    }
    
    // Simulate processing delay with some variation
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100))
  }
  
  // Log completion summary
  if (supabaseClient && executionId) {
    await logActivity(supabaseClient, executionId, {
      type: 'success',
      message: `Completed analysis of ${numResults} jobs from ${board.toUpperCase()}`,
      details: { 
        jobs_found: mockResults.length,
        companies: [...new Set(mockResults.map(j => j.company))],
        salary_range: {
          min: Math.min(...mockResults.map(j => j.salary_min)),
          max: Math.max(...mockResults.map(j => j.salary_max))
        }
      }
    })
  }
  
  return mockResults
}

function getRandomJobVariant(index: number): string {
  const variants = [
    'Senior Position', 'Lead Role', 'Principal Level', 'Staff Position', 
    'Senior Developer', 'Team Lead', 'Technical Lead', 'Solutions Architect',
    'Full Stack Developer', 'Backend Engineer', 'Frontend Specialist', 'DevOps Engineer'
  ]
  return variants[index % variants.length]
}

function getRandomCompany(index: number): string {
  const companies = [
    'TechCorp Solutions', 'InnovateTech', 'DataDriven Inc', 'CloudFirst Systems',
    'AgileWorks', 'ScaleUp Technologies', 'NextGen Software', 'DigitalEdge Corp',
    'SmartSystems LLC', 'FutureTech Innovations', 'CodeCraft Studios', 'ByteBuilders Inc',
    'CloudNative Solutions', 'DevOps Dynamics', 'AI-First Technologies', 'WebScale Inc'
  ]
  return companies[index % companies.length]
}

function getRandomLocation(): string {
  const locations = ['Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Denver, CO']
  return locations[Math.floor(Math.random() * locations.length)]
}

function getRandomJobDescription(jobTitle: string, company: string): string {
  const descriptions = [
    `Join ${company} as a ${jobTitle} and help build cutting-edge software solutions. We're looking for someone passionate about technology and innovation.`,
    `${company} is seeking a talented ${jobTitle} to join our growing team. You'll work on exciting projects using modern technologies and frameworks.`,
    `Exciting opportunity at ${company} for a ${jobTitle}. Help us scale our platform and deliver amazing user experiences to millions of customers.`,
    `${company} is hiring a ${jobTitle} to lead technical initiatives and mentor junior developers. Great benefits and flexible work environment.`
  ]
  return descriptions[Math.floor(Math.random() * descriptions.length)]
}

function getRandomPostedDate(): string {
  const daysAgo = Math.floor(Math.random() * 14) // 0-14 days ago
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

async function storeSearchResults(supabaseClient: any, searchId: string, results: any[]) {
  // Convert results to job_matches format
  const matches = results.map(result => ({
    search_id: searchId,
    job_listing_id: result.id,
    job_title: result.title,
    company_name: result.company,
    job_url: result.url,
    job_description: result.description,
    salary_range: result.salary_min && result.salary_max 
      ? `${result.salary_min} - ${result.salary_max}` 
      : null,
    location: result.location,
    remote_option: result.remote_type || null,
    ai_score: Math.floor(Math.random() * 40) + 60, // Mock AI score 60-100
    is_applied: false,
    is_saved: false
  }))

  const { error } = await supabaseClient
    .from('job_matches')
    .insert(matches)

  if (error) {
    console.error('Error storing search results:', error)
    throw new Error('Failed to store search results')
  }
}

async function updateProgress(supabaseClient: any, executionId: string, progress: any) {
  const searchInfo = runningSearclhes.get(executionId)
  if (searchInfo) {
    searchInfo.progress = progress
  }

  // No database update needed since your table doesn't have progress_data column
  // Progress is tracked in memory via runningSearclhes map
  console.log(`Progress update for ${executionId}:`, progress)
}

async function logActivity(supabaseClient: any, executionId: string, activity: any) {
  // Log both to console and database for real-time frontend access
  const logEntry = {
    timestamp: new Date().toISOString(),
    executionId,
    ...activity
  }
  
  console.log(`[${executionId}] ${activity.type?.toUpperCase()}: ${activity.message}`, activity.details || '')
  
  // Also store in database for frontend access
  try {
    await supabaseClient
      .from('search_activity_logs')
      .insert([{
        execution_id: executionId,
        log_type: activity.type || 'info',
        message: activity.message,
        details: activity.details || {},
        timestamp: new Date().toISOString()
      }])
  } catch (error) {
    // Don't fail the search if logging fails
    console.log('Could not store activity log:', error.message)
  }
}

function getSearchStatus(executionId: string) {
  const searchInfo = runningSearclhes.get(executionId)
  if (!searchInfo) {
    return { status: 'not_found' }
  }

  return {
    status: searchInfo.status,
    startTime: searchInfo.startTime,
    progress: searchInfo.progress,
    uptime: Date.now() - searchInfo.startTime
  }
}

async function cancelBackgroundSearch(supabaseClient: any, executionId: string) {
  const searchInfo = runningSearclhes.get(executionId)
  if (!searchInfo) {
    throw new Error('Search not found or already completed')
  }

  if (searchInfo.status === 'cancelling') {
    return { message: 'Search is already being cancelled' }
  }

  // Signal cancellation
  searchInfo.status = 'cancelling'
  searchInfo.abortController.abort()

  await logActivity(supabaseClient, executionId, {
    type: 'info',
    message: 'Search cancellation requested'
  })

  return { message: 'Search cancellation initiated' }
}