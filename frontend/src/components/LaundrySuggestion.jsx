import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from './AnimatedCard';
import LoadingSpinner from './LoadingSpinner';
import StatusIndicator from './StatusIndicator';

const LaundrySuggestion = ({ onItemMovedToLaundry, onDismiss }) => {
  const user = useSelector(selectUser);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch laundry suggestions
  const fetchSuggestions = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/laundry-suggestions/${user._id}`, {
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.data.suggestions);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error fetching laundry suggestions:', err);
      setError('Failed to fetch laundry suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [user?._id]);

  // Move item to laundry
  const moveToLaundry = async (clothingId, itemType) => {
    try {
      const response = await fetch(`http://localhost:8000/api/laundry/add/${clothingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: user._id })
      });

      const data = await response.json();
      
      if (data.success) {
        // Learn from user decision
        await fetch('http://localhost:8000/api/laundry-suggestions/learn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            userId: user._id,
            clothingId,
            decision: 'moved_to_laundry',
            itemType
          })
        });

        // Remove from suggestions
        setSuggestions(prev => prev.filter(s => s.clothingItem._id !== clothingId));
        
        // Notify parent component
        if (onItemMovedToLaundry) {
          onItemMovedToLaundry(clothingId);
        }
      } else {
        alert('Failed to move item to laundry');
      }
    } catch (err) {
      console.error('Error moving item to laundry:', err);
      alert('Failed to move item to laundry');
    }
  };

  // Dismiss suggestion
  const dismissSuggestion = async (clothingId, itemType) => {
    try {
      // Learn from user decision
      await fetch('http://localhost:8000/api/laundry-suggestions/learn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user._id,
          clothingId,
          decision: 'kept_wearing',
          itemType
        })
      });

      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.clothingItem._id !== clothingId));
    } catch (err) {
      console.error('Error dismissing suggestion:', err);
    }
  };

  // Update wash preference
  const updateWashPreference = async (clothingId, preference) => {
    try {
      const response = await fetch(`http://localhost:8000/api/laundry-suggestions/wash-preference/${clothingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: user._id, preference })
      });

      if (response.ok) {
        // Refresh suggestions
        fetchSuggestions();
      }
    } catch (err) {
      console.error('Error updating wash preference:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="medium" text="Checking for laundry suggestions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchSuggestions}
          className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <motion.div 
        className="text-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">All Clean!</h3>
        <p className="text-gray-500">No laundry suggestions at the moment.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.h3 
        className="text-xl font-semibold text-white mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        🧠 Smart Laundry Suggestions
      </motion.h3>

      <AnimatePresence>
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.clothingItem._id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <AnimatedCard className="p-4" delay={index * 0.1}>
              <div className="flex items-center gap-4">
                {/* Item Image */}
                <img
                  src={suggestion.clothingItem.imageUrl || 'https://via.placeholder.com/80x80/374151/9CA3AF?text=No+Image'}
                  alt={suggestion.clothingItem.metadata?.description || 'Clothing item'}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/80x80/374151/9CA3AF?text=No+Image';
                  }}
                />

                {/* Suggestion Details */}
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">
                    {suggestion.clothingItem.metadata?.description || suggestion.clothingItem.fileName || 'Unknown Item'}
                  </h4>
                  <p className="text-sm text-gray-400 mb-2">
                    {suggestion.suggestion.reason}
                  </p>
                  
                  {/* Smart Status Display */}
                  <div className="mb-2">
                    <StatusIndicator 
                      status={suggestion.clothingItem.cleanlinessStatus}
                      freshnessScore={suggestion.clothingItem.freshnessScore}
                      wearCount={suggestion.suggestion.wearCount}
                      className="text-xs"
                    />
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Preference: {suggestion.suggestion.preference.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <motion.button
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                    onClick={() => moveToLaundry(suggestion.clothingItem._id, suggestion.clothingItem.metadata?.category)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Move to Laundry
                  </motion.button>
                  
                  <motion.button
                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
                    onClick={() => dismissSuggestion(suggestion.clothingItem._id, suggestion.clothingItem.metadata?.category)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Keep Wearing
                  </motion.button>
                </div>
              </div>

              {/* Wash Preference Selector */}
              <div className="mt-3 pt-3 border-t border-gray-600">
                <label className="text-sm text-gray-400 mb-2 block">Wash preference for this item:</label>
                <div className="flex gap-2">
                  {[
                    { value: 'afterEachWear', label: 'After Each Wear' },
                    { value: 'afterFewWears', label: 'After Few Wears' },
                    { value: 'manual', label: 'Manual Only' }
                  ].map(pref => (
                    <motion.button
                      key={pref.value}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        suggestion.clothingItem.userWashPreference === pref.value
                          ? 'bg-yellow-500 text-black'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      onClick={() => updateWashPreference(suggestion.clothingItem._id, pref.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {pref.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default LaundrySuggestion;
