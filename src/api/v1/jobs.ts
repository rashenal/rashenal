import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';

export interface JobMatch {
  id: string;
  user_id: string;
  title: string;
  company: string;
  location: string;
  salary_range?: string;
  description: string;
  requirements: string[];
  benefits?: string[];
  job_type: 'full-time' | 'part-time' | 'contract' | 'remote';
  source: 'email' | 'scraping' | 'api' | 'manual';
  source_url?: string;
  match_score: number; // 0-100
  ai_analysis: {
    pros: string[];
    cons: string[];
    fit_explanation: string;
    missing_skills?: string[];
    growth_opportunities?: string[];
  };
  status: 'new' | 'interested' | 'applied' | 'interviewing' | 'rejected' | 'archived';
  applied_at?: string;
  created_at: string;
}

class JobsAPI {
  static async getAllJobs(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { status, min_score = 0, limit = 20, offset = 0 } = req.query;

      let query = supabase
        .from('job_matches')
        .select('*')
        .eq('user_id', userId)
        .gte('match_score', parseInt(min_score as string));

      if (status) query = query.eq('status', status);

      const { data: jobs, error } = await query
        .order('match_score', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) return res.status(500).json({ error: error.message });

      res.json({ jobs, count: jobs?.length || 0 });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getJob(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const { data: job, error } = await supabase
        .from('job_matches')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) return res.status(404).json({ error: 'Job not found' });

      res.json({ job });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateJobStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const userId = req.user?.id;

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'applied') {
        updateData.applied_at = new Date().toISOString();
      }

      const { data: job, error } = await supabase
        .from('job_matches')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) return res.status(404).json({ error: 'Job not found' });

      // Create application tasks if status is 'applied'
      if (status === 'applied') {
        await this.createApplicationTasks(id, userId, job);
      }

      res.json({ job, message: 'Job status updated' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private static async createApplicationTasks(jobId: string, userId: string, job: JobMatch) {
    const tasks = [
      {
        title: `Follow up on ${job.title} application`,
        description: `Follow up with ${job.company} regarding your application`,
        status: 'todo',
        priority: 'medium',
        category: 'job-search',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
        user_id: userId
      }
    ];

    await supabase.from('tasks').insert(tasks);
  }
}

export default JobsAPI;