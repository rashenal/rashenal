import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Share2,
  Eye,
  MessageSquare,
  Heart,
  BarChart3,
  Settings,
  Copy,
  Download,
  Upload,
  Sparkles,
  Users,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Hash,
  Image,
  Video,
  FileText,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Timer,
  X
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import { ContentGenerator } from '../services/ContentGenerator';
import { VoiceLearning } from '../services/VoiceLearning';
import BatchContentCreator from './BatchContentCreator';

// Types
interface SocialPost {
  id: string;
  title: string;
  content: string;
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'youtube';
  scheduled_date: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  engagement_metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  media_urls: string[];
  hashtags: string[];
  optimal_time?: string;
  content_type: 'motivational' | 'educational' | 'milestone' | 'story' | 'tips' | 'celebration';
  generated_by_ai: boolean;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

interface CalendarView {
  type: 'month' | 'week' | 'day';
  date: Date;
}

interface ContentTemplate {
  id: string;
  name: string;
  category: 'transformation' | 'habits' | 'motivation' | 'education';
  template: string;
  variables: string[];
  platforms: string[];
  optimal_times: string[];
}

const platformIcons = {
  linkedin: <Linkedin size={16} className="text-blue-600" />,
  twitter: <Twitter size={16} className="text-blue-400" />,
  instagram: <Instagram size={16} className="text-pink-600" />,
  facebook: <Facebook size={16} className="text-blue-700" />,
  youtube: <Youtube size={16} className="text-red-600" />
};

const platformColors = {
  linkedin: 'bg-blue-100 border-blue-300 text-blue-800',
  twitter: 'bg-blue-50 border-blue-200 text-blue-700',
  instagram: 'bg-pink-100 border-pink-300 text-pink-800',
  facebook: 'bg-blue-100 border-blue-300 text-blue-800',
  youtube: 'bg-red-100 border-red-300 text-red-800'
};

const contentTemplates: ContentTemplate[] = [
  {
    id: 'motivational-monday',
    name: 'Motivational Monday',
    category: 'motivation',
    template: '🌟 Monday Motivation: {message}\n\nThis week, I\'m focusing on {focus_area}.\n\nWhat\'s your Monday motivation? 💪\n\n{hashtags}',
    variables: ['message', 'focus_area'],
    platforms: ['linkedin', 'twitter', 'instagram'],
    optimal_times: ['09:00', '17:00']
  },
  {
    id: 'transformation-tuesday',
    name: 'Transformation Tuesday',
    category: 'transformation',
    template: '🔄 Transformation Tuesday\n\nProgress update: {milestone}\n\nThe journey isn\'t always linear, but every step counts.\n\n{reflection}\n\n{hashtags}',
    variables: ['milestone', 'reflection'],
    platforms: ['linkedin', 'instagram', 'facebook'],
    optimal_times: ['12:00', '18:00']
  },
  {
    id: 'wisdom-wednesday',
    name: 'Wisdom Wednesday',
    category: 'education',
    template: '💡 Wisdom Wednesday\n\nKey insight: {insight}\n\nHere\'s what I learned: {lesson}\n\nApply this by: {action_step}\n\n{hashtags}',
    variables: ['insight', 'lesson', 'action_step'],
    platforms: ['linkedin', 'twitter', 'facebook'],
    optimal_times: ['10:00', '16:00']
  },
  {
    id: 'habit-streak',
    name: 'Habit Streak Celebration',
    category: 'habits',
    template: '🎉 Day {streak_count} of {habit_name}!\n\n{achievement_message}\n\nConsistency builds momentum. What habit are you building?\n\n{hashtags}',
    variables: ['streak_count', 'habit_name', 'achievement_message'],
    platforms: ['instagram', 'twitter', 'linkedin'],
    optimal_times: ['08:00', '20:00']
  }
];

export default function SocialMediaCalendar() {
  const { user } = useUser();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [view, setView] = useState<CalendarView>({ type: 'month', date: new Date() });
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchMode, setShowBatchMode] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [draggedPost, setDraggedPost] = useState<string | null>(null);
  const [contentForm, setContentForm] = useState<Partial<SocialPost>>({
    content: '',
    platform: 'linkedin',
    content_type: 'motivational',
    hashtags: [],
    media_urls: []
  });

