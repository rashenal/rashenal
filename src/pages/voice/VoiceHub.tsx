import React, { useState, useEffect } from 'react';
import { Plus, Mic, Settings, BarChart3, Smartphone, 
         Globe, Watch, Play, Pause, Edit, Trash2, Copy } from 'lucide-react';
import VoiceAgentBuilder from '../../components/voice/VoiceAgentBuilder';
import { VoiceAgentConfig } from '../../services/voice/VoiceService';
import { useAuth } from '../../contexts/userContext';
import { supabase } from '../../lib/supabase';

interface VoiceAgent {
  id: string;
  name: string;
  description: string;
  config: VoiceAgentConfig;
  platforms: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface VoiceUsageStats {
  totalSyntheses: number;
  totalTranscriptions: number;
  thisWeekUsage: number;
  creditsUsed: number;
}

export default function VoiceHub() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingAgent, setEditingAgent] = useState<VoiceAgent | null>(null);
  const [usageStats, setUsageStats] = useState<VoiceUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'agents' | 'analytics' | 'settings'>('agents');

  useEffect(() => {
    if (user) {
      loadVoiceAgents();
      loadUsageStats();
    }
  }, [user]);

  const loadVoiceAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_agents')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error loading voice agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_usage_logs')
        .select('action, timestamp, cost_credits')
        .eq('user_id', user?.id)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        totalSyntheses: data?.filter(log => log.action === 'synthesize').length || 0,
        totalTranscriptions: data?.filter(log => log.action === 'transcribe').length || 0,
        thisWeekUsage: data?.filter(log => 
          new Date(log.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length || 0,
        creditsUsed: data?.reduce((sum, log) => sum + (log.cost_credits || 0), 0) || 0
      };

      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const handleAgentCreated = async (config: VoiceAgentConfig) => {
    try {
      const agentData = {
        user_id: user?.id,
        name: config.name,
        description: `${config.voiceProfile.style} voice agent`,
        config: config,
        platforms: Object.keys(config.integrations).filter(key => 
          config.integrations[key as keyof typeof config.integrations]
        )
      };

      const { data, error } = await supabase
        .from('voice_agents')
        .insert([agentData])
        .select()
        .single();

      if (error) throw error;

      setAgents(prev => [data, ...prev]);
      setShowBuilder(false);
      setEditingAgent(null);
    } catch (error) {
      console.error('Error saving voice agent:', error);
      alert('Failed to save voice agent. Please try again.');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this voice agent?')) return;

    try {
      const { error } = await supabase
        .from('voice_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      setAgents(prev => prev.filter(agent => agent.id !== agentId));
    } catch (error) {
      console.error('Error deleting voice agent:', error);
      alert('Failed to delete voice agent. Please try again.');
    }
  };

  const handleToggleAgent = async (agentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('voice_agents')
        .update({ is_active: !isActive })
        .eq('id', agentId);

      if (error) throw error;

      setAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, is_active: !isActive } : agent
      ));
    } catch (error) {
      console.error('Error toggling voice agent:', error);
    }
  };

  const duplicateAgent = async (agent: VoiceAgent) => {
    try {
      const newAgentData = {
        user_id: user?.id,
        name: `${agent.name} (Copy)`,
        description: agent.description,
        config: agent.config,
        platforms: agent.platforms
      };

      const { data, error } = await supabase
        .from('voice_agents')
        .insert([newAgentData])
        .select()
        .single();

      if (error) throw error;

      setAgents(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error duplicating voice agent:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return <Smartphone className="w-4 h-4" />;
      case 'web':
        return <Globe className="w-4 h-4" />;
      case 'watch':
      case 'apple watch':
        return <Watch className="w-4 h-4" />;
      default:
        return <Mic className="w-4 h-4" />;
    }
  };

  if (showBuilder) {
    return (
      <VoiceAgentBuilder
        onAgentCreated={handleAgentCreated}
        initialConfig={editingAgent?.config}
        mode={editingAgent ? 'edit' : 'create'}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🎤 Voice Agent Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create and manage your AI voice agents across platforms
            </p>
          </div>
          
          <button
            onClick={() => setShowBuilder(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                     text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Agent</span>
          </button>
        </div>
        
        {/* Quick Stats */}
        {usageStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">Active Agents</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {agents.filter(a => a.is_active).length}
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-green-600 dark:text-green-400 text-sm font-medium">This Week</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {usageStats.thisWeekUsage} uses
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-purple-600 dark:text-purple-400 text-sm font-medium">Voice Syntheses</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {usageStats.totalSyntheses}
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="text-orange-600 dark:text-orange-400 text-sm font-medium">Credits Used</div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {usageStats.creditsUsed.toFixed(1)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'agents', label: 'Voice Agents', icon: Mic },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'agents' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Loading voice agents...</p>
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-12">
                  <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No voice agents yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create your first AI voice agent to get started with voice interactions.
                  </p>
                  <button
                    onClick={() => setShowBuilder(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                             text-white rounded-lg font-medium mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Agent</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agents.map(agent => (
                    <div key={agent.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {agent.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {agent.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            agent.is_active ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>
                      </div>
                      
                      {/* Platforms */}
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Platforms:</span>
                        {agent.platforms.map((platform, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            {getPlatformIcon(platform)}
                            <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">
                              {platform}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Voice Profile */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Voice Profile</div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Style:</span>
                            <span className="font-medium capitalize">{agent.config.voiceProfile.style}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Pace:</span>
                            <span className="font-medium capitalize">{agent.config.voiceProfile.pace}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleAgent(agent.id, agent.is_active)}
                            className={`p-2 rounded-lg ${
                              agent.is_active
                                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                            title={agent.is_active ? 'Pause Agent' : 'Activate Agent'}
                          >
                            {agent.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => {
                              setEditingAgent(agent);
                              setShowBuilder(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Edit Agent"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => duplicateAgent(agent)}
                            className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                            title="Duplicate Agent"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Delete Agent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Voice Usage Analytics
              </h3>
              
              {usageStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Usage Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Syntheses:</span>
                        <span className="font-medium">{usageStats.totalSyntheses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Transcriptions:</span>
                        <span className="font-medium">{usageStats.totalTranscriptions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">This Week Usage:</span>
                        <span className="font-medium">{usageStats.thisWeekUsage}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Credits Used:</span>
                        <span className="font-medium">{usageStats.creditsUsed.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Platform Distribution</h4>
                    <div className="space-y-3">
                      {['whatsapp', 'web', 'watch'].map(platform => {
                        const agentCount = agents.filter(a => 
                          a.platforms.includes(platform) && a.is_active
                        ).length;
                        return (
                          <div key={platform} className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              {getPlatformIcon(platform)}
                              <span className="text-gray-600 dark:text-gray-300 capitalize">{platform}:</span>
                            </div>
                            <span className="font-medium">{agentCount} active</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No usage data available yet. Start using your voice agents to see analytics!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Voice Integration Settings
              </h3>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    Settings Coming Soon
                  </span>
                </div>
                <p className="text-yellow-700 dark:text-yellow-300 mt-2">
                  Voice integration settings panel is in development. This will include:
                </p>
                <ul className="text-yellow-700 dark:text-yellow-300 mt-2 ml-4 space-y-1">
                  <li>• WhatsApp phone number configuration</li>
                  <li>• Voice synthesis quality settings</li>
                  <li>• Usage limits and billing preferences</li>
                  <li>• Platform-specific configurations</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
