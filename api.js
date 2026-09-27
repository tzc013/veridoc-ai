// frontend/src/services/api.js
/**
 * Veridoc AI - API Service Layer
 * Handles all HTTP requests to the backend
 */

import axios from 'axios';
import { toast } from 'react-hot-toast';

// ============================================================================
// API CONFIGURATION
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// ============================================================================
// REQUEST INTERCEPTORS
// ============================================================================

// Add authentication token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('veridoc_auth_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracing
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTORS
// ============================================================================

apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`📥 ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(new Error('Network error - please check your connection'));
    }
    
    // Handle specific status codes
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        toast.error(data?.detail || 'Bad request. Please check your input.');
        break;
      case 401:
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('veridoc_auth_token');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
        break;
      case 403:
        toast.error('You don\'t have permission to perform this action.');
        break;
      case 404:
        toast.error(data?.detail || 'Resource not found.');
        break;
      case 422:
        // Validation error
        const errors = data?.detail || data?.errors || [];
        if (Array.isArray(errors)) {
          errors.forEach(err => {
            toast.error(err.msg || err.message || 'Validation error');
          });
        } else {
          toast.error(data?.detail || 'Validation error. Please check your input.');
        }
        break;
      case 429:
        toast.error('Too many requests. Please wait a moment.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      case 502:
      case 503:
      case 504:
        toast.error('Service unavailable. Please try again later.');
        break;
      default:
        toast.error(data?.detail || 'An unexpected error occurred.');
    }
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        status,
        data,
        config: error.config,
      });
    }
    
    return Promise.reject(error);
  }
);

// ============================================================================
// API SERVICES
// ============================================================================

export const api = {
  // ==========================================================================
  // HEALTH CHECK
  // ==========================================================================
  
  health: {
    check: async () => {
      const response = await apiClient.get('/api/health');
      return response.data;
    },
    
    ping: async () => {
      const response = await apiClient.get('/api/health/ping');
      return response.data;
    },
  },

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================
  
  dashboard: {
    getStats: async () => {
      const response = await apiClient.get('/api/dashboard/stats');
      return response.data;
    },
    
    getActivity: async (days = 7) => {
      const response = await apiClient.get('/api/dashboard/activity', {
        params: { days },
      });
      return response.data;
    },
  },

  // ==========================================================================
  // DOCUMENTS
  // ==========================================================================
  
  documents: {
    // Get all documents
    getAll: async (params = {}) => {
      const response = await apiClient.get('/api/documents', { params });
      return response.data;
    },
    
    // Get single document by ID
    getById: async (id) => {
      const response = await apiClient.get(`/api/documents/${id}`);
      return response.data;
    },
    
    // Upload a document
    upload: async (file, onProgress = null) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      
      if (onProgress && typeof onProgress === 'function') {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }
      
      const response = await apiClient.post('/api/documents/upload', formData, config);
      return response.data;
    },
    
    // Upload multiple documents
    uploadMultiple: async (files, onProgress = null) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      
      if (onProgress && typeof onProgress === 'function') {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }
      
      const response = await apiClient.post('/api/documents/upload-multiple', formData, config);
      return response.data;
    },
    
    // Get document status
    getStatus: async (id) => {
      const response = await apiClient.get(`/api/documents/${id}/status`);
      return response.data;
    },
    
    // Reprocess document
    reprocess: async (id) => {
      const response = await apiClient.post(`/api/documents/${id}/reprocess`);
      return response.data;
    },
    
    // Delete document
    delete: async (id) => {
      const response = await apiClient.delete(`/api/documents/${id}`);
      return response.data;
    },
    
    // Get document preview
    getPreview: async (id) => {
      const response = await apiClient.get(`/api/documents/${id}/preview`);
      return response.data;
    },
    
    // Get document chunks
    getChunks: async (id, params = {}) => {
      const response = await apiClient.get(`/api/documents/${id}/chunks`, { params });
      return response.data;
    },
    
    // Search documents
    search: async (query) => {
      const response = await apiClient.get('/api/documents/search', {
        params: { q: query },
      });
      return response.data;
    },
    
    // Get processing info
    getProcessingInfo: async () => {
      const response = await apiClient.get('/api/processing/info');
      return response.data;
    },
  },

  // ==========================================================================
  // CHAT
  // ==========================================================================
  
  chat: {
    // Create a new chat session
    createSession: async (data = {}) => {
      const response = await apiClient.post('/api/chat/sessions', data);
      return response.data;
    },
    
    // Get all chat sessions
    getSessions: async () => {
      const response = await apiClient.get('/api/chat/sessions');
      return response.data;
    },
    
    // Get a specific chat session
    getSession: async (sessionId) => {
      const response = await apiClient.get(`/api/chat/sessions/${sessionId}`);
      return response.data;
    },
    
    // Update chat session
    updateSession: async (sessionId, data) => {
      const response = await apiClient.patch(`/api/chat/sessions/${sessionId}`, data);
      return response.data;
    },
    
    // Delete chat session
    deleteSession: async (sessionId) => {
      const response = await apiClient.delete(`/api/chat/sessions/${sessionId}`);
      return response.data;
    },
    
    // Send a message
    sendMessage: async (sessionId, data) => {
      const response = await apiClient.post(`/api/chat/sessions/${sessionId}/messages`, data);
      return response.data;
    },
    
    // Send message with streaming
    sendMessageStream: async (sessionId, data, onChunk) => {
      const response = await fetch(`${API_URL}/api/chat/sessions/${sessionId}/messages/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('veridoc_auth_token') || ''}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (onChunk) onChunk(parsed);
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    },
    
    // Get chat history
    getHistory: async (sessionId, params = {}) => {
      const response = await apiClient.get(`/api/chat/sessions/${sessionId}/messages`, { params });
      return response.data;
    },
    
    // Delete a message
    deleteMessage: async (sessionId, messageId) => {
      const response = await apiClient.delete(`/api/chat/sessions/${sessionId}/messages/${messageId}`);
      return response.data;
    },
  },

  // ==========================================================================
  // SEARCH
  // ==========================================================================
  
  search: {
    global: async (query, params = {}) => {
      const response = await apiClient.get('/api/search', {
        params: { q: query, ...params },
      });
      return response.data;
    },
    
    documents: async (query) => {
      const response = await apiClient.get('/api/search/documents', {
        params: { q: query },
      });
      return response.data;
    },
    
    messages: async (query) => {
      const response = await apiClient.get('/api/search/messages', {
        params: { q: query },
      });
      return response.data;
    },
  },

  // ==========================================================================
  // AUTHENTICATION (if needed)
  // ==========================================================================
  
  auth: {
    login: async (credentials) => {
      const response = await apiClient.post('/api/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('veridoc_auth_token', response.data.token);
        localStorage.setItem('veridoc_user', JSON.stringify(response.data.user));
      }
      return response.data;
    },
    
    logout: async () => {
      try {
        await apiClient.post('/api/auth/logout');
      } catch (e) {
        // Ignore errors on logout
      } finally {
        localStorage.removeItem('veridoc_auth_token');
        localStorage.removeItem('veridoc_user');
      }
    },
    
    register: async (userData) => {
      const response = await apiClient.post('/api/auth/register', userData);
      return response.data;
    },
    
    getCurrentUser: async () => {
      const response = await apiClient.get('/api/auth/me');
      return response.data;
    },
    
    refreshToken: async () => {
      const response = await apiClient.post('/api/auth/refresh');
      if (response.data.token) {
        localStorage.setItem('veridoc_auth_token', response.data.token);
      }
      return response.data;
    },
  },

  // ==========================================================================
  // USER SETTINGS
  // ==========================================================================
  
  settings: {
    get: async () => {
      const response = await apiClient.get('/api/settings');
      return response.data;
    },
    
    update: async (data) => {
      const response = await apiClient.put('/api/settings', data);
      return response.data;
    },
    
    updatePreferences: async (data) => {
      const response = await apiClient.patch('/api/settings/preferences', data);
      return response.data;
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Handle API errors with custom logic
 */
export const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return {
      status: error.response.status,
      data: error.response.data,
      message: error.response.data?.detail || error.response.data?.message || 'API Error',
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      status: 0,
      data: null,
      message: 'No response received from server',
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      status: -1,
      data: null,
      message: error.message || 'Request setup error',
    };
  }
};

/**
 * Check if API is reachable
 */
export const checkApiHealth = async () => {
  try {
    await apiClient.get('/api/health');
    return true;
  } catch (error) {
    return false;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default api;