import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle password reset logic here
    console.log('Password reset for:', email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-bold text-yellow-400 mb-4 inline-block">
              SmartWardrobe
            </Link>
          </div>

          {/* Success Message */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Check Your Email</h1>
            <p className="text-gray-300 mb-6">
              We've sent a password reset link to <span className="text-yellow-400">{email}</span>
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full py-3 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300 transition-all duration-200 transform hover:scale-105"
              >
                Try Another Email
              </button>
              <Link
                to="/signin"
                className="block w-full py-3 text-yellow-400 font-semibold rounded-lg hover:text-yellow-300 transition-colors duration-200"
              >
                Back to Sign In
              </Link>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link 
              to="/" 
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-yellow-400 mb-4 inline-block">
            SmartWardrobe
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-gray-400">No worries, we'll send you reset instructions</p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email address"
              />
              <p className="mt-2 text-sm text-gray-400">
                We'll send you a link to reset your password
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-yellow-400 text-black font-bold rounded-lg hover:bg-yellow-300 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Send Reset Link
            </button>
          </form>

          {/* Back to Sign In */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Remember your password?{' '}
              <Link 
                to="/signin" 
                className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
