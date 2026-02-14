// BOM Share API Service
import axios from 'axios';
import { API_BASE_URL } from './config';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds (increased for share operations)
});

// Add request interceptor for JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('BOM Share API Error:', error);

    if (error.response) {
      const data = error.response.data || {};
      const err = new Error(data.message || data.error || 'Server error');
      err.status = error.response.status;
      err.data = data;
      throw err;
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'Request failed');
    }
  }
);

const bomShareAPI = {
  /**
   * Create share links for a BOM
   * @param {number} projectId - ID of the project (will lookup the saved BOM)
   * @param {number[]} sharedWithUserIds - Array of user IDs to share with
   * @param {string|null} message - Optional message for recipients
   * @returns {Promise<Object>} - Share creation response
   */
  async createShares(projectId, sharedWithUserIds, message = null) {
    const response = await apiClient.post('/bom/share', {
      projectId,
      sharedWithUserIds,
      message
    });
    return response.data;
  },

  /**
   * Access shared BOM via token
   * @param {string} token - The share token
   * @returns {Promise<Object>} - Share info and BOM details
   */
  async accessSharedBom(token) {
    const response = await apiClient.get(`/bom/shared/${token}`);
    return response.data;
  },

  /**
   * Get share history for a BOM
   * @param {number} bomId - ID of the BOM
   * @returns {Promise<Object>} - Share history
   */
  async getShareHistory(bomId) {
    const response = await apiClient.get(`/bom/share-history/${bomId}`);
    return response.data;
  },

  /**
   * Get BOMs shared with the current user
   * @returns {Promise<Object>} - List of shared BOMs
   */
  async getSharedWithMe() {
    const response = await apiClient.get('/bom/shared-with-me');
    return response.data;
  },

  /**
   * Get list of users for sharing
   * @param {string|null} role - Optional role filter (BASIC, DESIGN, MANAGER)
   * @returns {Promise<Object>} - List of users
   */
  async getUserList(role = null) {
    const url = role && role !== 'ALL'
      ? `/users/list?role=${role}`
      : '/users/list';

    const response = await apiClient.get(url);
    return response.data;
  }
};

export default bomShareAPI;
