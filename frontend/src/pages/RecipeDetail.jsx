import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipesApi, uploadsApi } from '../services/api';
import { useState } from 'react';

// File validation constants (matching RecipeForm)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedUrl, setEditedUrl] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesApi.getById(id),
  });

  const deleteMutation = useMutation({
    mutationFn: recipesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigate('/');
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (recipe.isFavorite) {
        await recipesApi.removeFavorite(id);
      } else {
        await recipesApi.addFavorite(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => recipesApi.update({ id, ...data }),
    onSuccess: (updatedRecipe) => {
      queryClient.setQueryData(['recipe', id], updatedRecipe);
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setIsEditMode(false);
      setValidationErrors({});
    },
  });

  const handleDownload = async () => {
    if (recipe.type === 'document' && recipe.storageKey) {
      const data = await uploadsApi.getPresignedDownloadUrl(id);
      window.open(data.presignedUrl, '_blank');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = () => {
    setEditedTitle(recipe.title);
    setEditedUrl(recipe.url || '');
    setEditedContent(recipe.content || '');
    setValidationErrors({});
    setFile(null);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setValidationErrors({});
    setFile(null);
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
      const dotIndex = fileName.lastIndexOf('.');
      if (dotIndex === -1) {
        return 'Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG';
      }
      const fileExtension = fileName.substring(dotIndex);
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
      setValidationErrors({ ...validationErrors, file: '' });
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setValidationErrors({ ...validationErrors, file: validationError });
      setFile(null);
      // Clear the input
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setValidationErrors({ ...validationErrors, file: '' });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!editedTitle.trim()) {
      errors.title = 'Title is required';
    }
    
    if (recipe.type.toLowerCase() === 'link') {
      if (!editedUrl.trim()) {
        errors.url = 'URL is required for link recipes';
      } else {
        try {
          new URL(editedUrl);
        } catch {
          errors.url = 'Please enter a valid URL';
        }
      }
    }
    
    if (recipe.type.toLowerCase() === 'manual' && !editedContent.trim()) {
      errors.content = 'Content is required for manual recipes';
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      let updateData = {
        title: editedTitle,
        type: recipe.type,
        url: recipe.type.toLowerCase() === 'link' ? editedUrl : recipe.url,
        content: recipe.type.toLowerCase() === 'manual' ? editedContent : recipe.content,
      };

      // Handle document upload if user selected a new file
      if (recipe.type.toLowerCase() === 'document' && file) {
        setUploading(true);
        
        // Get presigned upload URL
        const presignData = await uploadsApi.getPresignedUploadUrl(file.name, file.type);

        // Upload file to R2
        await uploadsApi.uploadToPresignedUrl(presignData.uploadUrl, file);

        updateData.storageKey = presignData.key;
        setUploading(false);
      }

      updateMutation.mutate(updateData);
    } catch (err) {
      setUploading(false);
      setValidationErrors({ ...validationErrors, file: err.message || 'Failed to upload file' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Recipe not found</h2>
        <Link to="/" className="text-blue-600 hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-xl font-bold text-blue-600">Recipe Manager</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {updateMutation.isError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              Failed to update recipe: {updateMutation.error?.message || 'Unknown error'}
            </p>
          </div>
        )}
        
        {updateMutation.isSuccess && !isEditMode && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">Recipe updated successfully!</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                {isEditMode ? (
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Recipe Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className={`w-full px-4 py-2 text-2xl font-bold border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter recipe title"
                    />
                    {validationErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                    )}
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {recipe.title}
                  </h1>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                  <span className="capitalize bg-gray-100 px-3 py-1 rounded-full">
                    {recipe.type}
                  </span>
                  <span>
                    Added {new Date(recipe.createdAt).toLocaleDateString()}
                  </span>
                  {recipe.updatedAt !== recipe.createdAt && (
                    <span>
                      Updated {new Date(recipe.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {!isEditMode && (
                <button
                  onClick={() => toggleFavoriteMutation.mutate()}
                  className={`transition-colors ${
                    recipe.isFavorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'
                  }`}
                  disabled={toggleFavoriteMutation.isPending}
                >
                  <svg className="w-8 h-8" fill={recipe.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {recipe.type.toLowerCase() === 'link' && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">Recipe Link</h2>
                {isEditMode ? (
                  <div>
                    <input
                      type="url"
                      value={editedUrl}
                      onChange={(e) => setEditedUrl(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.url ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="https://example.com/recipe"
                    />
                    {validationErrors.url && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.url}</p>
                    )}
                  </div>
                ) : recipe.url ? (
                  <a
                    href={recipe.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {recipe.url}
                  </a>
                ) : null}
              </div>
            )}

            {recipe.type.toLowerCase() === 'document' && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">Recipe Document</h2>
                {isEditMode ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Replace document (optional)
                    </p>
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
                    {validationErrors.file && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.file}</p>
                    )}
                    {recipe.storageKey && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Current document:</p>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Current Document
                        </button>
                      </div>
                    )}
                  </div>
                ) : recipe.storageKey ? (
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Document
                  </button>
                ) : null}
              </div>
            )}

            {recipe.type.toLowerCase() === 'manual' && (
              <div>
                <h2 className="text-lg font-semibold mb-3 text-gray-700">Recipe</h2>
                {isEditMode ? (
                  <div>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={10}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans ${
                        validationErrors.content ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter recipe content..."
                    />
                    {validationErrors.content && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.content}</p>
                    )}
                  </div>
                ) : recipe.content ? (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed bg-gray-50 p-4 rounded">
                      {recipe.content}
                    </pre>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={updateMutation.isPending || uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  disabled={updateMutation.isPending || uploading}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Recipe
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Recipe'}
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
