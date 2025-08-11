import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmailJobProcessor } from '../lib/email-job-processor';
import { useUser } from '../contexts/userContext';
import {
  Settings,
  Accessibility,
  Database,
  Mail,
  Shield,
  User,
  Bell,
  Palette,
  Globe,
  Smartphone,
  ChevronRight,
  X
} from 'lucide-react';
import AccessibilitySettings from './AccessibilitySettings';

interface SettingsManagerProps {
  onClose?: () => void;
  className?: string;
}

type SettingsSection = 
  | 'overview' 
  | 'accessibility' 
  | 'datasources' 
  | 'email' 
  | 'security' 
  | 'profile' 
  | 'notifications'
  | 'appearance'
  | 'privacy';

interface SettingsMenuItem {
  id: SettingsSection;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
  available: boolean;
}

const settingsMenuItems: SettingsMenuItem[] = [
  {
    id: 'accessibility',
    title: 'Accessibility & Preferences',
    subtitle: 'Visual, audio, navigation, and language settings',
    icon: Accessibility,
    color: 'text-blue-600',
    available: true
  },
  {
    id: 'datasources',
    title: 'Data Sources',
    subtitle: 'LinkedIn, job boards, and external integrations',
    icon: Database,
    color: 'text-green-600',
    available: true
  },
  {
    id: 'email',
    title: 'Email Integration',
    subtitle: 'Connect Outlook, Gmail, and email automation',
    icon: Mail,
    color: 'text-purple-600',
    available: true
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    subtitle: '2FA, session management, and data protection',
    icon: Shield,
    color: 'text-red-600',
    available: true
  },
  {
    id: 'profile',
    title: 'Profile Settings',
    subtitle: 'Personal information and job profiles',
    icon: User,
    color: 'text-orange-600',
    available: true
  },
  {
    id: 'notifications',
    title: 'Notifications',
    subtitle: 'Email alerts, push notifications, and job matches',
    icon: Bell,
    color: 'text-yellow-600',
    available: false // Coming soon
  },
  {
    id: 'appearance',
    title: 'Appearance',
    subtitle: 'Themes, colors, and layout preferences',
    icon: Palette,
    color: 'text-indigo-600',
    available: false // Coming soon
  },
  {
    id: 'privacy',
    title: 'Privacy Controls',
    subtitle: 'Data sharing, community features, and visibility',
    icon: Globe,
    color: 'text-teal-600',
    available: false // Coming soon
  }
];

