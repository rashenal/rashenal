import React, { useState } from 'react';
import { BookOpen, Camera, Users, Target, TrendingUp, Plus, Share2, MessageCircle, Heart, Eye } from 'lucide-react';

export default function Learning() {
  const [activeTab, setActiveTab] = useState('discover');

  const learningJourneys = [
    {
      id: 1,
      title: "Mastering Public Speaking",
      author: "Sarah Johnson",
      avatar: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=100",
      course: "Toastmasters International",
      progress: 65,
      objective: "Overcome fear of public speaking and deliver confident presentations",
      lastUpdate: "2 days ago",
      supporters: 23,
      posts: 12,
      image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400"
    },
    {
      id: 2,
      title: "Learning Spanish for Travel",
      author: "Marcus Chen",
      avatar: "https://images.pexels.com/photos/3184340/pexels-photo-3184340.jpeg?auto=compress&cs=tinysrgb&w=100",
      course: "Duolingo + Local Classes",
      progress: 42,
      objective: "Achieve conversational Spanish for upcoming trip to Spain",
      lastUpdate: "1 day ago",
      supporters: 18,
      posts: 8,
      image: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400"
    },
    {
      id: 3,
      title: "Web Development Bootcamp",
      author: "Lisa Rodriguez",
      avatar: "https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=100",
      course: "FreeCodeCamp + Rashee's Habit Tracking",
      progress: 78,
      objective: "Build my first full-stack application and change careers",
      lastUpdate: "3 hours ago",
      supporters: 31,
      posts: 24,
      image: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400"
    }
  ];

  const recentPosts = [
    {
      id: 1,
      author: "Sarah Johnson",
      avatar: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=100",
      journey: "Mastering Public Speaking",
      content: "Just completed my 5th speech! The feedback was incredible. I'm finally starting to feel confident on stage. The key was practicing my opening line 50 times until it felt natural.",
      image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=300",
      time: "2 hours ago",
      likes: 12,
      comments: 5
    },
    {
      id: 2,
      author: "Lisa Rodriguez",
      avatar: "https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=100",
      journey: "Web Development Bootcamp",
      content: "Breakthrough moment today! Finally understood React hooks. Built my first interactive component. Screenshot of my todo app attached - it's not pretty but it WORKS! 🎉",
      image: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=300",
      time: "4 hours ago",
      likes: 18,
      comments: 8
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Learning in Public
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Share your learning journey, get community support, and stay accountable. 
            The magic happens when you learn with others cheering you on.
          </p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('discover')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'discover'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Discover Journeys
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'feed'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Learning Feed
            </button>
            <button
              onClick={() => setActiveTab('my-journeys')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'my-journeys'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Journeys
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'discover' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Active Learning Journeys</h2>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Start New Journey</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningJourneys.map((journey) => (
                <div key={journey.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={journey.image} 
                      alt={journey.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <img 
                        src={journey.avatar} 
                        alt={journey.author}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{journey.author}</h4>
                        <p className="text-sm text-gray-600">{journey.lastUpdate}</p>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{journey.title}</h3>
                    <p className="text-sm text-purple-600 font-semibold mb-2">{journey.course}</p>
                    <p className="text-gray-600 text-sm mb-4">{journey.objective}</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{journey.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" 
                          style={{width: `${journey.progress}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{journey.supporters}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{journey.posts}</span>
                        </div>
                      </div>
                      <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">
                        Support Journey
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'feed' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Learning Feed</h2>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>Share Update</span>
              </button>
            </div>

            <div className="space-y-6">
              {recentPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <img 
                      src={post.avatar} 
                      alt={post.author}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{post.author}</h4>
                      <p className="text-sm text-purple-600">{post.journey}</p>
                      <p className="text-sm text-gray-500">{post.time}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{post.content}</p>
                  
                  {post.image && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={post.image} 
                        alt="Learning update"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-6 text-gray-600">
                    <button className="flex items-center space-x-2 hover:text-red-500 transition-colors">
                      <Heart className="h-5 w-5" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                      <MessageCircle className="h-5 w-5" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-green-500 transition-colors">
                      <Share2 className="h-5 w-5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'my-journeys' && (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Learning Journeys Yet</h3>
            <p className="text-gray-600 mb-6">Start your first learning journey and share your progress with the community.</p>
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
              Create Your First Journey
            </button>
          </div>
        )}
      </div>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Learning in Public Works
            </h2>
            <p className="text-xl text-gray-600">
              The secret sauce isn't the course material - it's the community support
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Declare Your Learning Goal</h3>
              <p className="text-gray-600">
                Share what you're learning, your objectives, and timeline. 
                Public commitment increases your likelihood of success.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Share Your Progress</h3>
              <p className="text-gray-600">
                Post screenshots, reflections, and breakthroughs. 
                Document your journey with photos and journal entries.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Get Community Support</h3>
              <p className="text-gray-600">
                Receive encouragement, advice, and accountability from fellow learners. 
                Celebrate wins together and push through challenges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Learn in Public?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join our community of learners who support each other's growth and transformation.
          </p>
          <button className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            Start Your Learning Journey
          </button>
        </div>
      </section>
    </div>
  );
}