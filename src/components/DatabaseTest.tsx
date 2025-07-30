// Temporary DatabaseTest without authentication requirements
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, Database, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DatabaseTestNoAuth() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test database connection
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('checking');
      
      // Simple connection test
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_profiles?select=count&limit=1`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('failed');
    }
  };

  const testDirectDatabaseQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Direct database query without auth requirement
      const { data, error, count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) {
        setError(`Database query error: ${error.message}`);
      } else {
        setTestResults(data || []);
        console.log('Query successful:', { data, count });
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testInsertWithoutAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test insert using service role (if available) or anon
      const testUser = {
        id: crypto.randomUUID(),
        email: `test-${Date.now()}@example.com`,
        full_name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([testUser])
        .select()
        .single();

      if (error) {
        setError(`Insert failed: ${error.message}`);
      } else {
        setTestResults(prev => [data, ...prev]);
        console.log('Insert successful:', data);
      }
    } catch (err) {
      setError(`Insert error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testTasksTableQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test tasks table structure
      const { data, error, count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .limit(3);
      
      if (error) {
        setError(`Tasks query error: ${error.message}`);
      } else {
        console.log('Tasks table query successful:', { data, count });
        setError(null);
        alert(`Tasks table works! Found ${count} tasks.`);
      }
    } catch (err) {
      setError(`Tasks query error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: 'checking' | 'connected' | 'failed') => {
    switch (status) {
      case 'checking':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'checking' | 'connected' | 'failed') => {
    switch (status) {
      case 'checking':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
          <Database className="w-6 h-6 text-blue-500" />
          <span>Database Test (No Auth Required)</span>
        </h2>

        {/* Connection Status */}
        <div className={`p-4 rounded-lg border mb-6 ${getStatusColor(connectionStatus)}`}>
          <div className="flex items-center space-x-3">
            {getStatusIcon(connectionStatus)}
            <div>
              <h3 className="font-medium">Database Connection</h3>
              <p className="text-sm">
                {connectionStatus === 'checking' && 'Testing connection...'}
                {connectionStatus === 'connected' && 'Successfully connected to Supabase'}
                {connectionStatus === 'failed' && 'Failed to connect to database'}
              </p>
            </div>
          </div>
        </div>

        {/* Environment Variables Check */}
        <div className="mb-6">
          <h3 className="font-medium mb-3">Environment Variables</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-3 rounded border ${
              import.meta.env.VITE_SUPABASE_URL ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <span className="text-sm font-medium">VITE_SUPABASE_URL:</span>
              <span className="text-sm ml-2">
                {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
            <div className={`p-3 rounded border ${
              import.meta.env.VITE_SUPABASE_ANON_KEY ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <span className="text-sm font-medium">VITE_SUPABASE_ANON_KEY:</span>
              <span className="text-sm ml-2">
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Database Operations Test */}
        <div className="border-t pt-6">
          <h3 className="font-medium mb-4">Database Operations Test (Bypass Auth)</h3>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={testDirectDatabaseQuery}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Query user_profiles</span>
            </button>
            
            <button
              onClick={testTasksTableQuery}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Test tasks table</span>
            </button>
            
            <button
              onClick={testInsertWithoutAuth}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Test Insert</span>
            </button>
          </div>

          {loading && (
            <div className="flex items-center space-x-2 text-gray-600 mb-4">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Testing database operations...</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded border border-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Test Results ({testResults.length})</h4>
            
            {testResults.length === 0 && !loading && (
              <p className="text-gray-600 text-sm">
                No results yet. Click a test button above to test database operations.
              </p>
            )}

            {testResults.length > 0 && (
              <div className="space-y-2">
                {testResults.slice(0, 5).map((result, index) => (
                  <div key={index} className="bg-white p-3 rounded border text-sm">
                    <pre className="text-xs text-gray-600 overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test Connection Again
          </button>
        </div>
      </div>
    </div>
  );
}