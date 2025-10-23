import { apiRequest, getAuthHeaders } from '../config';

const authAPI = {
  // Sign in user
  signIn: async (email, password) => {
    return apiRequest('/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  },

  // Sign up user
  signUp: async (userData) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
  },

  // Get current user
  getCurrentUser: async () => {
    return apiRequest('/auth/me', {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Sign out user
  signOut: async () => {
    return apiRequest('/auth/signout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  },

  // Reset password
  resetPassword: async (token, password) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
  }
};

export default authAPI;
