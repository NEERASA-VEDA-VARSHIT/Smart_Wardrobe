import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from '../components/AnimatedCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SuggestionInbox from '../components/SuggestionInbox';
import FriendStylistView from '../components/FriendStylistView';
import { useNavigate, useSearchParams } from 'react-router-dom';

const StylistPage = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get('owner');
  const collectionId = searchParams.get('collection');
  
  const [activeTab, setActiveTab] = useState('my-collections');
  const [collections, setCollections] = useState([]);
  const [sharedCollections, setSharedCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // If owner and collection are specified, show friend view
  if (ownerId && collectionId) {
    return <FriendStylistView />;
  }

  // Fetch collections data
  useEffect(() => {
    const fetchCollections = async () => {
      if (!user?._id) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch user's collections
        const collectionsResponse = await fetch(`/api/collections/user/${user._id}`, {
          credentials: 'include'
        });
        if (collectionsResponse.ok) {
          const collectionsData = await collectionsResponse.json();
          setCollections(collectionsData.data);
        }

        // Fetch shared collections (if endpoint exists)
        // This would be implemented based on your sharing system
        // const sharedResponse = await fetch('/api/collections/shared', {
        //   credentials: 'include'
        // });
        // if (sharedResponse.ok) {
        //   const sharedData = await sharedResponse.json();
        //   setSharedCollections(sharedData.data);
        // }

      } catch (err) {
        console.error('Error fetching collections:', err);
        setError('Failed to load collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [user?._id]);

  const handleCreateCollection = () => {
    navigate('/collections?action=create');
  };

  const handleShareCollection = (collectionId) => {
    const shareUrl = `${window.location.origin}/stylist?owner=${user._id}&collection=${collectionId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  const handleViewSuggestions = (collectionId) => {
    setActiveTab('suggestions');
    // You could pass collectionId to SuggestionInbox if needed
  };

  const tabs = [
    { id: 'my-collections', name: 'My Collections', icon: '📁' },
    { id: 'shared-with-me', name: 'Shared With Me', icon: '👥' },
    { id: 'suggestions', name: 'Suggestions Inbox', icon: '📬' },
  ];

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
        <LoadingSpinner text="Loading stylist mode..." />
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
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
            👥 Stylist Mode
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Collaborate with friends and family to create amazing outfits. Share your collections and get styling suggestions from your personal fashion community.
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex flex-wrap justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 mx-2 mb-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'my-collections' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">My Collections</h2>
                <motion.button
                  onClick={handleCreateCollection}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  + Create Collection
                </motion.button>
              </div>

              {collections.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {collections.map((collection) => (
                    <AnimatedCard
                      key={collection._id}
                      variants={itemVariants}
                      className="bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:bg-gray-700 transition-colors"
                    >
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{collection.name}</h3>
                        <p className="text-gray-400 mb-4 line-clamp-2">
                          {collection.description || 'No description available'}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>{collection.itemIds?.length || 0} items</span>
                          <span>Created {new Date(collection.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/collections/${collection._id}`)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleShareCollection(collection._id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                          >
                            Share
                          </button>
                          <button
                            onClick={() => handleViewSuggestions(collection._id)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                          >
                            Suggestions
                          </button>
                        </div>
                      </div>
                    </AnimatedCard>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-2xl font-semibold text-gray-400 mb-2">
                    No collections yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Create your first collection to start sharing and collaborating on outfits.
                  </p>
                  <motion.button
                    onClick={handleCreateCollection}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-4 rounded-lg font-medium transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    + Create Your First Collection
                  </motion.button>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'shared-with-me' && (
            <div>
              <h2 className="text-2xl font-bold mb-8">Shared With Me</h2>
              
              {sharedCollections.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {sharedCollections.map((collection) => (
                    <AnimatedCard
                      key={collection._id}
                      variants={itemVariants}
                      className="bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:bg-gray-700 transition-colors"
                    >
                      <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{collection.name}</h3>
                        <p className="text-gray-400 mb-4 line-clamp-2">
                          {collection.description || 'No description available'}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>By {collection.owner?.name}</span>
                          <span>{collection.itemIds?.length || 0} items</span>
                        </div>

                        <button
                          onClick={() => navigate(`/stylist?owner=${collection.owner?._id}&collection=${collection._id}`)}
                          className="w-full bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        >
                          Start Styling
                        </button>
                      </div>
                    </AnimatedCard>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-2xl font-semibold text-gray-400 mb-2">
                    No shared collections
                  </h3>
                  <p className="text-gray-500 mb-6">
                    When friends share their collections with you, they'll appear here.
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div>
              <h2 className="text-2xl font-bold mb-8">Suggestions Inbox</h2>
              <SuggestionInbox collectionId={null} />
            </div>
          )}
        </motion.div>

        {/* How It Works */}
        <motion.div
          className="mt-16 bg-gray-800 rounded-xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-center mb-8">How Stylist Mode Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-semibold mb-2">1. Create Collections</h3>
              <p className="text-gray-400">
                Group your clothes into themed collections like "Summer Vacation" or "Office Looks"
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-semibold mb-2">2. Share & Collaborate</h3>
              <p className="text-gray-400">
                Share collection links with friends so they can suggest outfits from your wardrobe
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-lg font-semibold mb-2">3. Get Suggestions</h3>
              <p className="text-gray-400">
                Receive outfit suggestions from friends and AI, then accept or refine them
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StylistPage;
