import React from 'react';
import { BookOpen, Video, Clock, Users, Star, CheckCircle, Play, Download } from 'lucide-react';

export default function Courses() {
  const courses = [
    {
      id: 1,
      title: 'Foundations of Self-Belief',
      description: 'Learn the core principles of replacing self-doubt with unshakeable confidence through proven psychological techniques.',
      instructor: 'Rashee Harvey',
      duration: '2 hours',
      lessons: 8,
      level: 'Beginner',
      price: 'Free',
      rating: 4.9,
      students: 1250,
      image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
      features: [
        'Understanding the psychology of self-doubt',
        'Cognitive restructuring techniques',
        'Building confidence through small wins',
        'Creating empowering belief systems'
      ]
    },
    {
      id: 2,
      title: 'AI-Powered Visualization Mastery',
      description: 'Master the art of creating compelling vision movies and using AI tools to accelerate your transformation.',
      instructor: 'Rashee Harvey',
      duration: '3 hours',
      lessons: 12,
      level: 'Intermediate',
      price: 'Free',
      rating: 4.8,
      students: 890,
      image: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800',
      features: [
        'Science of visualization',
        'Creating effective vision boards',
        'Introduction to AI vision movies',
        'Daily visualization practices'
      ]
    },
    {
      id: 3,
      title: 'Habit Architecture Masterclass',
      description: 'Build lasting habits that support your transformation goals using science-based methods and smart tracking.',
      instructor: 'Rashee Harvey',
      duration: '4 hours',
      lessons: 16,
      level: 'Intermediate',
      price: '$197',
      rating: 4.9,
      students: 650,
      image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
      features: [
        'The science of habit formation',
        'Habit stacking techniques',
        'Overcoming habit obstacles',
        'Creating habit systems that stick'
      ]
    },
    {
      id: 4,
      title: 'Transformation Coaching Certification',
      description: 'Become a certified transformation coach and learn to guide others from self-doubt to self-belief.',
      instructor: 'Rashee Harvey',
      duration: '20 hours',
      lessons: 40,
      level: 'Advanced',
      price: '$997',
      rating: 5.0,
      students: 125,
      image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
      features: [
        'Professional coaching techniques',
        'Client assessment methods',
        'Transformation frameworks',
        'Business building strategies',
        'Certification upon completion'
      ]
    },
    {
      id: 5,
      title: 'Digital Detox & Mindful Living',
      description: 'Reclaim your attention and create space for transformation by mastering your relationship with technology.',
      instructor: 'Rashee Harvey',
      duration: '2.5 hours',
      lessons: 10,
      level: 'Beginner',
      price: '$97',
      rating: 4.7,
      students: 420,
      image: 'https://images.pexels.com/photos/3184340/pexels-photo-3184340.jpeg?auto=compress&cs=tinysrgb&w=800',
      features: [
        'Understanding digital addiction',
        'Creating healthy boundaries',
        'Mindfulness practices',
        'Productivity optimization'
      ]
    },
    {
      id: 6,
      title: 'Vision to Reality Blueprint',
      description: 'A comprehensive system for turning your biggest dreams into achievable, step-by-step action plans.',
      instructor: 'Rashee Harvey',
      duration: '5 hours',
      lessons: 20,
      level: 'Advanced',
      price: '$297',
      rating: 4.9,
      students: 380,
      image: 'https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=800',
      features: [
        'Vision clarification exercises',
        'Goal setting frameworks',
        'Action planning systems',
        'Progress tracking methods',
        'Obstacle navigation strategies'
      ]
    }
  ];

  const freeCourses = courses.filter(course => course.price === 'Free');
  const paidCourses = courses.filter(course => course.price !== 'Free');

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transformation Courses
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive courses designed to guide you from self-doubt to self-belief. 
            Start with free courses and advance to premium certifications.
          </p>
        </div>
      </section>

      {/* Free Courses */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Free Courses
            </h2>
            <p className="text-xl text-gray-600">
              Start your transformation journey with these comprehensive free courses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {freeCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Free
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-purple-600 font-semibold">{course.level}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">{course.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Video className="h-4 w-4" />
                      <span>{course.lessons} lessons</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{course.students}</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2">
                    <Play className="h-5 w-5" />
                    <span>Start Free Course</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Courses */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Premium Courses
            </h2>
            <p className="text-xl text-gray-600">
              Advanced courses for deeper transformation and professional development
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paidCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {course.price}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-purple-600 font-semibold">{course.level}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">{course.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {course.description}
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">What you'll learn:</h4>
                    <ul className="space-y-1">
                      {course.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Video className="h-4 w-4" />
                      <span>{course.lessons} lessons</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Benefits */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              Why Choose Rashee's Courses?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Proven methodologies, practical tools, and ongoing support to ensure your transformation success.
            </p>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/10 p-6 rounded-xl">
                <BookOpen className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Expert Content</h3>
                <p className="text-purple-100 text-sm">
                  Courses designed by a certified transformation coach with proven results.
                </p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl">
                <Users className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Community Support</h3>
                <p className="text-purple-100 text-sm">
                  Join a community of learners supporting each other's growth.
                </p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl">
                <Download className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Practical Tools</h3>
                <p className="text-purple-100 text-sm">
                  Downloadable resources and templates you can use immediately.
                </p>
              </div>
              <div className="bg-white/10 p-6 rounded-xl">
                <CheckCircle className="h-8 w-8 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Lifetime Access</h3>
                <p className="text-purple-100 text-sm">
                  Access your courses forever with free updates and new content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Your Transformation?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Begin with a free course today and take the first step towards replacing self-doubt with self-belief.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Browse Free Courses
            </button>
            <a
              href="https://calendly.com/rashenal/catchup-with-rashee"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-purple-600 hover:text-white transition-all duration-300 inline-flex items-center justify-center"
            >
              Book Consultation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}