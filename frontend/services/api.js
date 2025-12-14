import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Firebase auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Firebase auth token will be added by auth context
    const token = localStorage.getItem('firebaseToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      console.error('Unauthorized - please log in');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API methods
export const recipesApi = {
  getAll: (searchQuery) => 
    apiClient.get('/api/recipes', { params: { q: searchQuery } }),
  
  getById: (id) => 
    apiClient.get(`/api/recipes/${id}`),
  
  create: (recipe) => 
    apiClient.post('/api/recipes', recipe),
  
  update: (id, recipe) => 
    apiClient.put(`/api/recipes/${id}`, recipe),
  
  delete: (id) => 
    apiClient.delete(`/api/recipes/${id}`),
  
  addFavorite: (id) => 
    apiClient.post(`/api/recipes/${id}/favorite`),
  
  removeFavorite: (id) => 
    apiClient.delete(`/api/recipes/${id}/favorite`),
};

export const uploadsApi = {
  getPresignedUploadUrl: (fileName, contentType) =>
    apiClient.post('/api/uploads/presign', { fileName, contentType }),
  
  getPresignedDownloadUrl: (recipeId) =>
    apiClient.get('/api/uploads/presign-download', { params: { recipeId } }),
  
  uploadFile: async (presignedUrl, file) => {
    return axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  },
};