export default function SettingsManager({ onClose, className = '' }: SettingsManagerProps) {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState<SettingsSection>('overview');
  const [outlookConnection, setOutlookConnection] = useState<any>(null);
  const [gmailConnection, setGmailConnection] = useState<any>(null);
  const [processingStats, setProcessingStats] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchThreshold, setMatchThreshold] = useState<number>(80);

  // Load connection status on component mount
  React.useEffect(() => {
    const loadConnections = () => {
      try {
        const outlookData = localStorage.getItem('outlook_connection');
        const gmailData = localStorage.getItem('gmail_connection');
        
        if (outlookData) {
          setOutlookConnection(JSON.parse(outlookData));
        }
        if (gmailData) {
          setGmailConnection(JSON.parse(gmailData));
        }
        
        // Load processing stats and threshold
        setProcessingStats(EmailJobProcessor.getProcessingStats());
        setMatchThreshold(EmailJobProcessor.getMatchThreshold());
      } catch (error) {
        console.error('Error loading connections:', error);
      }
    };

    loadConnections();
    
    // Listen for storage changes (when OAuth completes)
    const handleStorageChange = () => loadConnections();
    window.addEventListener('storage', handleStorageChange);
    
    // Check on focus (when returning from OAuth)
    const handleFocus = () => loadConnections();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleProcessEmails = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      const results = await EmailJobProcessor.processInboxForJobs(user.id);
      setProcessingStats(EmailJobProcessor.getProcessingStats());
      alert(`Email processing complete!\n\nEmails processed: ${results.emailsProcessed}\nJobs found: ${results.jobsFound}\nNew jobs added: ${results.jobsAdded}\nBelow threshold (${matchThreshold}%): ${results.belowThreshold}\n\nCheck the Job Finder dashboard to see the results!`);
    } catch (error) {
      console.error('Error processing emails:', error);
      alert('Error processing emails. Please try again.');
    }
    setIsProcessing(false);
  };

  const handleThresholdChange = (newThreshold: number) => {
    setMatchThreshold(newThreshold);
    EmailJobProcessor.setMatchThreshold(newThreshold);
  };

  const renderOverview = () => (
    <div className="linkedin-card-body">
      <div className="mb-6">
        <h2 className="linkedin-heading-2">Settings & Preferences</h2>
        <p className="linkedin-text">Manage your Rashenal AI experience, integrations, and security settings.</p>
      </div>
      
      <div className="grid gap-4">
        {settingsMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => item.available && setActiveSection(item.id)}
              disabled={!item.available}
              className={`linkedin-card p-4 text-left transition-all hover:shadow-md ${
                item.available 
                  ? 'cursor-pointer hover:border-linkedin-blue-hover' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="linkedin-flex-between">
                <div className="linkedin-flex">
                  <Icon className={`h-6 w-6 ${item.color}`} />
                  <div>
                    <h3 className="linkedin-heading-3 mb-1">{item.title}</h3>
                    <p className="linkedin-text-sm">{item.subtitle}</p>
                    {!item.available && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-linkedin-gray-100 text-linkedin-gray-600 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
                {item.available && <ChevronRight className="h-5 w-5 text-linkedin-gray-400" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDataSources = () => (
    <div className="linkedin-card-body">
      <div className="mb-6">
        <button
          onClick={() => setActiveSection('overview')}
          className="linkedin-btn linkedin-btn-ghost mb-4"
        >
          ← Back to Settings
        </button>
        <h2 className="linkedin-heading-2">Data Sources</h2>
        <p className="linkedin-text">Configure job boards, professional networks, and data integrations.</p>
      </div>

      <div className="space-y-6">
        {/* LinkedIn Integration */}
        <div className="linkedin-card border-l-4 border-l-blue-500">
          <div className="linkedin-card-body">
            <div className="linkedin-flex-between mb-4">
              <div>
                <h3 className="linkedin-heading-3">LinkedIn Integration</h3>
                <p className="linkedin-text-sm">Scrape job listings and leverage professional network data</p>
              </div>
              <div className="linkedin-status linkedin-status-completed">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Active
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Search Frequency:</span>
                <p className="linkedin-text-sm">Real-time, Daily, Weekly</p>
              </div>
              <div>
                <span className="font-medium">Rate Limits:</span>
                <p className="linkedin-text-sm">100 requests/hour</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Board Sources */}
        <div className="linkedin-card">
          <div className="linkedin-card-body">
            <h3 className="linkedin-heading-3 mb-4">Job Board Sources</h3>
            <div className="space-y-3">
              {[
                { name: 'Indeed', status: 'active', searches: 45 },
                { name: 'AngelList', status: 'active', searches: 23 },
                { name: 'Remote.co', status: 'planned', searches: 0 },
                { name: 'We Work Remotely', status: 'planned', searches: 0 }
              ].map((source) => (
                <div key={source.name} className="linkedin-flex-between p-3 border border-linkedin-gray-200 rounded">
                  <div className="linkedin-flex">
                    <Database className="h-4 w-4 text-linkedin-gray-600" />
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="linkedin-text-sm">{source.searches} active searches</p>
                    </div>
                  </div>
                  <div className={`linkedin-status ${
                    source.status === 'active' ? 'linkedin-status-completed' : 'linkedin-status-paused'
                  }`}>
                    {source.status === 'active' ? 'Active' : 'Planned'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="linkedin-card">
          <div className="linkedin-card-body">
            <h3 className="linkedin-heading-3 mb-4">API Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="linkedin-label">Default Rate Limit (requests/hour)</label>
                <input
                  type="number"
                  className="linkedin-input"
                  defaultValue="100"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="linkedin-label">Retry Attempts</label>
                <select className="linkedin-select">
                  <option value="3">3 attempts</option>
                  <option value="5">5 attempts</option>
                  <option value="10">10 attempts</option>
                </select>
              </div>
              <div className="linkedin-flex items-start">
                <input type="checkbox" id="respectRobots" className="mt-1" defaultChecked />
                <label htmlFor="respectRobots" className="linkedin-label ml-3">
                  Respect robots.txt files
                  <p className="linkedin-text-sm font-normal">Follow website crawling guidelines</p>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailIntegration = () => (
    <div className="linkedin-card-body">
      <div className="mb-6">
        <button
          onClick={() => setActiveSection('overview')}
          className="linkedin-btn linkedin-btn-ghost mb-4"
        >
          ← Back to Settings
        </button>
        <h2 className="linkedin-heading-2">AI Email Agent Integration</h2>
        <p className="linkedin-text">Connect your email accounts to enable AI-powered job discovery from thousands of emails.</p>
      </div>

      <div className="space-y-6">
        {/* AI Agent Overview */}
        <div className="linkedin-card border-l-4 border-l-purple-500 bg-purple-50">
          <div className="linkedin-card-body">
            <div className="linkedin-flex">
              <Smartphone className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="linkedin-heading-3 text-purple-800">🤖 AI Job Discovery Agent</h3>
                <p className="linkedin-text text-purple-700">
                  Your personal AI agent that processes thousands of job emails and learns your preferences through conversation.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="font-medium text-purple-800">Capabilities:</h4>
                    <ul className="list-disc list-inside mt-2 space-y-1 linkedin-text-sm text-purple-600">
                      <li>Process 1000s of emails in batches</li>
                      <li>Extract job details with AI</li>
                      <li>Learn from your feedback</li>
                      <li>Chat-based preference setting</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-800">Smart Features:</h4>
                    <ul className="list-disc list-inside mt-2 space-y-1 linkedin-text-sm text-purple-600">
                      <li>Auto-exclude unwanted jobs</li>
                      <li>Salary & location filtering</li>
                      <li>Company culture matching</li>
                      <li>Skill gap analysis</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = '/ai-agent'}
                  className="linkedin-btn linkedin-btn-primary mt-4"
                >
                  Open AI Agent Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Outlook Integration - Ready */}
        <div className="linkedin-card">
          <div className="linkedin-card-body">
            <div className="linkedin-flex-between mb-4">
              <div>
                <h3 className="linkedin-heading-3">Microsoft Outlook / Hotmail</h3>
                <p className="linkedin-text-sm">Process thousands of job emails from your Outlook account</p>
                {outlookConnection && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-800">Connected</span>
                    </div>
                    <div className="mt-1 text-xs text-green-700">
                      <p>Connected: {new Date(outlookConnection.connectedAt).toLocaleDateString()}</p>
                      <p>Permissions: {outlookConnection.permissions?.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
              {outlookConnection ? (
                <div className="flex flex-col space-y-2">
                  <button 
                    className="linkedin-btn linkedin-btn-secondary text-sm"
                    onClick={() => {
                      localStorage.removeItem('outlook_connection');
                      setOutlookConnection(null);
                    }}
                  >
                    Disconnect
                  </button>
                  <button className="linkedin-btn linkedin-btn-ghost text-sm">
                    Test Connection
                  </button>
                </div>
              ) : (
                <button 
                  className="linkedin-btn linkedin-btn-primary"
                  onClick={() => {
                    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
                    if (!clientId || clientId === 'your-microsoft-client-id-here') {
                      alert('Microsoft OAuth not configured. Please set VITE_MICROSOFT_CLIENT_ID in .env.local file.\n\nSee Azure App Registration setup guide at: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade');
                      return;
                    }
                    // Initiate Outlook OAuth
                    const redirectUri = `${window.location.origin}/auth/outlook/callback`;
                    const params = new URLSearchParams({
                      client_id: clientId,
                      response_type: 'code',
                      redirect_uri: redirectUri,
                      scope: 'Mail.Read User.Read offline_access',
                      response_mode: 'query',
                      state: Math.random().toString(36).substring(7)
                    });
                    const oauthUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?${params.toString()}`;
                    
                    window.location.href = oauthUrl;
                  }}
                >
                  Connect Outlook
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Email Volume:</span>
                <p className="linkedin-text-sm">Handle 10,000+ emails</p>
              </div>
              <div>
                <span className="font-medium">Processing:</span>
                <p className="linkedin-text-sm">Batch processing (100/min)</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded">
              <p className="text-sm text-green-800">
                <span className="font-medium">Perfect for:</span> Users with thousands of job notifications in Hotmail/Outlook
              </p>
            </div>
          </div>
        </div>

        {/* Gmail Integration */}
        <div className="linkedin-card">
          <div className="linkedin-card-body">
            <div className="linkedin-flex-between mb-4">
              <div>
                <h3 className="linkedin-heading-3">Gmail</h3>
                <p className="linkedin-text-sm">Connect your Gmail for comprehensive job email analysis</p>
              </div>
              <button 
                className="linkedin-btn linkedin-btn-secondary"
                onClick={() => {
                  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                  if (!clientId || clientId === 'your-google-client-id-here') {
                    alert('Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID in .env.local file.\n\nSee Google Cloud Console setup guide at: https://console.cloud.google.com/apis/credentials');
                    return;
                  }
                  // Initiate Gmail OAuth
                  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${window.location.origin}/auth/gmail/callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly`;
                }}
              >
                Connect Gmail
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">API Access:</span>
                <p className="linkedin-text-sm">Read-only access</p>
              </div>
              <div>
                <span className="font-medium">Privacy:</span>
                <p className="linkedin-text-sm">Process locally, store metadata only</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Matching Settings */}
        {(outlookConnection || gmailConnection) && (
          <div className="linkedin-card">
            <div className="linkedin-card-body">
              <h3 className="linkedin-heading-3 mb-4">Job Matching & Filtering</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Match Score ({matchThreshold}%)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="50"
                      max="95"
                      step="5"
                      value={matchThreshold}
                      onChange={(e) => handleThresholdChange(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-900 w-12">{matchThreshold}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only jobs with {matchThreshold}%+ AI match score will be added to your feed
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Processing Stats</label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Below threshold:</span>
                      <span className="text-red-600 font-medium">{processingStats.belowThreshold || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jobs added:</span>
                      <span className="text-green-600 font-medium">{processingStats.jobsAdded || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success rate:</span>
                      <span className="text-blue-600 font-medium">
                        {processingStats.jobsFound > 0 
                          ? Math.round((processingStats.jobsAdded / processingStats.jobsFound) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Monitoring Schedule */}
        {(outlookConnection || gmailConnection) && (
          <div className="linkedin-card">
            <div className="linkedin-card-body">
              <h3 className="linkedin-heading-3 mb-4">Job Alert Monitoring</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check Frequency</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="realtime">Real-time (webhook)</option>
                    <option value="5min" selected>Every 5 minutes</option>
                    <option value="15min">Every 15 minutes</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Alert Sources</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" checked className="mr-2" />
                      <span className="text-sm">LinkedIn Job Alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked className="mr-2" />
                      <span className="text-sm">Indeed Job Alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked className="mr-2" />
                      <span className="text-sm">Company Direct Emails</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">AI Job Detection</p>
                  <p className="text-sm text-blue-700">Automatically identify job opportunities using Claude AI</p>
                </div>
                <button className="linkedin-btn linkedin-btn-primary">
                  Start Monitoring
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Job Finder Activity Monitor */}
        {(outlookConnection || gmailConnection) && (
          <div className="linkedin-card">
            <div className="linkedin-card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="linkedin-heading-3">Job Finder Activity</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Monitoring</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {processingStats.totalProcessed || 0}
                  </p>
                  <p className="text-xs text-gray-600">Emails Processed</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {processingStats.jobsFound || 0}
                  </p>
                  <p className="text-xs text-gray-600">Job Alerts Found</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {processingStats.jobsAdded || 0}
                  </p>
                  <p className="text-xs text-gray-600">New Jobs Added</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">📧</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Last Email Check</p>
                      <p className="text-xs text-gray-500">
                        {processingStats.lastProcessed 
                          ? `${Math.round((Date.now() - new Date(processingStats.lastProcessed).getTime()) / 60000)} minutes ago`
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      Status: {processingStats.emailsProcessed ? 'Active' : 'Ready'}
                    </p>
                    <p className="text-xs text-gray-500">Waiting for jobs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">🤖</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">AI Job Detection</p>
                      <p className="text-xs text-gray-500">
                        {processingStats.jobsAdded || 0} jobs found {processingStats.lastProcessed ? 'today' : 'waiting'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Claude AI</p>
                    <p className="text-xs text-gray-500">Ready to process</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-bold text-sm">⏱</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Recent Sources</p>
                      <p className="text-xs text-gray-500">LinkedIn (15), Indeed (5), Glassdoor (3)</p>
                    </div>
                  </div>
                  <Link to="/jobs" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Jobs →
                  </Link>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={handleProcessEmails}
                  disabled={isProcessing || !user}
                  className={`linkedin-btn ${isProcessing ? 'linkedin-btn-ghost' : 'linkedin-btn-primary'} text-sm`}
                >
                  {isProcessing ? 'Processing...' : 'Process Emails Now'}
                </button>
                <button className="linkedin-btn linkedin-btn-ghost text-sm">
                  Reset Stats
                </button>
                <Link to="/jobs" className="linkedin-btn linkedin-btn-ghost text-sm">
                  View All Jobs
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Processing Stats */}
        <div className="linkedin-card">
          <div className="linkedin-card-body">
            <h3 className="linkedin-heading-3 mb-4">Email Processing Pipeline</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">Stage 1: Email Fetching</p>
                  <p className="text-sm text-gray-600">Retrieve job-related emails</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">100</p>
                  <p className="text-xs text-gray-500">emails/batch</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">Stage 2: AI Extraction</p>
                  <p className="text-sm text-gray-600">Extract job details with Claude</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">85%</p>
                  <p className="text-xs text-gray-500">accuracy</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">Stage 3: Smart Filtering</p>
                  <p className="text-sm text-gray-600">Apply preferences & exclusions</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">Smart</p>
                  <p className="text-xs text-gray-500">AI-powered</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'accessibility':
        return <AccessibilitySettings onClose={() => setActiveSection('overview')} />;
      case 'datasources':
        return renderDataSources();
      case 'email':
        return renderEmailIntegration();
      case 'security':
        return (
          <div className="linkedin-card-body">
            <button
              onClick={() => setActiveSection('overview')}
              className="linkedin-btn linkedin-btn-ghost mb-4"
            >
              ← Back to Settings
            </button>
            <h2 className="linkedin-heading-2">Security & Privacy</h2>
            <p className="linkedin-text">This section is integrated with Accessibility Settings for now.</p>
            <button
              onClick={() => setActiveSection('accessibility')}
              className="linkedin-btn linkedin-btn-primary mt-4"
            >
              Go to Security Settings
            </button>
          </div>
        );
      default:
        return (
          <div className="linkedin-card-body">
            <button
              onClick={() => setActiveSection('overview')}
              className="linkedin-btn linkedin-btn-ghost mb-4"
            >
              ← Back to Settings
            </button>
            <h2 className="linkedin-heading-2">Coming Soon</h2>
            <p className="linkedin-text">This settings section is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className={`linkedin-theme ${className}`}>
      <div className="linkedin-card max-w-6xl mx-auto">
        <div className="linkedin-card-header">
          <div className="linkedin-flex">
            <Settings className="h-6 w-6 text-linkedin-blue" />
            <h1 className="linkedin-heading-2">Settings</h1>
          </div>
          {onClose && (
            <button onClick={onClose} className="linkedin-btn linkedin-btn-ghost">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {renderSection()}
      </div>
    </div>
  );
}