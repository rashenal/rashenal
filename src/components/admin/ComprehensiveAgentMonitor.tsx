import React, { useState, useEffect } from 'react';
import {
  Bot,
  Activity,
  Zap,
  MessageSquare,
  Database,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Square,
  RefreshCcw,
  Eye,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Search,
  Calendar,
  Mail,
  Target,
  Trophy,
  Settings
} from 'lucide-react';

interface AgentMetrics {
  id: string;
  name: string;
  type: 'job-finder' | 'task-extractor' | 'habit-tracker' | 'goal-analyzer';
  status: 'active' | 'paused' | 'error' | 'maintenance';
  integration: string;
  user?: string;
  performance: {
    totalProcessed: number;
    successRate: number;
    avgResponseTime: number;
    tokensUsed: number;
    cost: number;
    lastProcessed: string;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    apiCalls: number;
    errorRate: number;
  };
  realTimeStats: {
    activeConnections: number;
    queueDepth: number;
    throughput: number;
  };
}

interface TokenUsage {
  timestamp: string;
  agentId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  model: string;
}

interface MessageExchange {
  id: string;
  timestamp: string;
  agentId: string;
  type: 'inbound' | 'outbound';
  source: string;
  content: string;
  tokens: number;
  processingTime: number;
  confidence?: number;
  result?: 'success' | 'error' | 'filtered';
}

