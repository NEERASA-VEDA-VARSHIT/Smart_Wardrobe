# Redux State Management

This directory contains all Redux slices and store configuration for the application.

## 📁 Structure

```
src/redux/
├── index.js              # Main exports
├── store.js              # Store configuration
├── userSlice.js          # User authentication state
├── uiSlice.js            # UI state (loading, errors, modals, etc.)
├── dataSlice.js          # Application data state
└── README.md             # This file
```

## 🚀 Available Slices

### `userSlice` - User Authentication
Manages user authentication state and persistence.

```javascript
import { setUser, clearUser, selectUser } from '../redux';

// Actions
dispatch(setUser(userData));
dispatch(clearUser());

// Selectors
const user = useSelector(selectUser);
```

### `uiSlice` - UI State
Manages UI state like loading, errors, notifications, modals, and theme.

```javascript
import { 
  setLoading, 
  addNotification, 
  openModal, 
  selectLoading 
} from '../redux';

// Actions
dispatch(setLoading(true));
dispatch(addNotification({ type: 'success', message: 'Saved!' }));
dispatch(openModal('createCollection'));

// Selectors
const loading = useSelector(selectLoading);
const modalOpen = useSelector(selectModal('createCollection'));
```

### `dataSlice` - Application Data
Manages application data like clothing items, collections, recommendations, etc.

```javascript
import { 
  setClothingItems, 
  addClothingItem, 
  selectClothingItems 
} from '../redux';

// Actions
dispatch(setClothingItems(items));
dispatch(addClothingItem(newItem));

// Selectors
const clothingItems = useSelector(selectClothingItems);
```

## 📋 Usage Examples

### User Authentication
```javascript
import { useSelector, useDispatch } from 'react-redux';
import { setUser, clearUser, selectUser } from '../redux';

const MyComponent = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const handleLogin = (userData) => {
    dispatch(setUser(userData));
  };

  const handleLogout = () => {
    dispatch(clearUser());
  };

  return (
    <div>
      {user ? `Welcome ${user.name}` : 'Please login'}
    </div>
  );
};
```

### UI State Management
```javascript
import { useSelector, useDispatch } from 'react-redux';
import { setLoading, addNotification, selectLoading } from '../redux';

const MyComponent = () => {
  const loading = useSelector(selectLoading);
  const dispatch = useDispatch();

  const handleSubmit = async () => {
    dispatch(setLoading(true));
    try {
      await submitData();
      dispatch(addNotification({ 
        type: 'success', 
        message: 'Data saved successfully!' 
      }));
    } catch (error) {
      dispatch(addNotification({ 
        type: 'error', 
        message: 'Failed to save data' 
      }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div>
      {loading ? 'Loading...' : <button onClick={handleSubmit}>Submit</button>}
    </div>
  );
};
```

### Data Management
```javascript
import { useSelector, useDispatch } from 'react-redux';
import { setClothingItems, selectClothingItems } from '../redux';

const WardrobeComponent = () => {
  const clothingItems = useSelector(selectClothingItems);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchItems = async () => {
      const items = await clothingAPI.getClothingItems(userId, token);
      dispatch(setClothingItems(items.data));
    };
    fetchItems();
  }, []);

  return (
    <div>
      {clothingItems.map(item => (
        <div key={item._id}>{item.name}</div>
      ))}
    </div>
  );
};
```

## 🔧 Store Configuration

### Persistence
- **User data**: Persisted to localStorage
- **UI state**: Not persisted (resets on reload)
- **Data state**: Not persisted (fetched fresh)

### Middleware
- **Redux Persist**: Handles user data persistence
- **Serializable Check**: Configured for persist actions

## 📝 Best Practices

1. **Use Selectors**: Always use selectors to access state
2. **Action Creators**: Use action creators for dispatching
3. **Normalize Data**: Keep data normalized in slices
4. **Error Handling**: Use error states in slices
5. **Loading States**: Track loading states for better UX
6. **TypeScript**: Use TypeScript for better type safety (optional)

## 🎯 Slice Responsibilities

### `userSlice`
- User authentication state
- User profile data
- Login/logout state
- Persistence handling

### `uiSlice`
- Loading states
- Error messages
- Notifications
- Modal states
- Theme preferences
- Sidebar state

### `dataSlice`
- Clothing items
- Collections
- Recommendations
- Suggestions
- Weather data
- Laundry items
- Loading/error states per data type

## 🚀 Adding New Slices

1. Create new slice file: `newSlice.js`
2. Add to store configuration
3. Export actions and selectors
4. Update this README
5. Add TypeScript types (optional)

## 🔍 Debugging

Use Redux DevTools for debugging:
- Install Redux DevTools Extension
- View state changes in real-time
- Time-travel debugging
- Action logging
