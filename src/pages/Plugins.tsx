// Plugin Management Page
// This connects to the marketplace and allows installation

import React, { useState, useEffect } from 'react';
import { Package, Download, Settings, Check, ExternalLink, Shield, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';

interface MarketplacePlugin {
  id: string;
  plugin_id: string;
  name: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  version: string;
  featured: boolean;
  downloads: number;
  rating: number;
  default_permissions: string[];
}

export function PluginsPage() {
  const { user } = useUser();
  const [marketplace, setMarketplace] = useState<MarketplacePlugin[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchMarketplace();
    fetchInstalled();
  }, []);

  const fetchMarketplace = async () => {
    try {
      const { data, error } = await supabase
        .from('plugin_marketplace')
        .select('*')
        .order('featured', { ascending: false })
        .order('downloads', { ascending: false });

      if (error) {
        console.error('Error fetching marketplace:', error);
        return;
      }

      setMarketplace(data || []);
    } catch (error) {
      console.error('Error fetching marketplace:', error);
    }
  };

  const fetchInstalled = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('plugin_installations')
        .select('plugin_id')
        .eq('user_id', user.id);
      
      setInstalled(new Set(data?.map(d => d.plugin_id) || []));
    } catch (error) {
      console.error('Error fetching installed plugins:', error);
    }
  };

  const installPlugin = async (plugin: MarketplacePlugin) => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('plugin_installations')
        .insert({
          user_id: user.id,
          plugin_id: plugin.plugin_id,
          plugin_name: plugin.name,
          plugin_version: plugin.version,
          permissions: plugin.default_permissions || [],
          enabled: true
        });

      if (error) {
        console.error('Error installing plugin:', error);
        return;
      }

      setInstalled(prev => new Set([...prev, plugin.plugin_id]));
      
      // Update download count
      await supabase
        .from('plugin_marketplace')
        .update({ downloads: plugin.downloads + 1 })
        .eq('plugin_id', plugin.plugin_id);

      // Emit a custom event to notify the dashboard to refresh plugins
      console.log('🔧 Dispatching plugin installation event for:', plugin.plugin_id);
      window.dispatchEvent(new CustomEvent('pluginInstalled', { 
        detail: { pluginId: plugin.plugin_id } 
      }));
    } catch (error) {
      console.error('Error installing plugin:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'wellness', 'productivity', 'ai', 'integration', 'analytics'];
  const filteredPlugins = selectedCategory === 'all' 
    ? marketplace 
    : marketplace.filter(p => p.category === selectedCategory);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign in to explore plugins</h2>
          <p className="text-gray-600">Access powerful extensions to enhance your Rashenal experience.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Package className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plugin Marketplace</h1>
            <p className="text-gray-600">
              Extend Rashenal with powerful plugins from our community
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>{marketplace.length} available plugins</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4" />
            <span>{installed.size} installed</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Plugin Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlugins.map(plugin => (
          <div
            key={plugin.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            {/* Plugin Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {plugin.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{plugin.name}</h3>
                    {plugin.featured && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">v{plugin.version} by {plugin.author}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-4 line-clamp-3">{plugin.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {plugin.tags?.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
              {plugin.tags?.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  +{plugin.tags.length - 3} more
                </span>
              )}
            </div>

            {/* Permissions Preview */}
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Permissions:</span>
              </div>
              <div className="text-xs text-gray-500">
                {plugin.default_permissions?.slice(0, 2).join(', ') || 'No special permissions'}
                {plugin.default_permissions?.length > 2 && ` +${plugin.default_permissions.length - 2} more`}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  <span>{plugin.downloads || 0}</span>
                </div>
                {plugin.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{plugin.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                {plugin.category}
              </span>
            </div>

            {/* Action Button */}
            <div className="flex gap-2">
              {installed.has(plugin.plugin_id) ? (
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium"
                >
                  <Check className="h-4 w-4" />
                  Installed
                </button>
              ) : (
                <button
                  onClick={() => installPlugin(plugin)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  Install
                </button>
              )}
              
              <button className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlugins.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No plugins found</h3>
          <p className="text-gray-600">
            {selectedCategory === 'all'
              ? 'No plugins are available in the marketplace yet.'
              : `No plugins found in the "${selectedCategory}" category.`}
          </p>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Installing Plugins</h4>
            <p>Click "Install" on any plugin to add it to your Rashenal dashboard. Plugins will appear automatically after installation.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Managing Permissions</h4>
            <p>Each plugin requests specific permissions to access your data. Review these carefully before installing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}