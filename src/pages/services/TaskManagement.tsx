import React from 'react';
import { Kanban, Users, Smartphone, CheckCircle, ArrowRight, Zap } from 'lucide-react';

export default function TaskManagement() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Smart Task Management
                  </span>
                </h1>
                <p className="text-2xl text-gray-600 font-medium">
                  Organize Your Transformation Journey
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Transform chaos into clarity with our intuitive drag-and-drop kanban system. 
                  Organize your goals, track progress, and collaborate with accountability partners 
                  in one powerful platform.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Start Organizing Now
                </button>
                <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300">
                  See Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div className="bg-red-100 p-3 rounded-lg">
                      <h4 className="font-semibold text-red-800 text-sm mb-2">To Do</h4>
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded text-xs">Create vision board</div>
                        <div className="bg-white p-2 rounded text-xs">Set morning routine</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 text-sm mb-2">In Progress</h4>
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded text-xs">Daily meditation</div>
                        <div className="bg-white p-2 rounded text-xs">Read 30 min/day</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <h4 className="font-semibold text-green-800 text-sm mb-2">Done</h4>
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded text-xs">Join gym</div>
                        <div className="bg-white p-2 rounded text-xs">Set goals</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Transformation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to organize, track, and achieve your transformation goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
              <Kanban className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Drag & Drop Interface</h3>
              <p className="text-gray-600">
                Intuitive kanban boards that make organizing your tasks and goals as simple 
                as dragging and dropping cards between columns.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl">
              <Users className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Collaboration Tools</h3>
              <p className="text-gray-600">
                Share boards with accountability partners, coaches, or team members. 
                Work together towards common goals with real-time updates.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl">
              <Smartphone className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile Optimized</h3>
              <p className="text-gray-600">
                Access your boards anywhere, anytime. Our mobile-first design ensures 
                you can manage your transformation on the go.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-2xl">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Visual progress indicators and completion statistics help you stay 
                motivated and see how far you've come.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-2xl">
              <Zap className="h-12 w-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Automation</h3>
              <p className="text-gray-600">
                Automated reminders, recurring tasks, and intelligent suggestions 
                keep you on track without the mental overhead.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-red-50 p-8 rounded-2xl">
              <Users className="h-12 w-12 text-pink-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Privacy Controls</h3>
              <p className="text-gray-600">
                Keep boards private for personal goals or share selectively with 
                trusted accountability partners and coaches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perfect for Every Transformation Goal
            </h2>
            <p className="text-xl text-gray-600">
              See how others are using our task management system
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Career Transformation</h3>
                <p className="text-gray-600 mb-4">
                  "I used the kanban board to organize my career transition from corporate to entrepreneurship. 
                  Having everything visual made the overwhelming process manageable."
                </p>
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=100" 
                    alt="Sarah"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Sarah M.</p>
                    <p className="text-sm text-gray-600">Entrepreneur</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Health & Fitness Goals</h3>
                <p className="text-gray-600 mb-4">
                  "Tracking my fitness journey with the kanban system helped me stay consistent. 
                  Seeing my progress visually was incredibly motivating."
                </p>
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://images.pexels.com/photos/3184340/pexels-photo-3184340.jpeg?auto=compress&cs=tinysrgb&w=100" 
                    alt="Marcus"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Marcus C.</p>
                    <p className="text-sm text-gray-600">Fitness Enthusiast</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Relationship Building</h3>
                <p className="text-gray-600 mb-4">
                  "My accountability partner and I share a board for our personal development goals. 
                  It's amazing how much more committed we are when we can see each other's progress."
                </p>
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=100" 
                    alt="Lisa"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Lisa R.</p>
                    <p className="text-sm text-gray-600">Life Coach</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Creative Projects</h3>
                <p className="text-gray-600 mb-4">
                  "As a creative, I struggle with organization. The visual nature of the kanban board 
                  finally gave me a system that works with my brain, not against it."
                </p>
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100" 
                    alt="Alex"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Alex T.</p>
                    <p className="text-sm text-gray-600">Graphic Designer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              Seamlessly Integrates with Your Transformation Journey
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Our task management system works perfectly with AI Vision Movies, Habit Tracking, 
              and Accountability Partners for a complete transformation experience.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 p-6 rounded-xl">
                <h3 className="font-bold mb-2">Vision Movie Integration</h3>
                <p className="text-blue-100 text-sm">
                  Break down your vision into actionable tasks and track progress towards your movie goals.
                </p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl">
                <h3 className="font-bold mb-2">Habit Tracking Sync</h3>
                <p className="text-blue-100 text-sm">
                  Convert habits into recurring tasks and see your consistency improve over time.
                </p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl">
                <h3 className="font-bold mb-2">Accountability Partners</h3>
                <p className="text-blue-100 text-sm">
                  Share specific boards with partners and coaches for targeted support and feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Organize Your Transformation?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start with our free task management system and upgrade to premium features 
            as your transformation journey grows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Start Free Trial
            </button>
            <a
              href="https://calendly.com/rashenal/catchup-with-rashee"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 inline-flex items-center justify-center space-x-2"
            >
              <span>Book Demo Call</span>
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}