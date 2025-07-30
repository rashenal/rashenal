import React, { useEffect, useState } from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Navigation from './components/Navigation';
import LandingPage from './components/LandingPageApp';
import TaskBoard from './components/SmartTasks';
import TaskBoardDemo from './components/DemoPage';
import AuthForm from './components/AuthForm';
import ContactForm from './components/ContactForm';
import Newsletter from './components/Newsletter';
import AICoachingDashboard from './components/AICoachingDashboard';

import { supabase } from './supabase/supabaseClient';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      <Router>
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route
              path="/tasks"
              element={session ? <TaskBoard /> : <Navigate to="/auth" replace />}
            />
            <Route
              path="/dashboard"
              element={session ? <AICoachingDashboard /> : <Navigate to="/auth" replace />}
            />
            <Route path="/demo" element={<TaskBoardDemo />} />
            <Route path="/contact" element={<ContactForm />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;
