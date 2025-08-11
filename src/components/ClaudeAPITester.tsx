// Claude API Tester Component
// This component helps debug the Claude AI integration

import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader, Bug } from 'lucide-react';
import { testClaudeAPIConnection, testClaudeCVParsing } from '../test/claude-api-test';

interface TestResult {
  success: boolean;
  error?: string;
  response?: any;
  debug?: any;
  timestamp?: string;
}

export default function ClaudeAPITester() {
  const [connectionTest, setConnectionTest] = useState<TestResult | null>(null);
  const [cvParsingTest, setCvParsingTest] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const runConnectionTest = async () => {
    setTesting('connection');
    setConnectionTest(null);
    
    try {
      const result = await testClaudeAPIConnection();
      setConnectionTest({
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setConnectionTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(null);
    }
  };

  const runCVParsingTest = async () => {
    setTesting('cvparsing');
    setCvParsingTest(null);
    
    try {
      const result = await testClaudeCVParsing();
      setCvParsingTest({
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setCvParsingTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(null);
    }
  };

  const TestResultDisplay = ({ result, title }: { result: TestResult | null; title: string }) => {
    if (!result) return null;

    return (
      <div className={`p-4 rounded-lg border ${
        result.success 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center mb-2">
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
          )}
          <h4 className={`font-medium ${
            result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
          }`}>
            {title} {result.success ? 'Passed' : 'Failed'}
          </h4>
        </div>

        {result.error && (
          <div className="mb-2">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Error:</p>
            <p className="text-xs text-red-600 dark:text-red-400 font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded">
              {result.error}
            </p>
          </div>
        )}

        {result.response && (
          <div className="mb-2">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Response:</p>
            <pre className="text-xs text-green-600 dark:text-green-400 font-mono bg-green-100 dark:bg-green-900/30 p-2 rounded overflow-auto max-h-32">
              {typeof result.response === 'string' 
                ? result.response 
                : JSON.stringify(result.response, null, 2)
              }
            </pre>
          </div>
        )}

        {result.extracted && (
          <div className="mb-2">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Extracted Data:</p>
            <pre className="text-xs text-green-600 dark:text-green-400 font-mono bg-green-100 dark:bg-green-900/30 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(result.extracted, null, 2)}
            </pre>
          </div>
        )}

        {result.debug && (
          <details className="mt-2">
            <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
              Debug Information
            </summary>
            <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto max-h-48">
              {JSON.stringify(result.debug, null, 2)}
            </pre>
          </details>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {result.timestamp && `Tested at: ${new Date(result.timestamp).toLocaleString()}`}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-primary rounded-xl p-6 shadow-lg">
      <div className="flex items-center mb-6">
        <Bug className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
        <h2 className="text-xl font-semibold text-primary">Claude AI Debug Tester</h2>
      </div>

      <div className="space-y-6">
        {/* Basic Connection Test */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-primary">1. Basic API Connection</h3>
              <p className="text-sm text-secondary">Tests if Claude API is reachable via Edge Function</p>
            </div>
            <button
              onClick={runConnectionTest}
              disabled={testing === 'connection'}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testing === 'connection' ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>{testing === 'connection' ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>
          
          <TestResultDisplay result={connectionTest} title="Connection Test" />
        </div>

        {/* CV Parsing Test */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-primary">2. CV Parsing Test</h3>
              <p className="text-sm text-secondary">Tests Claude AI CV parsing with sample data</p>
            </div>
            <button
              onClick={runCVParsingTest}
              disabled={testing === 'cvparsing'}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg 
                hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testing === 'cvparsing' ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>{testing === 'cvparsing' ? 'Testing...' : 'Test CV Parsing'}</span>
            </button>
          </div>
          
          <TestResultDisplay result={cvParsingTest} title="CV Parsing Test" />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Debugging Steps:</h4>
          <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
            <li>Run the Basic API Connection test first</li>
            <li>If connection fails, check Supabase Edge Function deployment</li>
            <li>If connection works but CV parsing fails, check the prompt format</li>
            <li>Check browser console for detailed logs</li>
            <li>Verify ANTHROPIC_API_KEY is set in Supabase Edge Function secrets</li>
          </ol>
        </div>

        {/* Console Instructions */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Manual Testing:</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            You can also run these tests manually in the browser console:
          </p>
          <code className="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-2 rounded block">
            testClaudeAPIConnection()<br />
            testClaudeCVParsing()
          </code>
        </div>
      </div>
    </div>
  );
}