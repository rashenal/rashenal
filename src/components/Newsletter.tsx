import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically integrate with your email service
    // For now, we'll just show a success message
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail('');
    }, 3000);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
          <Mail className="h-12 w-12 text-white mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">
            Transform Your Inbox
          </h3>
          <p className="text-purple-100 mb-6">
            Get weekly insights, tips, and inspiration delivered straight to your inbox. 
            Join our community of transformation seekers.
          </p>
          
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Subscribe
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-white">
              <CheckCircle className="h-6 w-6" />
              <span className="font-semibold">Thank you for subscribing!</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}