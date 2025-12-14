import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let getTokenFunction = null;

export const setTokenGetter = (tokenGetter) => {
  getTokenFunction = tokenGetter;
};

apiClient.interceptors.request.use(
  async (config) => {
    if (getTokenFunction) {
      const token = await getTokenFunction();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Recipe API
export const fetchRecipes = async (searchQuery = '') => {
  const params = searchQuery ? { q: searchQuery } : {};
  const response = await apiClient.get('/api/recipes', { params });
  return response.data;
};

export const fetchRecipe = async (id) => {
  const response = await apiClient.get(`/api/recipes/${id}`);
  return response.data;
};

export const createRecipe = async (recipeData) => {
  const response = await apiClient.post('/api/recipes', recipeData);
  return response.data;
};

export const updateRecipe = async ({ id, ...recipeData }) => {
  const response = await apiClient.put(`/api/recipes/${id}`, recipeData);
  return response.data;
};

export const deleteRecipe = async (id) => {
  await apiClient.delete(`/api/recipes/${id}`);
};

// Favorite API
export const addFavorite = async (recipeId) => {
  const response = await apiClient.post(`/api/recipes/${recipeId}/favorite`);
  return response.data;
};

export const removeFavorite = async (recipeId) => {
  await apiClient.delete(`/api/recipes/${recipeId}/favorite`);
};

// Upload API
export const getPresignedUploadUrl = async (fileName, contentType) => {
  const response = await apiClient.post('/api/uploads/presign', {
    fileName,
    contentType,
  });
  return response.data;
};

export const getPresignedDownloadUrl = async (recipeId) => {
  const response = await apiClient.get('/api/uploads/presign-download', {
    params: { recipeId },
  });
  return response.data;
};

export const uploadToPresignedUrl = async (presignedUrl, file) => {
  await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
  });
};

// Object-style API exports for component compatibility
export const recipesApi = {
  getAll: fetchRecipes,
  getById: fetchRecipe,
  create: createRecipe,
  update: updateRecipe,
  delete: deleteRecipe,
  addFavorite,
  removeFavorite,
};

export const uploadsApi = {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  uploadToPresignedUrl,
};

export default apiClient;
