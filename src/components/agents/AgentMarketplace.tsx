import React, { useState, useEffect } from 'react';
import {
  Bot,
  TrendingUp,
  Users,
  BarChart3,
  MessageSquare,
  Shield,
  CreditCard,
  Settings,
  Play,
  Pause,
  Calendar,
  DollarSign,
  Star,
  Clock,
  Activity,
  Eye,
  Download,
  Zap
} from 'lucide-react';
import { agentAPIService, AgentPersona, AgentSubscription, AgentExecutionResult } from '../../services/AgentAPIService';
import { useUser } from '../../contexts/userContext';

const AgentMarketplace: React.FC = () => {
  const { user } = useUser();
  const [agents, setAgents] = useState<AgentPersona[]>([]);
  const [subscriptions, setSubscriptions] = useState<AgentSubscription[]>([]);
  const [executions, setExecutions] = useState<AgentExecutionResult[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentPersona | null>(null);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-agents' | 'executions'>('marketplace');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    try {
      const availableAgents = await agentAPIService.getAvailableAgents();
      setAgents(availableAgents);
      
      if (user) {
        const executionHistory = await agentAPIService.getExecutionHistory(user.id);
        setExecutions(executionHistory);
      }
    } catch (error) {
      console.error('Failed to load agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (agentId: string, tier: string) => {
    if (!user) return;

    try {
      const subscription = await agentAPIService.subscribeToAgent(user.id, agentId, tier);
      setSubscriptions(prev => [...prev, subscription]);
      
      // Show success message
      alert(`Successfully subscribed to ${agents.find(a => a.id === agentId)?.name}!`);
    } catch (error) {
      console.error('Subscription failed:', error);
      alert('Subscription failed. Please try again.');
    }
  };

  const handleExecuteAgent = async (agentId: string, parameters: any = {}) => {
    if (!user) return;

    try {
      const execution = await agentAPIService.executeAgent(user.id, {
        agentId,
        task: 'Manual execution from marketplace',
        parameters,
        priority: 'normal'
      });
      
      setExecutions(prev => [execution, ...prev]);
      alert(`Agent execution started! ID: ${execution.id}`);
    } catch (error) {
      console.error('Execution failed:', error);
      alert(`Execution failed: ${error}`);
    }
  };

  const getAgentIcon = (agentId: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      'marketing-director': TrendingUp,
      'ai-tech-expert': Bot,
      'business-intelligence': BarChart3,
      'social-media-manager': Users,
      'customer-support-agent': MessageSquare
    };
    
    return icons[agentId] || Bot;
  };

  const getTierColor = (tier: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-yellow-100 text-yellow-800'
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'text-yellow-600',
      running: 'text-blue-600',
      completed: 'text-green-600',
      failed: 'text-red-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">aisista.ai Agent Marketplace</h1>
                <p className="text-sm text-gray-600">AI-powered automation personas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'marketplace', name: 'Browse Agents', icon: Bot },
              { id: 'my-agents', name: 'My Subscriptions', icon: Star },
              { id: 'executions', name: 'Execution History', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Agent Marketplace */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent List */}
              <div className="lg:col-span-2 space-y-4">
                {agents.map((agent) => {
                  const Icon = getAgentIcon(agent.id);
                  return (
                    <div
                      key={agent.id}
                      className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-purple-100 rounded-lg">
                            <Icon className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(agent.pricing.tier)}`}>
                                {agent.pricing.tier.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-600 mt-1">{agent.description}</p>
                            
                            <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {agent.usageStats.avgExecutionTime / 1000}s avg
                              </span>
                              <span className="flex items-center">
                                <Activity className="h-4 w-4 mr-1" />
                                {agent.usageStats.successRate}% success
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {agent.pricing.monthlyPrice === 0 ? 'Free' : `$${agent.pricing.monthlyPrice}/mo`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {agent.pricing.requestsPerMonth} requests/month
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubscribe(agent.id, agent.pricing.tier);
                            }}
                            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            Subscribe
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Agent Details Sidebar */}
              <div className="lg:col-span-1">
                {selectedAgent ? (
                  <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                    <div className="flex items-center space-x-3 mb-4">
                      {React.createElement(getAgentIcon(selectedAgent.id), {
                        className: "h-8 w-8 text-purple-600"
                      })}
                      <h3 className="text-xl font-bold text-gray-900">{selectedAgent.name}</h3>
                    </div>
                    
                    <p className="text-gray-600 mb-6">{selectedAgent.description}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Capabilities</h4>
                        <ul className="space-y-1">
                          {selectedAgent.capabilities.map((capability, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {capability}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                        <ul className="space-y-1">
                          {selectedAgent.pricing.features.map((feature, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">✓</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium">Try it now:</span>
                        </div>
                        <button
                          onClick={() => handleExecuteAgent(selectedAgent.id)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Execute Agent
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-gray-500">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Select an agent to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Subscriptions */}
        {activeTab === 'my-agents' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Agent Subscriptions</h2>
            
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subscriptions yet</h3>
                <p className="text-gray-600 mb-6">Subscribe to agents from the marketplace to get started</p>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Browse Agents
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions.map((subscription) => {
                  const agent = agents.find(a => a.id === subscription.agentId);
                  if (!agent) return null;
                  
                  const Icon = getAgentIcon(agent.id);
                  return (
                    <div key={`${subscription.userId}-${subscription.agentId}`} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Icon className="h-6 w-6 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                            {subscription.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Usage:</span>
                          <span>{subscription.usageThisMonth}/{agent.pricing.requestsPerMonth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Next billing:</span>
                          <span>{subscription.nextBillingDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleExecuteAgent(agent.id)}
                          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          Execute
                        </button>
                        <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Execution History */}
        {activeTab === 'executions' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Agent Execution History</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {executions.map((execution) => {
                    const agent = agents.find(a => a.id === execution.agentId);
                    const duration = execution.endTime 
                      ? Math.round((execution.endTime.getTime() - execution.startTime.getTime()) / 1000)
                      : null;
                    
                    return (
                      <tr key={execution.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {agent && React.createElement(getAgentIcon(agent.id), {
                              className: "h-5 w-5 text-purple-600 mr-2"
                            })}
                            <span className="text-sm font-medium text-gray-900">
                              {agent?.name || execution.agentId}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getStatusColor(execution.status)}`}>
                            {execution.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {execution.startTime.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {duration ? `${duration}s` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${execution.billingInfo.cost.toFixed(3)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-purple-600 hover:text-purple-900 mr-3">
                            <Eye className="h-4 w-4" />
                          </button>
                          {execution.result?.screenshots && (
                            <button className="text-green-600 hover:text-green-900">
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentMarketplace;