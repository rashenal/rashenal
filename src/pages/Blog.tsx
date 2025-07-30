import React from 'react';
import { Calendar, User, ArrowRight, Clock } from 'lucide-react';

const blogPosts = [
  {
    id: 1,
    title: "5 Signs You're Ready for Transformation",
    excerpt: "Discover the key indicators that signal you're prepared to make meaningful changes in your life and replace self-doubt with self-belief.",
    author: "Rashee Harvey",
    date: "2024-01-15",
    readTime: "5 min read",
    image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "Personal Growth"
  },
  {
    id: 2,
    title: "The Science Behind AI-Powered Vision Movies",
    excerpt: "Learn how visualization combined with AI technology creates powerful neural pathways that help manifest your goals into reality.",
    author: "Rashee Harvey",
    date: "2024-01-10",
    readTime: "7 min read",
    image: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "AI Technology"
  },
  {
    id: 3,
    title: "Building Habits That Stick: A Coach's Guide",
    excerpt: "Discover the proven strategies I use with clients to create lasting behavioral changes that support their transformation journey.",
    author: "Rashee Harvey",
    date: "2024-01-05",
    readTime: "6 min read",
    image: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "Habit Formation"
  },
  {
    id: 4,
    title: "From Self-Doubt to Self-Belief: My Journey",
    excerpt: "A personal reflection on my own transformation and how it led me to become the Queen of Transformation.",
    author: "Rashee Harvey",
    date: "2024-01-01",
    readTime: "8 min read",
    image: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800",
    category: "Personal Story"
  }
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transformation Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, strategies, and inspiration to help you replace self-doubt with self-belief 
            and create the life you've always envisioned.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl overflow-hidden shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-8 lg:p-12 text-white">
                <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  Featured Post
                </span>
                <h2 className="text-3xl font-bold mb-4">
                  {blogPosts[0].title}
                </h2>
                <p className="text-purple-100 mb-6 text-lg">
                  {blogPosts[0].excerpt}
                </p>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{blogPosts[0].author}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{blogPosts[0].date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{blogPosts[0].readTime}</span>
                  </div>
                </div>
                <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2">
                  <span>Read Full Article</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="h-64 lg:h-auto">
                <img 
                  src={blogPosts[0].image} 
                  alt={blogPosts[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.slice(1).map((post) => (
              <article key={post.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="inline-block bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                    {post.category}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{post.date}</span>
                      <span>{post.readTime}</span>
                    </div>
                    <button className="text-purple-600 hover:text-purple-700 font-semibold flex items-center space-x-1">
                      <span>Read More</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}