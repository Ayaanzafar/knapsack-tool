// src/services/api.js
// API client for communicating with the backend

import axios from 'axios';
import { API_BASE_URL } from './config';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
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
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear token if unauthorized (except for specific logic handled in components)
       if (error.response.data?.code !== 'PASSWORD_CHANGE_REQUIRED') {
         // Optionally redirect to login or clear state
       }
    }
    console.error('API Error:', error);
    if (error.response) {
      // Server responded with error status
      throw new Error(error.response.data.message || error.response.data.error || 'Server error');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error: Unable to reach the server');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// ====================
// AUTH API
// ====================

export const authAPI = {
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },
  
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

// ====================
// USER API
// ====================

export const userAPI = {
  // Get all users
  getAll: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  // Create new user
  create: async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  }
};

// ====================
// PROJECT API
// ====================

export const projectAPI = {
  // Get all projects
  getAll: async () => {
    const response = await apiClient.get('/projects');
    return response.data;
  },

  // Get project by ID
  getById: async (id) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  // Get project with all tabs and rows
  getWithDetails: async (id) => {
    const response = await apiClient.get(`/projects/${id}/full`);
    return response.data;
  },

  // Create new project
  create: async (data) => {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  // Update project
  update: async (id, data) => {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data;
  },

  // Delete project
  delete: async (id) => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
  },
};

// ====================
// TAB API
// ====================

export const tabAPI = {
  // Get all tabs for a project
  getByProjectId: async (projectId) => {
    const response = await apiClient.get(`/projects/${projectId}/tabs`);
    return response.data;
  },

  // Get single tab by ID
  getById: async (id) => {
    const response = await apiClient.get(`/tabs/${id}`);
    return response.data;
  },

  // Create new tab
  create: async (projectId, data) => {
    const response = await apiClient.post(`/projects/${projectId}/tabs`, data);
    return response.data;
  },

  // Update tab (name and/or settings)
  update: async (id, data) => {
    const response = await apiClient.put(`/tabs/${id}`, data);
    return response.data;
  },

  // Delete tab
  delete: async (id) => {
    const response = await apiClient.delete(`/tabs/${id}`);
    return response.data;
  },

  // Duplicate tab
  duplicate: async (id) => {
    const response = await apiClient.post(`/tabs/${id}/duplicate`);
    return response.data;
  },
};

// ====================
// ROW API
// ====================

export const rowAPI = {
  // Get all rows for a tab
  getByTabId: async (tabId) => {
    const response = await apiClient.get(`/tabs/${tabId}/rows`);
    return response.data;
  },

  // Get single row by ID
  getById: async (id) => {
    const response = await apiClient.get(`/rows/${id}`);
    return response.data;
  },

  // Create new row
  create: async (tabId, data) => {
    const response = await apiClient.post(`/tabs/${tabId}/rows`, data);
    return response.data;
  },

  // Update row
  update: async (id, data) => {
    const response = await apiClient.put(`/rows/${id}`, data);
    return response.data;
  },

  // Delete row
  delete: async (id) => {
    const response = await apiClient.delete(`/rows/${id}`);
    return response.data;
  },

  // Reorder rows
  reorder: async (tabId, rows) => {
    const response = await apiClient.put(`/tabs/${tabId}/rows/reorder`, { rows });
    return response.data;
  },
};

// ====================
// BOM API
// ====================

export const bomAPI = {
  // Get all BOM master items
  getAllMasterItems: async () => {
    const response = await apiClient.get('/bom/master-items');
    return response.data;
  },

  // Get BOM master item by ID
  getMasterItemById: async (id) => {
    const response = await apiClient.get(`/bom/master-items/${id}`);
    return response.data;
  },

  // Get BOM master item by Sunrack code
  getMasterItemBySunrackCode: async (code) => {
    const response = await apiClient.get(`/bom/master-items/sunrack/${code}`);
    return response.data;
  },

  // Create BOM master item
  createMasterItem: async (data) => {
    const response = await apiClient.post('/bom/master-items', data);
    return response.data;
  },

  // Update BOM master item
  updateMasterItem: async (id, data) => {
    const response = await apiClient.put(`/bom/master-items/${id}`, data);
    return response.data;
  },

  // Delete BOM master item
  deleteMasterItem: async (id) => {
    const response = await apiClient.delete(`/bom/master-items/${id}`);
    return response.data;
  },

  // Get all BOM formulas
  getAllFormulas: async () => {
    const response = await apiClient.get('/bom/formulas');
    return response.data;
  },

  // Create BOM formula
  createFormula: async (data) => {
    const response = await apiClient.post('/bom/formulas', data);
    return response.data;
  },

  // Save a new BOM to the database
  saveBOM: async (projectId, bomData) => {
    const response = await apiClient.post('/bom/save', { projectId, bomData });
    return response.data;
  },

  // Get all BOMs for a specific project
  getBOMsByProject: async (projectId) => {
    const response = await apiClient.get(`/bom/project/${projectId}`);
    return response.data;
  },

  // Get a specific BOM by its ID
  getBOMById: async (bomId) => {
    const response = await apiClient.get(`/bom/${bomId}`);
    return response.data;
  },

  // Update an existing BOM
  updateBOM: async (bomId, bomData, changeLog) => {
    const response = await apiClient.put(`/bom/${bomId}`, { bomData, changeLog });
    return response.data;
  },
};

export default apiClient;
