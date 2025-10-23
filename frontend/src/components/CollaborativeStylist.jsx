import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from './AnimatedCard';
import LoadingSpinner from './LoadingSpinner';

const CollaborativeStylist = ({ collectionId, ownerName }) => {
  const user = useSelector(selectUser);
  const [collection, setCollection] = useState(null);
  const [clothingItems, setClothingItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [note, setNote] = useState('');
  const [context, setContext] = useState({
    occasion: '',
    weather: '',
    season: '',
    formality: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch collection and items
  useEffect(() => {
    const fetchCollection = async () => {
      if (!collectionId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/collections/${collectionId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCollection(data.data);
          setClothingItems(data.data.clothingItems || []);
        }
      } catch (error) {
        console.error('Failed to fetch collection:', error);
        setMessage('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId]);

  const handleItemSelect = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected._id === item._id);
      if (isSelected) {
        return prev.filter(selected => selected._id !== item._id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSubmitSuggestion = async () => {
    if (selectedItems.length === 0) {
      setMessage('Please select at least one item for your suggestion');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/suggestions/${collectionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          suggestedBy: user._id,
          outfitItems: selectedItems.map(item => item._id),
          note,
          context
        })
      });

      if (response.ok) {
        setMessage('Suggestion submitted successfully! 🎉');
        setSelectedItems([]);
        setNote('');
        setContext({
          occasion: '',
          weather: '',
          season: '',
          formality: ''
        });
      } else {
        const errorData = await response.json();
        setMessage(`Failed to submit suggestion: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      setMessage('Failed to submit suggestion');
    } finally {
      setSubmitting(false);
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
        <LoadingSpinner text="Loading collection..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            👗 Style {ownerName}'s Collection
          </h1>
          <p className="text-gray-400 text-lg">
            Help create the perfect outfit from their wardrobe!
          </p>
        </div>

        {/* Context Form */}
        <motion.div
          className="bg-gray-800 p-6 rounded-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-semibold mb-4">Outfit Context</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Occasion</label>
              <select
                value={context.occasion}
                onChange={(e) => setContext({...context, occasion: e.target.value})}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Any</option>
                <option value="casual">Casual</option>
                <option value="work">Work</option>
                <option value="party">Party</option>
                <option value="date">Date</option>
                <option value="travel">Travel</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Weather</label>
              <select
                value={context.weather}
                onChange={(e) => setContext({...context, weather: e.target.value})}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Any</option>
                <option value="sunny">Sunny</option>
                <option value="rainy">Rainy</option>
                <option value="cold">Cold</option>
                <option value="hot">Hot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Season</label>
              <select
                value={context.season}
                onChange={(e) => setContext({...context, season: e.target.value})}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Any</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Formality</label>
              <select
                value={context.formality}
                onChange={(e) => setContext({...context, formality: e.target.value})}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Any</option>
                <option value="casual">Casual</option>
                <option value="smart-casual">Smart Casual</option>
                <option value="formal">Formal</option>
                <option value="semi-formal">Semi-Formal</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Selected Items Preview */}
        {selectedItems.length > 0 && (
          <motion.div
            className="bg-purple-900/20 p-6 rounded-xl mb-8 border border-purple-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-semibold mb-4">Your Outfit Suggestion</h3>
            <div className="flex flex-wrap gap-4">
              {selectedItems.map((item) => (
                <div key={item._id} className="flex items-center bg-gray-800 p-3 rounded-lg">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg mr-3"
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                  <button
                    onClick={() => handleItemSelect(item)}
                    className="ml-3 text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Clothing Items Grid */}
        <motion.div
          className="mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h3 className="text-2xl font-semibold mb-6">Available Items</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {clothingItems.map((item) => {
                const isSelected = selectedItems.some(selected => selected._id === item._id);
                return (
                  <AnimatedCard
                    key={item._id}
                    variants={itemVariants}
                    className={`relative cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'ring-2 ring-purple-500 bg-purple-900/20' 
                        : 'hover:ring-2 hover:ring-gray-500'
                    }`}
                    onClick={() => handleItemSelect(item)}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                    <div className="p-4">
                      <h4 className="font-semibold mb-2 line-clamp-1">{item.name}</h4>
                      <p className="text-sm text-gray-400 mb-2">
                        {item.metadata?.category} - {item.metadata?.color?.primary}
                      </p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                  </AnimatedCard>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Note Section */}
        <motion.div
          className="bg-gray-800 p-6 rounded-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold mb-4">Add a Note (Optional)</h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why do you think this outfit works? Any styling tips?"
            className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
            rows={3}
            maxLength={500}
          />
          <p className="text-sm text-gray-400 mt-2">{note.length}/500 characters</p>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <button
            onClick={handleSubmitSuggestion}
            disabled={submitting || selectedItems.length === 0}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
              submitting || selectedItems.length === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {submitting ? 'Submitting...' : `Submit Suggestion (${selectedItems.length} items)`}
          </button>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            className={`mt-6 p-4 rounded-lg text-center ${
              message.includes('successfully') 
                ? 'bg-green-600' 
                : 'bg-red-600'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {message}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CollaborativeStylist;
