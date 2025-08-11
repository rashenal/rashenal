import React, { useState, useEffect } from 'react';
import {
  Mail,
  Activity,
  Filter,
  Play,
  Pause,
  Loader,
  Settings,
  AlertCircle,
  CheckCircle,
  Folder,
  Zap,
  FileText,
  DollarSign,
  MapPin,
  Building,
  ExternalLink,
  Eye,
  Plus,
  X
} from 'lucide-react';
import { useUser } from '../../contexts/userContext';

interface EmailSource {
  id: string;
  type: 'gmail' | 'outlook' | 'imap';
  email: string;
  enabled: boolean;
  folders: string[];
  selectedFolders: string[];
  lastSync: Date;
  status: 'active' | 'paused' | 'error';
  processedCount: number;
  pendingCount: number;
}

interface EmailFilter {
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  startDate?: Date;
  endDate?: Date;
  folders: string[];
  keywords: string[];
  excludeKeywords: string[];
  senderFilters: string[];
  readStatus: 'all' | 'unread' | 'read';
}

interface ProcessedJob {
  id: string;
  emailId: string;
  emailSubject: string;
  sender: string;
  receivedAt: Date;
  jobTitle: string;
  company: string;
  location: string;
  salary?: string;
  jobUrl?: string;
  matchScore: number;
  analysis: {
    pros: string[];
    cons: string[];
    reasoning: string;
  };
  tokens: number;
  cost: number;
  processingTime: number;
  tags: string[];
  status: 'matched' | 'rejected' | 'pending';
}

