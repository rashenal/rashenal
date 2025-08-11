import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  Trophy,
  Target,
  Heart,
  Share2,
  Bell,
  Plus,
  Search,
  Filter,
  Star,
  Award,
  TrendingUp,
  Calendar,
  BookOpen,
  Brain,
  Sparkles,
  UserPlus,
  Shield,
  Globe,
  Lock,
  Send,
  ThumbsUp,
  HelpCircle,
  ChevronRight,
  Zap,
  Crown
} from 'lucide-react';
import { useUser } from '../contexts/userContext';
import { useGamification, POINT_VALUES } from '../contexts/GamificationContext';

interface LearningPod {
  id: string;
  name: string;
  description: string;
  topic: string;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  aiTrainerContext?: string;
  createdAt: Date;
  createdBy: string;
  tags: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface PodMember {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  role: 'leader' | 'member' | 'mentor';
  joinedAt: Date;
  points: number;
  streak: number;
}

interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  type: 'question' | 'achievement' | 'tip' | 'discussion';
  likes: number;
  replies: number;
  createdAt: Date;
  tags: string[];
  isHelpful?: boolean;
}

interface AccountabilityPartner {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  sharedGoals: number;
  mutualStreak: number;
  lastCheckIn: Date;
}

export default function CommunityHub() {
  const { user } = useUser();
  const { points, level, addPoints, leaderboard, getLeaderboard } = useGamification();
  const [activeTab, setActiveTab] = useState<'pods' | 'chat' | 'leaderboard' | 'partners'>('pods');
  const [myPods, setMyPods] = useState<LearningPod[]>([]);
  const [availablePods, setAvailablePods] = useState<LearningPod[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [partners, setPartners] = useState<AccountabilityPartner[]>([]);
  const [showCreatePod, setShowCreatePod] = useState(false);
  const [showInvitePartner, setShowInvitePartner] = useState(false);
  const [selectedPod, setSelectedPod] = useState<LearningPod | null>(null);
  const [newPost, setNewPost] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState('all');

  // Sample topics for learning pods
  const topics = [
    'Healthy Lifestyle',
    'Productivity',
    'Career Growth',
    'Mindfulness',
    'Fitness',
    'Learning Languages',
    'Creative Writing',
    'Public Speaking',
    'Financial Literacy',
    'Coding',
    'Nutrition',
    'Mental Health'
  ];

  useEffect(() => {
    loadMyPods();
    loadAvailablePods();
    loadCommunityPosts();
    loadPartners();
    if (activeTab === 'leaderboard') {
      getLeaderboard('global');
    }
  }, [user]);

  const loadMyPods = async () => {
    // Mock data for now
    setMyPods([
      {
        id: '1',
        name: 'Morning Routine Masters',
        description: 'Build a powerful morning routine together',
        topic: 'Productivity',
        memberCount: 12,
        maxMembers: 20,
        isPrivate: false,
        createdAt: new Date('2024-01-15'),
        createdBy: 'user1',
        tags: ['morning', 'habits', 'productivity'],
        level: 'beginner'
      },
      {
        id: '2',
        name: 'Fitness Accountability Squad',
        description: 'Stay fit together with daily check-ins',
        topic: 'Fitness',
        memberCount: 18,
        maxMembers: 20,
        isPrivate: false,
        createdAt: new Date('2024-02-01'),
        createdBy: 'user2',
        tags: ['fitness', 'health', 'exercise'],
        level: 'intermediate'
      }
    ]);
  };

  const loadAvailablePods = async () => {
    // Mock data
    setAvailablePods([
      {
        id: '3',
        name: 'Mindful Meditation Circle',
        description: 'Daily meditation practice and sharing',
        topic: 'Mindfulness',
        memberCount: 8,
        maxMembers: 15,
        isPrivate: false,
        createdAt: new Date('2024-01-20'),
        createdBy: 'user3',
        tags: ['meditation', 'mindfulness', 'wellness'],
        level: 'beginner'
      },
      {
        id: '4',
        name: 'Career Accelerators',
        description: 'Advance your career with peer support',
        topic: 'Career Growth',
        memberCount: 15,
        maxMembers: 25,
        isPrivate: false,
        createdAt: new Date('2024-01-10'),
        createdBy: 'user4',
        tags: ['career', 'networking', 'skills'],
        level: 'advanced'
      }
    ]);
  };

  const loadCommunityPosts = async () => {
    // Mock data
    setCommunityPosts([
      {
        id: '1',
        authorId: 'user1',
        authorName: 'Sarah Chen',
        authorAvatar: '👩‍💼',
        content: 'Just completed my 30-day meditation streak! The morning routine pod has been incredible for accountability. 🎉',
        type: 'achievement',
        likes: 45,
        replies: 12,
        createdAt: new Date('2024-03-10T10:30:00'),
        tags: ['achievement', 'meditation', 'streak'],
        isHelpful: true
      },
      {
        id: '2',
        authorId: 'user2',
        authorName: 'Mike Johnson',
        authorAvatar: '👨‍💻',
        content: 'Anyone have tips for staying consistent with exercise when traveling? I keep breaking my streak on work trips.',
        type: 'question',
        likes: 23,
        replies: 18,
        createdAt: new Date('2024-03-10T09:15:00'),
        tags: ['question', 'fitness', 'travel']
      },
      {
        id: '3',
        authorId: 'user3',
        authorName: 'Emma Wilson',
        authorAvatar: '👩‍🎨',
        content: 'Pro tip: Stack your habits! I meditate right after my morning coffee. The association makes it automatic now.',
        type: 'tip',
        likes: 67,
        replies: 8,
        createdAt: new Date('2024-03-09T14:20:00'),
        tags: ['tip', 'habits', 'productivity'],
        isHelpful: true
      }
    ]);
  };

  const loadPartners = async () => {
    // Mock data
    setPartners([
      {
        id: '1',
        userId: 'partner1',
        username: 'Alex Rivera',
        avatar: '🧑‍💼',
        sharedGoals: 3,
        mutualStreak: 15,
        lastCheckIn: new Date('2024-03-10T08:00:00')
      },
      {
        id: '2',
        userId: 'partner2',
        username: 'Jordan Lee',
        avatar: '👤',
        sharedGoals: 5,
        mutualStreak: 7,
        lastCheckIn: new Date('2024-03-09T19:30:00')
      }
    ]);
  };

  const joinPod = async (podId: string) => {
    // Join pod logic
    const pod = availablePods.find(p => p.id === podId);
    if (pod) {
      setMyPods([...myPods, pod]);
      setAvailablePods(availablePods.filter(p => p.id !== podId));
      await addPoints(POINT_VALUES.ACHIEVE_GOAL, 'Joined a learning pod');
    }
  };

  const leavePod = async (podId: string) => {
    // Leave pod logic
    const pod = myPods.find(p => p.id === podId);
    if (pod) {
      setAvailablePods([...availablePods, pod]);
      setMyPods(myPods.filter(p => p.id !== podId));
    }
  };

  const likePost = async (postId: string) => {
    setCommunityPosts(communityPosts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
    await addPoints(5, 'Engaged with community');
  };

  const helpfulPost = async (postId: string) => {
    const post = communityPosts.find(p => p.id === postId);
    if (post && !post.isHelpful) {
      setCommunityPosts(communityPosts.map(p => 
        p.id === postId 
          ? { ...p, isHelpful: true }
          : p
      ));
      // Award points to the post author
      await addPoints(POINT_VALUES.HELP_COMMUNITY, 'Your post was marked as helpful');
    }
  };

  const submitPost = async () => {
    if (!newPost.trim()) return;

    const post: CommunityPost = {
      id: Date.now().toString(),
      authorId: user?.id || '',
      authorName: user?.email || 'Anonymous',
      content: newPost,
      type: 'discussion',
      likes: 0,
      replies: 0,
      createdAt: new Date(),
      tags: []
    };

    setCommunityPosts([post, ...communityPosts]);
    setNewPost('');
    await addPoints(POINT_VALUES.HELP_COMMUNITY, 'Shared with community');
  };

  const filteredPods = availablePods.filter(pod => 
    (filterTopic === 'all' || pod.topic === filterTopic) &&
    (searchQuery === '' || 
     pod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     pod.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Community Hub</h1>
                <p className="text-gray-600">Learn, grow, and achieve together</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-purple-100 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-900">{points} pts</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-lg">
                <Star className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Level {level}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 mt-6">
            {[
              { id: 'pods', label: 'Learning Pods', icon: Users },
              { id: 'chat', label: 'Community Chat', icon: MessageSquare },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'partners', label: 'Accountability Partners', icon: Shield }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Learning Pods Tab */}
        {activeTab === 'pods' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* My Pods */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">My Pods</h2>
                  <button
                    onClick={() => setShowCreatePod(true)}
                    className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {myPods.map(pod => (
                    <div
                      key={pod.id}
                      className="p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 cursor-pointer transition-all"
                      onClick={() => setSelectedPod(pod)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{pod.name}</h3>
                        {pod.isPrivate && <Lock className="h-4 w-4 text-gray-500" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{pod.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {pod.memberCount}/{pod.maxMembers}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {pod.topic}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Available Pods */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Discover Pods</h2>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search pods..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterTopic}
                      onChange={(e) => setFilterTopic(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Topics</option>
                      {topics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {filteredPods.map(pod => (
                    <div key={pod.id} className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{pod.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{pod.description}</p>
                        </div>
                        {pod.isPrivate ? (
                          <Lock className="h-5 w-5 text-gray-500" />
                        ) : (
                          <Globe className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {pod.tags.map(tag => (
                          <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {pod.memberCount}/{pod.maxMembers}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            pod.level === 'beginner' ? 'bg-green-100 text-green-700' :
                            pod.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {pod.level}
                          </span>
                        </div>
                        <button
                          onClick={() => joinPod(pod.id)}
                          className="px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:shadow-lg transition-all"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Community Chat Tab */}
        {activeTab === 'chat' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Community Feed</h2>
                
                {/* New Post */}
                <div className="mb-6">
                  <div className="flex space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="Share your progress, ask a question, or help others..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={submitPost}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
                        >
                          <Send className="h-4 w-4" />
                          <span>Post</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Posts */}
                <div className="space-y-4">
                  {communityPosts.map(post => (
                    <div key={post.id} className="p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                          {post.authorAvatar || '👤'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-semibold text-gray-900">{post.authorName}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {new Date(post.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              post.type === 'achievement' ? 'bg-green-100 text-green-700' :
                              post.type === 'question' ? 'bg-blue-100 text-blue-700' :
                              post.type === 'tip' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {post.type}
                            </span>
                          </div>
                          
                          <p className="text-gray-800 mb-3">{post.content}</p>
                          
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => likePost(post.id)}
                              className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              <span className="text-sm">{post.likes}</span>
                            </button>
                            <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm">{post.replies}</span>
                            </button>
                            {post.type === 'tip' && !post.isHelpful && (
                              <button
                                onClick={() => helpfulPost(post.id)}
                                className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
                              >
                                <HelpCircle className="h-4 w-4" />
                                <span className="text-sm">Helpful</span>
                              </button>
                            )}
                            {post.isHelpful && (
                              <span className="flex items-center space-x-1 text-green-600">
                                <Award className="h-4 w-4" />
                                <span className="text-sm">Helpful</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Helpers */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Helpers This Week</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Sarah Chen', points: 450, helps: 23 },
                    { name: 'Mike Johnson', points: 380, helps: 19 },
                    { name: 'Emma Wilson', points: 320, helps: 16 },
                    { name: 'Alex Rivera', points: 290, helps: 14 },
                    { name: 'Jordan Lee', points: 250, helps: 12 }
                  ].map((helper, index) => (
                    <div key={helper.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100' :
                          index === 1 ? 'bg-gray-200' :
                          index === 2 ? 'bg-orange-100' :
                          'bg-gray-100'
                        }`}>
                          {index === 0 && <Crown className="h-4 w-4 text-yellow-600" />}
                          {index === 1 && <span className="text-sm font-bold text-gray-600">2</span>}
                          {index === 2 && <span className="text-sm font-bold text-orange-600">3</span>}
                          {index > 2 && <span className="text-sm font-bold text-gray-500">{index + 1}</span>}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{helper.name}</p>
                          <p className="text-xs text-gray-600">{helper.helps} helpful posts</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">+{helper.points}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Leaderboard</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => getLeaderboard('global')}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  Global
                </button>
                <button
                  onClick={() => getLeaderboard('pod')}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  My Pods
                </button>
                <button
                  onClick={() => getLeaderboard('friends')}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  Friends
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300' :
                    index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300' :
                    index === 2 ? 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-300 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-900' :
                      index === 2 ? 'bg-orange-300 text-orange-900' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      {entry.avatar || '👤'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{entry.username}</p>
                      <p className="text-sm text-gray-600">Level {entry.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600">{entry.points}</p>
                    <p className="text-sm text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accountability Partners Tab */}
        {activeTab === 'partners' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">My Accountability Partners</h2>
                <button
                  onClick={() => setShowInvitePartner(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Invite</span>
                </button>
              </div>

              <div className="space-y-4">
                {partners.map(partner => (
                  <div key={partner.id} className="p-4 border-2 border-purple-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                          {partner.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{partner.username}</p>
                          <p className="text-sm text-gray-600">
                            Last check-in: {partner.lastCheckIn.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                        <MessageSquare className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">{partner.mutualStreak}</p>
                        <p className="text-xs text-green-700">Day Streak</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">{partner.sharedGoals}</p>
                        <p className="text-xs text-purple-700">Shared Goals</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Partner Benefits</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Shared Goals</h3>
                    <p className="text-sm text-gray-600">Work together on common objectives and celebrate wins</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Daily Check-ins</h3>
                    <p className="text-sm text-gray-600">Stay accountable with regular progress updates</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Bonus Points</h3>
                    <p className="text-sm text-gray-600">Earn extra points for maintaining partner streaks</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Heart className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Mutual Support</h3>
                    <p className="text-sm text-gray-600">Give and receive encouragement when you need it most</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}