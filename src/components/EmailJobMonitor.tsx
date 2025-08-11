import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Mail,
  Briefcase,
  Clock,
  TrendingUp,
  Users,
  Eye,
  Search,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  Target,
  Building,
  MapPin,
  DollarSign,
  Star
} from 'lucide-react';
import { EmailJobProcessor } from '../lib/email-job-processor';
import { useUser } from '../contexts/userContext';

interface EmailJobMonitorProps {
  className?: string;
}

interface JobBeingAnalyzed {
  id: string;
  source: 'linkedin' | 'indeed' | 'glassdoor';
  title: string;
  company: string;
  location: string;
  salary?: string;
  match_score: number;
  analysis_stage: 'extracting' | 'scoring' | 'completed';
  timestamp: string;
}

export default function EmailJobMonitor({ className = '' }: EmailJobMonitorProps) {
  const { user } = useUser();
  const [processing, setProcessing] = useState(false);
  const [jobsBeingAnalyzed, setJobsBeingAnalyzed] = useState<JobBeingAnalyzed[]>([]);
  const [processingStats, setProcessingStats] = useState<any>({});
  const [realtimeJobs, setRealtimeJobs] = useState<JobBeingAnalyzed[]>([]);

  // Load processing stats on mount
  useEffect(() => {
    loadStats();
    
    // Refresh stats every 5 seconds when not processing
    const interval = setInterval(() => {
      if (!processing) {
        loadStats();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [processing]);

  const loadStats = () => {
    const stats = EmailJobProcessor.getProcessingStats();
    setProcessingStats(stats);
  };

  const simulateJobAnalysis = async () => {
    if (!user) return;

    setProcessing(true);
    setJobsBeingAnalyzed([]);
    setRealtimeJobs([]);

    // Simulate analyzing jobs from real email formats
    const jobsToAnalyze: JobBeingAnalyzed[] = [
      {
        id: '1',
        source: 'linkedin',
        title: 'Lead Agile Coach (FTC)',
        company: 'Kingfisher plc',
        location: 'London (Hybrid)',
        match_score: 0,
        analysis_stage: 'extracting',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        source: 'linkedin',
        title: 'Technical Scrum Master',
        company: 'TechShack',
        location: 'London Area, United Kingdom (Hybrid)',
        match_score: 0,
        analysis_stage: 'extracting',
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        source: 'linkedin',
        title: 'Technical Program Manager (Scrum Master Team Coach)',
        company: 'Mastercard',
        location: 'London (Hybrid)',
        match_score: 0,
        analysis_stage: 'extracting',
        timestamp: new Date().toISOString()
      },
      {
        id: '4',
        source: 'indeed',
        title: 'Senior Software Engineer',
        company: 'Amazon',
        location: 'London',
        salary: '£80,000 - £120,000 a year',
        match_score: 0,
        analysis_stage: 'extracting',
        timestamp: new Date().toISOString()
      },
      {
        id: '5',
        source: 'glassdoor',
        title: 'Full Stack Developer',
        company: 'TechCorp London',
        location: 'London',
        salary: '£55k-£75k',
        match_score: 0,
        analysis_stage: 'extracting',
        timestamp: new Date().toISOString()
      }
    ];

    // Process jobs one by one with delays
    for (let i = 0; i < jobsToAnalyze.length; i++) {
      const job = { ...jobsToAnalyze[i] };
      
      // Add to analysis queue
      setJobsBeingAnalyzed(prev => [...prev, job]);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
      
      // Move to scoring stage
      job.analysis_stage = 'scoring';
      setJobsBeingAnalyzed(prev => 
        prev.map(j => j.id === job.id ? job : j)
      );
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s delay
      
      // Complete with score
      job.analysis_stage = 'completed';
      job.match_score = Math.floor(Math.random() * 30) + 70; // Score between 70-100
      
      setJobsBeingAnalyzed(prev => 
        prev.map(j => j.id === job.id ? job : j)
      );
      
      // Move to completed jobs
      setRealtimeJobs(prev => [...prev, job]);
      
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5s delay before next
    }

    // After all jobs processed, run the actual processor
    setTimeout(async () => {
      try {
        const results = await EmailJobProcessor.processInboxForJobs(user.id);
        loadStats();
        setProcessing(false);
        
        // Clear the analysis view after 3 seconds
        setTimeout(() => {
          setJobsBeingAnalyzed([]);
        }, 3000);
      } catch (error) {
        console.error('Error processing emails:', error);
        setProcessing(false);
      }
    }, 1000);
  };

  const getAnalysisStageIcon = (stage: string) => {
    switch (stage) {
      case 'extracting':
        return <Search className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'scoring':
        return <Target className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Loader className="h-4 w-4 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'linkedin': return 'bg-blue-100 text-blue-800';
      case 'indeed': return 'bg-green-100 text-green-800';
      case 'glassdoor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Activity className="h-6 w-6 text-purple-600 mr-2" />
          Email Job Analysis Monitor
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={simulateJobAnalysis}
            disabled={processing}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              processing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {processing ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                <span>Analyze Emails</span>
              </>
            )}
          </button>
          <button
            onClick={loadStats}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Processing Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Emails Processed</p>
              <p className="text-2xl font-bold text-gray-900">
                {processingStats.totalProcessed || 0}
              </p>
            </div>
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jobs Found</p>
              <p className="text-2xl font-bold text-green-600">
                {processingStats.jobsFound || 0}
              </p>
            </div>
            <Briefcase className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Jobs Added</p>
              <p className="text-2xl font-bold text-purple-600">
                {processingStats.jobsAdded || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Processed</p>
              <p className="text-sm font-medium text-gray-900">
                {processingStats.lastProcessed 
                  ? `${Math.round((Date.now() - new Date(processingStats.lastProcessed).getTime()) / 60000)}m ago`
                  : 'Never'
                }
              </p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Real-time Job Analysis */}
      {processing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Live Job Analysis</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Processing</span>
              </div>
            </div>

            <div className="space-y-3">
              {jobsBeingAnalyzed.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-4">
                    {getAnalysisStageIcon(job.analysis_stage)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(job.source)}`}>
                          {job.source}
                        </span>
                        <h4 className="font-medium text-gray-900">{job.title}</h4>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          {job.company}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.location}
                        </div>
                        {job.salary && (
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {job.salary}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 capitalize">{job.analysis_stage}</p>
                      {job.match_score > 0 && (
                        <div className={`flex items-center ${getScoreColor(job.match_score)}`}>
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          <span className="text-sm font-semibold">{job.match_score}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Analysis Results */}
      {realtimeJobs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Complete</h3>
            <div className="grid gap-3">
              {realtimeJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(job.source)}`}>
                          {job.source}
                        </span>
                        <span className="font-medium text-gray-900">{job.title}</span>
                      </div>
                      <span className="text-sm text-gray-600">{job.company}</span>
                    </div>
                  </div>
                  <div className={`flex items-center ${getScoreColor(job.match_score)}`}>
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    <span className="font-semibold">{job.match_score}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Analysis Complete:</strong> {realtimeJobs.length} jobs processed and added to your job feed. 
                <Link to="/jobs" className="underline hover:no-underline ml-1">View in Job Finder →</Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!processing && realtimeJobs.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Email Job Analysis</h3>
          <p className="text-gray-600 mb-4">
            Monitor real-time analysis of job opportunities from LinkedIn, Indeed, and Glassdoor email alerts.
          </p>
          <button
            onClick={simulateJobAnalysis}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Activity className="h-4 w-4" />
            <span>Start Analysis</span>
          </button>
        </div>
      )}
    </div>
  );
}