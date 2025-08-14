import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';

interface TestResult {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  screenshot?: string;
  trace?: string;
  startTime?: number;
  endTime?: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  status: 'idle' | 'running' | 'completed';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration?: number;
}

const TestMonitorDashboard: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Mock test suites structure
  const mockTestSuites: TestSuite[] = [
    {
      name: 'Authentication Tests',
      tests: [
        { id: 'auth-1', title: 'should display login form elements', status: 'pending' },
        { id: 'auth-2', title: 'should validate required fields', status: 'pending' },
        { id: 'auth-3', title: 'should handle login flow', status: 'pending' },
      ],
      status: 'idle',
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
    },
    {
      name: 'Navigation Tests',
      tests: [
        { id: 'nav-1', title: 'should display logo and brand', status: 'pending' },
        { id: 'nav-2', title: 'should navigate between pages', status: 'pending' },
        { id: 'nav-3', title: 'should support mobile menu', status: 'pending' },
      ],
      status: 'idle',
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
    },
    {
      name: 'Task Board Tests',
      tests: [
        { id: 'task-1', title: 'should display kanban columns', status: 'pending' },
        { id: 'task-2', title: 'should create new tasks', status: 'pending' },
        { id: 'task-3', title: 'should support drag and drop', status: 'pending' },
      ],
      status: 'idle',
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
    },
    {
      name: 'Job Finder Tests',
      tests: [
        { id: 'job-1', title: 'should display job finder interface', status: 'pending' },
        { id: 'job-2', title: 'should create job profiles', status: 'pending' },
        { id: 'job-3', title: 'should perform job search', status: 'pending' },
      ],
      status: 'idle',
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
    },
    {
      name: 'AI Features Tests',
      tests: [
        { id: 'ai-1', title: 'should display AI coach interface', status: 'pending' },
        { id: 'ai-2', title: 'should handle chat messages', status: 'pending' },
        { id: 'ai-3', title: 'should provide task suggestions', status: 'pending' },
      ],
      status: 'idle',
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
    },
    {
      name: 'Accessibility Tests',
      tests: [
        { id: 'a11y-1', title: 'should have proper landmarks', status: 'pending' },
        { id: 'a11y-2', title: 'should support keyboard navigation', status: 'pending' },
        { id: 'a11y-3', title: 'should have proper heading structure', status: 'pending' },
      ],
      status: 'idle',
      totalTests: 3,
      passedTests: 0,
      failedTests: 0,
    },
  ];

  useEffect(() => {
    setTestSuites(mockTestSuites);
  }, []);

  // Mock WebSocket connection for real-time updates
  useEffect(() => {
    if (isRunning) {
      // In a real implementation, this would connect to a WebSocket server
      // that streams Playwright test results
      console.log('Would connect to WebSocket for real-time test updates');
      
      // Mock real-time updates
      const interval = setInterval(() => {
        simulateTestProgress();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const simulateTestProgress = () => {
    setTestSuites(prevSuites => {
      return prevSuites.map(suite => {
        if (suite.status === 'running') {
          const updatedTests = suite.tests.map(test => {
            if (test.status === 'running') {
              // Randomly complete running tests
              if (Math.random() > 0.7) {
                const passed = Math.random() > 0.3; // 70% pass rate
                addLog(`${test.title}: ${passed ? 'PASSED' : 'FAILED'}`);
                return {
                  ...test,
                  status: passed ? 'passed' : 'failed' as const,
                  duration: Math.floor(Math.random() * 5000) + 1000,
                  endTime: Date.now(),
                  error: !passed ? 'Element not found: input[type="email"]' : undefined,
                };
              }
            } else if (test.status === 'pending') {
              // Start next pending test
              if (Math.random() > 0.8) {
                addLog(`Starting: ${test.title}`);
                return {
                  ...test,
                  status: 'running' as const,
                  startTime: Date.now(),
                };
              }
            }
            return test;
          });

          const passedCount = updatedTests.filter(t => t.status === 'passed').length;
          const failedCount = updatedTests.filter(t => t.status === 'failed').length;
          const runningCount = updatedTests.filter(t => t.status === 'running').length;
          
          const isCompleted = passedCount + failedCount === suite.totalTests;

          return {
            ...suite,
            tests: updatedTests,
            passedTests: passedCount,
            failedTests: failedCount,
            status: isCompleted ? 'completed' : (runningCount > 0 ? 'running' : 'idle'),
          };
        }
        return suite;
      });
    });
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const startTests = () => {
    setIsRunning(true);
    setLogs([]);
    addLog('Starting Playwright test suite...');
    
    // Start first suite
    setTestSuites(prev => prev.map((suite, index) => ({
      ...suite,
      status: index === 0 ? 'running' : 'idle',
      tests: suite.tests.map(test => ({ ...test, status: 'pending' })),
      passedTests: 0,
      failedTests: 0,
    })));
  };

  const stopTests = () => {
    setIsRunning(false);
    addLog('Test execution stopped');
  };

  const resetTests = () => {
    setIsRunning(false);
    setLogs([]);
    setTestSuites(mockTestSuites);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
  const progressPercent = totalTests > 0 ? ((totalPassed + totalFailed) / totalTests) * 100 : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Playwright Test Monitor</h1>
              <p className="text-gray-600 mt-1">Real-time test execution monitoring</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={startTests}
                disabled={isRunning}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Tests
              </button>
              <button
                onClick={stopTests}
                disabled={!isRunning}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pause className="w-4 h-4 mr-2" />
                Stop Tests
              </button>
              <button
                onClick={resetTests}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{totalPassed + totalFailed}/{totalTests} tests completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-green-600">{totalPassed} passed</span>
              <span className="text-red-600">{totalFailed} failed</span>
              <span className="text-gray-600">{totalTests - totalPassed - totalFailed} pending</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Suites */}
          <div className="lg:col-span-2 space-y-4">
            {testSuites.map((suite) => (
              <div key={suite.name} className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">{suite.name}</h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-green-600">{suite.passedTests} passed</span>
                      <span className="text-red-600">{suite.failedTests} failed</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        suite.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        suite.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {suite.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {suite.tests.map((test) => (
                    <div
                      key={test.id}
                      className={`p-3 rounded-md border cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTest?.id === test.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedTest(test)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(test.status)}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {test.title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {test.duration && (
                            <span className="text-xs text-gray-500">
                              {test.duration}ms
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(test.status)}`}>
                            {test.status}
                          </span>
                        </div>
                      </div>
                      {test.error && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                          {test.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Test Details */}
            {selectedTest && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Test Name</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedTest.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center mt-1">
                      {getStatusIcon(selectedTest.status)}
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedTest.status)}`}>
                        {selectedTest.status}
                      </span>
                    </div>
                  </div>
                  {selectedTest.duration && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Duration</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedTest.duration}ms</p>
                    </div>
                  )}
                  {selectedTest.error && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Error</label>
                      <p className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded">{selectedTest.error}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t space-y-2">
                    <button className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                      <Eye className="w-4 h-4 mr-2" />
                      View Screenshot
                    </button>
                    <button className="flex items-center w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                      <Eye className="w-4 h-4 mr-2" />
                      View Trace
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Logs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Live Logs</h3>
              </div>
              <div
                ref={logContainerRef}
                className="p-4 h-64 overflow-y-auto bg-gray-900 text-green-400 font-mono text-xs"
              >
                {logs.length === 0 ? (
                  <p className="text-gray-500">No logs yet. Start tests to see real-time updates.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestMonitorDashboard;