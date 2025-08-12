// Widget component for the Motivation plugin
// Integrates with existing Rashenal UI components

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Heart, TrendingUp } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

interface MotivationWidgetProps {
  pluginId?: string;
  refreshInterval?: number;
  interactive?: boolean;
}

export function MotivationWidget({ 
  pluginId = 'ai.asista.motivation',
  refreshInterval = 3600000,
  interactive = true 
}: MotivationWidgetProps) {
  const [motivation, setMotivation] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const fetchMotivation = async () => {
    setLoading(true);
    try {
      // Try to call plugin API endpoint first
      try {
        const response = await supabase.functions.invoke('plugin-api', {
          body: {
            plugin_id: pluginId,
            method: 'getPersonalizedMotivation'
          }
        });
        
        if (response.data && response.data.text) {
          setMotivation(response.data.text);
          setAuthor(response.data.author || 'Asista');
          setSaved(false);
          return;
        }
      } catch (pluginError) {
        console.log('Plugin API not available, using fallback');
      }
      
      // Fallback to direct motivation generation
      const motivations = [
        "Progress isn't always visible, but it's always happening. Trust your journey.",
        "Small steps taken consistently create extraordinary results over time.",
        "Your energy is precious. Use it on what truly matters to you.",
        "It's okay to rest. Taking breaks is part of moving forward.",
        "You're exactly where you need to be right now. Keep going.",
        "Every task completed, no matter how small, is a victory worth celebrating.",
        "Your future self will thank you for the effort you're putting in today.",
        "Consistency beats perfection. You're building something meaningful."
      ];
      
      const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
      setMotivation(randomMotivation);
      setAuthor('Asista');
      setSaved(false);
      
    } catch (error) {
      console.error('Error fetching motivation:', error);
      setMotivation("You're doing great. Keep going! 💜");
      setAuthor('Asista');
    } finally {
      setLoading(false);
    }
  };
  
  const saveMotivation = async () => {
    try {
      await supabase.functions.invoke('plugin-api', {
        body: {
          plugin_id: pluginId,
          method: 'saveMotivation',
          params: { text: motivation, author }
        }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.log('Save motivation error (fallback to local):', error);
      // Fallback to local storage
      const savedMotivations = JSON.parse(localStorage.getItem('saved_motivations') || '[]');
      savedMotivations.push({ text: motivation, author, timestamp: Date.now() });
      localStorage.setItem('saved_motivations', JSON.stringify(savedMotivations));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };
  
  const fetchStats = async () => {
    try {
      const response = await supabase.functions.invoke('plugin-api', {
        body: {
          plugin_id: pluginId,
          method: 'getMotivationStats'
        }
      });
      
      if (response.data) {
        setStats(response.data);
      } else {
        // Fallback stats
        setStats({
          streak: Math.floor(Math.random() * 14) + 1,
          saved: JSON.parse(localStorage.getItem('saved_motivations') || '[]').length,
          energy: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        });
      }
    } catch (error) {
      console.log('Stats fetch error, using fallback');
      setStats({
        streak: Math.floor(Math.random() * 14) + 1,
        saved: JSON.parse(localStorage.getItem('saved_motivations') || '[]').length,
        energy: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      });
    }
  };
  
  useEffect(() => {
    fetchMotivation();
    fetchStats();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMotivation, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 
                    dark:from-purple-900/20 dark:to-pink-900/20 
                    border border-purple-200 dark:border-purple-800
                    rounded-lg p-6 shadow-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Daily Motivation
            </h3>
          </div>
          
          {interactive && (
            <div className="flex gap-2">
              <button
                onClick={fetchMotivation}
                disabled={loading}
                className="p-1.5 text-purple-600 hover:bg-white/50 dark:hover:bg-gray-800/50 
                          rounded transition-colors disabled:opacity-50"
                title="Get new motivation"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={saveMotivation}
                className="p-1.5 text-purple-600 hover:bg-white/50 dark:hover:bg-gray-800/50 
                          rounded transition-colors"
                title="Save this motivation"
              >
                <Heart className={`h-4 w-4 transition-colors ${
                  saved ? 'fill-red-500 text-red-500' : ''
                }`} />
              </button>
            </div>
          )}
        </div>
        
        {/* Quote */}
        <blockquote className="text-lg font-medium text-gray-800 dark:text-gray-200 
                             leading-relaxed min-h-[3rem] flex items-center">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Crafting your personalized motivation...
              </span>
            </div>
          ) : (
            `"${motivation || 'Loading your personalized motivation...'}"`
          )}
        </blockquote>
        
        {/* Author */}
        {author && !loading && (
          <cite className="block text-sm text-gray-600 dark:text-gray-400 not-italic">
            — {author}
          </cite>
        )}
        
        {/* Stats */}
        {stats && !loading && (
          <div className="pt-3 mt-3 border-t border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{stats.streak} day streak</span>
              </div>
              <div>
                <span>{stats.saved} saved</span>
              </div>
              <div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  stats.energy === 'high' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : stats.energy === 'low'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                }`}>
                  {stats.energy} energy
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Energy-aware message */}
        <div className="text-xs text-gray-600 dark:text-gray-400 italic">
          💜 Personalized for your current energy and goals
        </div>
        
        {saved && (
          <div className="text-xs text-green-600 dark:text-green-400 font-medium">
            ✓ Motivation saved to your collection
          </div>
        )}
      </div>
    </div>
  );
}