export default function ComprehensiveAgentMonitor() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterText, setFilterText] = useState('');

  // Mock data - replace with real agent monitoring
  const [agents, setAgents] = useState<AgentMetrics[]>([
    {
      id: 'job-finder-001',
      name: 'Job Finder - Outlook',
      type: 'job-finder',
      status: 'active',
      integration: 'outlook',
      user: 'rharveybis@hotmail.com',
      performance: {
        totalProcessed: 1247,
        successRate: 94.2,
        avgResponseTime: 2.3,
        tokensUsed: 125400,
        cost: 15.67,
        lastProcessed: '2 minutes ago'
      },
      resources: {
        cpuUsage: 12,
        memoryUsage: 45,
        apiCalls: 342,
        errorRate: 1.2
      },
      realTimeStats: {
        activeConnections: 3,
        queueDepth: 7,
        throughput: 15.2
      }
    },
    {
      id: 'task-extractor-001',
      name: 'Task Extractor - Gmail',
      type: 'task-extractor',
      status: 'paused',
      integration: 'gmail',
      user: 'user@company.com',
      performance: {
        totalProcessed: 892,
        successRate: 89.1,
        avgResponseTime: 1.8,
        tokensUsed: 89200,
        cost: 11.24,
        lastProcessed: '15 minutes ago'
      },
      resources: {
        cpuUsage: 0,
        memoryUsage: 8,
        apiCalls: 0,
        errorRate: 0
      },
      realTimeStats: {
        activeConnections: 0,
        queueDepth: 0,
        throughput: 0
      }
    },
    {
      id: 'habit-tracker-001',
      name: 'Habit Tracker - Universal',
      type: 'habit-tracker',
      status: 'active',
      integration: 'system',
      performance: {
        totalProcessed: 2341,
        successRate: 97.8,
        avgResponseTime: 0.8,
        tokensUsed: 45600,
        cost: 5.67,
        lastProcessed: '30 seconds ago'
      },
      resources: {
        cpuUsage: 8,
        memoryUsage: 22,
        apiCalls: 156,
        errorRate: 0.3
      },
      realTimeStats: {
        activeConnections: 5,
        queueDepth: 2,
        throughput: 28.4
      }
    }
  ]);

  const [messageExchanges, setMessageExchanges] = useState<MessageExchange[]>([
    {
      id: 'msg-001',
      timestamp: '2025-01-09T20:45:00Z',
      agentId: 'job-finder-001',
      type: 'inbound',
      source: 'outlook:inbox',
      content: 'Senior Software Engineer Position - Tech Corp',
      tokens: 245,
      processingTime: 2100,
      confidence: 94,
      result: 'success'
    },
    {
      id: 'msg-002',
      timestamp: '2025-01-09T20:44:30Z',
      agentId: 'job-finder-001',
      type: 'outbound',
      source: 'claude-api',
      content: 'Task created: Apply to Senior SE at Tech Corp',
      tokens: 156,
      processingTime: 800,
      result: 'success'
    }
  ]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setAgents(prev => prev.map(agent => ({
          ...agent,
          resources: {
            ...agent.resources,
            cpuUsage: Math.max(0, agent.resources.cpuUsage + (Math.random() - 0.5) * 5),
            apiCalls: agent.status === 'active' ? agent.resources.apiCalls + Math.floor(Math.random() * 3) : agent.resources.apiCalls
          }
        })));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Square className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'paused':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'job-finder':
        return <Target className="h-5 w-5 text-blue-600" />;
      case 'task-extractor':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'habit-tracker':
        return <Trophy className="h-5 w-5 text-purple-600" />;
      case 'goal-analyzer':
        return <TrendingUp className="h-5 w-5 text-orange-600" />;
      default:
        return <Bot className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(filterText.toLowerCase()) ||
    agent.type.toLowerCase().includes(filterText.toLowerCase()) ||
    agent.integration.toLowerCase().includes(filterText.toLowerCase())
  );

  const totalTokensUsed = agents.reduce((sum, agent) => sum + agent.performance.tokensUsed, 0);
  const totalCost = agents.reduce((sum, agent) => sum + agent.performance.cost, 0);
  const avgSuccessRate = agents.reduce((sum, agent) => sum + agent.performance.successRate, 0) / agents.length;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'agents', name: 'Agents', icon: Bot },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'tokens', name: 'Token Usage', icon: Zap },
    { id: 'performance', name: 'Performance', icon: Activity }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Bot className="h-6 w-6 text-purple-600 mr-3" />
              AI Agent Monitoring Center
            </h2>
            <p className="text-gray-600 mt-1">
              Comprehensive monitoring of AI agents, message exchanges, and token usage
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{agents.filter(a => a.status === 'active').length} Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{agents.filter(a => a.status === 'paused').length} Paused</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>{agents.filter(a => a.status === 'error').length} Error</span>
              </div>
            </div>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Auto-refresh</span>
            </label>
            
            <button
              onClick={() => {/* Manual refresh */}}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{agents.length}</div>
            <div className="text-sm text-blue-700">Total Agents</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{totalTokensUsed.toLocaleString()}</div>
            <div className="text-sm text-green-700">Tokens Used</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">${totalCost.toFixed(2)}</div>
            <div className="text-sm text-purple-700">Total Cost</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{avgSuccessRate.toFixed(1)}%</div>
            <div className="text-sm text-orange-700">Avg Success Rate</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Agent Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-4 rounded-lg border ${getStatusColor(agent.status)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getAgentIcon(agent.type)}
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    {getStatusIcon(agent.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium">{agent.performance.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processed:</span>
                      <span className="font-medium">{agent.performance.totalProcessed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Queue:</span>
                      <span className="font-medium">{agent.realTimeStats.queueDepth}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter agents..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Detailed Agent Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resources
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getAgentIcon(agent.type)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                            <div className="text-sm text-gray-500">{agent.integration}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                          {getStatusIcon(agent.status)}
                          <span className="ml-1 capitalize">{agent.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{agent.performance.successRate}% success</div>
                        <div className="text-gray-500">{agent.performance.avgResponseTime}s avg</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>CPU: {agent.resources.cpuUsage}%</div>
                        <div className="text-gray-500">API: {agent.resources.apiCalls}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedAgent(agent.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Real-time message exchanges between agents and external systems
            </div>
            
            <div className="space-y-3">
              {messageExchanges.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border ${
                    message.type === 'inbound' 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-sm">
                        {message.type === 'inbound' ? 'Received' : 'Sent'} - {message.source}
                      </span>
                      {message.result === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-800 mb-2">{message.content}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>Tokens: {message.tokens}</span>
                    <span>Processing: {message.processingTime}ms</span>
                    {message.confidence && <span>Confidence: {message.confidence}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Usage Analytics</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{totalTokensUsed.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Tokens Used</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">${totalCost.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total API Cost</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ${(totalCost / totalTokensUsed * 1000).toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600">Cost per 1K tokens</div>
                </div>
              </div>
            </div>

            {/* Token usage breakdown by agent */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Usage by Agent</h4>
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getAgentIcon(agent.type)}
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{agent.performance.tokensUsed.toLocaleString()} tokens</span>
                    <span className="text-green-600">${agent.performance.cost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">
                🚧 Performance analytics charts and detailed metrics will be implemented here with real-time data visualization
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}