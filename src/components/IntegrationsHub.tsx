import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Link,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  RefreshCcw,
  Bot,
  Zap,
  MessageSquare,
  Database,
  Globe,
  Calendar
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  type: 'email' | 'calendar' | 'storage' | 'communication' | 'api';
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  icon: React.ReactNode;
  description: string;
  connectedAccount?: string;
  lastSync?: string;
  agentThreads?: AgentThread[];
}

interface AgentThread {
  id: string;
  name: string;
  type: 'job-finder' | 'task-extractor' | 'habit-tracker' | 'goal-analyzer';
  status: 'active' | 'paused' | 'error';
  description: string;
  config: {
    startDate?: string;
    pollingFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    filters: Record<string, any>;
  };
  stats: {
    processed: number;
    found: number;
    errors: number;
  };
}

export default function IntegrationsHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  // Mock data - replace with real integration status
  const integrations: Integration[] = [
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      type: 'email',
      status: 'connected',
      icon: <Mail className="h-6 w-6 text-blue-600" />,
      description: 'Access emails for job discovery and task extraction',
      connectedAccount: 'rharveybis@hotmail.com',
      lastSync: '2 minutes ago',
      agentThreads: [
        {
          id: 'job-finder-outlook',
          name: 'Job Finder - Outlook',
          type: 'job-finder',
          status: 'active',
          description: 'Analyzes emails for job opportunities and creates tasks',
          config: {
            startDate: '2025-01-01',
            pollingFrequency: 'hourly',
            filters: {
              folders: ['Inbox', 'Jobs'],
              keywords: ['job', 'opportunity', 'position', 'hiring'],
              excludeKeywords: ['spam', 'newsletter']
            }
          },
          stats: {
            processed: 1247,
            found: 23,
            errors: 2
          }
        }
      ]
    },
    {
      id: 'gmail',
      name: 'Gmail',
      type: 'email',
      status: 'disconnected',
      icon: <Mail className="h-6 w-6 text-red-600" />,
      description: 'Connect Gmail for additional email processing',
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      type: 'calendar',
      status: 'disconnected',
      icon: <Calendar className="h-6 w-6 text-green-600" />,
      description: 'Sync calendar events and create time-based tasks',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      type: 'api',
      status: 'configuring',
      icon: <Link className="h-6 w-6 text-blue-700" />,
      description: 'Job discovery and professional networking integration',
    }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Globe },
    { id: 'email', name: 'Email Integration', icon: Mail },
    { id: 'agents', name: 'AI Agents', icon: Bot },
    { id: 'settings', name: 'Configuration', icon: Settings }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'configuring':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'configuring':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleConnect = (integrationId: string) => {
    // Implementation for connecting integration
    console.log('Connecting to:', integrationId);
  };

  const handleConfigureAgent = (integrationId: string, agentId?: string) => {
    // Navigate to email agent configuration page
    navigate(`/integrations/email-agent/${integrationId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Integrations Hub</h1>
                <p className="text-sm text-gray-600">Connect and manage external services</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <RefreshCcw className="h-4 w-4" />
                <span>Sync All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Connected Services</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {integrations.map((integration) => (
                      <div
                        key={integration.id}
                        className={`p-6 rounded-lg border ${getStatusColor(integration.status)}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {integration.icon}
                            <div>
                              <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                              <p className="text-sm text-gray-600">{integration.description}</p>
                            </div>
                          </div>
                          {getStatusIcon(integration.status)}
                        </div>

                        {integration.connectedAccount && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700">
                              Connected as: {integration.connectedAccount}
                            </p>
                            {integration.lastSync && (
                              <p className="text-xs text-gray-500">
                                Last sync: {integration.lastSync}
                              </p>
                            )}
                          </div>
                        )}

                        {integration.agentThreads && integration.agentThreads.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Active AI Agents: {integration.agentThreads.filter(a => a.status === 'active').length}
                            </p>
                            {integration.agentThreads.map((agent) => (
                              <div key={agent.id} className="flex items-center justify-between text-xs bg-white/50 rounded p-2">
                                <span>{agent.name}</span>
                                <div className="flex items-center space-x-2">
                                  {agent.status === 'active' && <Play className="h-3 w-3 text-green-600" />}
                                  {agent.status === 'paused' && <Pause className="h-3 w-3 text-yellow-600" />}
                                  {agent.status === 'error' && <AlertCircle className="h-3 w-3 text-red-600" />}
                                  <span className="font-medium">{agent.stats.found}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {integration.status === 'connected' ? (
                            <>
                              <button
                                onClick={() => handleConfigureAgent(integration.id)}
                                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-white text-gray-700 rounded-md border hover:bg-gray-50 transition-colors"
                              >
                                <Settings className="h-4 w-4" />
                                <span>Configure</span>
                              </button>
                              {integration.agentThreads && integration.agentThreads.length > 0 && (
                                <button className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                                  <Bot className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() => handleConnect(integration.id)}
                              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                              <Link className="h-4 w-4" />
                              <span>Connect</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Email Integration Setup</h2>
                <p className="text-gray-600 mb-4">
                  Connect your email accounts to enable AI-powered analysis and task extraction.
                </p>
                
                {/* Email integration setup will go here */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    🚧 Email Integration setup UI will be implemented here
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'agents' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">AI Agent Configuration</h2>
                <p className="text-gray-600 mb-4">
                  Configure and monitor your AI analysis threads.
                </p>
                
                {/* Agent configuration will go here */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800">
                    🚧 AI Agent configuration panel will be implemented here
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Integration Settings</h2>
                <p className="text-gray-600 mb-4">
                  Global settings for integrations and AI agents.
                </p>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    🚧 Integration settings panel will be implemented here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}