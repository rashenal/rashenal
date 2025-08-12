import React from 'react';
import { TrendingUp, Calendar, Target, Award, BarChart3, ArrowRight } from 'lucide-react';

export default function HabitTracking() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Smart Habit Tracking
                  </span>
                </h1>
                <p className="text-2xl text-gray-600 font-medium">
                  Build Lasting Change, One Day at a Time
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Transform your life through the power of consistent habits. Our intelligent tracking 
                  system adapts to your lifestyle, celebrates your wins, and keeps you motivated 
                  on your transformation journey.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Start Tracking Today
                </button>
                <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-full font-semibold hover:bg-green-600 hover:text-white transition-all duration-300">
                  See How It Works
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Habit Dashboard</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Morning Meditation</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                      <span className="text-sm text-green-600 font-semibold">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Daily Reading</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                      <span className="text-sm text-blue-600 font-semibold">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Exercise</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '78%'}}></div>
                      </div>
                      <span className="text-sm text-purple-600 font-semibold">78%</span>
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
              Intelligent Habit Tracking Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our smart system goes beyond simple checkboxes to provide insights, 
              motivation, and personalized guidance for lasting change.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-2xl">
              <TrendingUp className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Analytics</h3>
              <p className="text-gray-600">
                Detailed insights into your habit patterns, streaks, and improvement trends 
                help you understand what's working and what needs adjustment.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
              <Calendar className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Scheduling</h3>
              <p className="text-gray-600">
                AI-powered scheduling suggestions based on your lifestyle, energy patterns, 
                and success history to optimize habit formation.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl">
              <Target className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Adaptive Goals</h3>
              <p className="text-gray-600">
                Goals that evolve with your progress. Start small and gradually increase 
                difficulty as habits become more established.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-8 rounded-2xl">
              <Award className="h-12 w-12 text-yellow-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Achievement System</h3>
              <p className="text-gray-600">
                Celebrate milestones with badges, streaks, and rewards that keep you 
                motivated throughout your transformation journey.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl">
              <BarChart3 className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Visual Progress</h3>
              <p className="text-gray-600">
                Beautiful charts and graphs that make your progress tangible and 
                provide motivation to keep going.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-red-50 p-8 rounded-2xl">
              <Target className="h-12 w-12 text-pink-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Habit Stacking</h3>
              <p className="text-gray-600">
                Link new habits to existing ones for easier adoption. Our system 
                suggests optimal habit combinations for maximum success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Science Behind Habits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                The Science of Habit Formation
              </h2>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">The 21-Day Myth</h3>
                  <p className="text-gray-600">
                    Research shows it actually takes 66 days on average to form a new habit. 
                    Our system is designed around this reality, not marketing myths.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Habit Loop Optimization</h3>
                  <p className="text-gray-600">
                    We help you identify and optimize the cue-routine-reward loop that 
                    drives all habit formation for maximum effectiveness.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Neuroplasticity Support</h3>
                  <p className="text-gray-600">
                    Our tracking methods are designed to support your brain's natural 
                    ability to form new neural pathways through consistent repetition.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800" 
                alt="Habit Formation Science" 
                className="w-full h-96 object-cover rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">66</div>
                  <div className="text-sm text-gray-600">Days to Form a Habit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transformation Through Habits
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from people who transformed their lives one habit at a time
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Jennifer L.',
                transformation: 'Lost 40 pounds',
                habit: 'Daily 30-minute walks',
                image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400',
                quote: 'The habit tracker helped me stay consistent with small daily walks. After 6 months, I had lost 40 pounds without feeling like I was on a diet.'
              },
              {
                name: 'David M.',
                transformation: 'Wrote a book',
                habit: '500 words daily',
                image: 'https://images.pexels.com/photos/3184340/pexels-photo-3184340.jpeg?auto=compress&cs=tinysrgb&w=400',
                quote: 'By tracking just 500 words per day, I completed my first novel in 8 months. The visual progress kept me motivated even on tough days.'
              },
              {
                name: 'Maria S.',
                transformation: 'Reduced anxiety',
                habit: 'Morning meditation',
                image: 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=400',
                quote: '10 minutes of daily meditation tracked consistently for 3 months completely changed my relationship with stress and anxiety.'
              }
            ].map((story, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-6">
                  <img 
                    src={story.image} 
                    alt={story.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{story.name}</h4>
                    <p className="text-green-600 font-semibold">{story.transformation}</p>
                    <p className="text-sm text-gray-600">{story.habit}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{story.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Habits That Support Your Vision
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Our habit tracking integrates seamlessly with your AI Vision Movies and Task Management 
            to create a complete transformation ecosystem.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-6 rounded-xl">
              <h3 className="font-bold mb-2">Vision-Aligned Habits</h3>
              <p className="text-green-100 text-sm">
                Track habits that directly support the goals shown in your AI Vision Movie.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-xl">
              <h3 className="font-bold mb-2">Task Integration</h3>
              <p className="text-green-100 text-sm">
                Convert successful habits into recurring tasks in your kanban board system.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-xl">
              <h3 className="font-bold mb-2">AI Accountability</h3>
              <p className="text-green-100 text-sm">
                Your AI accountability partner celebrates habit wins and provides encouragement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Build Life-Changing Habits?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start with our free habit tracker and discover how small daily actions 
            can create extraordinary transformations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Start Free Habit Tracker
            </button>
            <a
              href="https://calendly.com/rashenal/catchup-with-rashee"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-full font-semibold hover:bg-green-600 hover:text-white transition-all duration-300 inline-flex items-center justify-center space-x-2"
            >
              <span>Book Strategy Call</span>
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}