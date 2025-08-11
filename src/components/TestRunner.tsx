import React, { useState } from 'react';
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { automatedTests, type TestSuite } from '../utils/automated-tests';

interface TestRunnerProps {
  className?: string;
}

export default function TestRunner({ className = '' }: TestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestSuite[]>([]);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await automatedTests.runAllTests();
      setResults(testResults);
      setLastRun(new Date());
    } catch (error) {
      console.error('Test run failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleDetails = (suiteName: string) => {
    setShowDetails(prev => ({
      ...prev,
      [suiteName]: !prev[suiteName]
    }));
  };

  const exportResults = () => {
    const resultsData = {
      timestamp: lastRun,
      results,
      summary: {
        totalSuites: results.length,
        totalTests: results.reduce((sum, suite) => sum + suite.totalTests, 0),
        totalPassed: results.reduce((sum, suite) => sum + suite.passedTests, 0),
        totalFailed: results.reduce((sum, suite) => sum + suite.failedTests, 0),
        totalAutoFixes: results.reduce((sum, suite) => sum + suite.autoFixesApplied, 0)
      }
    };

    const blob = new Blob([JSON.stringify(resultsData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (passed: boolean, autoFixApplied?: boolean) => {
    if (passed && autoFixApplied) {
      return <Wrench className="h-5 w-5 text-blue-600" />;
    } else if (passed) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (suite: TestSuite) => {
    if (suite.failedTests === 0) {
      return 'border-green-200 bg-green-50';
    } else if (suite.passedTests > suite.failedTests) {
      return 'border-yellow-200 bg-yellow-50';
    } else {
      return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Automated Test Runner</h2>
          <p className="text-gray-600">
            Run comprehensive tests to validate system functionality and auto-fix common issues
          </p>
          {lastRun && (
            <p className="text-sm text-gray-500 mt-1">
              Last run: {lastRun.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {results.length > 0 && (
            <button
              onClick={exportResults}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export Results</span>
            </button>
          )}
          <button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run All Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overall Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {results.reduce((sum, suite) => sum + suite.totalTests, 0)}
            </div>
            <div className="text-sm text-blue-700">Total Tests</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {results.reduce((sum, suite) => sum + suite.passedTests, 0)}
            </div>
            <div className="text-sm text-green-700">Passed</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {results.reduce((sum, suite) => sum + suite.failedTests, 0)}
            </div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {results.reduce((sum, suite) => sum + suite.autoFixesApplied, 0)}
            </div>
            <div className="text-sm text-purple-700">Auto-Fixes</div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
          {results.map((suite) => (
            <div
              key={suite.name}
              className={`border rounded-lg p-4 ${getStatusColor(suite)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {suite.failedTests === 0 ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <h4 className="font-semibold text-gray-900">{suite.name}</h4>
                  </div>
                  {suite.autoFixesApplied > 0 && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      <Wrench className="h-3 w-3" />
                      <span>{suite.autoFixesApplied} fixes</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {suite.passedTests}/{suite.totalTests} passed
                  </div>
                  <button
                    onClick={() => toggleDetails(suite.name)}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                  >
                    {showDetails[suite.name] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {showDetails[suite.name] && (
                <div className="mt-4 space-y-2">
                  {suite.tests.map((test, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/50 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(test.passed, test.autoFixApplied)}
                        <span className="font-medium">{test.test}</span>
                      </div>
                      <div className="text-right">
                        {test.error && (
                          <div className="text-red-600 text-sm mb-1">{test.error}</div>
                        )}
                        {test.fixDescription && (
                          <div className="text-blue-600 text-sm">
                            Fix: {test.fixDescription}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Initial State */}
      {results.length === 0 && !isRunning && (
        <div className="text-center py-12">
          <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Run Tests</h3>
          <p className="text-gray-600 mb-6">
            Click "Run All Tests" to start comprehensive system validation
          </p>
          <div className="text-sm text-gray-500">
            <p>Tests include:</p>
            <ul className="mt-2 space-y-1">
              <li>• UI Component functionality</li>
              <li>• Settings & preferences persistence</li>
              <li>• Database connectivity & schemas</li>
              <li>• Integration endpoints</li>
              <li>• Auto-fix for common issues</li>
            </ul>
          </div>
        </div>
      )}

      {/* Running State */}
      {isRunning && (
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Running Tests...</h3>
          <p className="text-gray-600">
            Please wait while we validate your system and apply auto-fixes
          </p>
        </div>
      )}
    </div>
  );
}