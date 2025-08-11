import React, { useState, useEffect } from 'react';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Download, 
  Upload,
  Code,
  Info,
  Loader,
  AlertCircle,
  FileText,
  Zap,
  Shield,
  Terminal
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SchemaValidator } from '../../lib/schema-validator';

interface SchemaIssue {
  table: string;
  column?: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface ValidationResult {
  isValid: boolean;
  issues: SchemaIssue[];
  tables: Record<string, TableInfo[]>;
  timestamp: string;
}

export default function DebugDashboard() {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'migrations' | 'logs'>('overview');
  const [autoFixing, setAutoFixing] = useState(false);
  const [migrations, setMigrations] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Only show in development
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  useEffect(() => {
    if (isDevelopment) {
      loadInitialData();
    }
  }, [isDevelopment]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Run initial validation
      await runValidation();
      
      // Load migrations
      await loadMigrations();
      
    } catch (err) {
      console.error('Error loading debug data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load debug data');
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    try {
      setValidating(true);
      setError(null);
      addLog('Starting schema validation...');
      
      const validator = new SchemaValidator();
      const result = await validator.validateSchema();
      
      setValidationResult(result);
      
      if (result.isValid) {
        addLog('✅ Schema validation passed!');
      } else {
        addLog(`⚠️ Found ${result.issues.length} schema issues`);
        result.issues.forEach(issue => {
          addLog(`- ${issue.severity.toUpperCase()}: ${issue.table}${issue.column ? `.${issue.column}` : ''} - ${issue.issue}`);
        });
      }
      
    } catch (err) {
      console.error('Validation error:', err);
      setError(err instanceof Error ? err.message : 'Validation failed');
      addLog(`❌ Validation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setValidating(false);
    }
  };

  const runAutoFix = async () => {
    try {
      setAutoFixing(true);
      setError(null);
      addLog('🔧 Starting auto-fix...');
      
      const validator = new SchemaValidator();
      const migration = await validator.generateAutoFix();
      
      if (migration) {
        addLog('✅ Migration generated successfully');
        addLog('📝 Migration SQL:');
        addLog(migration);
        
        // Create a download link for the migration
        const blob = new Blob([migration], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${new Date().toISOString().replace(/[:.]/g, '-')}_auto_fix.sql`;
        a.click();
        URL.revokeObjectURL(url);
        
        addLog('💾 Migration file downloaded');
      } else {
        addLog('✅ No fixes needed - schema is valid');
      }
      
      // Re-run validation
      await runValidation();
      
    } catch (err) {
      console.error('Auto-fix error:', err);
      setError(err instanceof Error ? err.message : 'Auto-fix failed');
      addLog(`❌ Auto-fix error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAutoFixing(false);
    }
  };

  const loadMigrations = async () => {
    try {
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use a mock implementation
      const mockMigrations = [
        { 
          version: '20250804_fix_missing_columns_comprehensive', 
          name: 'fix_missing_columns_comprehensive',
          executed_at: new Date().toISOString(),
          status: 'applied'
        }
      ];
      setMigrations(mockMigrations);
      addLog(`📄 Loaded ${mockMigrations.length} migrations`);
    } catch (err) {
      console.error('Error loading migrations:', err);
      addLog(`❌ Failed to load migrations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  if (!isDevelopment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">Debug tools are only available in development mode.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading debug tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Rashenal Debug Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Schema validation and debugging tools
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={runValidation}
                disabled={validating}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {validating ? (
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Validate Schema
              </button>
              <button
                onClick={runAutoFix}
                disabled={autoFixing || !validationResult || validationResult.isValid}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {autoFixing ? (
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Auto-Fix Issues
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: Database },
                { id: 'schema', label: 'Schema Issues', icon: AlertTriangle },
                { id: 'migrations', label: 'Migrations', icon: FileText },
                { id: 'logs', label: 'Logs', icon: Terminal }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-lg border ${
                    validationResult?.isValid 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Schema Status</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {validationResult?.isValid ? 'Valid' : 'Issues Found'}
                        </p>
                      </div>
                      {validationResult?.isValid ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Issues</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {validationResult?.issues.length || 0}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tables Checked</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {validationResult ? Object.keys(validationResult.tables).length : 0}
                        </p>
                      </div>
                      <Database className="h-8 w-8 text-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Quick Info */}
                {validationResult && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Last Validation
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Timestamp:</span> {validationResult.timestamp}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Status:</span>{' '}
                        <span className={validationResult.isValid ? 'text-green-600' : 'text-red-600'}>
                          {validationResult.isValid ? 'All checks passed' : 'Issues detected'}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Schema Issues Tab */}
            {activeTab === 'schema' && (
              <div className="space-y-4">
                {validationResult?.issues.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      No Schema Issues Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Your database schema matches the TypeScript definitions perfectly!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {validationResult?.issues.map((issue, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                      >
                        <div className="flex items-start">
                          {getSeverityIcon(issue.severity)}
                          <div className="ml-3 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {issue.table}
                              {issue.column && <span className="text-gray-600 dark:text-gray-400">.{issue.column}</span>}
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {issue.issue}
                            </p>
                            {issue.suggestion && (
                              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                  Suggestion:
                                </p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                                  {issue.suggestion}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Migrations Tab */}
            {activeTab === 'migrations' && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Applied Migrations
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    List of database migrations that have been applied.
                  </p>
                </div>
                
                {migrations.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No migrations found.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {migrations.map((migration, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {migration.name}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Version: {migration.version}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              migration.status === 'applied' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                            }`}>
                              {migration.status}
                            </span>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {new Date(migration.executed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Debug Logs
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Real-time debug output and validation logs.
                    </p>
                  </div>
                  <button
                    onClick={() => setLogs([])}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Clear Logs
                  </button>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-gray-400 text-sm font-mono">No logs yet. Run validation to see output.</p>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log, index) => (
                        <div key={index} className="text-sm font-mono text-gray-300">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}