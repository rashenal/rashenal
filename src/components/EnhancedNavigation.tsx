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
  Zap,
  User,
  Settings,
  Plug,
  HelpCircle,
  Code,
  LogOut,
  ChevronRight,
  Shield,
  MessageSquare,
  Bot,
  BarChart3,
  Calendar,
  UserCheck,
  Cpu
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/userContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { useRealStats } from '../hooks/useRealStats';
import ContextualSettings from './ContextualSettings';

interface NavigationProps {
  onContactFormOpen?: () => void;
}

const ADMIN_EMAIL = 'rharveybis@hotmail.com';

export default function EnhancedNavigation({ onContactFormOpen }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showContextualSettings, setShowContextualSettings] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { profile, getDisplayName, getInitials } = useUserProfile();
  const { stats } = useRealStats();
  const menuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Main navigation sections
  const mainNavItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'habits', name: 'Habits', icon: Target, href: '/habits' },
    { id: 'tasks', name: 'Smart Tasks', icon: CheckSquare, href: '/tasks' },
    { id: 'jobs', name: 'Job Finder', icon: Briefcase, href: '/jobs' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, href: '/calendar' },
    { id: 'accountability', name: 'AI Accountability', icon: UserCheck, href: '/accountability' },
    { id: 'aissistents', name: 'AIssistents', icon: Cpu, href: '/aissistents' },
    { id: 'goals', name: 'Goals', icon: Trophy, href: '/goals' },
  ];

  const settingsItems = [
    { id: 'profile', name: 'Profile Settings', icon: User, href: '/profile' },
    { id: 'preferences', name: 'Preferences', icon: Settings, href: '/preferences' },
    { id: 'integrations', name: 'Integrations', icon: Plug, href: '/integrations' },
    { id: 'privacy', name: 'Privacy & Encryption', icon: Shield, href: '/privacy' },
  ];

  const bottomItems = [
    { id: 'help', name: 'Help', icon: HelpCircle, href: '/help' },
    ...(isAdmin ? [
      { id: 'admin', name: 'Admin', icon: Shield, href: '/admin' },
      { id: 'optimization', name: 'Token Optimization', icon: BarChart3, href: '/optimization' },
      ...(isDevelopment ? [{ id: 'debug', name: 'Debug', icon: Code, href: '/debug' }] : []),
    ] : []),
  ];

  // Get user's initials for avatar - now uses profile data
  const getUserInitials = () => {
    return getInitials();
  };

  // Use real user stats
  const getUserStats = () => {
    return {
      tasksCompleted: stats.tasksCompleted,
      streak: stats.streak,
      level: stats.level
    };
  };

  const handleLogout = async () => {
    await import('../lib/supabase').then(({ supabase }) =>
      supabase.auth.signOut()
    );
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const handleContactClick = () => {
    if (onContactFormOpen) onContactFormOpen();
    setIsMobileMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    navigate(href);
  };

  // Close menu when clicking outside
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isMobileMenuOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsMobileMenuOpen(false);
          break;
        case 'Tab':
          // Keep focus within the menu
          event.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const userStats = getUserStats();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center space-x-3 text-gray-900 hover:text-blue-600 transition-colors"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">Rashenal AI</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {user && mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:block">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Info & Menu */}
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <button
                    onClick={() => setShowContextualSettings(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="AI Assistant - Voice & Chat Commands"
                  >
                    <Bot className="h-5 w-5" />
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <span className="hidden lg:block text-sm text-gray-600">
                    Welcome, {getDisplayName()}
                  </span>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {getUserInitials()}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Slide-out Navigation Menu */}
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
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">MyRashenal</h2>
              <button
                onClick={toggleMenu}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {user && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-blue-600">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-600 mt-1">
                    <span>{userStats.tasksCompleted} tasks</span>
                    <span>{userStats.streak} day streak</span>
                    <span className="text-blue-600 font-medium">{userStats.level}</span>
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
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isActive
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                          {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
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
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isActive
                              ? 'bg-blue-100 text-blue-700 font-medium'
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
                      Support
                    </h3>
                  </div>
                  
                  <nav className="space-y-1 px-2">
                    {bottomItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.href)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isActive
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                            } ${item.id === 'admin' ? 'text-purple-700 hover:bg-purple-50' : ''}`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.name}</span>
                          {item.id === 'admin' && (
                            <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              Admin
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
                    className="block w-full px-4 py-3 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Get Started
                  </Link>
                  <button
                    onClick={handleContactClick}
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

      {/* Contextual Settings Modal */}
      <ContextualSettings
        isOpen={showContextualSettings}
        onClose={() => setShowContextualSettings(false)}
        currentPage={location.pathname}
      />
    </>
  );
}