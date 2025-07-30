import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setMessage({
            type: 'error',
            text: 'Authentication failed. Please try again.'
          });
        } else if (data.session) {
          setMessage({
            type: 'success',
            text: 'Email confirmed successfully! Redirecting to your dashboard...'
          });
          setTimeout(() => navigate('/'), 2000);
        } else {
          setMessage({
            type: 'error',
            text: 'No session found. Please try signing in again.'
          });
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: 'An unexpected error occurred.'
        });
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-20">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {loading ? (
            <div className="space-y-4">
              <Loader className="h-12 w-12 text-purple-600 mx-auto animate-spin" />
              <h2 className="text-xl font-bold text-gray-900">Confirming your email...</h2>
              <p className="text-gray-600">Please wait while we verify your account.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {message?.type === 'success' ? (
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              ) : (
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              )}
              <h2 className={`text-xl font-bold ${message?.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                {message?.type === 'success' ? 'Email Confirmed!' : 'Confirmation Failed'}
              </h2>
              <p className="text-gray-600">{message?.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}