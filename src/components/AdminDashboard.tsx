import React, { useState, useEffect } from 'react';
import {
  Shield,
  Settings,
  Users,
  Database,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Code,
  Bug,
  TestTube,
  FileText,
  Download,
  Upload,
  RefreshCcw,
  Eye,
  EyeOff,
  Terminal,
  Server,
  Zap,
  Lock,
  Mail,
  Monitor,
  Briefcase,
  Search
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import TestRunner from './TestRunner';
import { checkAllFeatures } from '../api/health/features';
import EmailAgentMonitor from './admin/EmailAgentMonitor';
import DatabaseMigrationHelper from './DatabaseMigrationHelper';
import ComprehensiveAgentMonitor from './admin/ComprehensiveAgentMonitor';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  totalHabits: number;
  totalJobSearches: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
  uptime: string;
  lastBackup: string;
}

const ADMIN_EMAIL = 'rharveybis@hotmail.com';

export default function AdminDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    totalHabits: 0,
    totalJobSearches: 0,
    systemHealth: 'healthy',
    uptime: '99.9%',
    lastBackup: new Date().toISOString()
  });
  const [healthData, setHealthData] = useState(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is admin
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    
    loadSystemStats();
    loadHealthData();
  }, [isAdmin]);

  const loadSystemStats = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production this would come from your analytics service
      const mockStats: SystemStats = {
        totalUsers: 147,
        activeUsers: 89,
        totalTasks: 2341,
        totalHabits: 892,
        totalJobSearches: 156,
        systemHealth: 'healthy',
        uptime: '99.97%',
        lastBackup: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };
      
      setSystemStats(mockStats);
    } catch (error) {
      console.error('Failed to load system stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHealthData = async () => {
    try {
      const health = await checkAllFeatures();
      setHealthData(health);
    } catch (error) {
      console.error('Failed to load health data:', error);
    }
  };

  const handleDataExport = () => {
    // Mock data export
    const exportData = {
      exportTime: new Date().toISOString(),
      stats: systemStats,
      health: healthData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rashenal-admin-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runSystemHealthCheck = async () => {
    setIsLoading(true);
    await loadHealthData();
    await loadSystemStats();
    setIsLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <Lock className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the Admin Dashboard.
          </p>
          <p className="text-sm text-gray-500">
            This area is restricted to system administrators only.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'System Overview', icon: BarChart3 },
    { id: 'agent-monitor', name: 'AI Agent Monitor', icon: Server },
    { id: 'email-agent', name: 'Email Agent Monitor', icon: Mail },
    { id: 'job-finder', name: 'Job Finder Monitor', icon: Briefcase },
    { id: 'database', name: 'Database Manager', icon: Database },
    { id: 'health', name: 'Health Monitor', icon: Activity },
    { id: 'tests', name: 'Test Dashboard', icon: TestTube },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'debug', name: 'Debug Console', icon: Terminal },
    { id: 'settings', name: 'System Settings', icon: Settings }
  ];

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">System Administration & Monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getHealthIcon(systemStats.systemHealth)}
                <span className="text-sm font-medium capitalize">
                  {systemStats.systemHealth}
                </span>
              </div>
              
              <button
                onClick={runSystemHealthCheck}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
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
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
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
            {activeTab === 'agent-monitor' && (
              <ComprehensiveAgentMonitor />
            )}

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Activity className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats.activeUsers}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats.totalTasks}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Server className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Uptime</p>
                        <p className="text-2xl font-bold text-gray-900">{systemStats.uptime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Actions */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={handleDataExport}
                      className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Download className="h-5 w-5 text-gray-600" />
                      <span>Export System Data</span>
                    </button>
                    
                    <button
                      onClick={() => setShowSensitiveData(!showSensitiveData)}
                      className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {showSensitiveData ? (
                        <EyeOff className="h-5 w-5 text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-600" />
                      )}
                      <span>{showSensitiveData ? 'Hide' : 'Show'} Debug Data</span>
                    </button>
                    
                    <button
                      onClick={runSystemHealthCheck}
                      className="flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Zap className="h-5 w-5" />
                      <span>Run Health Check</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'health' && healthData && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(healthData.checks).map(([key, check]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border ${
                        check.status === 'pass'
                          ? 'bg-green-50 border-green-200'
                          : check.status === 'warn'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {getHealthIcon(check.status)}
                        <h4 className="font-medium capitalize">
                          {key.replace(/_/g, ' ')}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Response time: {check.duration}ms
                      </p>
                      {check.error && (
                        <p className="text-sm text-red-600 mt-1">{check.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="bg-white rounded-lg shadow-sm border">
                <TestRunner />
              </div>
            )}

            {activeTab === 'email-agent' && (
              <EmailAgentMonitor />
            )}

            {activeTab === 'job-finder' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                    Job Finder System Monitor
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Monitor job discovery, analysis, and task creation workflows.
                  </p>
                  <EmailAgentMonitor />
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="bg-white rounded-lg shadow-sm border">
                <DatabaseMigrationHelper />
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
                <p className="text-gray-600 mb-4">
                  User management features will be implemented here.
                </p>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    🚧 Coming Soon: User roles, permissions, and account management
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'debug' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Console</h3>
                
                {showSensitiveData && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Sensitive debugging information is now visible
                    </p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Environment Info</h4>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                      <div>NODE_ENV: {process.env.NODE_ENV}</div>
                      <div>Build Time: {new Date().toISOString()}</div>
                      <div>User Agent: {navigator.userAgent}</div>
                      {showSensitiveData && (
                        <>
                          <div>Current User: {user?.email}</div>
                          <div>Session ID: {user?.id}</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recent Errors</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 text-sm">No recent errors detected</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
                <p className="text-gray-600 mb-4">
                  Configure system-wide settings and preferences.
                </p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    🚧 System configuration panel coming soon
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