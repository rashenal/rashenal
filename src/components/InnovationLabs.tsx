import React, { useState } from 'react';
import {
  Lightbulb,
  Beaker,
  Zap,
  Target,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  MessageSquare,
  Puzzle,
  Play,
  Settings,
  Shield,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  description: string;
  category: 'wellness' | 'productivity' | 'ai' | 'integration' | 'analytics';
  status: 'development' | 'testing' | 'ready' | 'deployed';
  version: string;
  author: string;
  icon: React.ComponentType<any>;
  features: string[];
}

export default function InnovationLabs() {
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [activeTab, setActiveTab] = useState<'plugins' | 'experiments' | 'analytics'>('plugins');

  // Upcoming plugin ideas based on your vision
  const pluginQueue: Plugin[] = [
    {
      id: 'esg-score',
      name: 'ESG Score Tracker',
      description: 'Personal or company ESG (Environmental, Social, Governance) scoring system with actionable insights.',
      category: 'analytics',
      status: 'development',
      version: '0.1.0',
      author: 'aisista.ai',
      icon: Target,
      features: [
        'Personal carbon footprint tracking',
        'Social impact measurement',
        'Governance habit scoring',
        'Company ESG benchmarking',
        'Improvement recommendations'
      ]
    },
    {
      id: 'start-with-this',
      name: 'Start With This',
      description: 'AI-powered holistic view across all projects and tasks to recommend optimal daily starting point.',
      category: 'productivity',
      status: 'testing',
      version: '0.2.0',
      author: 'aisista.ai',
      icon: Play,
      features: [
        'Cross-project analysis',
        'Energy level optimization',
        'Deadline prioritization',
        'Context switching minimization',
        'Progress momentum tracking'
      ]
    },
    {
      id: 'dependency-map',
      name: 'DependencyMap',
      description: 'Visual dependency mapping for tasks, goals, and life areas with automatic bottleneck detection.',
      category: 'productivity',
      status: 'development',
      version: '0.1.0',
      author: 'aisista.ai',
      icon: Puzzle,
      features: [
        'Visual dependency graphs',
        'Critical path analysis',
        'Bottleneck identification',
        'Risk assessment',
        'Parallel task suggestions'
      ]
    },
    {
      id: 'voice-agents',
      name: 'Voice Agent Playground',
      description: 'Experiment with different AI voice personalities and conversation styles for various use cases.',
      category: 'ai',
      status: 'development',
      version: '0.1.0',
      author: 'aisista.ai',
      icon: MessageSquare,
      features: [
        'Multiple voice personalities',
        'Custom conversation styles',
        'Voice command training',
        'Emotion detection',
        'Contextual responses'
      ]
    },
    {
      id: 'text-condenser',
      name: 'Smart Text Condenser',
      description: 'AI-powered text analysis that condenses long discussions into cost-effective, accurate, accelerated responses.',
      category: 'ai',
      status: 'ready',
      version: '1.0.0',
      author: 'aisista.ai',
      icon: Zap,
      features: [
        'Intelligent text summarization',
        'Key insight extraction',
        'Action item identification',
        'Cost optimization',
        'Multi-format input support'
      ]
    },
    {
      id: 'motivation-engine',
      name: 'Motivation Plugin',
      description: 'Contextual motivation and encouragement system that replaces generic welcome messages.',
      category: 'wellness',
      status: 'deployed',
      version: '1.2.0',
      author: 'aisista.ai',
      icon: TrendingUp,
      features: [
        'Contextual greetings',
        'Progress celebration',
        'Streak motivation',
        'Personalized encouragement',
        'Goal visualization'
      ]
    }
  ];

  const getStatusColor = (status: Plugin['status']) => {
    switch (status) {
      case 'development': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'testing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      case 'deployed': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: Plugin['status']) => {
    switch (status) {
      case 'development': return <Beaker className="h-4 w-4" />;
      case 'testing': return <Eye className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'deployed': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Lightbulb className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Innovation Labs
              </h1>
              <p className="text-gray-600">Experimental features and plugin development for aisista.ai</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Experimental Zone</span>
            </div>
            <p className="text-yellow-700 text-sm">
              Features in this area are under active development. Test thoroughly before deploying to production.
              All plugins will integrate seamlessly with the new navigation system and voice commands.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-xl p-1 shadow-sm border">
          {[
            { id: 'plugins', label: 'Plugin Queue', icon: Puzzle },
            { id: 'experiments', label: 'Active Experiments', icon: Beaker },
            { id: 'analytics', label: 'Lab Analytics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Plugin Queue Tab */}
        {activeTab === 'plugins' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Plugin List */}
            <div className="lg:col-span-2">
              <div className="grid gap-4">
                {pluginQueue.map((plugin) => {
                  const Icon = plugin.icon;
                  return (
                    <div
                      key={plugin.id}
                      onClick={() => setSelectedPlugin(plugin)}
                      className={`bg-white rounded-xl border p-6 cursor-pointer transition-all hover:shadow-md ${
                        selectedPlugin?.id === plugin.id ? 'ring-2 ring-yellow-500 border-yellow-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <Icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{plugin.name}</h3>
                            <p className="text-sm text-gray-500">v{plugin.version} by {plugin.author}</p>
                          </div>
                        </div>
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(plugin.status)}`}>
                          {getStatusIcon(plugin.status)}
                          <span>{plugin.status}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{plugin.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className={'px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium'}>
                          {plugin.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {plugin.features.length} features
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plugin Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {selectedPlugin ? (
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <selectedPlugin.icon className="h-8 w-8 text-gray-600" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedPlugin.name}</h3>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium mt-1 ${getStatusColor(selectedPlugin.status)}`}>
                        {getStatusIcon(selectedPlugin.status)}
                        <span>{selectedPlugin.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6">{selectedPlugin.description}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                      <ul className="space-y-2">
                        {selectedPlugin.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Version:</span>
                        <span className="font-medium">v{selectedPlugin.version}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium">{selectedPlugin.category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Author:</span>
                        <span className="font-medium">{selectedPlugin.author}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 space-y-2">
                      {selectedPlugin.status === 'ready' && (
                        <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all font-medium">
                          Deploy Plugin
                        </button>
                      )}
                      {selectedPlugin.status === 'testing' && (
                        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all font-medium">
                          Run Tests
                        </button>
                      )}
                      <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-all font-medium">
                        View Code
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a plugin to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Experiments Tab */}
        {activeTab === 'experiments' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Beaker className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Active Experiments</h3>
            <p className="text-gray-600 mb-6">No active experiments running. Start a new experiment to test plugin integrations.</p>
            <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-medium">
              Start New Experiment
            </button>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Puzzle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Plugins in Queue</h3>
                  <p className="text-2xl font-bold text-blue-600">{pluginQueue.length}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Total plugins awaiting development</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ready to Deploy</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {pluginQueue.filter(p => p.status === 'ready').length}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Plugins ready for production</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Deployed</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {pluginQueue.filter(p => p.status === 'deployed').length}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">Active plugins in production</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}