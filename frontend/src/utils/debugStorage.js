// Debug utility to check localStorage
export const checkStorageData = () => {
  console.log("=== CHECKING LOCAL STORAGE ===");
  
  // Check for persist:root
  const rootData = localStorage.getItem('persist:root');
  console.log("persist:root:", rootData);
  
  // Check for persist:user
  const userData = localStorage.getItem('persist:user');
  console.log("persist:user:", userData);
  
  // Check all keys
  const allKeys = Object.keys(localStorage);
  console.log("All localStorage keys:", allKeys);
  
  allKeys.forEach(key => {
    if (key.startsWith('persist:')) {
      console.log(`${key}:`, localStorage.getItem(key));
    }
  });
  
  console.log("=== END STORAGE CHECK ===");
};

// Clear corrupted localStorage data
export const clearCorruptedStorage = () => {
  console.log("=== CLEARING CORRUPTED STORAGE ===");
  
  // Clear all persist keys
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.startsWith('persist:')) {
      localStorage.removeItem(key);
      console.log(`Removed ${key}`);
    }
  });
  
  console.log("=== STORAGE CLEARED ===");
};

