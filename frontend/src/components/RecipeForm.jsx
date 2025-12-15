import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { recipesApi, uploadsApi } from '../services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

const RecipeForm = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [recipeType, setRecipeType] = useState('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const createRecipeMutation = useMutation({
    mutationFn: recipesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to create recipe');
    },
  });

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setContent('');
    setFile(null);
    setError('');
    setRecipeType('link');
  };

  const validateFile = (file) => {
    if (!file) {
      return 'No file selected';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB (selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
    }

    // Check file type by MIME type first
    let isValidType = Object.keys(ALLOWED_FILE_TYPES).includes(file.type);
    
    // If MIME type check fails or is empty, check by file extension
    if (!isValidType || !file.type) {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat();
      isValidType = allowedExtensions.includes(fileExtension);
    }
    
    if (!isValidType) {
      return 'Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG';
    }

    return null; // Valid file
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (!selectedFile) {
      setFile(null);
      setError('');
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      // Clear the input
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      let recipeData = {
        title: title.trim(),
        type: recipeType,
      };

      if (recipeType === 'link') {
        if (!url.trim()) {
          setError('URL is required for link recipes');
          return;
        }
        recipeData.url = url.trim();
      } else if (recipeType === 'document') {
        if (!file) {
          setError('File is required for document recipes');
          return;
        }

        setUploading(true);
        
        // Get presigned upload URL
        const presignData = await uploadsApi.getPresignedUploadUrl(file.name, file.type);

        // Upload file to R2
        await uploadsApi.uploadToPresignedUrl(presignData.uploadUrl, file);

        recipeData.storageKey = presignData.key;
        setUploading(false);
      } else if (recipeType === 'manual') {
        if (!content.trim()) {
          setError('Content is required for manual recipes');
          return;
        }
        recipeData.content = content.trim();
      }

      createRecipeMutation.mutate(recipeData);
    } catch (err) {
      setUploading(false);
      setError(err.message || 'Failed to create recipe');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Add New Recipe</h2>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Recipe Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Favorite Recipe"
              />
            </div>

            {/* Recipe Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Recipe Type *</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="link"
                    checked={recipeType === 'link'}
                    onChange={(e) => setRecipeType(e.target.value)}
                    className="mr-2"
                  />
                  Link
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="document"
                    checked={recipeType === 'document'}
                    onChange={(e) => setRecipeType(e.target.value)}
                    className="mr-2"
                  />
                  Document
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={recipeType === 'manual'}
                    onChange={(e) => setRecipeType(e.target.value)}
                    className="mr-2"
                  />
                  Manual
                </label>
              </div>
            </div>

            {/* Conditional Fields Based on Type */}
            {recipeType === 'link' && (
              <div className="mb-4">
                <label htmlFor="url" className="block text-sm font-medium mb-1">
                  Recipe URL *
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/recipe"
                />
              </div>
            )}

            {recipeType === 'document' && (
              <div className="mb-4">
                <label htmlFor="file" className="block text-sm font-medium mb-1">
                  Upload Document *
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Max file size: 10MB. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG
                </p>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                {file && (
                  <p className="text-xs text-green-600 mt-1">
                    Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)
                  </p>
                )}
              </div>
            )}

            {recipeType === 'manual' && (
              <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium mb-1">
                  Recipe Content *
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="10"
                  placeholder="Ingredients:&#10;- ...&#10;&#10;Instructions:&#10;1. ..."
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={uploading || createRecipeMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={uploading || createRecipeMutation.isPending}
              >
                {uploading ? 'Uploading...' : createRecipeMutation.isPending ? 'Creating...' : 'Add Recipe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecipeForm;
