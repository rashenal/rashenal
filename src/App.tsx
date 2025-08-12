import React from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import EnhancedNavigation from './components/EnhancedNavigation';
import InclusiveLandingPage from './components/InclusiveLandingPage';
import TaskBoard from './components/SmartTasks';
import TaskBoardDemo from './components/DemoPage';
import AuthForm from './components/AuthForm';
import ContactForm from './components/ContactForm';
import Newsletter from './components/Newsletter';
import AICoachingDashboard from './components/AICoachingDashboard';
import AIHabitTracker from './components/AIHabitTracker';
import CommunityHub from './components/CommunityHub';
import JobFinderDashboard from './components/JobFinderDashboard';
import SettingsManager from './components/SettingsManager';
import AdminDashboard from './components/AdminDashboard';
import Breadcrumbs from './components/Breadcrumbs';
import DebugDashboard from './components/debug/DebugDashboard';
import OAuthCallback from './components/OAuthCallback';
import IntegrationsHub from './components/IntegrationsHub';
import EmailAgentConfiguration from './components/EmailAgentConfiguration';
import OptimizationDashboard from './components/OptimizationDashboard';
import GoalsManagement from './components/GoalsManagement';
import AIssistents from './components/AIssistents';
import PrivacyDashboard from './components/PrivacyDashboard';
import UserProfileManager from './components/UserProfileManager';
import EnhancedTaskBoard from './components/EnhancedTaskBoard';
import VoiceHub from './pages/voice/VoiceHub';
import { PluginsPage } from './pages/Plugins';
import PersistenceTestScenarios from './tests/PersistenceTestScenarios';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider, useUser } from './contexts/userContext';
import { GamificationProvider } from './contexts/GamificationContext';
import { optimizationInitializer } from './lib/OptimizationInitializer';

// Inner App component that uses the UserContext
function AppRoutes() {
  const { session, loading } = useUser();

  // Initialize optimization system when user is loaded
  React.useEffect(() => {
    if (session) {
      optimizationInitializer.initialize().catch(error => {
        console.error('Failed to initialize optimization system:', error);
      });
    }
  }, [session]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Router>
        <EnhancedNavigation />
        <main className="main-content">
          {/* Breadcrumbs for authenticated pages */}
          {session && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Breadcrumbs />
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<InclusiveLandingPage />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route
              path="/tasks"
              element={session ? <EnhancedTaskBoard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/tasks-old"
              element={session ? <TaskBoard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/dashboard"
              element={session ? <AICoachingDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/habits"
              element={session ? <AIHabitTracker /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/calendar"
              element={session ? <div className="p-8 text-center"><h1 className="text-2xl font-bold">Calendar Coming Soon</h1></div> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/accountability"
              element={session ? <div className="p-8 text-center"><h1 className="text-2xl font-bold">AI Accountability Coming Soon</h1></div> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/aissistents"
              element={session ? <AIssistents /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/voice"
              element={session ? <VoiceHub /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/plugins"
              element={session ? <PluginsPage /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/goals"
              element={session ? <GoalsManagement /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/privacy"
              element={session ? <PrivacyDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/community"
              element={session ? <CommunityHub /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/jobs"
              element={session ? <JobFinderDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/coach"
              element={session ? <AICoachingDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/profile"
              element={session ? <UserProfileManager /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/preferences"
              element={session ? <SettingsManager /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/integrations"
              element={session ? <IntegrationsHub /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/integrations/email-agent/:integration"
              element={session ? <EmailAgentConfiguration integration="outlook" onSave={() => {}} onClose={() => window.history.back()} /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/help"
              element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Help Center Coming Soon</h1></div>}
            />
            <Route
              path="/admin"
              element={session ? <AdminDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/optimization"
              element={session ? <OptimizationDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route path="/demo" element={<TaskBoardDemo />} />
            <Route path="/contact" element={<ContactForm />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/debug" element={<DebugDashboard />} />
            <Route 
              path="/test-persistence" 
              element={session ? <PersistenceTestScenarios /> : <Navigate to="/auth" replace />} 
            />
            <Route path="/auth/outlook/callback" element={<OAuthCallback />} />
            <Route path="/auth/gmail/callback" element={<OAuthCallback />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

// Main App wrapper component
function App() {
  return (
    <UserProvider>
      <GamificationProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </GamificationProvider>
    </UserProvider>
  );
}

export default App;
