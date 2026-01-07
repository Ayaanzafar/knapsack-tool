// src/services/api.js
// API client for communicating with the backend

import axios from 'axios';
import { API_BASE_URL } from './config';

const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getUserRoleFromToken = () => {
  const token = localStorage.getItem('token');
  return decodeJwtPayload(token)?.role || null;
};

const BASIC_FORBIDDEN_TAB_SETTINGS_FIELDS = new Set([
  'buffer',
  'lengthsInput',
  'costPerMm',
  'costPerJointSet',
  'joinerLength',
  'maxPieces',
  'maxWastePct',
  'alphaJoint',
  'betaSmall',
  'allowUndershootPct',
  'gammaShort'
]);

const sanitizeTabSettingsForRole = (settings, role) => {
  if (!settings || typeof settings !== 'object') return settings;
  if (role !== 'BASIC') return settings;
  const sanitized = { ...settings };
  for (const field of BASIC_FORBIDDEN_TAB_SETTINGS_FIELDS) {
    delete sanitized[field];
  }
  return sanitized;
};

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

    // Don't log 404 errors for saved-boms endpoints (expected when no saved BOM exists)
    const isSavedBom404 = error.response?.status === 404 && error.config?.url?.includes('/saved-boms/');

    if (!isSavedBom404) {
      console.error('API Error:', error);
    }

    if (error.response) {
      // Server responded with error status
      const data = error.response.data || {};
      const err = new Error(data.message || data.error || 'Server error');
      err.status = error.response.status;
      err.code = data.code;
      err.field = data.field;
      err.data = data;
      err.response = error.response;
      throw err;
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
  },

  // Soft delete user
  delete: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  // Update user status (ACTIVE, HOLD, INACTIVE)
  updateStatus: async (userId, status) => {
    const response = await apiClient.patch(`/users/${userId}/status`, { status });
    return response.data;
  },

  // Reset user password
  resetPassword: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/reset-password`);
    return response.data;
  }
};

// ====================
// PROJECT API
// ====================

export const projectAPI = {
  // Get all projects with optional pagination and sorting
  getAll: async (params = {}) => {
    const response = await apiClient.get('/projects', { params });
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
    const role = getUserRoleFromToken();
    const payload = data?.settings ? { ...data, settings: sanitizeTabSettingsForRole(data.settings, role) } : data;
    const response = await apiClient.post(`/projects/${projectId}/tabs`, payload);
    return response.data;
  },

  // Update tab (name and/or settings)
  update: async (id, data) => {
    const role = getUserRoleFromToken();
    const payload = data?.settings ? { ...data, settings: sanitizeTabSettingsForRole(data.settings, role) } : data;
    const response = await apiClient.put(`/tabs/${id}`, payload);
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

  // Update material in sunrack_profiles
  updateMaterial: async (data) => {
    const response = await apiClient.put('/bom/update-material', data);
    return response.data;
  },

  // Update material in fasteners (single fastener by serialNumber F-{id})
  updateFastenerMaterial: async (data) => {
    const response = await apiClient.put('/bom/update-fastener-material', data);
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

// Saved BOM API
export const savedBomAPI = {
  // Save BOM snapshot
  saveBomSnapshot: async (projectId, bomData, userNotes, changeLog, customDefaultNotes = null) => {
    const response = await apiClient.post(`/saved-boms/project/${projectId}`, {
      bomData,
      userNotes,
      changeLog,
      customDefaultNotes
    });
    return response.data;
  },

  // Get saved BOM for a project
  getSavedBom: async (projectId) => {
    const response = await apiClient.get(`/saved-boms/project/${projectId}`);
    return response.data;
  },

  // Check if saved BOM exists
  checkSavedBomExists: async (projectId) => {
    const response = await apiClient.get(`/saved-boms/project/${projectId}/exists`);
    return response.data;
  },

  // Get all saved BOMs (for admin)
  getAllSavedBoms: async () => {
    const response = await apiClient.get('/saved-boms/all');
    return response.data;
  },

  // Delete saved BOM
  deleteSavedBom: async (projectId) => {
    const response = await apiClient.delete(`/saved-boms/project/${projectId}`);
    return response.data;
  },
};

// ====================
// Default Notes API
// ====================

export const defaultNotesAPI = {
  // Get all default notes
  getAll: async () => {
    const response = await apiClient.get('/default-notes');
    return response.data;
  },

  // Add a new default note
  addNote: async (noteText) => {
    const response = await apiClient.post('/default-notes', { noteText });
    return response.data;
  },

  // Update a specific default note
  updateNote: async (noteOrder, noteText) => {
    const response = await apiClient.put(`/default-notes/${noteOrder}`, { noteText });
    return response.data;
  },

  // Update multiple default notes
  updateNotes: async (notes) => {
    const response = await apiClient.put('/default-notes', { notes });
    return response.data;
  },

  // Delete a default note
  deleteNote: async (noteOrder) => {
    const response = await apiClient.delete(`/default-notes/${noteOrder}`);
    return response.data;
  },
};

export default apiClient;
