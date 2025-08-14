// components/LandingPageApp.tsx
// Updated with cleaned up navigation

import React, { useState } from 'react';
import {
  Play,
  Target,
  MessageCircle,
  Kanban,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import ContactForm from './ContactForm';
import DemoPage from '../components/DemoPage';
import Blog from '../pages/Blog';
import Community from '../pages/Community';
import Learning from '../pages/Learning';
import Courses from '../pages/Courses';
import Login from '../pages/Login';
import MyRashenalDashboard from './MyRashenalDashboard';

export default function LandingPageApp() {
  const [activeTab, setActiveTab] = useState('about');
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const { user } = useUser();

  // ✅ CLEANED UP: Removed 'demo' and 'login' from main navigation
  const navigationItems = [
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'blog', label: 'Blog' },
    { id: 'community', label: 'Community' },
    { id: 'learning', label: 'Learning' },
    { id: 'courses', label: 'Courses' },
    { id: 'myrashenal', label: 'myRashenal' },
  ];

  // ✅ ADDED: Logout functionality
  const handleLogout = async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.auth.signOut();
      setActiveTab('about'); // Redirect to about page after logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return (
          <div className="content-section">
            <div className="hero-section">
              <div className="hero-content">
                <h1 className="hero-title">
                  Rashenal: AI Assisted Life Management
                </h1>
                <p className="hero-description">
                  Transform your life with AI-powered coaching that combines
                  traditional professional guidance with cutting-edge technology
                  to help you build the habits and mindset needed to achieve
                  your vision.
                </p>
                <div className="hero-buttons">
                  <button
                    className="btn-primary"
                    onClick={() => setActiveTab('myrashenal')}
                  >
                    Start Your Transformation
                  </button>
                  <button className="btn-secondary">Watch My Story</button>
                </div>
              </div>
              <div className="hero-image">
                <div className="placeholder-image">
                  <img
                    src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Professional coaching session"
                    className="w-full h-full object-cover"
                  />
                  <div className="transformed-badge">
                    <span className="badge-dots"></span>
                    <span className="badge-text">500+ Transformed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'services':
        return (
          <div className="content-section">
            <div className="services-section">
              <h2 className="section-title">AI-Powered Coaching Services</h2>
              <p className="section-description">
                Experience the future of personal development with our
                innovative blend of traditional coaching and cutting-edge AI
                technology
              </p>
              <div className="services-grid">
                <div className="service-card">
                  <div className="service-icon play-icon">
                    <Play className="h-7 w-7 text-white" />
                  </div>
                  <h3>AI Vision Movies</h3>
                  <p>
                    Experience your future success through personalized
                    AI-generated movies featuring you as the star of your
                    transformation story.
                  </p>
                  <button className="learn-more-btn">Learn More →</button>
                </div>
                <div className="service-card">
                  <div className="service-icon chat-icon">
                    <MessageCircle className="h-7 w-7 text-white" />
                  </div>
                  <h3>AI Accountability Partner</h3>
                  <p>
                    Stay motivated with your personal AI accountability partner
                    that speaks in your voice or mine, providing 24/7 support.
                  </p>
                  <button className="learn-more-btn">Learn More →</button>
                </div>
                <div className="service-card">
                  <div className="service-icon task-icon">
                    <Kanban className="h-7 w-7 text-white" />
                  </div>
                  <h3>Smart Task Management</h3>
                  <p>
                    Organize your transformation journey with our intuitive
                    drag-and-drop kanban board, private or shared with partners.
                  </p>
                  <button className="learn-more-btn">Learn More →</button>
                </div>
                <div className="service-card">
                  <div className="service-icon habit-icon">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <h3>New Habit Tracking</h3>
                  <p>
                    Build lasting change with our intelligent habit tracking
                    system that adapts to your lifestyle and goals.
                  </p>
                  <button className="learn-more-btn">Learn More →</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'myrashenal':
        return <MyRashenalDashboard />;
      case 'blog':
        return (
          <div className="content-section">
            <Blog />
          </div>
        );
      case 'community':
        return (
          <div className="content-section">
            <Community />
          </div>
        );
      case 'learning':
        return (
          <div className="content-section">
            <Learning />
          </div>
        );
      case 'courses':
        return (
          <div className="content-section">
            <Courses />
          </div>
        );
      case 'login':
        return (
          <div className="content-section">
            <Login />
          </div>
        );
      default:
        return (
          <div className="content-section">
            <div className="placeholder-content">
              <h2 className="section-title">
                {navigationItems.find((item) => item.id === activeTab)?.label}
              </h2>
              <p>
                Content for{' '}
                {navigationItems.find((item) => item.id === activeTab)?.label}{' '}
                coming soon...
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <nav className="navigation">
          <div className="nav-brand">
            <div className="logo">
              <img 
                src="/aisista-logo.png" 
                alt="aisista.ai logo" 
                className="logo-icon h-8 w-8 object-contain"
              />
              <span className="brand-name">aisista.ai</span>
            </div>
          </div>

          {/* ✅ CLEANED UP: Main navigation items (removed demo) */}
          <div className="nav-menu">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* ✅ FIXED: Conditional navigation actions based on user login status */}
          <div className="nav-actions">
            {user ? (
              // ✅ Show logout when user is logged in
              <button
                className="nav-item"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : (
              // ✅ Show login/get started when user is not logged in
              <>
                <button
                  className={`nav-item login ${
                    activeTab === 'login' ? 'active' : ''
                  }`}
                  onClick={() => setActiveTab('login')}
                >
                  Login
                </button>
                <button
                  className="btn-get-started"
                  onClick={() => setActiveTab('myrashenal')}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="main-content">{renderContent()}</main>

      <ContactForm
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
      />
    </div>
  );
}