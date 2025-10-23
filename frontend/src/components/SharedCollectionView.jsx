import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { selectUser } from '../redux/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { collectionsAPI, suggestionsAPI } from '../api';
import LoadingSpinner from './LoadingSpinner';
import AnimatedCard from './AnimatedCard';

const SharedCollectionView = () => {
  const { collectionId } = useParams();
  const user = useSelector(selectUser);
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionData, setSuggestionData] = useState({
    outfitItems: [],
    note: '',
    occasion: '',
    aiEnhancement: false
  });

  // Fetch collection details
  useEffect(() => {
    const fetchCollection = async () => {
      if (!collectionId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await collectionsAPI.getSharedCollection(collectionId);
        setCollection(response.data);
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId]);

  // Submit outfit suggestion
  const handleSubmitSuggestion = async (e) => {
    e.preventDefault();
    if (!collection) return;

    try {
      const response = await suggestionsAPI.submitSuggestion(
        collection._id,
        suggestionData,
      );

      setSuggestionData({
        outfitItems: [],
        note: '',
        occasion: '',
        aiEnhancement: false
      });
      setShowSuggestionModal(false);
      
      // Show success message
      alert('Outfit suggestion submitted successfully!');
    } catch (err) {
      console.error('Error submitting suggestion:', err);
      setError('Failed to submit suggestion');
    }
  };

  // Toggle item selection for suggestion
  const toggleItemSelection = (itemId) => {
    setSuggestionData(prev => ({
      ...prev,
      outfitItems: prev.outfitItems.includes(itemId)
        ? prev.outfitItems.filter(id => id !== itemId)
        : [...prev.outfitItems, itemId]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading collection..." />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold mb-2">Collection Not Found</h3>
        <p className="text-gray-400">{error || 'This collection may have been deleted or is no longer shared.'}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6 pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Collection Header */}
        <motion.div
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{collection.name}</h1>
              {collection.description && (
                <p className="text-gray-400 text-lg">{collection.description}</p>
              )}
              <div className="flex items-center mt-2 text-sm text-gray-400">
                <span>👤 Shared by {collection.userId?.name || 'Unknown'}</span>
                <span className="mx-2">•</span>
                <span>{collection.itemIds?.length || 0} items</span>
              </div>
            </div>
            <motion.button
              onClick={() => setShowSuggestionModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              💡 Suggest Outfit
            </motion.button>
          </div>

          {/* Tags */}
          {collection.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {collection.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Collection Items */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {collection.itemIds?.map((item) => (
            <AnimatedCard
              key={item._id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="aspect-square relative">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500">
                    📷
                  </div>
                )}
                
                {/* Selection indicator for suggestions */}
                {showSuggestionModal && (
                  <div className="absolute top-2 right-2">
                    <motion.button
                      onClick={() => toggleItemSelection(item._id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        suggestionData.outfitItems.includes(item._id)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-gray-800/50 border-gray-400 text-gray-400'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {suggestionData.outfitItems.includes(item._id) && '✓'}
                    </motion.button>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-white truncate">
                  {item.name || item.metadata?.description || 'Untitled Item'}
                </h3>
                {item.metadata?.category && (
                  <p className="text-xs text-gray-400 mt-1">{item.metadata.category}</p>
                )}
              </div>
            </AnimatedCard>
          ))}
        </motion.div>

        {/* Empty State */}
        {collection.itemIds?.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-6xl mb-4">👕</div>
            <h3 className="text-xl font-semibold mb-2">No Items Yet</h3>
            <p className="text-gray-400">This collection doesn't have any items yet.</p>
          </motion.div>
        )}

        {/* Suggestion Modal */}
        <AnimatePresence>
          {showSuggestionModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h2 className="text-2xl font-bold mb-4">Suggest an Outfit</h2>
                <p className="text-gray-400 mb-6">
                  Select items from the collection and add your suggestion
                </p>

                <form onSubmit={handleSubmitSuggestion}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Occasion</label>
                    <input
                      type="text"
                      value={suggestionData.occasion}
                      onChange={(e) => setSuggestionData(prev => ({ ...prev, occasion: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="e.g., Date night, Work meeting, Casual outing"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Your Note</label>
                    <textarea
                      value={suggestionData.note}
                      onChange={(e) => setSuggestionData(prev => ({ ...prev, note: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Why do you think this outfit works? Any styling tips?"
                      rows={3}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={suggestionData.aiEnhancement}
                        onChange={(e) => setSuggestionData(prev => ({ ...prev, aiEnhancement: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-300">Enhance with AI suggestions</span>
                    </label>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">
                      Selected items: {suggestionData.outfitItems.length}
                    </p>
                    {suggestionData.outfitItems.length === 0 && (
                      <p className="text-red-400 text-sm">Please select at least one item for your suggestion</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowSuggestionModal(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={suggestionData.outfitItems.length === 0}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                    >
                      Submit Suggestion
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SharedCollectionView;
