import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  X,
  Edit3,
  Copy,
  Trash2,
  Play,
  Pause,
  Send,
  FileText,
  Hash,
  Image,
  Target,
  Zap,
  BarChart3,
  Settings,
  Shuffle,
  Filter,
  Search,
  Plus,
  Save
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import { ContentGenerator } from '../services/ContentGenerator';
import { VoiceLearning } from '../services/VoiceLearning';
import { EngagementTracker } from '../services/EngagementTracker';

interface BatchContentCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchComplete: (posts: any[]) => void;
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

interface GeneratedPost {
  id: string;
  content: string;
  platform: string;
  scheduled_date: Date;
  hashtags: string[];
  content_type: string;
  engagement_score: number;
  selected: boolean;
  customized: boolean;
  original_template: string;
}

interface BatchSettings {
  timeRange: 'week' | 'month' | '3months';
  postsPerWeek: number;
  platforms: string[];
  contentTypes: string[];
  optimalTimingOnly: boolean;
  diversifyContent: boolean;
  includeWeekends: boolean;
  customVariables: Record<string, string>;
}

const defaultBatchSettings: BatchSettings = {
  timeRange: 'week',
  postsPerWeek: 7,
  platforms: ['linkedin'],
  contentTypes: ['motivational', 'educational', 'milestone'],
  optimalTimingOnly: true,
  diversifyContent: true,
  includeWeekends: false,
  customVariables: {}
};

const platformIcons = {
  linkedin: '💼',
  twitter: '🐦',
  instagram: '📸',
  facebook: '👥',
  youtube: '📺'
};

const contentTypeColors = {
  motivational: 'bg-purple-100 text-purple-800 border-purple-300',
  educational: 'bg-blue-100 text-blue-800 border-blue-300',
  milestone: 'bg-green-100 text-green-800 border-green-300',
  story: 'bg-orange-100 text-orange-800 border-orange-300',
  tips: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  celebration: 'bg-pink-100 text-pink-800 border-pink-300'
};

