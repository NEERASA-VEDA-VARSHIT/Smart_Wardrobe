import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, clearUser } from '../redux/userSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New outfit recommendation available", time: "2 min ago", type: "recommendation" },
    { id: 2, message: "Laundry reminder: 3 items ready to wash", time: "1 hour ago", type: "laundry" },
    { id: 3, message: "Collection shared with you by John", time: "3 hours ago", type: "share" }
  ]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      // Check if at bottom of page
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      setIsAtBottom(isAtBottom);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowSearch(false);
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const handleLogout = () => {
      dispatch(clearUser());
    navigate('/');
  };

  const handleNotificationClick = (notification) => {
    // Handle notification click based on type
    switch (notification.type) {
      case 'recommendation':
        navigate('/recommendations');
        break;
      case 'laundry':
        navigate('/laundry');
        break;
      case 'share':
        navigate('/stylist');
        break;
      default:
        break;
    }
    setShowNotifications(false);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/wardrobe?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const navItems = [
    { name: 'Add Clothes', path: '/add-clothing', icon: '➕', description: 'Add New Items' },
    { name: 'Wardrobe', path: '/wardrobe', icon: '👕', description: 'My Clothes' },
    { name: 'Collections', path: '/collections', icon: '📁', description: 'Outfit Collections' },
    { name: 'Stylist', path: '/stylist', icon: '👥', description: 'Collaborate' },
    { name: 'Recommendations', path: '/recommendations', icon: '🧠', description: 'AI Suggestions' },
    { name: 'Laundry', path: '/laundry', icon: '🧺', description: 'Care Schedule' },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-black/90 backdrop-blur-xl border-b border-white/10 shadow-2xl' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full px-2">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Far Left */}
            <motion.div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate('/home')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <div className="text-3xl group-hover:rotate-12 transition-transform duration-300">👕</div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            SmartWardrobe
                </span>
                <span className="text-xs text-gray-400 -mt-1">AI-Powered Style</span>
              </div>
            </motion.div>

            {/* Right Side - Search, Notifications, User */}
          <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-lg">🔍</span>
                  {searchQuery && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </motion.button>
                
                <AnimatePresence>
                  {showSearch && (
                    <motion.div
                      className="absolute right-0 top-14 w-80 bg-black/95 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-2xl"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <form onSubmit={handleSearch}>
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search your wardrobe..."
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                            autoFocus
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            ⌘K
                          </div>
                        </div>
                      </form>
                      <div className="mt-3 text-xs text-gray-400">
                        Press Enter to search
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-lg">🔔</span>
                  {notifications.length > 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      {notifications.length}
                    </motion.div>
                  )}
                </motion.button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      className="absolute right-0 top-14 w-80 bg-black/95 backdrop-blur-xl rounded-2xl border border-white/20 py-2 shadow-2xl z-50"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="text-sm font-medium text-white">Notifications</div>
                        <div className="text-xs text-gray-400">{notifications.length} unread</div>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <motion.div
                              key={notification.id}
                              className="px-4 py-3 hover:bg-white/10 transition-colors cursor-pointer border-b border-white/5 last:border-b-0"
                              onClick={() => handleNotificationClick(notification)}
                              whileHover={{ x: 5 }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-sm text-white font-medium">
                                    {notification.message}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {notification.time}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(notification.id);
                                  }}
                                  className="ml-2 text-gray-400 hover:text-white transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-400 text-sm">
                            No notifications
                          </div>
                        )}
                      </div>
                      
                      {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-white/10">
                          <button
                            onClick={() => setNotifications([])}
                            className="w-full text-xs text-gray-400 hover:text-white transition-colors"
                          >
                            Mark all as read
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <motion.button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-white">
                        {user.name || user.email}
                      </div>
                    </div>
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        className="absolute right-0 top-14 w-64 bg-black/95 backdrop-blur-xl rounded-2xl border border-white/20 py-2 shadow-2xl"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 py-3 border-b border-white/10">
                          <div className="text-sm font-medium text-white">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                        
                        <button
                          onClick={() => {
                            const username = user.username || user.email?.split('@')[0];
                            navigate(`/profile/${username}`);
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-3"
                        >
                          <span className="text-lg">👤</span>
                          <span>Profile</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigate('/settings');
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-3"
                        >
                          <span className="text-lg">⚙️</span>
                          <span>Settings</span>
                        </button>
                        
                        <div className="px-4 py-2 border-t border-white/10 mt-2">
                <button
                  onClick={handleLogout}
                            className="w-full px-4 py-3 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center space-x-3 rounded-lg"
                >
                            <span className="text-lg">🚪</span>
                            <span>Logout</span>
                </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  onClick={() => navigate('/signin')}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-all duration-200 border border-white/20 hover:border-white/40"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <motion.span
                  className="text-xl"
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? '✕' : '☰'}
                </motion.span>
              </button>
          </div>
      </div>
      </div>
      </motion.nav>

       {/* Bottom Navigation Bar */}
       <motion.nav
         className={`fixed z-40 transition-all duration-500 ${
           isAtBottom 
             ? 'bottom-0 left-0 right-0 rounded-none bg-black/95 backdrop-blur-2xl border-t border-white/20 shadow-2xl'
             : `bottom-6 left-1/2 -translate-x-1/2 rounded-full ${
                 isScrolled 
                   ? 'bg-gradient-to-r from-black/90 via-gray-900/90 to-black/90 backdrop-blur-3xl border border-white/20 shadow-2xl' 
                   : 'bg-gradient-to-r from-black/70 via-gray-900/70 to-black/70 backdrop-blur-2xl border border-white/10 shadow-xl'
               }`
         }`}
         initial={{ y: 100, scale: 0.8, opacity: 0 }}
         animate={{ 
           y: 0, 
           scale: 1, 
           opacity: 1
         }}
         transition={{ 
           duration: 0.6, 
           delay: 0.1,
           type: "spring",
           stiffness: 100,
           damping: 15
         }}
         style={{ 
           width: isAtBottom ? '100vw' : 'calc(100vw - 1rem)', 
           maxWidth: isAtBottom ? 'none' : '750px', 
           height: isAtBottom ? '64px' : '76px' 
         }}
       >
         <div className="w-full h-full px-6">
           <div className="flex items-center justify-around h-full relative">
            {navItems.map((item) => (
              <motion.div
                key={item.name}
                className="relative group"
                whileHover={{ y: -2 }}
              >
                 <motion.button
                   onClick={() => navigate(item.path)}
                   className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-500 flex flex-col items-center space-y-1 relative overflow-hidden ${
                     isActive(item.path)
                       ? 'bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 text-white border border-blue-400/50 shadow-2xl backdrop-blur-md'
                       : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 hover:backdrop-blur-sm hover:shadow-lg'
                   }`}
                   whileHover={{ 
                     scale: 1.1, 
                     y: -4,
                     transition: { type: "spring", stiffness: 400, damping: 10 }
                   }}
                   whileTap={{ scale: 0.9 }}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 + (navItems.indexOf(item) * 0.1) }}
                 >
                   {/* Active indicator background */}
                   {isActive(item.path) && (
                     <motion.div
                       className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full"
                       initial={{ scale: 0, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       transition={{ duration: 0.3 }}
                     />
                   )}
                   
                   {/* Content */}
                   <span className="text-lg relative z-10">{item.icon}</span>
                   <span className="text-xs font-medium relative z-10">{item.name}</span>
                   
                   {/* Active dot */}
                   {isActive(item.path) && (
                     <motion.div
                       className="absolute -top-3 w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full shadow-lg"
                       initial={{ scale: 0, rotate: 180 }}
                       animate={{ scale: 1, rotate: 0 }}
                       transition={{ 
                         duration: 0.4,
                         type: "spring",
                         stiffness: 200,
                         damping: 10
                       }}
                     />
                   )}
                   
                   {/* Hover effect */}
                   <motion.div
                     className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-full opacity-0"
                     whileHover={{ opacity: 1 }}
                     transition={{ duration: 0.2 }}
                   />
                 </motion.button>
                
                {/* Enhanced Tooltip */}
                <motion.div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-2 bg-gradient-to-r from-black/95 to-gray-900/95 backdrop-blur-xl text-white text-xs rounded-xl border border-white/20 shadow-2xl pointer-events-none whitespace-nowrap"
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  whileHover={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="font-medium">{item.description}</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/95"></div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl rounded-t-2xl border-t border-white/20 p-6 shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white">Navigation</h3>
                </div>
                
                {navItems.map((item) => (
                  <motion.button
                    key={item.name}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-left transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-400/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-gray-400">{item.description}</span>
                    </div>
                    {isActive(item.path) && (
                      <motion.div
                        className="ml-auto w-2 h-2 bg-blue-400 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                ))}
                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* Add padding to prevent content from being hidden behind fixed navbars */}
       <style>{`
         body {
           padding-top: 64px;
           padding-bottom: 100px;
         }
       `}</style>
    </>
  );
};

export default Navbar;
