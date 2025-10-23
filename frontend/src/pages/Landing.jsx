import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">

      {/* Hero Section */}
      <section className="px-6 lg:px-12 py-20 lg:py-32">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            Your Smart Wardrobe,<br />
            <span className="text-yellow-400">Powered by AI</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover, organize, and get personalized outfit recommendations — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/signup" 
              className="px-8 py-4 bg-yellow-400 text-black font-bold text-lg rounded-xl hover:bg-yellow-300 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Get Started Free
            </Link>
            <Link 
              to="/signin" 
              className="px-8 py-4 border-2 border-gray-400 text-white font-semibold text-lg rounded-xl hover:border-yellow-400 hover:text-yellow-400 transition-all duration-200"
            >
              Log In
            </Link>
          </div>
          
          {/* Demo Placeholder */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
              <div className="aspect-video bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎥</div>
                  <p className="text-gray-300">Smart Mirror Demo Video</p>
                  <p className="text-sm text-gray-400 mt-2">AI suggesting perfect outfits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 lg:px-12 py-20 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16">
            Why Choose SmartWardrobe?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all duration-200">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-3 text-yellow-400">Smart Metadata</h3>
              <p className="text-gray-300">
                Auto-tag clothes with Gemini AI or enter manually for perfect organization.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all duration-200">
              <div className="text-5xl mb-4">🧠</div>
              <h3 className="text-xl font-bold mb-3 text-yellow-400">Vector-Powered Suggestions</h3>
              <p className="text-gray-300">
                AI embeddings help recommend better outfits based on your style preferences.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all duration-200">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-yellow-400">Organized Closet</h3>
              <p className="text-gray-300">
                Track what you wore, when you wore it, and optimize your wardrobe usage.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-all duration-200">
              <div className="text-5xl mb-4">☁️</div>
              <h3 className="text-xl font-bold mb-3 text-yellow-400">Cloud Sync</h3>
              <p className="text-gray-300">
                Your wardrobe available anywhere, anytime with seamless cloud synchronization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-3xl text-black font-bold mx-auto mb-6">
                1
              </div>
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Upload Your Clothes</h3>
              <p className="text-gray-300 text-lg">
                Take photos of your wardrobe items or upload existing images to get started.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-3xl text-black font-bold mx-auto mb-6">
                2
              </div>
              <div className="text-6xl mb-4">✍️</div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Confirm Metadata</h3>
              <p className="text-gray-300 text-lg">
                Review and confirm AI-generated tags or add your own custom metadata.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-3xl text-black font-bold mx-auto mb-6">
                3
              </div>
              <div className="text-6xl mb-4">👕</div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">Get Outfit Suggestions</h3>
              <p className="text-gray-300 text-lg">
                Receive instant, personalized outfit recommendations based on your style.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 lg:px-12 py-20 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8">
            Ready to upgrade your wardrobe?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of users who have transformed their style with AI-powered recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/signup" 
              className="px-10 py-4 bg-yellow-400 text-black font-bold text-xl rounded-xl hover:bg-yellow-300 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Get Started Free
            </Link>
            <Link 
              to="/signin" 
              className="px-10 py-4 text-yellow-400 font-semibold text-xl hover:text-yellow-300 transition-colors duration-200"
            >
              Already a member? Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold text-yellow-400 mb-4">
                SmartWardrobe
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Transform your wardrobe with AI-powered organization and personalized outfit recommendations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SmartWardrobe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
