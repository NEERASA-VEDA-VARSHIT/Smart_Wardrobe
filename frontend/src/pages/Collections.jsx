import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { collectionsAPI, clothingAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedCard from '../components/AnimatedCard';
import ShareLinkModal from '../components/ShareLinkModal';

const Collections = () => {
  const user = useSelector(selectUser);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [showShareUserModal, setShowShareUserModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [clothingItems, setClothingItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [shareUserData, setShareUserData] = useState({
    username: '',
    permission: 'view'
  });
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    tags: [],
    isPublic: false
  });

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      if (!user?._id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await collectionsAPI.getCollections(user._id);
        setCollections(response.data || []);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError('Failed to load collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [user?._id]);

  // Fetch clothing items
  const fetchClothingItems = async () => {
    if (!user?._id) return;

    try {
      const response = await clothingAPI.getClothingItems(user._id);
      setClothingItems(response.data || []);
    } catch (err) {
      console.error('Error fetching clothing items:', err);
      setError('Failed to load clothing items');
    }
  };

  // Create new collection
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!user?._id) return;

    try {
      const response = await collectionsAPI.createCollection({
        userId: user._id,
        ...newCollection
      });

      setCollections(prev => [response.data, ...prev]);
      setNewCollection({ name: '', description: '', tags: [] });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating collection:', err);
      setError('Failed to create collection');
    }
  };


  // Delete collection
  const handleDeleteCollection = async (collectionId) => {
    if (!user?._id) return;

    try {
      await collectionsAPI.deleteCollection(collectionId);
      setCollections(prev => prev.filter(collection => collection._id !== collectionId));
    } catch (err) {
      console.error('Error deleting collection:', err);
      setError('Failed to delete collection');
    }
  };

  // Add items to collection
  const handleAddItemsToCollection = async () => {
    if (!selectedCollection || selectedItems.length === 0) return;

    try {
      // Add each selected item to the collection
      for (const itemId of selectedItems) {
        await collectionsAPI.addItemToCollection(selectedCollection._id, itemId);
      }

      // Refresh collections to show updated items
      const response = await collectionsAPI.getCollections(user._id);
      setCollections(response.data || []);
      
      setSelectedItems([]);
      setShowAddItemsModal(false);
      setSelectedCollection(null);
    } catch (err) {
      console.error('Error adding items to collection:', err);
      setError('Failed to add items to collection');
    }
  };

  // Remove item from collection
  const handleRemoveItemFromCollection = async (collectionId, itemId) => {
    try {
      await collectionsAPI.removeItemFromCollection(collectionId, itemId);
      
      // Refresh collections to show updated items
      const response = await collectionsAPI.getCollections(user._id);
      setCollections(response.data || []);
    } catch (err) {
      console.error('Error removing item from collection:', err);
      setError('Failed to remove item from collection');
    }
  };

  // Share collection with user
  const handleShareWithUser = async (e) => {
    e.preventDefault();
    if (!selectedCollection || !shareUserData.username) return;

    try {
      const response = await collectionsAPI.shareCollectionWithUser(
        selectedCollection._id,
        shareUserData.username,
        shareUserData.permission
      );

      setCollections(prev => prev.map(collection => 
        collection._id === selectedCollection._id ? response.data : collection
      ));
      setShareUserData({ username: '', permission: 'view' });
      setShowShareUserModal(false);
      setSelectedCollection(null);
    } catch (err) {
      console.error('Error sharing collection:', err);
      setError('Failed to share collection');
    }
  };

  // Toggle collection public setting
  const handleTogglePublic = async (collectionId, isPublic) => {
    try {
      const response = await collectionsAPI.updateCollection(collectionId, { isPublic });
      setCollections(prev => prev.map(collection => 
        collection._id === collectionId ? response.data : collection
      ));
    } catch (err) {
      console.error('Error updating collection:', err);
      setError('Failed to update collection');
    }
  };

  // Open add items modal
  const openAddItemsModal = (collection) => {
    setSelectedCollection(collection);
    setSelectedItems([]);
    fetchClothingItems();
    setShowAddItemsModal(true);
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

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6 pt-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-8"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              My Collections
            </h1>
            <p className="text-gray-400 mt-2">Organize and share your favorite outfits</p>
          </div>
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            + Create Collection
          </motion.button>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="bg-red-600 p-4 rounded-lg text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner text="Loading collections..." />
          </div>
        )}

        {/* Collections Grid */}
        {!loading && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {collections.length === 0 ? (
              <motion.div
                className="col-span-full text-center py-12"
                variants={itemVariants}
              >
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold mb-2">No Collections Yet</h3>
                <p className="text-gray-400 mb-6">Create your first collection to organize your outfits</p>
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create Your First Collection
                </motion.button>
              </motion.div>
            ) : (
              collections.map((collection) => (
                <AnimatedCard
                  key={collection._id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
                  variants={itemVariants}
                >
                  {/* Collection Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{collection.name}</h3>
                      {collection.description && (
                        <p className="text-gray-400 text-sm">{collection.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        onClick={() => openAddItemsModal(collection)}
                        className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Add items"
                      >
                        <span className="text-purple-400">➕</span>
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setSelectedCollection(collection);
                          setShowShareUserModal(true);
                        }}
                        className="p-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Share with user"
                      >
                        <span className="text-green-400">👥</span>
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setSelectedCollection(collection);
                          setShowShareLinkModal(true);
                        }}
                        className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Get share link"
                      >
                        <span className="text-blue-400">🔗</span>
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteCollection(collection._id)}
                        className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <span className="text-red-400">🗑️</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Collection Stats */}
                  <div className="flex justify-between text-sm text-gray-400 mb-4">
                    <span>{collection.itemIds?.length || 0} items</span>
                    <span>{collection.sharedWith?.length || 0} shared</span>
                  </div>

                  {/* Collection Items Preview */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {collection.itemIds?.slice(0, 6).map((item, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-700 rounded-lg overflow-hidden"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            📷
                          </div>
                        )}
                      </div>
                    ))}
                    {collection.itemIds?.length > 6 && (
                      <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">
                        +{collection.itemIds.length - 6}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {collection.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {collection.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                </AnimatedCard>
              ))
            )}
          </motion.div>
        )}

        {/* Create Collection Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h2 className="text-2xl font-bold mb-4">Create New Collection</h2>
                <form onSubmit={handleCreateCollection}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Collection Name</label>
                    <input
                      type="text"
                      value={newCollection.name}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="e.g., Summer Outfits"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newCollection.description}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Describe your collection..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                    >
                      Create Collection
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Share with User Modal */}
        <AnimatePresence>
          {showShareUserModal && selectedCollection && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h2 className="text-2xl font-bold mb-4">Share Collection</h2>
                <p className="text-gray-400 mb-4">Share "{selectedCollection.name}" with a user</p>
                <form onSubmit={handleShareWithUser}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <input
                      type="text"
                      value={shareUserData.username}
                      onChange={(e) => setShareUserData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="Enter username (without @)"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Permission</label>
                    <select
                      value={shareUserData.permission}
                      onChange={(e) => setShareUserData(prev => ({ ...prev, permission: e.target.value }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="view">View Only</option>
                      <option value="edit">Can Edit</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowShareUserModal(false);
                        setSelectedCollection(null);
                        setShareUserData({ username: '', permission: 'view' });
                      }}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                    >
                      Share Collection
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Link Modal */}
        <ShareLinkModal
          collection={selectedCollection}
          isOpen={showShareLinkModal}
          onClose={() => {
            setShowShareLinkModal(false);
            setSelectedCollection(null);
          }}
        />

        {/* Add Items Modal */}
        <AnimatePresence>
          {showAddItemsModal && selectedCollection && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden flex flex-col"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Add Items to "{selectedCollection.name}"</h2>
                  <button
                    onClick={() => {
                      setShowAddItemsModal(false);
                      setSelectedCollection(null);
                      setSelectedItems([]);
                    }}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {clothingItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">👕</div>
                      <h3 className="text-xl font-semibold mb-2">No Clothing Items</h3>
                      <p className="text-gray-400 mb-4">Add some clothing items to your wardrobe first</p>
                      <button
                        onClick={() => {
                          setShowAddItemsModal(false);
                          setSelectedCollection(null);
                          setSelectedItems([]);
                          window.location.href = '/add-clothing';
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                      >
                        Add Clothing Items
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {clothingItems.map((item) => {
                        const isSelected = selectedItems.includes(item._id);
                        const isInCollection = selectedCollection.itemIds?.some(collectionItem => 
                          collectionItem._id === item._id
                        );
                        
                        return (
                          <motion.div
                            key={item._id}
                            className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'ring-2 ring-purple-500 bg-purple-500/20' 
                                : isInCollection
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:ring-2 hover:ring-gray-500'
                            }`}
                            onClick={() => {
                              if (isInCollection) return;
                              if (isSelected) {
                                setSelectedItems(prev => prev.filter(id => id !== item._id));
                              } else {
                                setSelectedItems(prev => [...prev, item._id]);
                              }
                            }}
                            whileHover={{ scale: isInCollection ? 1 : 1.05 }}
                            whileTap={{ scale: isInCollection ? 1 : 0.95 }}
                          >
                            <div className="aspect-square">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.metadata?.description || 'Clothing item'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500">
                                  📷
                                </div>
                              )}
                            </div>
                            
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                ✓
                              </div>
                            )}
                            
                            {isInCollection && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">Already Added</span>
                              </div>
                            )}
                            
                            <div className="p-2 bg-gray-700/80">
                              <p className="text-white text-sm font-medium truncate">
                                {item.metadata?.description || 'Clothing Item'}
                              </p>
                              <p className="text-gray-400 text-xs truncate">
                                {item.metadata?.category} • {item.metadata?.color?.primary}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {clothingItems.length > 0 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowAddItemsModal(false);
                          setSelectedCollection(null);
                          setSelectedItems([]);
                        }}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddItemsToCollection}
                        disabled={selectedItems.length === 0}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                      >
                        Add {selectedItems.length} Item{selectedItems.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Collections;
