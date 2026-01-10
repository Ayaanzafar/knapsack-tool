// Centralized API configuration
// All services should import from here to ensure consistent API base URL

// Get base URL from environment or use default
// Export the base URL with /api suffix (for most endpoints)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Export the base URL without /api suffix (for raw endpoints)
export const API_URL = API_BASE_URL.replace('/api', '');

// Alias for API_BASE_URL
export const API_BASE = API_BASE_URL;

// Log the configuration (useful for debugging)
// console.log('API Configuration:', {
//   API_BASE_URL,
//   API_URL,
//   environment: import.meta.env.MODE || 'development'
// });

export default {
  API_BASE_URL,
  API_URL,
  API_BASE
};
