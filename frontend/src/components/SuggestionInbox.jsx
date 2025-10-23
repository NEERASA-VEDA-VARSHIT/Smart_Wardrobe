import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from './AnimatedCard';
import LoadingSpinner from './LoadingSpinner';
import { suggestionsAPI } from '../api';

const SuggestionInbox = ({ collectionId }) => {
  const user = useSelector(selectUser);
  const [suggestions, setSuggestions] = useState([]);
  const [groupedSuggestions, setGroupedSuggestions] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [processing, setProcessing] = useState({});

  // Fetch suggestions
  const fetchSuggestions = async () => {
    if (!collectionId || !user?._id) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await suggestionsAPI.getCollectionSuggestions(collectionId);
      setSuggestions(result.data.suggestions);
      setGroupedSuggestions(result.data.groupedSuggestions);
      setStats(result.data.stats);
      
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [collectionId, user?._id]);

  const handleAccept = async (suggestionId, wornItems = []) => {
    setProcessing(prev => ({ ...prev, [suggestionId]: 'accepting' }));
    
    try {
      await suggestionsAPI.acceptSuggestion(suggestionId, { wornItems });

      // Refresh suggestions
      await fetchSuggestions();
      
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      alert(`Failed to accept suggestion: ${err.message}`);
    } finally {
      setProcessing(prev => ({ ...prev, [suggestionId]: null }));
    }
  };

  const handleMarkAsWorn = async (suggestionId) => {
    setProcessing(prev => ({ ...prev, [suggestionId]: 'worn' }));
    
    try {
      await suggestionsAPI.markSuggestionAsWorn(suggestionId);

      // Refresh suggestions
      await fetchSuggestions();
      
    } catch (err) {
      console.error('Error marking as worn:', err);
      alert(`Failed to mark as worn: ${err.message}`);
    } finally {
      setProcessing(prev => ({ ...prev, [suggestionId]: null }));
    }
  };

  const handleIgnore = async (suggestionId, feedback = '') => {
    setProcessing(prev => ({ ...prev, [suggestionId]: 'ignoring' }));
    
    try {
      await suggestionsAPI.ignoreSuggestion(suggestionId, feedback);

      // Refresh suggestions
      await fetchSuggestions();
      
    } catch (err) {
      console.error('Error ignoring suggestion:', err);
      alert(`Failed to ignore suggestion: ${err.message}`);
    } finally {
      setProcessing(prev => ({ ...prev, [suggestionId]: null }));
    }
  };

  const handleEnhance = async (suggestionId) => {
    setProcessing(prev => ({ ...prev, [suggestionId]: 'enhancing' }));
    
    try {
      await suggestionsAPI.enhanceSuggestion(suggestionId);

      // Refresh suggestions
      await fetchSuggestions();
      
    } catch (err) {
      console.error('Error enhancing suggestion:', err);
      alert(`Failed to enhance suggestion: ${err.message}`);
    } finally {
      setProcessing(prev => ({ ...prev, [suggestionId]: null }));
    }
  };

  const getFilteredSuggestions = () => {
    if (selectedStatus === 'all') {
      return suggestions;
    }
    return groupedSuggestions[selectedStatus] || [];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      case 'ignored': return 'bg-gray-500';
      case 'worn': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading suggestions..." />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="bg-red-600 p-4 rounded-lg text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-white">{error}</p>
        <button
          onClick={fetchSuggestions}
          className="mt-2 px-4 py-2 bg-white text-red-600 rounded hover:bg-gray-100"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatedCard className="bg-gradient-to-br from-yellow-600 to-yellow-800 text-center p-4 rounded-xl">
          <div className="text-2xl font-bold text-white">{stats.pending || 0}</div>
          <div className="text-yellow-200 text-sm">Pending</div>
        </AnimatedCard>
        <AnimatedCard className="bg-gradient-to-br from-green-600 to-green-800 text-center p-4 rounded-xl">
          <div className="text-2xl font-bold text-white">{stats.accepted || 0}</div>
          <div className="text-green-200 text-sm">Accepted</div>
        </AnimatedCard>
        <AnimatedCard className="bg-gradient-to-br from-blue-600 to-blue-800 text-center p-4 rounded-xl">
          <div className="text-2xl font-bold text-white">{stats.worn || 0}</div>
          <div className="text-blue-200 text-sm">Worn</div>
        </AnimatedCard>
        <AnimatedCard className="bg-gradient-to-br from-gray-600 to-gray-800 text-center p-4 rounded-xl">
          <div className="text-2xl font-bold text-white">{stats.ignored || 0}</div>
          <div className="text-gray-200 text-sm">Ignored</div>
        </AnimatedCard>
      </motion.div>

      {/* Filter Buttons */}
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {[
          { key: 'all', label: 'All', count: stats.total },
          { key: 'pending', label: 'Pending', count: stats.pending },
          { key: 'accepted', label: 'Accepted', count: stats.accepted },
          { key: 'worn', label: 'Worn', count: stats.worn },
          { key: 'ignored', label: 'Ignored', count: stats.ignored }
        ].map((filter) => (
          <button
            key={filter.key}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === filter.key
                ? getStatusColor(filter.key) + ' text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setSelectedStatus(filter.key)}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </motion.div>

      {/* Suggestions List */}
      {getFilteredSuggestions().length > 0 ? (
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {getFilteredSuggestions().map((suggestion) => (
              <AnimatedCard
                key={suggestion._id}
                variants={itemVariants}
                className="bg-gray-800 p-6 rounded-xl shadow-lg"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Outfit Items */}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-4 mb-4">
                      {suggestion.outfitItems.map((item) => (
                        <div key={item._id} className="text-center">
                          <img
                            src={item.imageUrl || 'https://via.placeholder.com/100x100/374151/9CA3AF?text=No+Image'}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg mb-2"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/100x100/374151/9CA3AF?text=No+Image';
                            }}
                          />
                          <p className="text-xs text-gray-400 line-clamp-2">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggestion Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(suggestion.status)} text-white`}>
                        {suggestion.status.toUpperCase()}
                      </span>
                      {suggestion.aiEnhanced && (
                        <span className="px-2 py-1 bg-purple-500 text-white rounded text-xs font-medium">
                          AI ENHANCED
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-300 mb-2">
                      Suggested by <span className="font-semibold text-purple-400">{suggestion.suggestedBy?.name}</span>
                    </p>

                    {suggestion.note && (
                      <p className="text-gray-300 mb-2 italic">"{suggestion.note}"</p>
                    )}

                    {suggestion.aiEnhancement && (
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 mb-3">
                        <p className="text-sm text-purple-200">
                          <span className="font-semibold">AI Insight:</span> {suggestion.aiEnhancement}
                        </p>
                      </div>
                    )}

                    {suggestion.occasion && (
                      <p className="text-xs text-gray-400 mb-2">
                        Occasion: {suggestion.occasion}
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      {new Date(suggestion.createdAt).toLocaleDateString()} • {suggestion.ageInDays} days ago
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {suggestion.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAccept(suggestion._id, suggestion.outfitItems.map(item => item._id))}
                          disabled={processing[suggestion._id]}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        >
                          {processing[suggestion._id] === 'accepting' ? 'Accepting...' : 'Accept & Mark as Worn'}
                        </button>
                        <button
                          onClick={() => handleIgnore(suggestion._id)}
                          disabled={processing[suggestion._id]}
                          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        >
                          {processing[suggestion._id] === 'ignoring' ? 'Ignoring...' : 'Ignore'}
                        </button>
                        {!suggestion.aiEnhanced && (
                          <button
                            onClick={() => handleEnhance(suggestion._id)}
                            disabled={processing[suggestion._id]}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                          >
                            {processing[suggestion._id] === 'enhancing' ? 'Enhancing...' : 'Ask AI to Enhance'}
                          </button>
                        )}
                      </>
                    )}

                    {suggestion.status === 'accepted' && (
                      <button
                        onClick={() => handleMarkAsWorn(suggestion._id)}
                        disabled={processing[suggestion._id]}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                      >
                        {processing[suggestion._id] === 'worn' ? 'Marking...' : 'Mark as Worn'}
                      </button>
                    )}

                    {suggestion.status === 'worn' && (
                      <div className="text-center text-green-400 text-sm font-medium">
                        ✓ Worn on {suggestion.wornAt ? new Date(suggestion.wornAt).toLocaleDateString() : 'Unknown date'}
                      </div>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No suggestions found
          </h3>
          <p className="text-gray-500">
            {selectedStatus === 'all' 
              ? 'No suggestions have been made for this collection yet.'
              : `No ${selectedStatus} suggestions found.`
            }
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default SuggestionInbox;