import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackButtons = ({ 
  recommendationId, 
  onSubmitFeedback, 
  isSubmitting = false,
  hasSubmitted = false 
}) => {
  const [showDetailed, setShowDetailed] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleQuickFeedback = (isPositive) => {
    const quickRating = isPositive ? 5 : 1;
    const quickComment = isPositive ? "Great suggestion!" : "Not quite right for me";
    onSubmitFeedback(recommendationId, quickRating, quickComment);
  };

  const handleDetailedSubmit = () => {
    if (rating > 0) {
      onSubmitFeedback(recommendationId, rating, comment);
      setShowDetailed(false);
      setRating(0);
      setComment('');
    }
  };

  if (hasSubmitted) {
    return (
      <motion.div 
        className="bg-green-900/30 border border-green-500 rounded-lg p-3 text-green-200 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        ✅ Thanks for your feedback!
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Feedback Buttons */}
      <div className="flex gap-2">
        <motion.button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          onClick={() => handleQuickFeedback(true)}
          disabled={isSubmitting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>👍</span>
          <span>Love it!</span>
        </motion.button>
        
        <motion.button
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          onClick={() => handleQuickFeedback(false)}
          disabled={isSubmitting}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>👎</span>
          <span>Not for me</span>
        </motion.button>

        <motion.button
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          onClick={() => setShowDetailed(!showDetailed)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>📝</span>
          <span>Detailed</span>
        </motion.button>
      </div>

      {/* Detailed Feedback Form */}
      <AnimatePresence>
        {showDetailed && (
          <motion.div
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-600"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="text-sm font-medium text-gray-300 mb-3">Rate this recommendation</h4>
            
            {/* Star Rating */}
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-500'}`}
                  onClick={() => setRating(star)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ★
                </motion.button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              placeholder="Tell us more about your experience (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />

            {/* Submit Button */}
            <div className="flex gap-2 mt-3">
              <motion.button
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors font-medium disabled:opacity-50"
                onClick={handleDetailedSubmit}
                disabled={rating === 0 || isSubmitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </motion.button>
              
              <motion.button
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                onClick={() => setShowDetailed(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackButtons;
