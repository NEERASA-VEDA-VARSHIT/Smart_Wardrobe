import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from './AnimatedCard';
import LoadingSpinner from './LoadingSpinner';

const FriendStylistView = () => {
  const { ownerId } = useParams();
  const [searchParams] = useSearchParams();
  const collectionId = searchParams.get('collection');
  
  const [collection, setCollection] = useState(null);
  const [clothingItems, setClothingItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [suggestionNote, setSuggestionNote] = useState('');
  const [occasion, setOccasion] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch collection and clothing items
  useEffect(() => {
    const fetchCollectionData = async () => {
      if (!collectionId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch collection details
        const collectionResponse = await fetch(`/api/collections/${collectionId}`);
        if (!collectionResponse.ok) {
          throw new Error('Collection not found or access denied');
        }
        const collectionData = await collectionResponse.json();
        setCollection(collectionData.data);

        // Fetch clothing items in the collection
        const itemsResponse = await fetch(`/api/collections/${collectionId}/items`);
        if (!itemsResponse.ok) {
          throw new Error('Failed to fetch clothing items');
        }
        const itemsData = await itemsResponse.json();
        setClothingItems(itemsData.data);
        
      } catch (err) {
        console.error('Error fetching collection data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, [collectionId]);

  const handleItemSelect = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSubmitSuggestion = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one clothing item');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/outfit-suggestions/${collectionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          outfitItems: selectedItems,
          note: suggestionNote,
          occasion: occasion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit suggestion');
      }

      setSuccess(true);
      setSelectedItems([]);
      setSuggestionNote('');
      setOccasion('');
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      console.error('Error submitting suggestion:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getItemById = (itemId) => {
    return clothingItems.find(item => item._id === itemId);
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <LoadingSpinner text="Loading collection..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-red-400 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
          👗 Stylist Mode
        </h1>
        <p className="text-gray-300 text-lg">
          Help style <span className="font-semibold text-purple-400">{collection?.name}</span>
        </p>
        {collection?.description && (
          <p className="text-gray-400 mt-2">{collection.description}</p>
        )}
      </motion.div>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="bg-green-600 p-4 rounded-lg text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            ✅ Suggestion submitted successfully! Thank you for your input.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Items Preview */}
      {selectedItems.length > 0 && (
        <motion.div
          className="bg-gray-800 p-6 rounded-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-purple-400">
            Your Outfit Suggestion ({selectedItems.length} items)
          </h3>
          <div className="flex flex-wrap gap-4 mb-4">
            {selectedItems.map(itemId => {
              const item = getItemById(itemId);
              return item ? (
                <div key={itemId} className="flex items-center gap-2 bg-gray-700 p-3 rounded-lg">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <span className="text-sm">{item.name}</span>
                  <button
                    onClick={() => handleItemSelect(itemId)}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    ×
                  </button>
                </div>
              ) : null;
            })}
          </div>
        </motion.div>
      )}

      {/* Suggestion Form */}
      {selectedItems.length > 0 && (
        <motion.div
          className="bg-gray-800 p-6 rounded-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-purple-400">Add Your Note</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Occasion (optional)</label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g., Dinner date, Beach day, Work meeting"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Your styling note</label>
              <textarea
                value={suggestionNote}
                onChange={(e) => setSuggestionNote(e.target.value)}
                placeholder="Tell them why this outfit works! e.g., 'Perfect for a summer evening - the colors complement each other beautifully'"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none h-24 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">
                {suggestionNote.length}/500 characters
              </p>
            </div>
            <button
              onClick={handleSubmitSuggestion}
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-medium transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Suggestion ✨'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Clothing Items Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {clothingItems.map((item) => (
            <AnimatedCard
              key={item._id}
              variants={itemVariants}
              className={`relative bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                selectedItems.includes(item._id)
                  ? 'ring-2 ring-purple-500 bg-purple-900/20'
                  : 'hover:bg-gray-700'
              }`}
              onClick={() => handleItemSelect(item._id)}
            >
              <img
                src={item.imageUrl || 'https://via.placeholder.com/300x300/374151/9CA3AF?text=No+Image'}
                alt={item.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x300/374151/9CA3AF?text=No+Image';
                }}
              />
              
              {/* Selection Indicator */}
              {selectedItems.includes(item._id) && (
                <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                  ✓
                </div>
              )}

              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1 line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                  {item.metadata?.description || 'No description available'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.metadata?.category && (
                    <span className="px-2 py-1 bg-gray-700 text-xs rounded">
                      {item.metadata.category}
                    </span>
                  )}
                  {item.metadata?.color?.primary && (
                    <span className="px-2 py-1 bg-gray-700 text-xs rounded">
                      {item.metadata.color.primary}
                    </span>
                  )}
                </div>
              </div>
            </AnimatedCard>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {clothingItems.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No clothing items in this collection
          </h3>
          <p className="text-gray-500">
            The collection owner hasn't added any items yet.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default FriendStylistView;