export default function EmailAgentMonitor() {
  const { user } = useUser();
  const [emailSources, setEmailSources] = useState<EmailSource[]>([]);
  const [filters, setFilters] = useState<EmailFilter>({
    dateRange: 'week',
    folders: [],
    keywords: [],
    excludeKeywords: [],
    senderFilters: [],
    readStatus: 'all'
  });
  const [processedJobs, setProcessedJobs] = useState<ProcessedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ProcessedJob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [trainMode, setTrainMode] = useState(false);
  const [stats, setStats] = useState({
    totalProcessed: 0,
    matchedJobs: 0,
    rejectedJobs: 0,
    totalTokens: 0,
    totalCost: 0,
    avgMatchScore: 0,
    processingRate: 0
  });

  useEffect(() => {
    loadEmailSources();
    loadProcessedJobs();
    loadStats();
  }, [user]);

  const loadEmailSources = async () => {
    // Mock data for now
    setEmailSources([
      {
        id: '1',
        type: 'outlook',
        email: 'rharveybis@hotmail.com',
        enabled: true,
        folders: ['Inbox', 'LinkedIn', 'Indeed', 'Glassdoor', 'Archive'],
        selectedFolders: ['LinkedIn', 'Indeed'],
        lastSync: new Date('2024-03-10T10:30:00'),
        status: 'active',
        processedCount: 1247,
        pendingCount: 23
      },
      {
        id: '2',
        type: 'gmail',
        email: 'rashee.harvey@gmail.com',
        enabled: false,
        folders: ['Inbox', 'Jobs', 'Recruiters'],
        selectedFolders: ['Jobs'],
        lastSync: new Date('2024-03-09T15:00:00'),
        status: 'paused',
        processedCount: 456,
        pendingCount: 0
      }
    ]);
  };

  const loadProcessedJobs = async () => {
    // Mock data
    setProcessedJobs([
      {
        id: '1',
        emailId: 'email1',
        emailSubject: 'New job alert: Lead Agile Coach at Kingfisher',
        sender: 'LinkedIn Job Alerts',
        receivedAt: new Date('2024-03-10T09:15:00'),
        jobTitle: 'Lead Agile Coach (FTC)',
        company: 'Kingfisher plc',
        location: 'London (Hybrid)',
        salary: '£95,000 - £110,000',
        jobUrl: 'https://linkedin.com/jobs/123',
        matchScore: 92,
        analysis: {
          pros: ['Strong Agile coaching experience match', 'Hybrid working', 'Enterprise transformation scope'],
          cons: ['Fixed-term contract', 'Retail sector (not fintech)'],
          reasoning: 'Excellent match for your Agile coaching profile with enterprise transformation experience'
        },
        tokens: 1250,
        cost: 0.025,
        processingTime: 2.3,
        tags: ['agile', 'coaching', 'transformation', 'hybrid'],
        status: 'matched'
      },
      {
        id: '2',
        emailId: 'email2',
        emailSubject: 'Technical Scrum Master - TechShack',
        sender: 'LinkedIn',
        receivedAt: new Date('2024-03-10T08:45:00'),
        jobTitle: 'Technical Scrum Master',
        company: 'TechShack',
        location: 'London Area (Hybrid)',
        matchScore: 78,
        analysis: {
          pros: ['Scrum Master role', 'Tech company', 'Hybrid'],
          cons: ['More technical than coaching focused', 'Startup environment'],
          reasoning: 'Good match but more technical than your preferred coaching focus'
        },
        tokens: 980,
        cost: 0.020,
        processingTime: 1.8,
        tags: ['scrum', 'technical', 'startup'],
        status: 'matched'
      }
    ]);
  };

  const loadStats = () => {
    setStats({
      totalProcessed: 1703,
      matchedJobs: 234,
      rejectedJobs: 1469,
      totalTokens: 1.5e6,
      totalCost: 30.45,
      avgMatchScore: 72,
      processingRate: 12.5
    });
  };

  const toggleSource = async (sourceId: string) => {
    setEmailSources(sources => 
      sources.map(s => 
        s.id === sourceId 
          ? { ...s, enabled: !s.enabled, status: !s.enabled ? 'active' : 'paused' }
          : s
      )
    );
  };

  const processEmails = async () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      loadProcessedJobs();
      loadStats();
    }, 3000);
  };

  const handleJobDoubleClick = (job: ProcessedJob) => {
    setSelectedJob(job);
  };

  return (
    <div className="space-y-6">
      {/* Email Sources Configuration */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Mail className="h-6 w-6 text-blue-600 mr-2" />
            Email Sources
          </h2>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Source</span>
            </button>
            <button
              onClick={processEmails}
              disabled={isProcessing}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                isProcessing 
                  ? 'bg-gray-100 text-gray-400' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Process Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {emailSources.map(source => (
            <div key={source.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleSource(source.id)}
                    className={`p-2 rounded-lg ${
                      source.enabled 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {source.enabled ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </button>
                  <div>
                    <p className="font-semibold text-gray-900">{source.email}</p>
                    <p className="text-sm text-gray-600">
                      {source.type.toUpperCase()} • Last sync: {source.lastSync.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{source.processedCount}</p>
                    <p className="text-xs text-gray-500">Processed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-600">{source.pendingCount}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {source.selectedFolders.map(folder => (
                  <span key={folder} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    <Folder className="inline h-3 w-3 mr-1" />
                    {folder}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtering Options */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Filter className="h-5 w-5 text-purple-600 mr-2" />
          Processing Filters
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Read Status</label>
            <select
              value={filters.readStatus}
              onChange={(e) => setFilters({...filters, readStatus: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Emails</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Training Mode</label>
            <button
              onClick={() => setTrainMode(!trainMode)}
              className={`w-full px-3 py-2 rounded-lg font-medium ${
                trainMode 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {trainMode ? 'Training Active' : 'Production Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Processing Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalProcessed}</span>
          </div>
          <p className="text-sm text-gray-600">Total Processed</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.matchedJobs}</span>
          </div>
          <p className="text-sm text-gray-600">Matched Jobs</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.avgMatchScore}%</span>
          </div>
          <p className="text-sm text-gray-600">Avg Match Score</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">${stats.totalCost.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-600">Total Cost</p>
        </div>
      </div>

      {/* Processed Jobs List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 text-green-600 mr-2" />
          Real-time Job Analysis
        </h3>
        
        <div className="space-y-3">
          {processedJobs.map(job => (
            <div
              key={job.id}
              onDoubleClick={() => handleJobDoubleClick(job)}
              className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{job.jobTitle}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.matchScore >= 80 
                        ? 'bg-green-100 text-green-700' 
                        : job.matchScore >= 60 
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {job.matchScore}% Match
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      {job.company}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.salary}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>From: {job.sender}</span>
                    <span>{job.receivedAt.toLocaleTimeString()}</span>
                    <span>{job.tokens} tokens (${job.cost.toFixed(3)})</span>
                    <span>{job.processingTime}s</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {job.jobUrl && (
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Job Analysis Details</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{selectedJob.jobTitle}</h3>
                <p className="text-gray-600">{selectedJob.company} • {selectedJob.location}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Pros</h4>
                  <ul className="space-y-1">
                    {selectedJob.analysis.pros.map((pro, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Cons</h4>
                  <ul className="space-y-1">
                    {selectedJob.analysis.cons.map((con, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">AI Reasoning</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedJob.analysis.reasoning}
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Email Subject</p>
                  <p className="text-sm font-medium">{selectedJob.emailSubject}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Processing Cost</p>
                  <p className="text-sm font-medium">${selectedJob.cost.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedJob.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}