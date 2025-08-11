import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { useUser } from '../contexts/userContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser(); // Preserve Rashenal session
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const provider = window.location.pathname.includes('outlook') ? 'outlook' : 'gmail';

      if (error) {
        setStatus('error');
        setMessage(`OAuth error: ${error}. Your Rashenal session is still active.`);
        setTimeout(() => {
          // Redirect to preferences if user is logged in, otherwise to login
          navigate(user ? '/preferences' : '/auth');
        }, 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received. Your Rashenal session is still active.');
        setTimeout(() => {
          navigate(user ? '/preferences' : '/auth');
        }, 3000);
        return;
      }

      try {
        // TODO: Exchange code for access token
        // For now, just simulate success
        console.log(`${provider} OAuth code received:`, code);
        console.log('Current user:', user); // Debug user session
        
        setStatus('success');
        setMessage(`Successfully connected to ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
        
        // Store connection status with more details
        const connectionData = {
          connected: true,
          connectedAt: new Date().toISOString(),
          provider: provider,
          authCode: code,
          permissions: ['Mail.Read', 'User.Read', 'offline_access']
        };
        localStorage.setItem(`${provider}_connection`, JSON.stringify(connectionData));
        
        // Navigate immediately to preserve session
        setTimeout(() => {
          window.location.href = '/preferences#email';
        }, 1500);
      } catch (err) {
        setStatus('error');
        setMessage('Failed to process OAuth callback');
        setTimeout(() => {
          navigate(user ? '/preferences' : '/auth');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="h-12 w-12 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
        <div className="mb-6 flex justify-center">
          {getIcon()}
        </div>
        
        <h2 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {status === 'loading' && 'Connecting...'}
          {status === 'success' && 'Connected!'}
          {status === 'error' && 'Connection Failed'}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        
        {status !== 'loading' && (
          <button
            onClick={() => window.location.href = '/preferences#email'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Settings
          </button>
        )}
        
        {status === 'loading' && (
          <p className="text-sm text-gray-500">
            This will take just a moment...
          </p>
        )}
      </div>
    </div>
  );
}