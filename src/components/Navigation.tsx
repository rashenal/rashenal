// src/components/Navigation.tsx
// Updated navigation with cleaned up auth logic and brand name

import React, { useState } from 'react';
import { Sparkles, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/userContext';

interface NavigationProps {
  onContactFormOpen?: () => void;
}
// components/Navigation.tsx - Add Job Finder tab
// Import additional icons for the new navigation items
import { LayoutDashboard, CheckSquare, MessageCircle, Target, Briefcase, User, Settings } from 'lucide-react';

// Updated navigation items array with Job Finder and Settings
const navigationItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Smart Tasks', icon: CheckSquare, href: '/tasks' },
  { name: 'Job Finder', icon: Briefcase, href: '/jobs' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];
export default function Navigation({ onContactFormOpen }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const { user } = useUser();

  const handleContactClick = () => {
    if (onContactFormOpen) onContactFormOpen();
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await import('../supabase/supabaseClient').then(({ supabase }) =>
      supabase.auth.signOut()
    );
    navigate('/');
  };

  return (
    <header className="app-header">
      <nav className="navigation">
        <div className="nav-brand">
          <Link to="/" className="logo">
            <Sparkles className="logo-icon" />
            {/* ✅ CHANGED: Updated brand name */}
            <span className="brand-name">Rashenal AI</span>
          </Link>
        </div>

        <div className="nav-menu">
          {user ? (
            <>
              {/* Navigation items for authenticated users */}
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-item flex items-center space-x-1 ${
                      isActive ? 'active' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
              
              <button onClick={handleLogout} className="nav-item">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="nav-item login">
                Sign In
              </Link>
              <Link to="/auth" className="btn-get-started">
                Get Started
              </Link>
            </>
          )}
        </div>

        <div
          className="mobile-menu-icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </div>
      </nav>
    </header>
  );
}