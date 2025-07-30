import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DatabaseTest from './components/DatabaseTest'; 
import DemoPage from './pages/DemoPage';
import LandingPageApp from './components/LandingPageApp';
import { Play, Target, MessageCircle, Kanban, TrendingUp, Star, ArrowRight, CheckCircle, Users, Sparkles, Menu, X, Bot, BarChart3, Plus, Edit3, Trash2, Clock, Zap, AlertCircle, CheckCircle2, Paperclip, RotateCcw, Save, RefreshCcw, FolderPlus, Lightbulb, Eye, Bell, Calendar, Settings, ChevronDown, Copy, Database } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import ContactForm from './components/ContactForm';
import Navigation from './components/Navigation';
import Newsletter from './components/Newsletter';
import AuthSignup from './components/AuthSignup';
import AICoachingDashboard from './components/AICoachingDashboard';
import AIHabitTracker from './components/AIHabitTracker';
import SmartTasks from './components/SmartTasks';
import Blog from './pages/Blog';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Community from './pages/Community';
import Learning from './pages/Learning';
import Courses from './pages/Courses';
import AIVisionMovies from './pages/services/AIVisionMovies';
import TaskManagement from './pages/services/TaskManagement';
import HabitTracking from './pages/services/HabitTracking';
import AccountabilityPartners from './pages/services/AccountabilityPartners';



function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPageApp />} />  {/* ✅ Use extracted component */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/services/ai-vision-movies" element={<AIVisionMovies />} />
          <Route path="/services/task-management" element={<TaskManagement />} />
          <Route path="/services/habit-tracking" element={<HabitTracking />} />
          <Route path="/services/accountability-partners" element={<AccountabilityPartners />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;