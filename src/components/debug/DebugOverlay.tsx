// Development-only Debug Overlay
// Provides a floating overlay with quick schema health information

import React, { useState } from 'react';
import { 
  Bug, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Database,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSchemaHealthMonitor } from '../../hooks/useSchemaHealth';

interface DebugOverlayProps {
  enabled?: boolean;
}

export default function DebugOverlay({ enabled = true }: DebugOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Only show in development
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  
  // Use schema health monitor with auto-refresh
  const health = useSchemaHealthMonitor();

  if (!enabled || !isDevelopment || !isVisible) {
    return null;
  }

  const getStatusColor = () => {
    const status = health.getHealthStatus();
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warnings':
        return 'bg-yellow-500';
      case 'errors':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    const status = health.getHealthStatus();
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warnings':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'errors':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    const status = health.getHealthStatus();
    switch (status) {
      case 'healthy':
        return 'Schema OK';
      case 'warnings':
        return `${health.warningCount} Warning${health.warningCount !== 1 ? 's' : ''}`;
      case 'errors':
        return `${health.errorCount} Error${health.errorCount !== 1 ? 's' : ''}`;
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {/* Main overlay */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Bug className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Debug</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {getStatusText()}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-3">
            {/* Status summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Schema Status
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {health.tablesChecked} tables checked
                </div>
                {health.lastChecked && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(health.lastChecked).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>

            {/* Issue counts */}
            {health.totalIssues > 0 && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                {health.errorCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-600">{health.errorCount} Error{health.errorCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {health.warningCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-600">{health.warningCount} Warning{health.warningCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {health.infoCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600">{health.infoCount} Info</span>
                  </div>
                )}
              </div>
            )}

            {/* Recent issues preview */}
            {health.issues.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Recent Issues:
                </div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {health.issues.slice(0, 3).map((issue, index) => (
                    <div key={index} className="text-xs p-1 rounded bg-gray-50 dark:bg-gray-700">
                      <div className="flex items-start space-x-1">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                          issue.severity === 'error' ? 'bg-red-500' :
                          issue.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-700 dark:text-gray-300 truncate">
                            {issue.table}{issue.column ? `.${issue.column}` : ''}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 truncate">
                            {issue.issue}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {health.issues.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{health.issues.length - 3} more issues
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => health.refresh()}
                disabled={health.isLoading}
                className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${health.isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <Link
                  to="/debug"
                  className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  <span>Debug Dashboard</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
                
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Show/hide toggle when overlay is hidden */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-colors"
          title="Show Debug Overlay"
        >
          <Bug className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}