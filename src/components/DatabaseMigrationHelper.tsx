// components/DatabaseMigrationHelper.tsx
// TEMPORARY COMPONENT - Debug and fix foreign key constraint issues
// Remove this after the issue is resolved

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader, Database, User, AlertTriangle, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../contexts/userContext';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function DatabaseMigrationHelper() {
  const { user } = useUser();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    if (!user) {
      addResult({
        test: 'Authentication',
        status: 'error',
        message: 'User not authenticated'
      });
      return;
    }

    setLoading(true);
    setResults([]);

    // Get current timestamp for error reporting
    const timestamp = new Date().toISOString();

    try {
      // 1. Check if user exists in auth.users
      addResult({
        test: 'Auth User Check',
        status: 'success',
        message: `User authenticated: ${user.id}`,
        details: { email: user.email, id: user.id }
      });

      // 2. Check if user exists in user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          addResult({
            test: 'User Profile Check',
            status: 'error',
            message: 'User profile does not exist - this is the root cause of the foreign key error',
            details: { error: profileError.message, user_id: user.id }
          });
        } else {
          addResult({
            test: 'User Profile Check',
            status: 'error',
            message: `Database error: ${profileError.message}`,
            details: profileError
          });
        }
      } else {
        addResult({
          test: 'User Profile Check',
          status: 'success',
          message: 'User profile exists',
          details: userProfile
        });
      }

      // 3. Check job_profiles table structure
      try {
        const { data: jobProfiles, error: jobError } = await supabase
          .from('job_profiles')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        if (jobError) {
          addResult({
            test: 'Job Profiles Table Access',
            status: 'error',
            message: `Cannot access job_profiles: ${jobError.message}`,
            details: jobError
          });
        } else {
          addResult({
            test: 'Job Profiles Table Access',
            status: 'success',
            message: `Found ${jobProfiles?.length || 0} job profiles`,
            details: jobProfiles
          });
        }
      } catch (err) {
        addResult({
          test: 'Job Profiles Table Access',
          status: 'error',
          message: `Exception accessing job_profiles: ${err}`,
          details: err
        });
      }

      // 4. Check for specific missing columns that cause errors (including email)
      try {
        const { error: columnError } = await supabase
          .from('job_profiles')
          .select('name, email, phone, location, cover_letter_template, bio, summary, cv_tone, cover_letter_tone, avatar_url, intro_video_url')
          .limit(1);

        if (columnError) {
          addResult({
            test: 'Schema Column Check',
            status: 'error',
            message: `Missing columns detected: ${columnError.message}`,
            details: { 
              error: columnError,
              likely_missing: ['name', 'email', 'phone', 'location', 'cover_letter_template', 'bio', 'summary', 'cv_tone', 'cover_letter_tone', 'avatar_url', 'intro_video_url']
            }
          });
        } else {
          addResult({
            test: 'Schema Column Check',
            status: 'success',
            message: 'All expected columns exist in job_profiles table',
            details: 'name, email, phone, location, cover_letter_template, bio, summary, cv_tone, cover_letter_tone, avatar_url, intro_video_url'
          });
        }
      } catch (err) {
        addResult({
          test: 'Schema Column Check',
          status: 'error',
          message: `Exception checking columns: ${err}`,
          details: err
        });
      }

      // 4b. Test the ensure_user_profile function exists
      try {
        const { data: testResult, error: funcError } = await supabase
          .rpc('ensure_user_profile', { user_uuid: user.id });

        if (funcError) {
          addResult({
            test: 'Auto-Profile Function Check',
            status: 'error',
            message: `ensure_user_profile function error: ${funcError.message}`,
            details: funcError
          });
        } else {
          addResult({
            test: 'Auto-Profile Function Check',
            status: 'success',
            message: 'ensure_user_profile function works correctly',
            details: testResult
          });
        }
      } catch (err) {
        addResult({
          test: 'Auto-Profile Function Check',
          status: 'error',
          message: `Exception testing ensure_user_profile function: ${err}`,
          details: err
        });
      }

      // 5. Test foreign key constraint with corrected schema
      try {
        const testProfileData = {
          user_id: user.id,
          name: 'Test Profile - Will Delete',
          email: user.email || 'test@example.com',
          phone: null,
          location: null,
          bio: 'Diagnostic test profile',
          summary: 'Test',
          skills: ['Test'],
          is_active: false // Mark as inactive so it's clear it's a test
        };

        const { data: testProfile, error: testError } = await supabase
          .from('job_profiles')
          .insert([testProfileData])
          .select()
          .single();

        if (testError) {
          addResult({
            test: 'Foreign Key Constraint Test',
            status: 'error',
            message: `Foreign key constraint failed: ${testError.message}`,
            details: { error: testError, attempted_data: testProfileData }
          });
        } else {
          addResult({
            test: 'Foreign Key Constraint Test',
            status: 'success',
            message: 'Foreign key constraint passed - profile created successfully',
            details: testProfile
          });

          // Clean up test profile
          await supabase
            .from('job_profiles')
            .delete()
            .eq('id', testProfile.id);
        }
      } catch (err) {
        addResult({
          test: 'Foreign Key Constraint Test',
          status: 'error',
          message: `Exception during constraint test: ${err}`,
          details: err
        });
      }

      // 6. Final schema health summary
      const errorCount = results.filter(r => r.status === 'error').length;
      const warningCount = results.filter(r => r.status === 'warning').length;
      const successCount = results.filter(r => r.status === 'success').length;

      addResult({
        test: 'Schema Health Summary',
        status: errorCount === 0 ? (warningCount === 0 ? 'success' : 'warning') : 'error',
        message: `Current Schema Status: ${errorCount} errors, ${warningCount} warnings, ${successCount} passed`,
        details: {
          timestamp,
          totalTests: results.length + 1,
          errors: errorCount,
          warnings: warningCount,
          successes: successCount,
          healthScore: Math.round((successCount / (results.length + 1)) * 100)
        }
      });

    } catch (err) {
      addResult({
        test: 'General Diagnostics',
        status: 'error',
        message: `Unexpected error: ${err}`,
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  const fixUserProfile = async () => {
    if (!user) return;

    setFixing(true);
    try {
      // Try to create missing user profile
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert([{
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email || 'Unknown User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        if (createError.message.includes('duplicate key')) {
          addResult({
            test: 'Fix User Profile',
            status: 'success',
            message: 'User profile already exists',
            details: createError
          });
        } else {
          addResult({
            test: 'Fix User Profile',
            status: 'error',
            message: `Failed to create user profile: ${createError.message}`,
            details: createError
          });
        }
      } else {
        addResult({
          test: 'Fix User Profile',
          status: 'success',
          message: 'User profile created successfully!',
          details: newProfile
        });
      }
    } catch (err) {
      addResult({
        test: 'Fix User Profile',
        status: 'error',
        message: `Exception during fix: ${err}`,
        details: err
      });
    } finally {
      setFixing(false);
    }
  };

  const fixJobProfileSchema = async () => {
    if (!user) return;

    setFixing(true);
    addResult({
      test: 'Schema Fix',
      status: 'warning',
      message: 'Schema fixes require database admin access. Run the migration manually.',
      details: {
        instruction: 'Copy the contents of 20250804_fix_missing_job_profile_columns.sql to Supabase Dashboard SQL Editor',
        file_location: 'src/supabase/migrations/20250804_fix_missing_job_profile_columns.sql'
      }
    });
    setFixing(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20';
    }
  };

  if (!user) {
    return (
      <div className="bg-primary rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-secondary">Please log in to run database diagnostics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary flex items-center">
          <Database className="h-6 w-6 text-purple-600 mr-2" />
          Database Migration Helper
        </h2>
        <div className="text-xs text-secondary bg-yellow-100 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
          TEMPORARY DEBUG TOOL
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Purpose</h3>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          This tool diagnoses and fixes the foreign key constraint error preventing job profile creation.
          The issue occurs when users exist in auth.users but not in user_profiles table.
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Run Diagnostics
        </button>

        <button
          onClick={fixUserProfile}
          disabled={fixing}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {fixing ? (
            <Loader className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Wrench className="h-4 w-4 mr-2" />
          )}
          Fix User Profile
        </button>

        <button
          onClick={fixJobProfileSchema}
          disabled={fixing}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {fixing ? (
            <Loader className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Fix Schema
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-primary">Diagnostic Results</h3>
          {results.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start">
                {getStatusIcon(result.status)}
                <div className="ml-3 flex-1">
                  <h4 className="font-medium text-primary">{result.test}</h4>
                  <p className="text-sm text-secondary mt-1">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-secondary cursor-pointer hover:underline">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-primary mb-2">User Information</h3>
        <div className="text-sm text-secondary space-y-1">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}