export default function BatchContentCreator({ isOpen, onClose, onBatchComplete }: BatchContentCreatorProps) {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<'settings' | 'generation' | 'review' | 'scheduling'>('settings');
  const [batchSettings, setBatchSettings] = useState<BatchSettings>(defaultBatchSettings);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [editingPost, setEditingPost] = useState<GeneratedPost | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'engagement' | 'date' | 'platform'>('engagement');

  // Initialize services
  useEffect(() => {
    if (user) {
      ContentGenerator.initialize(user.id);
      VoiceLearning.initialize(user.id);
      EngagementTracker.initialize(user.id);
    }
  }, [user]);

  const generateBatchContent = async () => {
    if (!user) return;

    setIsGenerating(true);
    setCurrentStep('generation');
    setGenerationProgress(0);

    try {
      const totalPosts = calculateTotalPosts();
      const templates = await getTemplatesForSettings();
      const scheduleDates = generateScheduleDates();
      const posts: GeneratedPost[] = [];

      let generated = 0;
      
      for (let i = 0; i < totalPosts; i++) {
        const template = templates[i % templates.length];
        const platform = batchSettings.platforms[i % batchSettings.platforms.length];
        const scheduledDate = scheduleDates[i];

        // Generate content with custom variables
        const generatedContent = await ContentGenerator.generateFromTemplate(
          template,
          batchSettings.customVariables
        );

        // Adapt content for platform and user voice
        const adaptedContent = await VoiceLearning.adaptContentToVoice(
          generatedContent.content,
          platform
        );

        // Predict performance
        const performancePrediction = ContentGenerator.predictPerformance(
          generatedContent,
          platform
        );

        const post: GeneratedPost = {
          id: `batch-${Date.now()}-${i}`,
          content: adaptedContent,
          platform,
          scheduled_date: scheduledDate,
          hashtags: generatedContent.hashtags,
          content_type: generatedContent.content_type,
          engagement_score: performancePrediction.expectedLikes + performancePrediction.expectedComments,
          selected: true,
          customized: false,
          original_template: template.name
        };

        posts.push(post);
        generated++;
        setGenerationProgress((generated / totalPosts) * 100);

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Sort posts by engagement score for better defaults
      posts.sort((a, b) => b.engagement_score - a.engagement_score);

      setGeneratedPosts(posts);
      setSelectedPosts(new Set(posts.map(p => p.id)));
      setCurrentStep('review');

    } catch (error) {
      console.error('Error generating batch content:', error);
      alert('Failed to generate batch content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateTotalPosts = (): number => {
    const weeks = batchSettings.timeRange === 'week' ? 1 : 
                 batchSettings.timeRange === 'month' ? 4 : 12;
    return batchSettings.postsPerWeek * weeks;
  };

  const getTemplatesForSettings = async (): Promise<ContentTemplate[]> => {
    // In a real implementation, this would fetch templates from the database
    const allTemplates: ContentTemplate[] = [
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
        id: 'throwback-thursday',
        name: 'Throwback Thursday',
        category: 'story',
        template: '📸 Throwback Thursday\n\nRemembering when {past_experience}\n\nThe lesson: {key_takeaway}\n\nHow it applies today: {current_application}\n\n{hashtags}',
        variables: ['past_experience', 'key_takeaway', 'current_application'],
        platforms: ['instagram', 'facebook', 'linkedin'],
        optimal_times: ['11:00', '19:00']
      },
      {
        id: 'feature-friday',
        name: 'Feature Friday',
        category: 'tips',
        template: '🎯 Feature Friday\n\nToday\'s tip: {tip_title}\n\n{detailed_explanation}\n\nTry it out and let me know how it works for you!\n\n{hashtags}',
        variables: ['tip_title', 'detailed_explanation'],
        platforms: ['linkedin', 'twitter', 'instagram'],
        optimal_times: ['14:00', '17:00']
      }
    ];

    return allTemplates.filter(template => 
      batchSettings.contentTypes.some(type => 
        template.category === type || 
        (type === 'motivational' && template.category === 'motivation')
      )
    );
  };

  const generateScheduleDates = (): Date[] => {
    const dates: Date[] = [];
    const startDate = new Date();
    startDate.setHours(9, 0, 0, 0); // Start at 9 AM
    
    const totalPosts = calculateTotalPosts();
    const daysToSchedule = batchSettings.timeRange === 'week' ? 7 : 
                          batchSettings.timeRange === 'month' ? 30 : 90;
    
    const postsPerDay = totalPosts / daysToSchedule;
    let postIndex = 0;

    for (let day = 0; day < daysToSchedule && postIndex < totalPosts; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      // Skip weekends if not included
      if (!batchSettings.includeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
        continue;
      }

      const postsForToday = Math.ceil(postsPerDay);
      
      for (let postOfDay = 0; postOfDay < postsForToday && postIndex < totalPosts; postOfDay++) {
        const postDate = new Date(currentDate);
        
        // Spread posts throughout the day
        const hourOffset = postOfDay * (12 / postsForToday); // Spread over 12 hours (9 AM to 9 PM)
        postDate.setHours(9 + Math.floor(hourOffset), Math.floor((hourOffset % 1) * 60));

        dates.push(postDate);
        postIndex++;
      }
    }

    return dates.slice(0, totalPosts);
  };

  const togglePostSelection = (postId: string) => {
    const newSelection = new Set(selectedPosts);
    if (newSelection.has(postId)) {
      newSelection.delete(postId);
    } else {
      newSelection.add(postId);
    }
    setSelectedPosts(newSelection);
  };

  const updatePostContent = (postId: string, newContent: string) => {
    setGeneratedPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, content: newContent, customized: true }
        : post
    ));
  };

  const scheduleSelectedPosts = () => {
    const postsToSchedule = generatedPosts.filter(post => selectedPosts.has(post.id));
    onBatchComplete(postsToSchedule);
    onClose();
  };

  const exportToCSV = () => {
    const selectedPostsList = generatedPosts.filter(post => selectedPosts.has(post.id));
    
    const csvContent = [
      ['Platform', 'Scheduled Date', 'Content', 'Hashtags', 'Content Type', 'Engagement Score'].join(','),
      ...selectedPostsList.map(post => [
        post.platform,
        post.scheduled_date.toISOString(),
        `"${post.content.replace(/"/g, '""')}"`,
        post.hashtags.join(' '),
        post.content_type,
        post.engagement_score.toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rashenal-batch-content-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredPosts = generatedPosts.filter(post => 
    post.content.toLowerCase().includes(searchFilter.toLowerCase()) ||
    post.hashtags.some(tag => tag.toLowerCase().includes(searchFilter.toLowerCase()))
  ).sort((a, b) => {
    switch (sortBy) {
      case 'engagement':
        return b.engagement_score - a.engagement_score;
      case 'date':
        return a.scheduled_date.getTime() - b.scheduled_date.getTime();
      case 'platform':
        return a.platform.localeCompare(b.platform);
      default:
        return 0;
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center space-x-3">
            <Sparkles size={24} />
            <div>
              <h2 className="text-xl font-semibold">AI Batch Content Creator</h2>
              <p className="text-purple-100 text-sm">Generate weeks of content in minutes</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
              Step {currentStep === 'settings' ? '1' : currentStep === 'generation' ? '2' : currentStep === 'review' ? '3' : '4'} of 4
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
            style={{ 
              width: currentStep === 'settings' ? '25%' : 
                     currentStep === 'generation' ? '50%' : 
                     currentStep === 'review' ? '75%' : '100%'
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {currentStep === 'settings' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Configure Your Content Batch</h3>
                  <p className="text-gray-600">Set up your preferences for AI-generated content</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Time Range */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Calendar className="inline w-4 h-4 mr-2" />
                      Time Range
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'week', label: '1 Week', desc: '7 days of content' },
                        { value: 'month', label: '1 Month', desc: '30 days of content' },
                        { value: '3months', label: '3 Months', desc: '90 days of content' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="timeRange"
                            value={option.value}
                            checked={batchSettings.timeRange === option.value}
                            onChange={(e) => setBatchSettings(prev => ({ ...prev, timeRange: e.target.value as any }))}
                            className="text-purple-600"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Posts per Week */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Target className="inline w-4 h-4 mr-2" />
                      Posts per Week
                    </label>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="1"
                        max="21"
                        value={batchSettings.postsPerWeek}
                        onChange={(e) => setBatchSettings(prev => ({ ...prev, postsPerWeek: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>1 post/week</span>
                        <span className="font-medium text-purple-600">
                          {batchSettings.postsPerWeek} posts/week
                        </span>
                        <span>21 posts/week</span>
                      </div>
                      <div className="text-center text-sm text-gray-500">
                        Total: {calculateTotalPosts()} posts
                      </div>
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Send className="inline w-4 h-4 mr-2" />
                      Target Platforms
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(platformIcons).map(([platform, icon]) => (
                        <label key={platform} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            checked={batchSettings.platforms.includes(platform)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBatchSettings(prev => ({ ...prev, platforms: [...prev.platforms, platform] }));
                              } else {
                                setBatchSettings(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== platform) }));
                              }
                            }}
                            className="text-purple-600"
                          />
                          <span className="text-lg">{icon}</span>
                          <span className="capitalize font-medium">{platform}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Content Types */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Hash className="inline w-4 h-4 mr-2" />
                      Content Types
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'motivational', label: 'Motivational', desc: 'Inspiring quotes and messages' },
                        { value: 'educational', label: 'Educational', desc: 'Tips, insights, and lessons' },
                        { value: 'milestone', label: 'Milestone', desc: 'Progress updates and achievements' },
                        { value: 'story', label: 'Storytelling', desc: 'Personal experiences and narratives' },
                        { value: 'tips', label: 'Tips & Advice', desc: 'Practical actionable content' },
                        { value: 'celebration', label: 'Celebrations', desc: 'Success stories and wins' }
                      ].map(option => (
                        <label key={option.value} className="flex items-start space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={batchSettings.contentTypes.includes(option.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBatchSettings(prev => ({ ...prev, contentTypes: [...prev.contentTypes, option.value] }));
                              } else {
                                setBatchSettings(prev => ({ ...prev, contentTypes: prev.contentTypes.filter(t => t !== option.value) }));
                              }
                            }}
                            className="text-purple-600 mt-1"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{option.label}</div>
                            <div className="text-sm text-gray-500">{option.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Options
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchSettings.optimalTimingOnly}
                        onChange={(e) => setBatchSettings(prev => ({ ...prev, optimalTimingOnly: e.target.checked }))}
                        className="text-purple-600"
                      />
                      <span className="text-sm">Only optimal posting times</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchSettings.diversifyContent}
                        onChange={(e) => setBatchSettings(prev => ({ ...prev, diversifyContent: e.target.checked }))}
                        className="text-purple-600"
                      />
                      <span className="text-sm">Diversify content types</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={batchSettings.includeWeekends}
                        onChange={(e) => setBatchSettings(prev => ({ ...prev, includeWeekends: e.target.checked }))}
                        className="text-purple-600"
                      />
                      <span className="text-sm">Include weekends</span>
                    </label>
                  </div>
                </div>

                {/* Custom Variables */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Personalization Variables
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Focus Area</label>
                      <input
                        type="text"
                        value={batchSettings.customVariables.focus_area || ''}
                        onChange={(e) => setBatchSettings(prev => ({
                          ...prev,
                          customVariables: { ...prev.customVariables, focus_area: e.target.value }
                        }))}
                        placeholder="e.g., building better habits"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Goal</label>
                      <input
                        type="text"
                        value={batchSettings.customVariables.current_goal || ''}
                        onChange={(e) => setBatchSettings(prev => ({
                          ...prev,
                          customVariables: { ...prev.customVariables, current_goal: e.target.value }
                        }))}
                        placeholder="e.g., launching my business"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center pt-6">
                  <button
                    onClick={generateBatchContent}
                    disabled={batchSettings.platforms.length === 0 || batchSettings.contentTypes.length === 0}
                    className="flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Sparkles size={20} />
                    <span>Generate {calculateTotalPosts()} Posts</span>
                    <Zap size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'generation' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="relative mb-8">
                  <div className="w-32 h-32 mx-auto rounded-full border-4 border-purple-200 relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600 to-pink-600 transition-all duration-1000"
                      style={{ height: `${generationProgress}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="text-white w-8 h-8 animate-pulse" />
                    </div>
                  </div>
                  <div className="mt-4 text-2xl font-bold text-gray-900">
                    {Math.round(generationProgress)}%
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Generating Your Content...
                </h3>
                <p className="text-gray-600 mb-4">
                  Our AI is creating personalized content that matches your voice and maximizes engagement
                </p>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span>Analyzing your content history</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle2 size={16} className="text-green-500" />
                    <span>Adapting to your writing style</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw size={16} className="animate-spin text-purple-600" />
                    <span>Generating optimized content</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="flex h-full">
              {/* Left Panel - Controls */}
              <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Content Review</h3>
                    <p className="text-sm text-gray-600">
                      Review and customize your generated content
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-2">Generated Content</div>
                    <div className="text-2xl font-bold text-gray-900">{generatedPosts.length}</div>
                    <div className="text-sm text-gray-500">
                      {selectedPosts.size} selected
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search Content
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder="Search posts..."
                          className="w-full pl-10 p-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="engagement">Engagement Score</option>
                        <option value="date">Scheduled Date</option>
                        <option value="platform">Platform</option>
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedPosts(new Set(generatedPosts.map(p => p.id)))}
                      className="w-full p-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedPosts(new Set())}
                      className="w-full p-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="w-full p-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download size={16} />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel - Posts */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`border rounded-xl p-4 transition-all ${
                        selectedPosts.has(post.id) 
                          ? 'border-purple-300 bg-purple-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedPosts.has(post.id)}
                            onChange={() => togglePostSelection(post.id)}
                            className="text-purple-600"
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{platformIcons[post.platform]}</span>
                            <span className="font-medium capitalize">{post.platform}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs border ${contentTypeColors[post.content_type]}`}>
                            {post.content_type}
                          </div>
                          {post.customized && (
                            <div className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-300">
                              Customized
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <BarChart3 size={14} />
                            <span>{post.engagement_score}</span>
                          </div>
                          <button
                            onClick={() => setEditingPost(post)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const newPosts = generatedPosts.filter(p => p.id !== post.id);
                              setGeneratedPosts(newPosts);
                              setSelectedPosts(prev => {
                                const updated = new Set(prev);
                                updated.delete(post.id);
                                return updated;
                              });
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-sm text-gray-600 mb-1">
                          Scheduled: {post.scheduled_date.toLocaleDateString()} at {post.scheduled_date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm font-mono bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                          {post.content}
                        </div>
                      </div>

                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'scheduling' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Content Ready for Scheduling!
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedPosts.size} posts are ready to be added to your social media calendar
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={scheduleSelectedPosts}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Add to Calendar
                  </button>
                  
                  <button
                    onClick={exportToCSV}
                    className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download size={18} />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {currentStep === 'review' && `${selectedPosts.size} of ${generatedPosts.length} posts selected`}
          </div>
          
          <div className="flex items-center space-x-3">
            {currentStep === 'review' && (
              <>
                <button
                  onClick={() => setCurrentStep('settings')}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back to Settings
                </button>
                <button
                  onClick={() => setCurrentStep('scheduling')}
                  disabled={selectedPosts.size === 0}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Schedule Selected ({selectedPosts.size})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit Post Modal */}
        {editingPost && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Post Content</h3>
                <button
                  onClick={() => setEditingPost(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <textarea
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg h-40 resize-none"
                />
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setEditingPost(null)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      updatePostContent(editingPost.id, editingPost.content);
                      setEditingPost(null);
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <Save size={16} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}