  // Load posts and initialize services
  useEffect(() => {
    if (user) {
      loadPosts();
      ContentGenerator.initialize(user.id);
      VoiceLearning.initialize(user.id);
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockPosts: SocialPost[] = [
        {
          id: '1',
          title: 'Monday Motivation',
          content: '🌟 Starting this Monday with intention and purpose. This week, I\'m focusing on building better morning routines.\n\nWhat\'s your Monday motivation? 💪\n\n#MondayMotivation #Habits #PersonalGrowth',
          platform: 'linkedin',
          scheduled_date: new Date(2025, 7, 12, 9, 0),
          status: 'scheduled',
          engagement_metrics: { views: 0, likes: 0, comments: 0, shares: 0 },
          media_urls: [],
          hashtags: ['MondayMotivation', 'Habits', 'PersonalGrowth'],
          optimal_time: '09:00',
          content_type: 'motivational',
          generated_by_ai: true,
          user_id: user?.id || '',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          title: 'Habit Streak Update',
          content: '🎉 Day 30 of daily meditation!\n\nWhat started as a 5-minute commitment has transformed my entire day. The clarity and calm I feel is incredible.\n\nConsistency builds momentum. What habit are you building?\n\n#HabitStreaks #Meditation #Mindfulness #PersonalDevelopment',
          platform: 'instagram',
          scheduled_date: new Date(2025, 7, 13, 18, 0),
          status: 'draft',
          engagement_metrics: { views: 0, likes: 0, comments: 0, shares: 0 },
          media_urls: ['meditation-progress.jpg'],
          hashtags: ['HabitStreaks', 'Meditation', 'Mindfulness', 'PersonalDevelopment'],
          optimal_time: '18:00',
          content_type: 'milestone',
          generated_by_ai: false,
          user_id: user?.id || '',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      setPosts(mockPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const generateContent = async (template: ContentTemplate, customInputs?: Record<string, string>) => {
    setIsGeneratingContent(true);
    try {
      const generatedContent = await ContentGenerator.generateFromTemplate(
        template,
        customInputs || {}
      );
      
      const newPost: Partial<SocialPost> = {
        content: generatedContent.content,
        hashtags: generatedContent.hashtags,
        platform: 'linkedin',
        content_type: template.category as any,
        generated_by_ai: true,
        scheduled_date: new Date()
      };

      setContentForm(newPost);
      setShowCreateModal(true);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const createPost = async () => {
    if (!user) return;

    const newPost: SocialPost = {
      id: `post-${Date.now()}`,
      title: contentForm.content?.split('\n')[0] || 'Untitled Post',
      content: contentForm.content || '',
      platform: contentForm.platform || 'linkedin',
      scheduled_date: contentForm.scheduled_date || new Date(),
      status: 'draft',
      engagement_metrics: { views: 0, likes: 0, comments: 0, shares: 0 },
      media_urls: contentForm.media_urls || [],
      hashtags: contentForm.hashtags || [],
      content_type: contentForm.content_type || 'motivational',
      generated_by_ai: contentForm.generated_by_ai || false,
      user_id: user.id,
      created_at: new Date(),
      updated_at: new Date()
    };

    setPosts(prev => [...prev, newPost]);
    setShowCreateModal(false);
    setContentForm({});
  };

  const schedulePost = (postId: string, newDate: Date) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, scheduled_date: newDate, status: 'scheduled' as const }
        : post
    ));
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduled_date);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const generateCalendarDays = () => {
    const days = [];
    const startOfMonth = new Date(view.date.getFullYear(), view.date.getMonth(), 1);
    const endOfMonth = new Date(view.date.getFullYear(), view.date.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === view.date.getMonth();
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const postsForDay = getPostsForDate(currentDate);

      days.push({
        date: currentDate,
        isCurrentMonth,
        isToday,
        posts: postsForDay
      });
    }
    return days;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    setDraggedPost(postId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    if (draggedPost) {
      schedulePost(draggedPost, targetDate);
      setDraggedPost(null);
    }
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 min-h-96 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Social Media Calendar</h2>
          <p className="text-gray-600 mb-6">
            Please log in to access your AI-powered content planning dashboard.
          </p>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
            Log In to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Social Media Calendar
                </h1>
                <p className="text-gray-600">AI-Powered Content Planning & Scheduling</p>
              </div>
            </div>
            
            {/* Value Proposition */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Save $1,080/year vs competitors
              </div>
              <div className="text-sm text-gray-600">
                Supagrow: $99/mo • <span className="text-purple-600 font-semibold">Rashenal: $9/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              {/* View Controls */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {['month', 'week', 'day'].map((viewType) => (
                  <button
                    key={viewType}
                    onClick={() => setView(prev => ({ ...prev, type: viewType as any }))}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      view.type === viewType
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                  </button>
                ))}
              </div>

              {/* Date Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setView(prev => ({
                    ...prev,
                    date: new Date(prev.date.getFullYear(), prev.date.getMonth() - 1, 1)
                  }))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <h3 className="text-lg font-semibold text-gray-900 min-w-48 text-center">
                  {view.date.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </h3>
                
                <button
                  onClick={() => setView(prev => ({
                    ...prev,
                    date: new Date(prev.date.getFullYear(), prev.date.getMonth() + 1, 1)
                  }))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus size={16} />
                <span>Create Post</span>
              </button>
              
              <button
                onClick={() => setShowBatchMode(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
              >
                <Sparkles size={16} />
                <span>AI Batch Generate</span>
              </button>
              
              <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Body */}
          <div className="grid grid-cols-7">
            {generateCalendarDays().map((day, index) => (
              <div
                key={index}
                className={`min-h-32 p-2 border-b border-r border-gray-100 ${
                  !day.isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${day.isToday ? 'bg-blue-50' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day.date)}
              >
                <div className={`text-sm font-medium mb-2 ${
                  !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                } ${day.isToday ? 'text-blue-600' : ''}`}>
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {day.posts.slice(0, 2).map(post => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, post.id)}
                      onClick={() => setSelectedPost(post)}
                      className={`text-xs p-2 rounded border cursor-pointer hover:shadow-md transition-all ${
                        platformColors[post.platform]
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {platformIcons[post.platform]}
                        <span className="text-xs">{formatTime(post.scheduled_date)}</span>
                      </div>
                      <div className="truncate font-medium">
                        {post.content.split('\n')[0]}
                      </div>
                      {post.generated_by_ai && (
                        <div className="flex items-center mt-1">
                          <Sparkles size={10} className="text-purple-500 mr-1" />
                          <span className="text-xs text-purple-600">AI</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {day.posts.length > 2 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{day.posts.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Templates */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Templates</h3>
            <div className="flex items-center space-x-2">
              {isGeneratingContent && (
                <div className="flex items-center space-x-2 text-purple-600">
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-sm">Generating...</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contentTemplates.map(template => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => generateContent(template)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <Sparkles size={16} className="text-purple-500" />
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {template.template.substring(0, 60)}...
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {template.platforms.slice(0, 3).map(platform => (
                      <span key={platform} className="text-xs">
                        {platformIcons[platform as keyof typeof platformIcons]}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {template.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">This Month</h4>
              <BarChart3 className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {posts.filter(p => p.scheduled_date.getMonth() === new Date().getMonth()).length}
            </div>
            <div className="text-sm text-gray-600">Posts Scheduled</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">AI Generated</h4>
              <Sparkles className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round((posts.filter(p => p.generated_by_ai).length / Math.max(posts.length, 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Content Automated</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Engagement</h4>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">+127%</div>
            <div className="text-sm text-gray-600">vs Last Month</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Time Saved</h4>
              <Timer className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">12.5h</div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
        </div>
      </div>

      {/* Batch Content Creator */}
      <BatchContentCreator
        isOpen={showBatchMode}
        onClose={() => setShowBatchMode(false)}
        onBatchComplete={(posts) => {
          // Add generated posts to the calendar
          const newPosts = posts.map(post => ({
            ...post,
            user_id: user?.id || '',
            created_at: new Date(),
            updated_at: new Date(),
            status: 'scheduled' as const,
            generated_by_ai: true,
            engagement_metrics: { views: 0, likes: 0, comments: 0, shares: 0 },
            media_urls: []
          }));
          setPosts(prev => [...prev, ...newPosts]);
          setShowBatchMode(false);
        }}
      />

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Create Social Media Post</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setContentForm({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Platform
                </label>
                <div className="flex space-x-3">
                  {Object.entries(platformIcons).map(([platform, icon]) => (
                    <button
                      key={platform}
                      onClick={() => setContentForm(prev => ({ ...prev, platform: platform as any }))}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        contentForm.platform === platform
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                      <span className="capitalize">{platform}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={contentForm.content || ''}
                  onChange={(e) => setContentForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your post content..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={6}
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hashtags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {contentForm.hashtags?.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center"
                    >
                      #{tag}
                      <button
                        onClick={() => setContentForm(prev => ({
                          ...prev,
                          hashtags: prev.hashtags?.filter((_, i) => i !== index)
                        }))}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add hashtags (press Enter)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newTag = e.currentTarget.value.trim().replace('#', '');
                      setContentForm(prev => ({
                        ...prev,
                        hashtags: [...(prev.hashtags || []), newTag]
                      }));
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    value={contentForm.scheduled_date?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setContentForm(prev => ({ 
                      ...prev, 
                      scheduled_date: new Date(e.target.value) 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={contentForm.scheduled_date?.toTimeString().slice(0, 5) || ''}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(contentForm.scheduled_date || new Date());
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setContentForm(prev => ({ ...prev, scheduled_date: newDate }));
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setContentForm({});
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createPost}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}