import React from 'react';
import { Users, MessageCircle, Calendar, Trophy, Heart, Star } from 'lucide-react';

export default function Community() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transformation Community
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with like-minded individuals on their journey from self-doubt to self-belief. 
            Find accountability partners, share victories, and grow together.
          </p>
        </div>
      </section>

      {/* Community Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-2xl">
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Human Accountability Partners</h3>
              <p className="text-gray-600 mb-4">
                Connect with real people who understand your journey. Get matched with accountability partners 
                who share similar goals and challenges.
              </p>
              <button className="text-purple-600 font-semibold hover:text-purple-700">
                Find Your Partner →
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl">
              <MessageCircle className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Discussion Forums</h3>
              <p className="text-gray-600 mb-4">
                Join conversations about transformation, share your wins, ask questions, 
                and support others in their journey.
              </p>
              <button className="text-blue-600 font-semibold hover:text-blue-700">
                Join Discussions →
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl">
              <Calendar className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Group Coaching Sessions</h3>
              <p className="text-gray-600 mb-4">
                Attend live group coaching sessions, workshops, and Q&A sessions with Rashee 
                and other transformation experts.
              </p>
              <button className="text-indigo-600 font-semibold hover:text-indigo-700">
                View Schedule →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Growing Community
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of transformation seekers worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">2,500+</div>
              <div className="text-gray-600">Active Members</div>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">1,200+</div>
              <div className="text-gray-600">Goals Achieved</div>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">850+</div>
              <div className="text-gray-600">Success Stories</div>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">4.9/5</div>
              <div className="text-gray-600">Community Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Recent Community Activity
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Discussions</h3>
              <div className="space-y-4">
                {[
                  { title: 'How to overcome imposter syndrome?', author: 'Sarah M.', replies: 12, time: '2 hours ago' },
                  { title: 'My 30-day habit tracking results!', author: 'Mike R.', replies: 8, time: '4 hours ago' },
                  { title: 'Vision movie creation tips', author: 'Lisa K.', replies: 15, time: '6 hours ago' },
                  { title: 'Finding the right accountability partner', author: 'James D.', replies: 6, time: '8 hours ago' }
                ].map((discussion, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 hover:text-purple-600 cursor-pointer">
                        {discussion.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        by {discussion.author} • {discussion.replies} replies
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{discussion.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Stories</h3>
              <div className="space-y-4">
                {[
                  { name: 'Emma T.', achievement: 'Completed first vision movie', time: '1 day ago' },
                  { name: 'David L.', achievement: '30-day meditation streak', time: '2 days ago' },
                  { name: 'Rachel P.', achievement: 'Started dream business', time: '3 days ago' },
                  { name: 'Tom W.', achievement: 'Lost 20 pounds with new habits', time: '5 days ago' }
                ].map((story, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{story.name}</p>
                      <p className="text-sm text-gray-600">{story.achievement}</p>
                    </div>
                    <span className="text-xs text-gray-500 ml-auto">{story.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Connect with others, find accountability partners, and accelerate your transformation journey.
          </p>
          <button className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            Join the Community
          </button>
        </div>
      </section>
    </div>
  );
}