// supabase/functions/job-discovery-execute/index.ts
// Edge Function for executing scheduled job searches

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobBoardResult {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { data: { user } } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, searchId } = await req.json()

    if (action === 'execute_search') {
      return await executeJobSearch(supabaseClient, user.id, searchId)
    } else if (action === 'execute_scheduled') {
      return await executeScheduledSearches(supabaseClient)
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in job-discovery-execute:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function executeJobSearch(supabaseClient: any, userId: string, searchId: string) {
  try {
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

    // Create execution log
    const { data: executionLog, error: logError } = await supabaseClient
      .from('search_execution_log')
      .insert([{
        search_id: searchId,
        execution_type: 'manual',
        started_at: new Date().toISOString(),
        status: 'running'
      }])
      .select()
      .single()

    if (logError) {
      throw new Error(`Failed to create execution log: ${logError.message}`)
    }

    try {
      // Execute the search across selected job boards
      const results = await performJobBoardSearch(search)
      
      // Store results in database
      if (results.length > 0) {
        await storeSearchResults(supabaseClient, searchId, results)
      }

      // Update execution log with success
      await supabaseClient
        .from('search_execution_log')
        .update({
          completed_at: new Date().toISOString(),
          status: 'completed',
          total_results_found: results.length,
          results_by_board: summarizeResultsByBoard(results)
        })
        .eq('id', executionLog.id)

      // Update search last_executed_at
      await supabaseClient
        .from('enhanced_job_searches')
        .update({
          last_executed_at: new Date().toISOString()
        })
        .eq('id', searchId)

      return new Response(
        JSON.stringify({ 
          success: true, 
          executionId: executionLog.id,
          resultsCount: results.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (executionError) {
      // Update execution log with error
      await supabaseClient
        .from('search_execution_log')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          error_message: executionError.message,
          error_details: { error: executionError.toString() }
        })
        .eq('id', executionLog.id)

      throw executionError
    }

  } catch (error) {
    console.error('Error executing job search:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function executeScheduledSearches(supabaseClient: any) {
  try {
    const now = new Date()
    const currentTime = now.toTimeString().substring(0, 5) // HH:MM format
    const currentDay = now.toISOString().split('T')[0] // YYYY-MM-DD format

    // Find searches that should be executed now
    const { data: scheduledSearches, error } = await supabaseClient
      .from('enhanced_job_searches')
      .select('*')
      .eq('is_active', true)
      .neq('search_frequency', 'manual')
      .or(`next_execution_at.lte.${now.toISOString()},next_execution_at.is.null`)

    if (error) {
      throw new Error(`Failed to fetch scheduled searches: ${error.message}`)
    }

    const results = []
    
    for (const search of scheduledSearches || []) {
      try {
        // Check if this search should run based on frequency and time
        const shouldRun = shouldExecuteSearch(search, now)
        
        if (shouldRun) {
          console.log(`Executing scheduled search: ${search.search_name}`)
          
          // Execute the search
          const searchResults = await performJobBoardSearch(search)
          
          // Store results
          if (searchResults.length > 0) {
            await storeSearchResults(supabaseClient, search.id, searchResults)
          }

          // Calculate next execution time
          const nextExecution = calculateNextExecution(search, now)
          
          // Update search record
          await supabaseClient
            .from('enhanced_job_searches')
            .update({
              last_executed_at: now.toISOString(),
              next_execution_at: nextExecution
            })
            .eq('id', search.id)

          results.push({
            searchId: search.id,
            searchName: search.search_name,
            resultsFound: searchResults.length,
            nextExecution
          })
        }
      } catch (searchError) {
        console.error(`Error executing scheduled search ${search.id}:`, searchError)
        results.push({
          searchId: search.id,
          searchName: search.search_name,
          error: searchError.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        executedSearches: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error executing scheduled searches:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

function shouldExecuteSearch(search: any, now: Date): boolean {
  const frequency = search.search_frequency
  const lastExecuted = search.last_executed_at ? new Date(search.last_executed_at) : null
  const scheduledTime = search.scheduled_time || '09:00'
  
  // Check if it's the right time of day
  const currentTime = now.toTimeString().substring(0, 5)
  const timeDiff = Math.abs(
    timeToMinutes(currentTime) - timeToMinutes(scheduledTime)
  )
  
  // Allow 30-minute window around scheduled time
  if (timeDiff > 30) {
    return false
  }

  if (!lastExecuted) {
    return true // Never executed before
  }

  const hoursSinceLastExecution = (now.getTime() - lastExecuted.getTime()) / (1000 * 60 * 60)

  switch (frequency) {
    case 'daily':
      return hoursSinceLastExecution >= 23 // Allow slight overlap
    case 'weekly':
      return hoursSinceLastExecution >= (7 * 24 - 1) // Weekly minus 1 hour
    case 'bi_weekly':
      return hoursSinceLastExecution >= (14 * 24 - 1) // Bi-weekly minus 1 hour
    default:
      return false
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function calculateNextExecution(search: any, currentTime: Date): string {
  const frequency = search.search_frequency
  const scheduledTime = search.scheduled_time || '09:00'
  const [hours, minutes] = scheduledTime.split(':').map(Number)
  
  const nextExecution = new Date(currentTime)
  nextExecution.setHours(hours, minutes, 0, 0)

  switch (frequency) {
    case 'daily':
      nextExecution.setDate(nextExecution.getDate() + 1)
      break
    case 'weekly':
      nextExecution.setDate(nextExecution.getDate() + 7)
      break
    case 'bi_weekly':
      nextExecution.setDate(nextExecution.getDate() + 14)
      break
  }

  return nextExecution.toISOString()
}

async function performJobBoardSearch(search: any): Promise<JobBoardResult[]> {
  // Mock job search implementation
  // In production, this would call real job board APIs
  const mockResults: JobBoardResult[] = []
  const selectedBoards = search.selected_job_boards || ['linkedin', 'indeed']
  
  for (const board of selectedBoards) {
    const boardResults = generateMockResults(board, search)
    mockResults.push(...boardResults)
  }
  
  return mockResults
}

function generateMockResults(boardName: string, search: any): JobBoardResult[] {
  const titles = [
    `Senior ${search.job_title || 'Software Engineer'}`,
    `${search.job_title || 'Product Manager'}`,
    `Lead ${search.job_title || 'Data Scientist'}`,
  ]

  const companies = ['TechCorp', 'InnovateCo', 'DataDyne', 'CloudSoft']
  const results: JobBoardResult[] = []
  
  const numResults = Math.min(search.max_results_per_board || 10, 10)
  
  for (let i = 0; i < numResults; i++) {
    results.push({
      jobTitle: titles[i % titles.length],
      companyName: companies[i % companies.length],
      jobDescription: `Exciting opportunity at ${companies[i % companies.length]} for a ${titles[i % titles.length]}. Remote-friendly position with competitive benefits.`,
      location: search.location || 'London, UK',
      remoteType: search.remote_type || 'hybrid',
      employmentType: 'full-time',
      experienceLevel: search.experience_level || 'mid',
      salaryMin: search.salary_min || 50000,
      salaryMax: search.salary_max || 80000,
      salaryCurrency: search.salary_currency || 'GBP',
      originalJobId: `${boardName}-${Date.now()}-${i}`,
      jobUrl: `https://${boardName}.com/jobs/${Date.now()}-${i}`,
      postedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      applicationDeadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  
  return results
}

async function storeSearchResults(supabaseClient: any, searchId: string, results: JobBoardResult[]) {
  const resultsToInsert = results.map(result => ({
    search_id: searchId,
    job_board_source_id: getBoardSourceId(result.originalJobId?.split('-')[0] || 'linkedin'),
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
    ai_match_score: Math.random() * 0.4 + 0.6, // Mock AI score
    is_bookmarked: false,
    is_dismissed: false
  }))

  const { error } = await supabaseClient
    .from('job_search_results')
    .insert(resultsToInsert)

  if (error) {
    throw new Error(`Failed to store search results: ${error.message}`)
  }
}

function getBoardSourceId(boardName: string): string {
  const boardMap: Record<string, string> = {
    'linkedin': '1',
    'indeed': '2',
    'totaljobs': '3',
    'glassdoor': '4',
    'stackoverflow': '5',
    'monster': '6',
    'reed': '7',
    'ziprecruiter': '8'
  }
  return boardMap[boardName] || '1'
}

function summarizeResultsByBoard(results: JobBoardResult[]): Record<string, number> {
  const summary: Record<string, number> = {}
  
  for (const result of results) {
    const boardName = result.originalJobId?.split('-')[0] || 'unknown'
    summary[boardName] = (summary[boardName] || 0) + 1
  }
  
  return summary
}