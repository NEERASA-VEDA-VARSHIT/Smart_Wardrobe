import rateLimit from 'express-rate-limit';

// Rate limiter for recommendation endpoints
export const recommendationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many recommendation requests, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for metadata generation
export const metadataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per minute
  message: {
    success: false,
    message: 'Too many metadata generation requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Prefer standardized Forwarded header; fallback to X-Forwarded-For and others
    const forwardedStandard = req.headers['forwarded'];
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const ip = req.ip || req.connection?.remoteAddress;
    
    // Log for debugging
    console.log('Rate limit key generation:', {
      forwardedStandard,
      forwarded,
      realIp,
      ip,
      headers: req.headers
    });
    
    // Parse standardized Forwarded header: e.g., "for=203.0.113.43, for=70.41.3.18"
    if (forwardedStandard) {
      try {
        const parts = forwardedStandard.split(',').map(p => p.trim());
        for (const part of parts) {
          const match = part.match(/for=\"?\[?([^;\"]+)\]?\"?/i);
          if (match && match[1]) {
            const clientIp = match[1].split(':')[0];
            console.log('Using Forwarded header IP:', clientIp);
            return clientIp;
          }
        }
      } catch (e) {
        console.warn('Failed to parse Forwarded header:', e);
      }
    }

    if (forwarded) {
      const clientIp = forwarded.split(',')[0].trim();
      console.log('Using forwarded IP:', clientIp);
      return clientIp;
    }
    if (realIp) {
      console.log('Using real IP:', realIp);
      return realIp;
    }
    console.log('Using default IP:', ip);
    return ip || 'unknown';
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health' || req.path === '/api/test-cloudinary';
  }
});

// Rate limiter for general API calls
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
