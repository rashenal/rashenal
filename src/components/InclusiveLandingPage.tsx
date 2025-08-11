import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Users,
  Heart,
  Shield,
  Sparkles,
  Target,
  Brain,
  Accessibility,
  Star,
  Play,
  Quote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/userContext';

export default function InclusiveLandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const { user } = useUser();

  const testimonials = [
    {
      name: "Maria Rodriguez",
      role: "Product Manager, Tech Startup",
      image: "👩🏽‍💼",
      quote: "As someone with ADHD, I've tried every productivity tool. Rashenal actually gets how my brain works - it doesn't judge, it just helps me succeed.",
      rating: 5
    },
    {
      name: "David Chen",
      role: "Software Engineer & Dad of 2",
      image: "👨🏻‍💻",
      quote: "Between work and family chaos, I needed something that understood real life isn't linear. Rashenal adapts to my energy levels, not the other way around.",
      rating: 5
    },
    {
      name: "Amara Williams",
      role: "Freelance Designer",
      image: "👩🏿‍🎨",
      quote: "Finally, a productivity app that doesn't assume I work 9-5 in an office. The inclusive design makes me feel seen and supported, not overwhelmed.",
      rating: 5
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "Neurodiversity-Friendly",
      description: "Designed by and for neurodiverse minds. Whether you're ADHD, autistic, or neurotypical - we meet you where you are.",
      color: "purple"
    },
    {
      icon: Accessibility,
      title: "Accessibility First",
      description: "Full keyboard navigation, screen reader support, and customizable interfaces. Technology should work for everyone.",
      color: "blue"
    },
    {
      icon: Heart,
      title: "Gentle Progress",
      description: "No guilt, no shame, no pressure. Celebrate small wins and learn from setbacks in a supportive environment.",
      color: "pink"
    },
    {
      icon: Shield,
      title: "Privacy Focused",
      description: "Your data stays yours. We're transparent about what we collect and why. No dark patterns, no surveillance capitalism.",
      color: "green"
    }
  ];

  const inclusiveHeroImages = [
    {
      alt: "Professional woman in her 50s with silver hair confidently using a tablet in a modern office",
      description: "Experienced professional",
      emoji: "👩🏽‍💼✨"
    },
    {
      alt: "Black professional in wheelchair at ergonomic standing desk with multiple monitors",
      description: "Tech professional with adaptive workspace",
      emoji: "👨🏿‍💻♿"
    },
    {
      alt: "South Asian person with visible hearing aid participating in video conference",
      description: "Inclusive remote collaboration",
      emoji: "👨🏽‍💼🦻"
    },
    {
      alt: "Person with noise-canceling headphones in organized, calm workspace",
      description: "Neurodiverse-friendly work environment",
      emoji: "👩🏼‍💻🎧"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  <span>Built by neurodivergent professionals, for everyone</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                  Your Personal{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Partner
                  </span>{' '}
                  for Life & Career Success
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed">
                  Designed for how <em>your</em> mind works — whether you're neurotypical, ADHD, autistic, 
                  or anywhere in between. No judgment, no pressure, just genuine support.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <span>Continue Your Journey</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <span>Start Your Journey</span>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                      to="/demo"
                      className="inline-flex items-center justify-center space-x-2 bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transform hover:scale-105 transition-all duration-200"
                    >
                      <Play className="h-5 w-5" />
                      <span>Watch Demo</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Your data, your control</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Accessibility className="h-4 w-4 text-blue-600" />
                  <span>WCAG AAA compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-pink-600" />
                  <span>Neurodiversity-friendly</span>
                </div>
              </div>
            </div>

            {/* Right Content - Inclusive Hero Images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-6">
                {inclusiveHeroImages.map((image, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center"
                  >
                    <div className="text-6xl mb-4">{image.emoji}</div>
                    <p className="text-sm text-gray-600 font-medium">
                      {image.description}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Floating Success Indicators */}
              <div className="absolute -top-4 -right-4 bg-green-100 text-green-700 p-3 rounded-full shadow-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-100 text-purple-700 p-3 rounded-full shadow-lg">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Technology That Understands You
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe productivity tools should adapt to people, not the other way around. 
              Here's how we're different.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                purple: 'bg-purple-100 text-purple-600',
                blue: 'bg-blue-100 text-blue-600',
                pink: 'bg-pink-100 text-pink-600',
                green: 'bg-green-100 text-green-600'
              };
              
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
                >
                  <div className={`w-12 h-12 rounded-lg ${colorClasses[feature.color]} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Stories from Real People
            </h2>
            <p className="text-xl text-gray-600">
              Hear from our community of professionals who've found their rhythm
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
              <div className="text-center mb-8">
                <Quote className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <div className="text-6xl mb-4">
                  {testimonials[activeTestimonial].image}
                </div>
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
              <blockquote className="text-xl md:text-2xl text-gray-700 text-center mb-8 leading-relaxed">
                "{testimonials[activeTestimonial].quote}"
              </blockquote>
              
              <div className="text-center">
                <p className="font-semibold text-gray-900">
                  {testimonials[activeTestimonial].name}
                </p>
                <p className="text-gray-600">
                  {testimonials[activeTestimonial].role}
                </p>
              </div>
              
              {/* Testimonial Navigation */}
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === activeTestimonial
                        ? 'bg-blue-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Show testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of professionals who've discovered a kinder, more effective way to get things done.
          </p>
          
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              <span>Continue Your Journey</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center space-x-2 bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              <span>Start Free Today</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
          
          <p className="text-blue-100 mt-4 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Rashenal AI</span>
            </div>
            <p className="text-gray-400 mb-8">
              Empowering everyone to achieve their potential, one step at a time.
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-400">
              <Link to="/help" className="hover:text-white transition-colors">Help</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
            <p className="text-gray-500 text-xs mt-8">
              © 2024 Rashenal AI. Made with ❤️ for humans of all kinds.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}