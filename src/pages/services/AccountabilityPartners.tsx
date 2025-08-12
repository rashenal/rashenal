// src/pages/services/AccountabilityPartners.tsx
import React from 'react';
import { MessageCircle, Bot, Users, Mic, ArrowRight, Zap } from 'lucide-react';

export default function AccountabilityPartners() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    AI Accountability Partners
                  </span>
                </h1>
                <p className="text-2xl text-gray-600 font-medium">
                  Your Personal Success Companion
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Never feel alone on your transformation journey. Our AI accountability partners 
                  provide 24/7 support, motivation, and guidance in your own voice or mine, 
                  keeping you on track towards your goals.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Meet Your AI Partner
                </button>
                <button className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-indigo-600 hover:text-white transition-all duration-300">
                  Hear Sample Conversation
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Your AI Partner</h3>
                    <p className="text-sm text-green-500">● Online</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <p className="text-sm text-indigo-800">
                      "Good morning! How did your morning meditation go today? 
                      Remember, you're building the foundation for your dream life!"
                    </p>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg ml-8">
                    <p className="text-sm text-gray-700">
                      "I did it! 15 minutes of meditation. Feeling more centered already."
                    </p>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <p className="text-sm text-indigo-800">
                      "That's amazing! You're now on a 7-day streak. 
                      What's one thing you're grateful for today?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI vs Human Partners */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Perfect Accountability Partner
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you prefer AI-powered support or human connection, we have the perfect 
              accountability solution for your transformation journey.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* AI Partners */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <Bot className="h-8 w-8 text-indigo-600" />
                <h3 className="text-2xl font-bold text-gray-900">AI Accountability Partners</h3>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-indigo-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">24/7 Availability</h4>
                    <p className="text-gray-600 text-sm">Always there when you need support, motivation, or a gentle nudge.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mic className="h-5 w-5 text-indigo-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Your Voice or Mine</h4>
                    <p className="text-gray-600 text-sm">Choose to hear encouragement in your own voice or Rashee's voice.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MessageCircle className="h-5 w-5 text-indigo-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Personalized Conversations</h4>
                    <p className="text-gray-600 text-sm">AI learns your patterns and provides tailored support and motivation.</p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                Get AI Partner
              </button>
            </div>

            {/* Human Partners */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 p-8 rounded-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <Users className="h-8 w-8 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Human Accountability Partners</h3>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Real Human Connection</h4>
                    <p className="text-gray-600 text-sm">Connect with like-minded individuals on similar transformation journeys.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MessageCircle className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Shared Experiences</h4>
                    <p className="text-gray-600 text-sm">Learn from others' challenges and celebrate victories together.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Mutual Support</h4>
                    <p className="text-gray-600 text-sm">Give and receive support in a reciprocal partnership.</p>
                  </div>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                Find Human Partner
              </button>
              
              <p className="text-center text-sm text-gray-600 mt-3">
                Available in our <a href="/community" className="text-blue-600 hover:underline">Community Section</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How AI Partners Work */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How AI Accountability Partners Work
            </h2>
            <p className="text-xl text-gray-600">
              Advanced AI technology that understands your goals and adapts to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Goal Integration</h3>
              <p className="text-gray-600">
                Your AI partner learns about your specific goals, challenges, and preferences 
                from your vision movie and coaching sessions.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Voice Cloning</h3>
              <p className="text-gray-600">
                Choose to receive support in your own voice or Rashee's voice using 
                advanced voice cloning technology for maximum impact.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-pink-600 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Adaptive Support</h3>
              <p className="text-gray-600">
                Your AI partner adapts its communication style and timing based on 
                your progress, mood, and what motivates you most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Advanced AI Features
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: 'Emotional Intelligence',
                    description: 'Recognizes your emotional state and adjusts its approach accordingly.'
                  },
                  {
                    title: 'Progress Tracking',
                    description: 'Monitors your habits, tasks, and goals to provide relevant support.'
                  },
                  {
                    title: 'Motivational Timing',
                    description: 'Learns when you need encouragement most and reaches out proactively.'
                  },
                  {
                    title: 'Personalized Strategies',
                    description: 'Suggests specific actions based on your unique situation and goals.'
                  },
                  {
                    title: 'Crisis Support',
                    description: 'Provides extra support during challenging times or setbacks.'
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <Bot className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800" 
                alt="AI Technology" 
                className="w-full h-96 object-cover rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <Bot className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-gray-700">AI-Powered</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              How AI accountability partners have transformed lives
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: 'Michael R.',
                goal: 'Fitness Transformation',
                image: 'https://images.pexels.com/photos/3184340/pexels-photo-3184340.jpeg?auto=compress&cs=tinysrgb&w=400',
                quote: 'My AI partner kept me motivated when I wanted to skip workouts. Having that voice of encouragement in my own voice made it feel like I was coaching myself to success.',
                result: 'Lost 35 pounds in 4 months'
              },
              {
                name: 'Amanda K.',
                goal: 'Career Change',
                image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400',
                quote: 'The AI partner helped me stay focused on my career transition goals. It celebrated small wins and kept me accountable for daily actions that led to my dream job.',
                result: 'Successfully changed careers'
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
                    <p className="text-indigo-600 font-semibold">{story.goal}</p>
                    <p className="text-sm text-green-600">{story.result}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{story.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready for Your Personal Success Companion?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Experience the power of having a dedicated accountability partner who's always 
            there to support, motivate, and guide you towards your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Get Your AI Partner
            </button>
            <a
              href="https://calendly.com/rashenal/catchup-with-rashee"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-full font-semibold hover:bg-indigo-600 hover:text-white transition-all duration-300 inline-flex items-center justify-center space-x-2"
            >
              <span>Book Discovery Call</span>
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}