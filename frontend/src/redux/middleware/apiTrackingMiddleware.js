// Redux middleware for tracking API calls and Gemini usage
export const apiTrackingMiddleware = (store) => (next) => (action) => {
  // Track API calls that involve Gemini
  if (action.type?.includes('data/') && action.meta?.geminiAPI) {
    const startTime = Date.now();
    
    // Track the API call
    const originalAction = { ...action };
    
    // Add response time tracking
    const enhancedAction = {
      ...action,
      meta: {
        ...action.meta,
        startTime,
        trackResponse: true
      }
    };
    
    const result = next(enhancedAction);
    
    // If this is an async action, track completion
    if (action.meta?.trackResponse && result?.then) {
      result.then((response) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Extract token usage from response if available
        const tokens = response?.data?.tokens || response?.tokens || 0;
        const endpoint = action.meta?.endpoint || action.type;
        
        // Dispatch tracking action
        store.dispatch({
          type: 'gemini/trackAPICall',
          payload: {
            endpoint,
            tokens,
            responseTime,
            timestamp: Date.now()
          }
        });
      }).catch((error) => {
        console.error('API call failed:', error);
        // Still track the failed call
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        store.dispatch({
          type: 'gemini/trackAPICall',
          payload: {
            endpoint: action.meta?.endpoint || action.type,
            tokens: 0,
            responseTime,
            timestamp: Date.now(),
            error: true
          }
        });
      });
    }
    
    return result;
  }
  
  return next(action);
};

// Middleware for logging API calls in development
export const apiLoggingMiddleware = (store) => (next) => (action) => {
  if (process.env.NODE_ENV === 'development' && action.type?.includes('data/')) {
    console.log('🔗 API Action:', action.type, action.payload);
  }
  
  return next(action);
};

// Middleware for handling loading states
export const loadingStateMiddleware = (store) => (next) => (action) => {
  // Automatically set loading states for async actions
  if (action.type?.includes('data/') && action.meta?.async) {
    const dataType = action.type.split('/')[1]; // Extract data type from action type
    
    // Set loading to true when action starts
    store.dispatch({
      type: 'data/setLoading',
      payload: { key: dataType, loading: true }
    });
    
    // Set loading to false when action completes
    const result = next(action);
    
    if (result?.then) {
      result.then(() => {
        store.dispatch({
          type: 'data/setLoading',
          payload: { key: dataType, loading: false }
        });
      }).catch(() => {
        store.dispatch({
          type: 'data/setLoading',
          payload: { key: dataType, loading: false }
        });
      });
    } else {
      // Synchronous action, set loading to false immediately
      store.dispatch({
        type: 'data/setLoading',
        payload: { key: dataType, loading: false }
      });
    }
    
    return result;
  }
  
  return next(action);
};
