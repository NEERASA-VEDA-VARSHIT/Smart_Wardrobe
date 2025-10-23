/**
 * Performance monitoring middleware
 * Tracks response times and logs slow requests
 */

const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Log performance metrics
    console.log(`📊 ${req.method} ${req.originalUrl} - ${responseTime}ms`);
    
    // Log slow requests (>1 second)
    if (responseTime > 1000) {
      console.warn(`🐌 Slow request detected: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
    }
    
    // Add performance headers
    res.set('X-Response-Time', `${responseTime}ms`);
    res.set('X-Processing-Time', `${responseTime}ms`);
    
    // Add performance data to response if it's a JSON response
    if (data && typeof data === 'object' && data.success) {
      data.performance = {
        ...data.performance,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

export default performanceMonitor;
