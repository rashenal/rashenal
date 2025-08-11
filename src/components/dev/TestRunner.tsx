import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RefreshCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Bug,
  Zap,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { checkAllFeatures, SystemHealthResult } from '../../api/health/features';

interface TestResult {
  id: string;
  name: string;
  status: 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  coverage?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  status: 'running' | 'passed' | 'failed' | 'mixed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  coverage?: number;
}

export default function TestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [healthStatus, setHealthStatus] = useState<SystemHealthResult | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [showPassed, setShowPassed] = useState(true);
  const [showFailed, setShowFailed] = useState(true);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);

  // Initialize with mock test data
  useEffect(() => {
    loadTestResults();
    loadHealthStatus();
  }, []);

  const loadTestResults = async () => {
    // Mock test data - in a real implementation, this would come from Vitest results
    const mockSuites: TestSuite[] = [
      {
        name: 'Settings System',
        status: 'passed',
        totalTests: 12,
        passedTests: 12,
        failedTests: 0,
        duration: 1200,
        coverage: 85,
        tests: [
          { id: '1', name: 'SettingsModal renders correctly', status: 'passed', duration: 100 },
          { id: '2', name: 'ToggleSwitch handles clicks', status: 'passed', duration: 80 },
          { id: '3', name: 'Settings persist to localStorage', status: 'passed', duration: 120 },
          { id: '4', name: 'SmartTasksSettings loads defaults', status: 'passed', duration: 90 },
        ]
      },
      {
        name: 'Smart Tasks',
        status: 'mixed',
        totalTests: 8,
        passedTests: 6,
        failedTests: 2,
        duration: 2400,
        coverage: 72,
        tests: [
          { id: '5', name: 'SmartTasks renders without crashing', status: 'passed', duration: 150 },
          { id: '6', name: 'Task creation works', status: 'passed', duration: 300 },
          { id: '7', name: 'Drag and drop functionality', status: 'failed', duration: 200, error: 'DragEvent not properly mocked' },
          { id: '8', name: 'Task deletion confirmation', status: 'failed', duration: 180, error: 'Alert mock not working' },
        ]
      },
      {
        name: 'Health Checks',
        status: 'passed',
        totalTests: 6,
        passedTests: 6,
        failedTests: 0,
        duration: 800,
        coverage: 90,
        tests: [
          { id: '9', name: 'System status check', status: 'passed', duration: 100 },
          { id: '10', name: 'Database connectivity', status: 'passed', duration: 200 },
          { id: '11', name: 'LocalStorage functionality', status: 'passed', duration: 50 },
        ]
      }
    ];

    setTestSuites(mockSuites);
  };

  const loadHealthStatus = async () => {
    try {
      const status = await checkAllFeatures();
      setHealthStatus(status);
    } catch (error) {
      console.error('Failed to load health status:', error);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setLastRunTime(new Date());

    try {
      // In a real implementation, this would trigger Vitest
      console.log('Running all tests...');
      
      // Simulate test running
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload results
      await loadTestResults();
      await loadHealthStatus();
    } finally {
      setIsRunning(false);
    }
  };

  const runSuite = async (suiteName: string) => {
    setIsRunning(true);
    console.log(`Running suite: ${suiteName}`);
    
    // Simulate running specific suite
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'mixed':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getOverallStats = () => {
    const total = testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passed = testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const failed = testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const coverage = testSuites.length > 0 
      ? Math.round(testSuites.reduce((sum, suite) => sum + (suite.coverage || 0), 0) / testSuites.length)
      : 0;

    return { total, passed, failed, coverage };
  };

  const stats = getOverallStats();
  const filteredTests = selectedSuite 
    ? testSuites.find(suite => suite.name === selectedSuite)?.tests || []
    : testSuites.flatMap(suite => suite.tests);

  const visibleTests = filteredTests.filter(test => {
    if (!showPassed && test.status === 'passed') return false;
    if (!showFailed && test.status === 'failed') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bug className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Test Dashboard</h1>
                <p className="text-gray-600">Automated testing & health monitoring</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autorun"
                  checked={autoRun}
                  onChange={(e) => setAutoRun(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autorun" className="text-sm text-gray-700">Auto-run</label>
              </div>
              
              <button
                onClick={loadHealthStatus}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <RefreshCcw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isRunning ? 'Running...' : 'Run All Tests'}</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">Passed</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{stats.passed}</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800">Failed</span>
              </div>
              <div className="text-2xl font-bold text-red-900">{stats.failed}</div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-800">Coverage</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{stats.coverage}%</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-purple-800">Health</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {healthStatus?.overall === 'healthy' ? '✓' : healthStatus?.overall === 'degraded' ? '⚠' : '✗'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Test Suites */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Test Suites</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {testSuites.map((suite) => (
                  <div
                    key={suite.name}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedSuite === suite.name ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedSuite(selectedSuite === suite.name ? null : suite.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(suite.status)}
                        <span className="font-medium text-gray-900">{suite.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          runSuite(suite.name);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Run suite"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{suite.passedTests}/{suite.totalTests} passed</span>
                      <span>{suite.duration}ms</span>
                    </div>
                    
                    {suite.coverage && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Coverage</span>
                          <span>{suite.coverage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full"
                            style={{ width: `${suite.coverage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedSuite ? `${selectedSuite} Tests` : 'All Tests'}
                  </h2>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowPassed(!showPassed)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                          showPassed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {showPassed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        <span>Passed</span>
                      </button>
                      
                      <button
                        onClick={() => setShowFailed(!showFailed)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                          showFailed ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {showFailed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        <span>Failed</span>
                      </button>
                    </div>
                    
                    {lastRunTime && (
                      <span className="text-sm text-gray-500">
                        Last run: {lastRunTime.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {visibleTests.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No tests match the current filter
                  </div>
                ) : (
                  visibleTests.map((test) => (
                    <div key={test.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(test.status)}
                          <span className="font-medium text-gray-900">{test.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {test.duration}ms
                        </span>
                      </div>
                      
                      {test.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          {test.error}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Health Status */}
        {healthStatus && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(healthStatus.checks).map(([key, check]) => (
                <div
                  key={key}
                  className={`p-3 rounded-lg border ${
                    check.status === 'pass' 
                      ? 'bg-green-50 border-green-200' 
                      : check.status === 'warn'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusIcon(check.status)}
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {check.duration}ms
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}