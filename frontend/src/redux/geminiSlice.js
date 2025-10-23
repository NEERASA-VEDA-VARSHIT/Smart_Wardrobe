import { createSlice } from "@reduxjs/toolkit";

const geminiSlice = createSlice({
  name: "gemini",
  initialState: {
    apiUsage: {},
    dailyUsage: {},
    monthlyUsage: {},
    rateLimits: {
      requestsPerMinute: 60,
      requestsPerDay: 1000,
      tokensPerDay: 100000
    },
    currentUsage: {
      requestsThisMinute: 0,
      requestsToday: 0,
      tokensToday: 0
    },
    lastReset: {
      minute: new Date().getMinutes(),
      day: new Date().getDate()
    }
  },
  reducers: {
    trackAPICall: (state, action) => {
      const { endpoint, tokens, responseTime, timestamp } = action.payload;
      const now = new Date();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDate();
      
      // Reset counters if needed
      if (currentMinute !== state.lastReset.minute) {
        state.currentUsage.requestsThisMinute = 0;
        state.lastReset.minute = currentMinute;
      }
      
      if (currentDay !== state.lastReset.day) {
        state.currentUsage.requestsToday = 0;
        state.currentUsage.tokensToday = 0;
        state.lastReset.day = currentDay;
      }
      
      // Update endpoint-specific usage
      if (!state.apiUsage[endpoint]) {
        state.apiUsage[endpoint] = {
          calls: 0,
          tokens: 0,
          responseTime: 0,
          lastUsed: null
        };
      }
      
      state.apiUsage[endpoint].calls += 1;
      state.apiUsage[endpoint].tokens += tokens || 0;
      state.apiUsage[endpoint].responseTime = (state.apiUsage[endpoint].responseTime + responseTime) / 2;
      state.apiUsage[endpoint].lastUsed = timestamp;
      
      // Update current usage
      state.currentUsage.requestsThisMinute += 1;
      state.currentUsage.requestsToday += 1;
      state.currentUsage.tokensToday += tokens || 0;
      
      // Update daily usage
      const today = now.toISOString().split('T')[0];
      if (!state.dailyUsage[today]) {
        state.dailyUsage[today] = {
          requests: 0,
          tokens: 0,
          endpoints: {}
        };
      }
      
      state.dailyUsage[today].requests += 1;
      state.dailyUsage[today].tokens += tokens || 0;
      
      if (!state.dailyUsage[today].endpoints[endpoint]) {
        state.dailyUsage[today].endpoints[endpoint] = 0;
      }
      state.dailyUsage[today].endpoints[endpoint] += 1;
    },
    
    resetUsage: (state) => {
      state.currentUsage = {
        requestsThisMinute: 0,
        requestsToday: 0,
        tokensToday: 0
      };
      state.lastReset = {
        minute: new Date().getMinutes(),
        day: new Date().getDate()
      };
    },
    
    updateRateLimits: (state, action) => {
      state.rateLimits = { ...state.rateLimits, ...action.payload };
    },
    
    clearHistory: (state) => {
      state.apiUsage = {};
      state.dailyUsage = {};
      state.monthlyUsage = {};
    }
  }
});

export const { trackAPICall, resetUsage, updateRateLimits, clearHistory } = geminiSlice.actions;
export default geminiSlice.reducer;

// Selectors
export const selectGeminiUsage = (state) => state.gemini.apiUsage;
export const selectCurrentUsage = (state) => state.gemini.currentUsage;
export const selectRateLimits = (state) => state.gemini.rateLimits;
export const selectDailyUsage = (state) => state.gemini.dailyUsage;
export const selectUsageStats = (state) => {
  const { apiUsage, currentUsage, rateLimits } = state.gemini;
  
  const totalCalls = Object.values(apiUsage).reduce((sum, usage) => sum + usage.calls, 0);
  const totalTokens = Object.values(apiUsage).reduce((sum, usage) => sum + usage.tokens, 0);
  const averageResponseTime = Object.values(apiUsage).reduce((sum, usage) => sum + usage.responseTime, 0) / Math.max(Object.keys(apiUsage).length, 1);
  
  return {
    totalCalls,
    totalTokens,
    averageResponseTime,
    currentUsage,
    rateLimits,
    isNearLimit: {
      requests: currentUsage.requestsToday >= rateLimits.requestsPerDay * 0.8,
      tokens: currentUsage.tokensToday >= rateLimits.tokensPerDay * 0.8
    }
  };
};
