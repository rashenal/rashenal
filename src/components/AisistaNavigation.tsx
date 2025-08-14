import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Menu,
  X,
  Home,
  CheckSquare,
  Target,
  Trophy,
  Briefcase,
  User,
  Settings,
  HelpCircle,
  Code,
  LogOut,
  ChevronRight,
  Shield,
  MessageSquare,
  Bot,
  BarChart3,
  Calendar,
  Lightbulb,
  Zap,
  Mic,
  Search,
  Bell
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/userContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { useRealStats } from '../hooks/useRealStats';

interface NavigationProps {
  onContactFormOpen?: () => void;
}

const ADMIN_EMAIL = 'rharveybis@hotmail.com';

export default function AisistaNavigation({ onContactFormOpen }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { profile, getDisplayName, getInitials } = useUserProfile();
  const { stats } = useRealStats();
  const menuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const aiChatRef = useRef<HTMLDivElement>(null);
  
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Main navigation items - updated with new names
  const mainNavItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'habits', name: 'Habits', icon: Target, href: '/habits' },
    { id: 'projects', name: 'Projects', icon: CheckSquare, href: '/tasks' }, // renamed from Smart Tasks
    { id: 'jobs', name: 'Jobs', icon: Briefcase, href: '/jobs' }, // renamed from Job Finder
    { id: 'goals', name: 'Goals', icon: Trophy, href: '/goals' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, href: '/calendar' },
  ];

  const settingsItems = [
    { id: 'profile', name: 'Profile Settings', icon: User, href: '/profile' },
    { id: 'preferences', name: 'Preferences', icon: Settings, href: '/preferences' },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield, href: '/privacy' },
  ];

  // Admin items with Innovation Labs
  const adminItems = [
    { id: 'innovation-labs', name: 'Innovation Labs', icon: Lightbulb, href: '/admin/labs' },
    { id: 'admin', name: 'System Admin', icon: Shield, href: '/admin' },
    { id: 'optimization', name: 'Performance', icon: BarChart3, href: '/optimization' },
    ...(isDevelopment ? [{ id: 'debug', name: 'Debug Console', icon: Code, href: '/debug' }] : []),
  ];

  const bottomItems = [
    { id: 'help', name: 'Help & Support', icon: HelpCircle, href: '/help' },
    ...(isAdmin ? adminItems : []),
  ];

  // AI Assistant Messages - different greetings like Claude would give
  const getAIGreeting = () => {
    const hour = new Date().getHours();
    const name = getDisplayName();
    
    if (hour < 12) {
      return `Good morning, ${name}! I'm here to help you make the most of today. What would you like to focus on?`;
    } else if (hour < 17) {
      return `Hello ${name}! How can I support your goals and projects this afternoon?`;
    } else {
      return `Good evening, ${name}! Let's review your progress and plan for tomorrow. How can I assist?`;
    }
  };

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;
    
    // Here you would integrate with your AI chat system
    console.log('AI Message:', aiMessage);
    setAiMessage('');
    // Navigate to full AI coach if needed
    navigate('/coach');
  };

  const handleVoiceToggle = () => {
    setVoiceEnabled(!voiceEnabled);
    // Here you would integrate with voice commands
    if (!voiceEnabled) {
      console.log('Voice commands activated');
    } else {
      console.log('Voice commands deactivated');
    }
  };

  const handleLogout = async () => {
    await import('../lib/supabase').then(({ supabase }) =>
      supabase.auth.signOut()
    );
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    navigate(href);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        overlayRef.current &&
        event.target === overlayRef.current
      ) {
        setIsMobileMenuOpen(false);
      }
      
      if (
        showAIChat &&
        aiChatRef.current &&
        !aiChatRef.current.contains(event.target as Node)
      ) {
        setShowAIChat(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen, showAIChat]);

  const userStats = {
    tasksCompleted: stats?.tasksCompleted || 0,
    streak: stats?.streak || 0,
    level: stats?.level || 'Starter'
  };

  return (
    <>
      {/* Elegant Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-purple-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* aisista.ai Brand Logo */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center space-x-3 text-gray-900 hover:text-purple-600 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-purple-200 transition-all duration-300">
                  <img 
                    src="/aisista-logo.png" 
                    alt="aisista.ai logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    aisista.ai
                  </span>
                  <span className="text-xs text-gray-500 -mt-1">powered by Rashenal</span>
                </div>
              </Link>
            </div>

            {/* Immediate AI Conversation - Center */}
            {user && (
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div 
                  className="w-full relative"
                  ref={aiChatRef}
                >
                  <button
                    onClick={() => setShowAIChat(!showAIChat)}
                    className="w-full flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <Bot className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-600 text-left flex-1 truncate">
                      {getAIGreeting()}
                    </span>
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                  </button>

                  {/* Quick AI Chat Dropdown */}
                  {showAIChat && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-purple-100 p-4 z-50">
                      <div className="mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Bot className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-gray-900">Quick Chat</span>
                          <div className="flex items-center space-x-1 ml-auto">
                            <button
                              onClick={handleVoiceToggle}
                              className={`p-1 rounded-lg transition-colors ${
                                voiceEnabled 
                                  ? 'bg-purple-100 text-purple-600' 
                                  : 'text-gray-400 hover:text-purple-600'
                              }`}
                              title="Voice Commands"
                            >
                              <Mic className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {getAIGreeting()}
                        </p>
                      </div>
                      
                      <form onSubmit={handleAISubmit} className="space-y-3">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={aiMessage}
                            onChange={(e) => setAiMessage(e.target.value)}
                            placeholder="Ask me anything..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
                          >
                            Send
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['Start with this', 'Review my day', 'Quick motivation', 'Time to focus'].map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setAiMessage(suggestion)}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-purple-100 hover:text-purple-700 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </form>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <Link
                          to="/coach"
                          onClick={() => setShowAIChat(false)}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Open full AI Coach →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {user && mainNavItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 shadow-sm' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-purple-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Actions & Menu */}
            <div className="flex items-center space-x-3">
              {user && (
                <>
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {getInitials()}
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-sm font-medium text-gray-900">{getDisplayName()}</div>
                      <div className="text-xs text-gray-500">{userStats.streak} day streak</div>
                    </div>
                  </div>
                  
                  <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                    <Bell className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile AI Chat Bar */}
      {user && (
        <div className="md:hidden sticky top-16 z-30 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-3">
          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Bot className="h-5 w-5 text-purple-600" />
            <span className="text-gray-700 text-left flex-1 truncate text-sm">
              Hi {getDisplayName()}! How can I help today?
            </span>
            <MessageSquare className="h-4 w-4 text-purple-400" />
          </button>
        </div>
      )}

      {/* Enhanced Slide-out Navigation Menu */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          ref={menuRef}
          className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Menu Header */}
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    aisista.ai
                  </h2>
                  <p className="text-xs text-gray-500">Your AI companion</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {user && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">
                    {getInitials()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayName()}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                    <span>{userStats.tasksCompleted} tasks</span>
                    <span>{userStats.streak} day streak</span>
                    <span className="text-purple-600 font-medium">{userStats.level}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Menu Content */}
          <div className="flex flex-col h-full">
            {user ? (
              <>
                {/* Main Navigation */}
                <div className="flex-1 overflow-y-auto py-2">
                  <div className="px-4 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Main
                    </h3>
                  </div>
                  
                  <nav className="space-y-1 px-2">
                    {mainNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.href)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                          {isActive && <ChevronRight className="h-4 w-4 ml-auto text-purple-500" />}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Settings Section */}
                  <div className="px-4 py-2 mt-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Settings
                    </h3>
                  </div>
                  
                  <nav className="space-y-1 px-2">
                    {settingsItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.href)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            isActive
                              ? 'bg-purple-100 text-purple-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </nav>

                  {/* Bottom Section */}
                  <div className="px-4 py-2 mt-6">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {isAdmin ? 'Admin & Support' : 'Support'}
                    </h3>
                  </div>
                  
                  <nav className="space-y-1 px-2">
                    {bottomItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      const isInnovationLabs = item.id === 'innovation-labs';
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.href)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            isActive
                              ? 'bg-purple-100 text-purple-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          } ${isInnovationLabs ? 'bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100' : ''}`}
                        >
                          <Icon className={`h-5 w-5 ${isInnovationLabs ? 'text-yellow-600' : ''}`} />
                          <span className={isInnovationLabs ? 'font-medium text-yellow-800' : ''}>{item.name}</span>
                          {isInnovationLabs && (
                            <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                              BETA
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Sign Out Button */}
                <div className="border-t bg-gray-50 p-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              /* Unauthenticated Menu */
              <div className="p-4">
                <div className="space-y-3">
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    Get Started
                  </Link>
                  <button
                    onClick={() => {
                      if (onContactFormOpen) onContactFormOpen();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full px-4 py-3 text-center text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}