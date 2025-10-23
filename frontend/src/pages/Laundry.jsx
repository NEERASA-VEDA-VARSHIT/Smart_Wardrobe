import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from '../components/AnimatedCard';
import LoadingSpinner from '../components/LoadingSpinner';
import LaundrySuggestion from '../components/LaundrySuggestion';
import StatusIndicator from '../components/StatusIndicator';

const Laundry = () => {
  const user = useSelector(selectUser);
  const [laundryItems, setLaundryItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Fetch laundry items
  const fetchLaundryItems = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/laundry/${user._id}`, {
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        setLaundryItems(data.data.items);
        setGroupedItems(data.data.grouped);
        setStats(data.data.stats);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error fetching laundry items:', err);
      setError('Failed to fetch laundry items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaundryItems();
  }, [user?._id]);

  // Mark item as washed
  const markAsWashed = async (clothingId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/laundry/return/${clothingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: user._id, status: 'ready_to_wear' })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        fetchLaundryItems();
      } else {
        alert('Failed to mark item as washed');
      }
    } catch (err) {
      console.error('Error marking item as washed:', err);
      alert('Failed to mark item as washed');
    }
  };

  // Remove item from laundry
  const removeFromLaundry = async (clothingId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/laundry/remove/${clothingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: user._id })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        fetchLaundryItems();
      } else {
        alert('Failed to remove item from laundry');
      }
    } catch (err) {
      console.error('Error removing item from laundry:', err);
      alert('Failed to remove item from laundry');
    }
  };

  // Handle item moved to laundry from suggestions
  const handleItemMovedToLaundry = (clothingId) => {
    // Refresh the laundry items list
    fetchLaundryItems();
  };

  // Filter items by status
  const getFilteredItems = () => {
    if (selectedStatus === 'all') {
      return laundryItems;
    }
    return groupedItems[selectedStatus] || [];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_laundry': return 'bg-gray-600';
      case 'washed': return 'bg-blue-600';
      case 'ready_to_wear': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in_laundry': return 'In Laundry';
      case 'washed': return 'Washed';
      case 'ready_to_wear': return 'Ready to Wear';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading laundry..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={fetchLaundryItems}
            className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">🧺 Laundry Bag</h1>
          <p className="text-gray-400 text-lg">Track your dirty clothes and manage your laundry</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AnimatedCard className="text-center p-6" delay={0.1}>
            <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.total || 0}</div>
            <div className="text-gray-300">Total Items</div>
          </AnimatedCard>
          
          <AnimatedCard className="text-center p-6" delay={0.2}>
            <div className="text-3xl font-bold text-gray-400 mb-2">{stats.in_laundry || 0}</div>
            <div className="text-gray-300">In Laundry</div>
          </AnimatedCard>
          
          <AnimatedCard className="text-center p-6" delay={0.3}>
            <div className="text-3xl font-bold text-blue-400 mb-2">{stats.washed || 0}</div>
            <div className="text-gray-300">Washed</div>
          </AnimatedCard>
          
          <AnimatedCard className="text-center p-6" delay={0.4}>
            <div className="text-3xl font-bold text-green-400 mb-2">{stats.ready_to_wear || 0}</div>
            <div className="text-gray-300">Ready to Wear</div>
          </AnimatedCard>
        </motion.div>

        {/* Smart Suggestions Toggle */}
        <motion.div 
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              showSuggestions
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            {showSuggestions ? '🧠 Hide Smart Suggestions' : '🧠 Show Smart Suggestions'}
          </button>
        </motion.div>

        {/* Smart Laundry Suggestions */}
        {showSuggestions && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <LaundrySuggestion onItemMovedToLaundry={handleItemMovedToLaundry} />
          </motion.div>
        )}

        {/* Filter Buttons */}
        <motion.div 
          className="flex flex-wrap gap-2 mb-8 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {[
            { key: 'all', label: 'All Items', count: stats.total },
            { key: 'in_laundry', label: 'In Laundry', count: stats.in_laundry },
            { key: 'washed', label: 'Washed', count: stats.washed },
            { key: 'ready_to_wear', label: 'Ready to Wear', count: stats.ready_to_wear }
          ].map((filter, index) => (
            <motion.button
              key={filter.key}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === filter.key
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedStatus(filter.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            >
              {filter.label} ({filter.count || 0})
            </motion.button>
          ))}
        </motion.div>

        {/* Laundry Items */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <AnimatePresence>
            {getFilteredItems().map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <AnimatedCard className="overflow-hidden group" hover={true}>
                  {/* Image */}
                  <div className="relative">
                    <img
                      src={item.clothingId?.imageUrl || 'https://via.placeholder.com/300x300/374151/9CA3AF?text=No+Image'}
                      alt={item.clothingId?.metadata?.description || 'Clothing item'}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300/374151/9CA3AF?text=No+Image';
                      }}
                    />
                    
                    {/* Smart Status Badge */}
                    <div className="absolute top-2 right-2">
                      <StatusIndicator 
                        status={item.clothingId?.cleanlinessStatus || item.status}
                        freshnessScore={item.clothingId?.freshnessScore}
                        wearCount={item.clothingId?.wearCount}
                        className="text-xs"
                      />
                    </div>

                    {/* Days in Laundry */}
                    <div className="absolute top-2 left-2 bg-black/50 rounded-full px-2 py-1">
                      <span className="text-xs text-white">
                        {item.daysInLaundry} day{item.daysInLaundry !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">
                      {item.clothingId?.metadata?.description || item.clothingId?.fileName || 'Unknown Item'}
                    </h3>
                    
                    <div className="text-sm text-gray-400 mb-3">
                      <div>Category: {item.clothingId?.metadata?.category || 'Unknown'}</div>
                      <div>Added: {new Date(item.addedAt).toLocaleDateString()}</div>
                      {item.expectedReturn && (
                        <div>Expected: {new Date(item.expectedReturn).toLocaleDateString()}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {item.status === 'in_laundry' && (
                        <motion.button
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                          onClick={() => markAsWashed(item.clothingId._id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Mark Washed
                        </motion.button>
                      )}
                      
                      <motion.button
                        className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors"
                        onClick={() => removeFromLaundry(item.clothingId._id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Remove
                      </motion.button>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {getFilteredItems().length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="text-6xl mb-4">🧺</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {selectedStatus === 'all' ? 'No items in laundry' : `No ${selectedStatus.replace('_', ' ')} items`}
            </h3>
            <p className="text-gray-500">
              {selectedStatus === 'all' 
                ? 'Your laundry bag is empty! Add items by marking outfits as worn.'
                : 'Try selecting a different filter to see more items.'
              }
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Laundry;
