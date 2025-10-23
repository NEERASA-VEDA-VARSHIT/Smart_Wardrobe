# Custom Hooks

This directory contains all custom React hooks for the application.

## 📁 Structure

```
src/hooks/
├── index.js              # Main exports
├── UseCurrentUser.jsx    # Get current user data
├── useAPI.jsx           # API access hook
├── useAsyncData.jsx     # Async data fetching
├── useForm.jsx          # Form state management
├── useLocalStorage.jsx  # Local storage management
├── useDebounce.jsx      # Debouncing values
└── README.md            # This file
```

## 🚀 Available Hooks

### `UseCurrentUser`
Get current user data from the API.

```javascript
import { UseCurrentUser } from '../hooks';

const user = UseCurrentUser();
```

### `useAPI`
Access all API functions through a single hook.

```javascript
import { useAPI } from '../hooks';

const { auth, clothing, collections } = useAPI();
```

### `useAsyncData`
Handle async data fetching with loading and error states.

```javascript
import { useAsyncData } from '../hooks';

const { data, loading, error, refetch } = useAsyncData(
  () => fetchSomeData(),
  [dependency1, dependency2],
  initialData
);
```

### `useForm`
Manage form state and validation.

```javascript
import { useForm } from '../hooks';

const { values, errors, handleChange, handleSubmit, reset } = useForm(
  initialValues,
  validateFunction
);
```

### `useLocalStorage`
Manage localStorage with React state.

```javascript
import { useLocalStorage } from '../hooks';

const [storedValue, setValue] = useLocalStorage('key', initialValue);
```

### `useDebounce`
Debounce values to prevent excessive API calls.

```javascript
import { useDebounce } from '../hooks';

const debouncedValue = useDebounce(value, 500);
```

## 📋 Usage Examples

### Form Handling
```javascript
import { useForm } from '../hooks';

const MyForm = () => {
  const { values, errors, handleChange, handleSubmit } = useForm({
    name: '',
    email: ''
  });

  const onSubmit = async (formData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={(e) => handleSubmit(onSubmit)}>
      <input
        name="name"
        value={values.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      {errors.name && <span>{errors.name}</span>}
    </form>
  );
};
```

### Async Data Fetching
```javascript
import { useAsyncData } from '../hooks';
import { clothingAPI } from '../api';

const MyComponent = ({ userId, token }) => {
  const { data, loading, error } = useAsyncData(
    () => clothingAPI.getClothingItems(userId, token),
    [userId, token]
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data?.length} items</div>;
};
```

### Local Storage
```javascript
import { useLocalStorage } from '../hooks';

const MyComponent = () => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current theme: {theme}
    </button>
  );
};
```

## 🔧 Best Practices

1. **Always use `.jsx` extension** for hook files
2. **Export both named and default exports** for flexibility
3. **Include JSDoc comments** for better IDE support
4. **Handle errors gracefully** in async hooks
5. **Use TypeScript** for better type safety (optional)
6. **Test hooks** with React Testing Library

## 📝 Adding New Hooks

1. Create a new `.jsx` file in this directory
2. Follow the naming convention: `use[Name].jsx`
3. Export both named and default exports
4. Add to `index.js` for easy importing
5. Update this README with documentation
6. Include usage examples

## 🎯 Hook Categories

- **Data Fetching**: `useAsyncData`, `UseCurrentUser`
- **State Management**: `useForm`, `useLocalStorage`
- **Performance**: `useDebounce`
- **API Access**: `useAPI`
- **UI**: `useModal`, `useToggle` (future additions)
