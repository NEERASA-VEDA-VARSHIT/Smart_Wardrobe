import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from '../components/AnimatedCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { clothingAPI, laundryAPI } from '../api';

const EnhancedWardrobe = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [clothingItems, setClothingItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    color: '',
    season: '',
    formality: '',
    cleanlinessStatus: '',
    search: searchParams.get('search') || ''
  });

  // Handle action=add parameter
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      navigate('/add-clothing');
    }
  }, [searchParams, navigate]);

  // Fetch clothing items
  useEffect(() => {
    const fetchClothingItems = async () => {
      if (!user?._id) return;

      setLoading(true);
      setError(null);

      try {
        const result = await clothingAPI.getClothingItems(user._id);
        setClothingItems(result.data);
        setFilteredItems(result.data);

      } catch (err) {
        console.error('Error fetching clothing items:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClothingItems();
  }, [user?._id]);

  // Apply filters
  useEffect(() => {
    let filtered = clothingItems;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.metadata?.description?.toLowerCase().includes(searchLower) ||
        item.metadata?.category?.toLowerCase().includes(searchLower) ||
        item.metadata?.color?.primary?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(item => item.metadata?.category === filters.category);
    }

    // Color filter
    if (filters.color) {
      filtered = filtered.filter(item => 
        item.metadata?.color?.primary?.toLowerCase().includes(filters.color.toLowerCase())
      );
    }

    // Season filter
    if (filters.season) {
      filtered = filtered.filter(item => item.metadata?.season === filters.season);
    }

    // Formality filter
    if (filters.formality) {
      filtered = filtered.filter(item => item.metadata?.formality === filters.formality);
    }

    // Cleanliness status filter
    if (filters.cleanlinessStatus) {
      filtered = filtered.filter(item => item.cleanlinessStatus === filters.cleanlinessStatus);
    }

    setFilteredItems(filtered);
  }, [clothingItems, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      color: '',
      season: '',
      formality: '',
      cleanlinessStatus: '',
      search: ''
    });
  };

  const handleItemSelect = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBatchAction = (action) => {
    if (selectedItems.length === 0) {
      alert('Please select items first');
      return;
    }

    switch (action) {
      case 'collection':
        navigate('/collections?action=create', { 
          state: { selectedItems } 
        });
        break;
      case 'laundry':
        // Move selected items to laundry
        selectedItems.forEach(async (itemId) => {
          try {
            await laundryAPI.addToLaundry(itemId, { userId: user._id });
          } catch (err) {
            console.error('Error moving item to laundry:', err);
          }
        });
        alert(`${selectedItems.length} items moved to laundry`);
        setSelectedItems([]);
        break;
      case 'delete':
        if (window.confirm(`Delete ${selectedItems.length} items? This action cannot be undone.`)) {
          // Delete selected items
          selectedItems.forEach(async (itemId) => {
            try {
              await clothingAPI.deleteClothingItem(itemId);
            } catch (err) {
              console.error('Error deleting item:', err);
            }
          });
          alert(`${selectedItems.length} items deleted`);
          setSelectedItems([]);
          // Refresh items
          window.location.reload();
        }
        break;
    }
  };

  const getCleanlinessColor = (status) => {
    switch (status) {
      case 'fresh': return 'bg-green-500';
      case 'worn_wearable': return 'bg-blue-500';
      case 'needs_wash': return 'bg-orange-500';
      case 'in_laundry': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCleanlinessText = (status) => {
    switch (status) {
      case 'fresh': return 'Fresh';
      case 'worn_wearable': return 'Wearable';
      case 'needs_wash': return 'Needs Wash';
      case 'in_laundry': return 'In Laundry';
      default: return 'Unknown';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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
        <LoadingSpinner text="Loading your wardrobe..." />
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
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">My Wardrobe</h1>
            <p className="text-gray-400">
              {filteredItems.length} of {clothingItems.length} items
              {filters.search && ` matching "${filters.search}"`}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <motion.button
              onClick={() => navigate('/wardrobe?action=add')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-medium transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              + Add Clothing
            </motion.button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                ☰
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="bg-gray-800 rounded-xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search your wardrobe..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              🔍 Filters {showFilters ? '▲' : '▼'}
            </button>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">All Categories</option>
                  <option value="top">Tops</option>
                  <option value="bottom">Bottoms</option>
                  <option value="dress">Dresses</option>
                  <option value="outerwear">Outerwear</option>
                  <option value="shoes">Shoes</option>
                  <option value="accessories">Accessories</option>
                </select>

                <select
                  value={filters.color}
                  onChange={(e) => handleFilterChange('color', e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">All Colors</option>
                  <option value="black">Black</option>
                  <option value="white">White</option>
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                  <option value="brown">Brown</option>
                  <option value="gray">Gray</option>
                </select>

                <select
                  value={filters.season}
                  onChange={(e) => handleFilterChange('season', e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">All Seasons</option>
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="autumn">Autumn</option>
                  <option value="winter">Winter</option>
                </select>

                <select
                  value={filters.formality}
                  onChange={(e) => handleFilterChange('formality', e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">All Formality</option>
                  <option value="casual">Casual</option>
                  <option value="smart-casual">Smart Casual</option>
                  <option value="business">Business</option>
                  <option value="formal">Formal</option>
                </select>

                <select
                  value={filters.cleanlinessStatus}
                  onChange={(e) => handleFilterChange('cleanlinessStatus', e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="">All Status</option>
                  <option value="fresh">Fresh</option>
                  <option value="worn_wearable">Wearable</option>
                  <option value="needs_wash">Needs Wash</option>
                  <option value="in_laundry">In Laundry</option>
                </select>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Batch Actions */}
        {selectedItems.length > 0 && (
          <motion.div
            className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <p className="text-blue-200">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBatchAction('collection')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                >
                  Create Collection
                </button>
                <button
                  onClick={() => handleBatchAction('laundry')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm transition-colors"
                >
                  Move to Laundry
                </button>
                <button
                  onClick={() => handleBatchAction('delete')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedItems([])}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Clothing Items */}
        {filteredItems.length > 0 ? (
          <motion.div
            className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
              : 'space-y-4'
            }
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {filteredItems.map((item) => (
                <AnimatedCard
                  key={item._id}
                  variants={itemVariants}
                  className={`relative bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                    selectedItems.includes(item._id)
                      ? 'ring-2 ring-blue-500 bg-blue-900/20'
                      : 'hover:bg-gray-700'
                  }`}
                  onClick={() => handleItemSelect(item._id)}
                >
                  {/* Selection Indicator */}
                  {selectedItems.includes(item._id) && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm z-10">
                      ✓
                    </div>
                  )}

                  {/* Cleanliness Status */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCleanlinessColor(item.cleanlinessStatus)} text-white`}>
                      {getCleanlinessText(item.cleanlinessStatus)}
                    </span>
                  </div>

                  {/* Item Image */}
                  <div className="aspect-square">
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/300x300/374151/9CA3AF?text=No+Image'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300/374151/9CA3AF?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Item Details */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-1 line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                      {item.metadata?.description || 'No description available'}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
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

                    {/* Wear Stats */}
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Worn: {item.wearCount || 0} times</span>
                      {item.lastWorn && (
                        <span>Last: {new Date(item.lastWorn).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">👕</div>
            <h3 className="text-2xl font-semibold text-gray-400 mb-2">
              {filters.search ? 'No items found' : 'Your wardrobe is empty'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filters.search 
                ? `No items match "${filters.search}". Try adjusting your search.`
                : 'Start building your digital wardrobe by adding your first clothing item.'
              }
            </p>
            {!filters.search && (
              <motion.button
                onClick={() => navigate('/wardrobe?action=add')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-4 rounded-lg font-medium transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                + Add Your First Item
              </motion.button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EnhancedWardrobe;
