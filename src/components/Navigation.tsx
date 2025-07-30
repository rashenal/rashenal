// src/components/Navigation.tsx
// Updated navigation with cleaned up auth logic and brand name

import React, { useState } from 'react';
import { Sparkles, Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/userContext';

interface NavigationProps {
  onContactFormOpen?: () => void;
}

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
              {/* ✅ REMOVED: Dashboard link since it's now part of myRashenal */}
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