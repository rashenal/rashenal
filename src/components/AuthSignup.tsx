import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useUser } from '../contexts/userContext'; // Fixed import

export default function AuthSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const { signUp, signIn, resendConfirmation } = useUser(); // Now using useUser consistently

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await signIn(formData.email, formData.password);

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setMessage({
              type: 'info',
              text: 'Please check your email and click the confirmation link before signing in.',
            });
          } else {
            setMessage({
              type: 'error',
              text: error.message,
            });
          }
        } else if (data.user) {
          setMessage({
            type: 'success',
            text: 'Successfully signed in! Welcome to your AI coaching platform.',
          });
        }
      } else {
        // Sign up
        if (formData.password !== formData.confirmPassword) {
          setMessage({
            type: 'error',
            text: 'Passwords do not match',
          });
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setMessage({
            type: 'error',
            text: 'Password must be at least 6 characters long',
          });
          setLoading(false);
          return;
        }

        const { data, error } = await signUp(
          formData.email,
          formData.password,
          {
            full_name: formData.name,
          }
        );

        if (error) {
          setMessage({
            type: 'error',
            text: error.message,
          });
        } else {
          setMessage({
            type: 'success',
            text: 'Account created! Please check your email for a confirmation link.',
          });
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
          });
        }
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An unexpected error occurred',
      });
    }

    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleResendConfirmation = async () => {
    if (!formData.email) {
      setMessage({
        type: 'error',
        text: 'Please enter your email address',
      });
      return;
    }

    setLoading(true);
    const { error } = await resendConfirmation(formData.email);

    if (error) {
      setMessage({
        type: 'error',
        text: error.message,
      });
    } else {
      setMessage({
        type: 'success',
        text: 'Confirmation email sent! Please check your inbox.',
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🤖</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Coaching Platform
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isLogin ? 'Welcome Back' : 'Join the AI Revolution'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin
              ? 'Access your personalized AI coaching dashboard'
              : 'Create your account and start your transformation with AI'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Message Display */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              {message.type === 'success' && (
                <CheckCircle className="h-5 w-5" />
              )}
              {message.type === 'error' && <AlertCircle className="h-5 w-5" />}
              {message.type === 'info' && <AlertCircle className="h-5 w-5" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading && <Loader className="h-5 w-5 animate-spin" />}
              <span>
                {loading
                  ? 'Processing...'
                  : isLogin
                  ? 'Sign In to AI Platform'
                  : 'Create AI Account'}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin
                ? 'Don\'t have an account? '
                : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage(null);
                  setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    name: '',
                  });
                }}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Resend confirmation link */}
          {message?.type === 'info' &&
            message.text.includes('confirmation') && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleResendConfirmation}
                  disabled={loading}
                  className="text-sm text-purple-600 hover:text-purple-700 underline disabled:opacity-50"
                >
                  Resend confirmation email
                </button>
              </div>
            )}
        </div>

        {/* Features Preview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
            🚀 AI Coaching Features
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-purple-500">🤖</span>
              <span className="text-gray-700">AI Coach Dashboard</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-500">📊</span>
              <span className="text-gray-700">Smart Habit Tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">🎯</span>
              <span className="text-gray-700">Goal Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500">📈</span>
              <span className="text-gray-700">Progress Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
