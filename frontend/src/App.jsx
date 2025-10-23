import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectIsRehydrated } from './redux/userSlice';
import { checkStorageData, clearCorruptedStorage } from './utils/debugStorage';
import Navbar from './components/Navbar';
import NotificationSystem from './components/NotificationSystem';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AddClothing from './pages/AddClothing';
import EnhancedWardrobe from './pages/EnhancedWardrobe';
import Laundry from './pages/Laundry';
import Weather from './pages/Weather';
import FriendStylistView from './components/FriendStylistView';
import StylistPage from './pages/StylistPage';
import RecommendationEngine from './components/RecommendationEngine';
import Dashboard from './pages/Dashboard';
import Collections from './pages/Collections';
import SharedCollectionView from './components/SharedCollectionView';

function App() {
  const user = useSelector(selectUser);
  const isRehydrated = useSelector(selectIsRehydrated);
  const [fallbackRehydrated, setFallbackRehydrated] = useState(false);

  // Debug logging
  console.log("App render - user:", user, "isRehydrated:", isRehydrated, "fallbackRehydrated:", fallbackRehydrated);

  // Monitor user state changes
  useEffect(() => {
    console.log("App: User state changed:", user);
  }, [user]);

  // Debug storage on mount
  useEffect(() => {
    checkStorageData();
    
    // Check if user data is corrupted (stored as string "null")
    const userData = localStorage.getItem('persist:user');
    if (userData && userData.includes('"user":"null"')) {
      console.log("Detected corrupted user data, clearing storage...");
      clearCorruptedStorage();
    }
  }, []);

  // Fallback: if rehydration doesn't happen within 2 seconds, assume no persisted data
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isRehydrated) {
        console.log("Rehydration timeout - assuming no persisted data");
        setFallbackRehydrated(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isRehydrated]);

  // Show loading while rehydrating
  if (!isRehydrated && !fallbackRehydrated) {
    console.log("App: Still rehydrating, showing loading screen");
    return (
      <div className="App">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  console.log("App: Rehydration complete, user:", !!user, "isRehydrated:", isRehydrated);

  // If we have a user and are rehydrated, we're good to go
  if (user && isRehydrated) {
    console.log("App: User authenticated, showing app");
  } else if (!user && isRehydrated) {
    console.log("App: No user after rehydration, showing login");
  }

  return (
    <ErrorBoundary>
      <div className="App">
        {user && <Navbar />}
        <Routes>
          <Route path="/" element={!user ? <Landing /> : <Navigate to="/home" />} />
          <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/home" />} />
          <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/home" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/home" />} />
          <Route path="/home" element={user ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <Navigate to={`/profile/${user.username || user.email}`} /> : <Navigate to="/" />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" />} />
          <Route path="/add-clothing" element={user ? <AddClothing /> : <Navigate to="/" />} />
          <Route path="/wardrobe" element={user ? <EnhancedWardrobe /> : <Navigate to="/" />} />
          <Route path="/laundry" element={user ? <Laundry /> : <Navigate to="/" />} />
          <Route path="/weather" element={user ? <Weather /> : <Navigate to="/" />} />
          <Route path="/stylist" element={user ? <StylistPage /> : <Navigate to="/" />} />
          <Route path="/stylist/:ownerId" element={user ? <FriendStylistView /> : <Navigate to="/" />} />
          <Route path="/collections" element={user ? <Collections /> : <Navigate to="/" />} />
          <Route path="/collections/:collectionId" element={user ? <SharedCollectionView /> : <Navigate to="/" />} />
          <Route path="/collections/shared/:collectionId" element={user ? <SharedCollectionView /> : <Navigate to="/" />} />
          <Route path="/recommendations" element={user ? <RecommendationEngine /> : <Navigate to="/" />} />
        </Routes>
        <NotificationSystem />
      </div>
    </ErrorBoundary>
  );
}

export default App;
