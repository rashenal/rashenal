import React from 'react';
import { Play, Star, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function AIVisionMovies() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    AI Vision Movies
                  </span>
                </h1>
                <p className="text-2xl text-gray-600 font-medium">
                  See Your Future Success Story
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Experience the power of visualization like never before. Our AI-generated movies 
                  feature YOU as the star of your own transformation story, making your dreams 
                  feel tangible and achievable.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Create My Vision Movie
                </button>
                <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-purple-600 hover:text-white transition-all duration-300">
                  Watch Sample Movie
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-gray-900 rounded-2xl relative overflow-hidden shadow-2xl">
                <img 
                  src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                  alt="AI Vision Movie Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button className="bg-white/90 p-6 rounded-full hover:bg-white transition-all duration-300 transform hover:scale-110">
                    <Play className="h-12 w-12 text-purple-600 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How AI Vision Movies Work
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our revolutionary process combines cutting-edge AI technology with proven visualization 
              techniques to create your personalized success story.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Vision Discovery Session</h3>
              <p className="text-gray-600">
                We work together to define your goals, dreams, and what success looks like for you. 
                This becomes the foundation of your personalized movie script.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Movie Creation</h3>
              <p className="text-gray-600">
                Using advanced AI technology (HeyGen), we create a cinematic movie featuring you 
                as the protagonist achieving your goals and living your dream life.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Daily Visualization</h3>
              <p className="text-gray-600">
                Watch your personalized movie daily to reinforce your goals, boost motivation, 
                and program your subconscious mind for success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Why Vision Movies Transform Lives
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Neural Pathway Programming",
                    description: "Seeing yourself succeed creates new neural pathways that make success feel familiar and achievable."
                  },
                  {
                    title: "Emotional Connection",
                    description: "Movies create emotional experiences that traditional vision boards simply cannot match."
                  },
                  {
                    title: "Daily Motivation",
                    description: "Your personalized movie becomes a powerful daily ritual that keeps you focused and inspired."
                  },
                  {
                    title: "Subconscious Programming",
                    description: "Regular viewing programs your subconscious mind to recognize and pursue opportunities."
                  }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800" 
                alt="Vision Movie Benefits" 
                className="w-full h-96 object-cover rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <span className="font-semibold text-gray-700">AI-Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              See how AI Vision Movies have transformed lives
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Entrepreneur",
                image: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400",
                quote: "Watching myself succeed in my vision movie every morning gave me the confidence to launch my business. Within 6 months, everything I saw in that movie became reality.",
                result: "Launched successful business"
              },
              {
                name: "Marcus Chen",
                role: "Sales Director",
                image: "https://images.pexels.com/photos/3184340/pexels-photo-3184340.jpeg?auto=compress&cs=tinysrgb&w=400",
                quote: "The vision movie made my goals feel so real and achievable. I could see myself as the top performer, and that's exactly what happened.",
                result: "Became #1 sales performer"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                    <p className="text-sm text-green-600 font-semibold">{testimonial.result}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic mb-4">"{testimonial.quote}"</p>
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Investment in Your Future
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Choose the package that best fits your transformation goals
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Single Vision Movie</h3>
              <div className="text-4xl font-bold text-purple-600 mb-6">$497</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>1-hour vision discovery session</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Custom AI-generated movie (3-5 minutes)</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>HD video download</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Viewing guide & best practices</span>
                </li>
              </ul>
              <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                Get Started
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-2xl shadow-lg text-white relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-4">Vision Movie + Coaching</h3>
              <div className="text-4xl font-bold mb-6">$997</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <span>Everything in Single Movie</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <span>3 follow-up coaching sessions</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <span>Action plan development</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <span>Progress tracking & accountability</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                  <span>Movie updates as goals evolve</span>
                </li>
              </ul>
              <button className="w-full bg-white text-purple-600 py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                Start Transformation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to See Your Future Success?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Book a free consultation to discuss your vision and learn how an AI-generated movie 
            can accelerate your transformation journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://calendly.com/rashenal/catchup-with-rashee"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-2"
            >
              <span>Book Free Consultation</span>
              <ArrowRight className="h-5 w-5" />
            </a>
            <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-full font-semibold hover:bg-purple-600 hover:text-white transition-all duration-300">
              Watch Sample Movies
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}