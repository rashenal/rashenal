// supabase/functions/search-monitor/index.ts
// Monitoring and management system for job searches

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchMonitorRequest {
  action: 'get_active_searches' | 'get_search_status' | 'cancel_search' | 'get_search_logs';
  searchId?: string;
  userId?: string;
}

interface ActiveSearchInfo {
  id: string;
  user_id: string;
  user_email: string;
  search_name: string;
  job_board: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  estimated_completion?: string;
  progress?: {
    current_step: string;
    total_steps: number;
    completed_steps: number;
    current_url?: string;
    results_found: number;
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
    const { action, searchId, userId }: SearchMonitorRequest = await req.json()

    let response: any = {}

    switch (action) {
      case 'get_active_searches':
        response = await getActiveSearches(supabaseClient, user.id)
        break
      case 'get_search_status':
        if (!searchId) throw new Error('Search ID required')
        response = await getSearchStatus(supabaseClient, user.id, searchId)
        break
      case 'cancel_search':
        if (!searchId) throw new Error('Search ID required')
        response = await cancelSearch(supabaseClient, user.id, searchId)
        break
      case 'get_search_logs':
        response = await getSearchLogs(supabaseClient, user.id, searchId)
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
    console.error('Error in search-monitor function:', error)
    
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

async function getActiveSearches(supabaseClient: any, userId: string): Promise<ActiveSearchInfo[]> {
  try {
    // Get all active search executions for the user
    const { data: activeSearches, error } = await supabaseClient
      .from('search_execution_log')
      .select(`
        id,
        search_id,
        status,
        started_at,
        completed_at,
        total_jobs_found,
        total_results_found,
        enhanced_job_searches!inner (
          name,
          user_id,
          selected_job_boards
        )
      `)
      .eq('enhanced_job_searches.user_id', userId)
      .in('status', ['pending', 'running'])
      .order('started_at', { ascending: false })

    if (error) {
      // If table doesn't exist, return empty array instead of throwing
      if (error.message.includes('relation "search_execution_log" does not exist')) {
        console.log('search_execution_log table does not exist yet, returning empty array')
        return []
      }
      console.error('Error fetching active searches:', error)
      throw new Error(`Failed to fetch active searches: ${error.message}`)
    }

    // Get user info
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    // Transform the data
    const searches: ActiveSearchInfo[] = (activeSearches || []).map((search: any) => ({
      id: search.id,
      user_id: search.enhanced_job_searches.user_id,
      user_email: user?.email || 'Unknown',
      search_name: search.enhanced_job_searches.name,
      job_board: search.enhanced_job_searches.selected_job_boards?.[0] || 'unknown',
      status: search.status,
      started_at: search.started_at,
      estimated_completion: estimateCompletion(search.started_at, null), // No progress_data in your table
      progress: {
        current_step: search.status === 'running' ? 'Processing jobs' : 'Initializing',
        total_steps: 5,
        completed_steps: search.status === 'completed' ? 5 : (search.status === 'running' ? 3 : 0),
        results_found: search.total_jobs_found || search.total_results_found || 0
      }
    }))

    return searches
  } catch (error) {
    console.error('Error in getActiveSearches:', error)
    // Return empty array on any error to prevent function failure
    return []
  }
}

async function getSearchStatus(supabaseClient: any, userId: string, searchId: string) {
  const { data, error } = await supabaseClient
    .from('search_execution_log')
    .select(`
      *,
      enhanced_job_searches!inner (
        name,
        user_id
      )
    `)
    .eq('id', searchId)
    .eq('enhanced_job_searches.user_id', userId)
    .single()

  if (error) {
    throw new Error('Search not found or access denied')
  }

  return {
    id: data.id,
    search_name: data.enhanced_job_searches.name,
    status: data.status,
    started_at: data.started_at,
    completed_at: data.completed_at,
    progress: {
      current_step: data.status === 'completed' ? 'Completed' : (data.status === 'running' ? 'Processing jobs' : 'Initializing'),
      total_steps: 5,
      completed_steps: data.status === 'completed' ? 5 : (data.status === 'running' ? 3 : 0),
      results_found: data.total_jobs_found || data.total_results_found || 0
    },
    error_message: data.error_message,
    total_results_found: data.total_results_found,
    execution_time_ms: data.execution_time_ms
  }
}

async function cancelSearch(supabaseClient: any, userId: string, searchId: string) {
  // First verify the search belongs to the user
  const { data: searchCheck, error: checkError } = await supabaseClient
    .from('search_execution_log')
    .select(`
      id,
      status,
      enhanced_job_searches!inner (user_id)
    `)
    .eq('id', searchId)
    .eq('enhanced_job_searches.user_id', userId)
    .single()

  if (checkError || !searchCheck) {
    throw new Error('Search not found or access denied')
  }

  if (!['pending', 'running'].includes(searchCheck.status)) {
    throw new Error('Search cannot be cancelled in its current state')
  }

  // Update the search status to cancelled
  const { error: updateError } = await supabaseClient
    .from('search_execution_log')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
      error_message: 'Cancelled by user'
    })
    .eq('id', searchId)

  if (updateError) {
    throw new Error('Failed to cancel search')
  }

  return { message: 'Search cancelled successfully' }
}

async function getSearchLogs(supabaseClient: any, userId: string, searchId?: string) {
  try {
    let query = supabaseClient
      .from('search_execution_log')
      .select(`
        *,
        enhanced_job_searches!inner (
          name,
          user_id,
          selected_job_boards
        )
      `)
      .eq('enhanced_job_searches.user_id', userId)
      .order('started_at', { ascending: false })
      .limit(50)

    if (searchId) {
      query = query.eq('id', searchId)
    }

    const { data, error } = await query

    if (error) {
      // If table doesn't exist, return empty array instead of throwing
      if (error.message.includes('relation "search_execution_log" does not exist')) {
        console.log('search_execution_log table does not exist yet, returning empty array')
        return []
      }
      throw new Error(`Failed to fetch search logs: ${error.message}`)
    }

    return data?.map((log: any) => ({
      id: log.id,
      search_name: log.enhanced_job_searches.name,
      job_boards: log.enhanced_job_searches.selected_job_boards,
      status: log.status,
      started_at: log.started_at,
      completed_at: log.completed_at,
      execution_time_ms: log.execution_time_ms,
      total_results_found: log.total_results_found,
      error_message: log.error_message,
      progress_data: {
        current_step: log.status === 'completed' ? 'Completed' : (log.status === 'running' ? 'Processing jobs' : 'Initializing'),
        total_steps: 5,
        completed_steps: log.status === 'completed' ? 5 : (log.status === 'running' ? 3 : 0),
        results_found: log.total_jobs_found || log.total_results_found || 0
      }
    })) || []
  } catch (error) {
    console.error('Error in getSearchLogs:', error)
    // Return empty array on any error to prevent function failure
    return []
  }
}

function estimateCompletion(startedAt: string, progressData: any): string | undefined {
  if (!progressData || !progressData.total_steps || !progressData.completed_steps) {
    return undefined
  }

  const started = new Date(startedAt).getTime()
  const now = Date.now()
  const elapsed = now - started
  
  if (progressData.completed_steps === 0) {
    return undefined
  }

  const avgTimePerStep = elapsed / progressData.completed_steps
  const remainingSteps = progressData.total_steps - progressData.completed_steps
  const estimatedRemainingTime = remainingSteps * avgTimePerStep
  
  const estimatedCompletion = new Date(now + estimatedRemainingTime)
  return estimatedCompletion.toISOString()
}